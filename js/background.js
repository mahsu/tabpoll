"use strict";

requirejs.config({
    baseUrl: 'js',
    paths: {
        node: 'node_modules'
    }
});

// Start the main app logic.
requirejs(['async', 'node/interval-tree/IntervalTree', 'node/alike/main'],
    function (async, intervalTree, alike) {
        //jQuery, canvas and the app/sub module are all
        //loaded and can be used here now.
        var current_token;
        var user_data;
        var calendars;
        var events = [];
        var itree = new intervalTree(Date.now() / 10000);
        var weatherData;
        var linkData;

        if (current_token) {
            chrome.identity.removeCachedAuthToken({token: current_token}, function () {
            });

            // Make a request to revoke token in the server
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
            current_token);
            xhr.send();

            current_token = 0;
            console.log("Revoked token.")
        }

        chrome.identity.getAuthToken({'interactive': true}, function (token) {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError);
                //changeState(STATE_START);
            } else {
                current_token = token;
                console.log('Token acquired:' + current_token +
                '. See chrome://identity-internals for details.');

                //GET the user's email
                $.ajax({
                    method: 'GET',
                    url: "https://www.googleapis.com/oauth2/v1/userinfo",
                    data: {
                        "alt": "json",
                        "access_token": current_token
                    },
                    success: function (data) {
                        user_data = data;
                        chrome.storage.sync.set(user_data, function () {
                            console.log(user_data);
                            get_history();
                            get_all_cal_events();
                        })
                    }
                });

            }
        });

        function get_history(callback) {
            var d = new Date();
            var max_start = Date.now();
            var min_start = d.setMonth(d.getMonth() - 1);
            // get history data
            chrome.history.search({
                text: "",
                startTime: min_start,
                endTime: max_start,
                maxResults: 1e6
            }, function (results) {
                var visits = [];
                async.each(results, function (result, callback) {
                    chrome.history.getVisits({
                        url: result.url
                    }, function (items) {
                        Array.prototype.push.apply(visits, items.map(function (item) {
                            return {
                                url: result.url,
                                title: result.title,
                                visitTime: item.visitTime
                            };
                        }));
                        callback();
                    });
                }, function (err) {
                    if (typeof callback === 'function') {
                        callback(err, visits);
                    }
                });
            });
        }


        function get_cal_list(callback) {

            $.ajax({
                method: 'GET',
                url: "https://www.googleapis.com/calendar/v3/users/me/calendarList",
                data: {
                    "alt": "json",
                    "access_token": current_token,
                    "max_results": 10//max=250

                },
                success: function (cal_list) {
                    //console.log(cal_list);
                    callback(cal_list, null);

                },
                error: function (err) {
                    console.log(err);
                    callback(null, err);
                }
            });
        }

        function get_all_cal_events() {

            var d = new Date();
            var max_start = d.setMonth(d.getMonth() + 1);
            max_start = new Date(max_start).toISOString();
            var min_start = d.setMonth(d.getMonth() - 2);
            min_start = new Date(min_start).toISOString();

            get_cal_list(function (calendar_list, err) {
                if (err) console.log(err);

                calendars = calendars || calendar_list;
                //console.log(calendars);
                async.eachSeries(calendars.items, function (cal, callback) {
                    var cal_id = cal.id;
                    $.ajax({
                        method: 'GET',
                        url: "https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(cal_id) + "/events",
                        data: {
                            "alt": "json",
                            "access_token": current_token,
                            "max_results": 2500,
                            "timeMin": min_start,
                            "timeMax": max_start,
                            "singleEvents": true
                        },
                        success: function (cal_list) {
                            //console.log(cal_list);
                            events = events.concat(cal_list.items);
                        },
                        complete: function () {
                            callback();
                        }

                    });

                }, function () {
                    //console.log(events);
                    var filtered_events = events.filter(function (evt) {
                        //if recurring events expanded
                        return evt.recurringEventId !== undefined;

                        //if recurring events not expanded
                        //return evt.recurrence !== undefined;
                    });
                    console.log("filtered all events");
                    console.log(filtered_events);
                    async.eachSeries(filtered_events, function (evt, callback) {
                        //console.log(evt.start.dateTime);
                        var start = Date.parse(evt.start.dateTime || evt.start.date);
                        var end = Date.parse(evt.end.dateTime || evt.end.date);
                        if (start < end) {
                            //console.log([start, end, evt.summary]);
                            itree.add([start / 10000, end / 10000, evt.summary]);
                        }
                        callback();
                    }, function () {
                        //console.log(itree.search(142176470,142196470));
                        //console.log(itree);
                    });

                });

            });
        }

        function init() {
            console.log("init()", "Initializing");

            function getWeather() {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function (position) {
                        $.ajax({
                            url: "http://api.openweathermap.org/data/2.5/weather?units=imperial&lat=" + position.coords.latitude + "&lon=" + position.coords.longitude,
                            success: function (data) {
                                console.log("init()", "Got weather data");
                                weatherData = data;
                            }
                        });
                    });
                }
            }

            setInterval(function () {
                getWeather();
            }, 10 * 60 * 1000);
            getWeather();

            get_history(function (err, visits) {
                console.log("init()", "Got history data");
                var re = /^(?:ftp|https?):\/\/(?:[^@:\/]*@)?([^:\/]+)/;

                var sites = {};

                visits.forEach(function (item) {
                    var date = new Date(item.visitTime);
                    var obj = dateToObj(date);
                    obj.url = item.url;
                    obj.title = item.title;
                    obj.visitTime = item.visitTime;
                    var host = getHost(item.url);
                    if (!sites.hasOwnProperty(host)) {
                        sites[host] = [];
                    }
                    sites[host].push(obj);
                });

                function getHost(url) {
                    var result = url.match(re);
                    if (result && result.length > 1) {
                        return result[1];
                    } else {
                        return "";
                    }
                }

                function dateToObj(date) {
                    var obj = {};
                    obj.dayOfWeek = date.getDay() / 7;
                    obj.minutesPastMidnight = (date.getHours() * 60 + date.getMinutes()) / (60 * 24);
                    obj.minutesPastNoon = (((date.getHours() + 12) % 24) * 60 + date.getMinutes()) / (60 * 24);
                    return obj;
                }

                var distance = function (p1, p2, opts) {
                    var attr, dist, val, x, y;
                    dist = 0;
                    for (attr in p1) {
                        val = p1[attr];
                        x = val;
                        y = p2[attr];
                        if ((opts != null ? opts.stdv : void 0) && Object.getOwnPropertyNames(opts.stdv).length > 0 && opts.stdv[attr] !== 0) {
                            x /= opts.stdv[attr];
                            y /= opts.stdv[attr];
                        }
                        if ((opts != null ? opts.weights : void 0) && Object.getOwnPropertyNames(opts.weights).length > 0) {
                            x *= opts.weights[attr];
                            y *= opts.weights[attr];
                        }
                        dist += Math.pow(x - y, 2);
                    }
                    return dist;
                };

                function compareEvents(current, pastArray) {
                    var allEvents = {};
                    var commonEvents = [];
                    pastArray.forEach(function (past) {
                        past.forEach(function (event) {
                            allEvents[event.data[2]] = true;
                        });
                    });
                    current.forEach(function (event) {
                        var eventName = event.data[2];
                        if (allEvents[eventName] && !(eventName in commonEvents)) {
                            commonEvents.push(eventName);
                        }
                    });
                    return commonEvents;
                }

                function titleForHost(host) {
                    let site = sites[host];
                    var title = site[0].title;
                    var shortestUrlLength = site[0].url.length;
                    for (let i = 1; i < site.length; i++) {
                        if (site[i].url.length < shortestUrlLength) {
                            shortestUrlLength = site[i].url.length;
                            title = site[i].title;
                        }
                    }

                    return title;
                }

                function getLinks(callback) {
                    var testObj = dateToObj(new Date(Date.now()));
                    var currentEvents = itree.search(Date.now() / 10000); // convert to 10 second resolution
                    var results = [];
                    for (var host in sites) {
                        // Limit only to sites with at least 20 visits, and skip blank
                        if (sites[host].length < 20 || host == '') {
                            continue;
                        }

                        var options = {
                            k: 5,
                            weights: {
                                dayOfWeek: 2,
                                minutesPastMidnight: 1,
                                minutesPastNoon: 1
                            }
                        };

                        var knnResults = alike(testObj, sites[host], options);

                        var score = 0;
                        for (var i = 0; i < knnResults.length; i++) {
                            score += distance(testObj, knnResults[i]);
                        }
                        var commonEvents = compareEvents(currentEvents, knnResults.map(function (visit) {
                            return itree.search(visit.visitTime / 10000); // convert to 10 second resolution
                        }));
                        if (commonEvents.length > 0) {
                            score -= 1.5;
                        }
                        results.push({
                            host: host,
                            title: titleForHost(host),
                            score: score,
                            commonEvents: commonEvents
                        });
                    }
                    results.sort(function (a, b) {
                        return a.score - b.score;
                    });
                    results = results.slice(0, 20);
                    console.log(results);

                    linkData = results;
                    if (typeof callback === 'function') {
                        callback(err, results);
                    }

                }

                setInterval(function () {
                    getLinks();
                }, 60 * 1000);
                getLinks();

                chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
                    console.log("init()", "Incoming message", request, sender);
                    if (request.action == "getLinks") {
                        if (request.refresh) {
                            getLinks(function (err, linkData) {
                                sendResponse(linkData);
                            });
                        }
                        sendResponse(linkData);
                    } else if (request.action == "getWeather") {
                        sendResponse(weatherData);
                    }
                });
            });

        }

        init();
    });

