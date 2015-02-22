requirejs.config({
    baseUrl: 'js',
    paths: {
        node: 'node_modules'
    }
});

// Start the main app logic.
requirejs(['async','node/interval-tree/IntervalTree'],
    function   (async, intervalTree) {
        //jQuery, canvas and the app/sub module are all
        //loaded and can be used here now.
        var current_token;
        var user_data;
        var calendars;
        var events = [];
        var itree = new intervalTree(Date.now()/10000);

        if (current_token) {
            chrome.identity.removeCachedAuthToken({ token: current_token }, function(){});

            // Make a request to revoke token in the server
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
            current_token);
            xhr.send();

            current_token = 0;
            console.log("Revoked token.")
        }

        chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
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
                    success: function(data) {
                        user_data = data;
                        console.log(user_data);
                        get_history();
                        get_all_cal_events();

                    }
                });

            }
        });

        function get_history() {
            var d = new Date();
            var max_start = Date.now();
            var min_start = d.setMonth(d.getMonth()-2);
            // get history data
            chrome.history.search({
                text: "",
                startTime: min_start,
                endTime: max_start,
                maxResults: 1e6
            }, function(results) {
                console.log(results);
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
                success: function(cal_list) {
                    console.log(cal_list);
                    callback(cal_list, null);

                },
                error: function(err) {
                    console.log(err);
                    callback(null, err);
                }
            });
        }

        function get_all_cal_events() {

            var d = new Date();
            var max_start = d.setMonth(d.getMonth()+1);
            max_start = new Date(max_start).toISOString();
            var min_start = d.setMonth(d.getMonth()-2);
            min_start = new Date(min_start).toISOString();
            console.log(min_start, max_start);

            get_cal_list(function (calendar_list, err) {
                if (err) console.log(err);
                calendars = calendars || calendar_list;
                console.log(calendars);
                var max = calendars.items.length;
                var count = 1;
                async.eachSeries(calendars.items, function(cal, callback) {
                    var cal_id = cal.id;
                    $.ajax({
                        method: 'GET',
                        url: "https://www.googleapis.com/calendar/v3/calendars/" + cal_id + "/events",
                        data: {
                            "alt": "json",
                            "access_token": current_token,
                            "max_results": 2500,
                            "timeMin": min_start,
                            "timeMax": max_start,
                            "singleEvents": false
                        },
                        success: function(cal_list) {
                            //console.log(cal_list);
                            events = events.concat(cal_list.items);
                        },
                        complete: function(){
                          count++;
                            callback();
                        }

                    });

                }, function() {

                    var filtered_events = events.filter(function(evt){
                        return evt.recurrence !== undefined;
                    });
                    console.log(filtered_events);
                    async.eachSeries(filtered_events, function(evt, callback) {
                        console.log(evt.start.dateTime);
                        var start = Date.parse(evt.start.dateTime || evt.start.date);
                        var end = Date.parse(evt.end.dateTime || evt.end.date);
                        if (start < end) {
                            console.log([start, end, evt.summary]);
                            itree.add([start / 10000, end / 10000, evt.summary]);
                        }
                        callback();
                    }, function() {
                        console.log(itree.search(142176470,142196470));
                        console.log(itree);
                    });

                });
                //while (count !=max){console.log(count,max);}

            });




        }
    });

