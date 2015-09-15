"use strict";
$(window).load(function () {
    var clock = new Clock();
    setInterval(function () {
        clock.update();
        if (lastRendered != null && Math.abs(lastRendered - Date.now()) > 60 * 1000) {
            lastRendered = null;
            updateLinks(true);
        }
        lastRendered = Date.now();
    }, 1000);
    getWeather();
    updateLinks(false);
});

function updateLinks(refresh) {
    chrome.runtime.sendMessage({action: "getLinks", refresh: refresh}, function (response) {
        renderLinks(response);
    });
}

var lastRendered;
function renderLinks(response) {
    lastRendered = Date.now();
    console.log(response);
    $("#suggestions ul").html("");
    for (let i = 0; i < response.length; i++) {
        var colors = [];
        var events = response[i].commonEvents;
        for (var j = 0; j < events.length; j++) {
            colors.push(hashColor(events[j]));
        }
        var colorBars = "";
        for (var k = 0; k < colors.length; k++) {
            colorBars += '<div class="colorBar" style="background-color: rgb(' + colors[k].r + ',' + colors[k].g + ',' + colors[k].b + ')"></div>';
        }

        var title = response[i].title || response[i].host;

        var html = '<li class="link-item">' +
            '<a href="http://' + response[i].host + '">' +
            '<i><img src="chrome://favicon/http://' + response[i].host + '" /></i>' +
            '<div class="color-wrapper">' +
            colorBars +
            '</div>' +
            '<div class="contain">' +
            '<div class="title">' + title + '</div>' +
            '<div class="link">' + response[i].host + '</div>' +
            '<div class="event">' + response[i].commonEvents.join(', ') + '</div>' +
            '</div>' +
            '</a>' +
            '</li>';
        $(html).appendTo("#suggestions ul");
    }
    var items = $('.link-item');
    for (let i = 0; i < items.length; i++) {
        $(items[i]).delay(30 * i).queue(function (next) {
            $(this).addClass("in");
            next();
        });
    }
}

var lastOffset = $("scroll-wrapper").scrollTop();
var lastDate = new Date().getTime();

chrome.storage.sync.get("given_name", function (item) {
    $('#name').text(item.given_name);
});

chrome.storage.sync.get(function (item) {
    console.log(item);
});

$("#scroll-wrapper").scroll(function (e) {
    /*var delayInMs = e.timeStamp - lastDate;
     var offset = e.target.scrollTop - lastOffset;
     var speedInpxPerMs = Math.abs(offset / delayInMs)*2;

     $(".link-item").css("paddingTop", 5 + speedInpxPerMs);
     $(".link-item").css("paddingBottom", 5 + speedInpxPerMs);

     lastDate = e.timeStamp;
     lastOffset = e.target.scrollTop;
     setTimeout(function() {
     $(".link-item").css("paddingTop", 5);
     $(".link-item").css("paddingBottom", 5);
     }, 500);*/
    /*$(".link-item").addClass("scrolling");
     setTimeout(function() {
     $(".link-item").removeClass("scrolling");
     }, 200);*/
    adjustPadding();
    setTimeout(function () {
        adjustPadding();
    }, 10);
});

function adjustPadding() {
    var items = $('.link-item');
    for (var i = 0; i < items.length; i++) {
        var pad = Math.abs($(items[i]).offset().top - 150) / 300;
        $(items[i]).css("paddingTop", pad);
        $(items[i]).css("paddingBottom", pad);
    }
}

function getTime() {
    var today = new Date();
    var h = today.getHours();
    if (h >= 13) {
        h = h - 12;
    }
    if (h == 0) {
        h = 12;
    }
    h = h + "";
    var m = today.getMinutes() + "";
    var s = today.getSeconds() + "";
    if (h.length < 2) {
        h = "0" + h;
    }
    if (m.length < 2) {
        m = "0" + m;
    }
    if (s.length < 2) {
        s = "0" + s;
    }
    var arr = [h[0], h[1], m[0], m[1], s[0], s[1]];


    const DAYS_OF_WEEK = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" ");
    const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

    var day_of_week = DAYS_OF_WEEK[today.getDay()];
    var day = today.getDate();
    var month = MONTHS[today.getMonth()];

    $("#date").html(day_of_week + "<br/>" + month + " " + day);
    var hour = today.getHours();
    var greeting;
    if (hour < 12) {
        greeting = "Good morning"
    } else if (hour > 18) {
        greeting = "Good evening"
    } else {
        greeting = "Good afternoon"
    }
    $("#greeting").text(greeting);

    return arr;
}

$(document).ready(function () {
    $('#topbar').animate({
        opacity: 1
    }, 800);
    $('#suggestions').animate({
        opacity: 1,
        top: 0
    }, 400);
    $('#divider').animate({
        width: "80%",
        opacity: 1
    }, 500);
});

function getWeather() {
    chrome.runtime.sendMessage({action: "getWeather"}, function (data) {
        if (data == null) return;

        var location = data.name;
        var temp = parseInt(data.main.temp) + " F";
        var desc = data.weather[0].description;
        var img;
        $('#location').text(location);
        $('#temp').text(temp);
        if (desc.indexOf("cloudy") > -1) {
            img = "icons/Cloud.svg"
        } else if (desc.indexOf("sunny") > -1) {
            img = "icons/Sun.svg"
        } else if (desc.indexOf("partly") > -1 || desc.indexOf("mostly") > -1) {
            img = "icons/Cloud-Sun.svg"
        } else {
            img = "icons/Sun.svg"
        }
        $('#weather-icon').attr('src', img);
        $('.weather').animate({
            opacity: 1
        }, 300);
    });
}

function Clock() {
    var time = getTime();
    this.h1 = [time[0], time[0]];
    this.h2 = [time[1], time[1]];
    this.m1 = [time[2], time[2]];
    this.m2 = [time[3], time[3]];
    this.s1 = [time[4], time[4]];
    this.s2 = [time[5], time[5]];
    this.times = [this.h1, this.h2, this.m1, this.m2, this.s1, this.s2];
    this.numbers = [$('#h1'), $('#h2'), $('#m1'), $('#m2'), $('#s1'), $('#s2')];
    this.numbers_hidden = [$('#h1_hidden'), $('#h2_hidden'), $('#m1_hidden'), $('#m2_hidden'), $('#s1_hidden'), $('#s2_hidden')];
    $('#h1').text(this.h1[0]);
    $('#h2').text(this.h2[0]);
    $('#m1').text(this.m1[0]);
    $('#m2').text(this.m2[0]);
    $('#s1').text(this.s1[0]);
    $('#s2').text(this.s2[0]);
    $('#h1_hidden').text(this.h1[1]);
    $('#h2_hidden').text(this.h2[1]);
    $('#m1_hidden').text(this.m1[1]);
    $('#m2_hidden').text(this.m2[1]);
    $('#s1_hidden').text(this.s1[1]);
    $('#s2_hidden').text(this.s2[1]);
}

Clock.prototype.update = function () {
    var time = getTime();
    this.times[0][1] = time[0];
    this.times[1][1] = time[1];
    this.times[2][1] = time[2];
    this.times[3][1] = time[3];
    this.times[4][1] = time[4];
    this.times[5][1] = time[5];
    $('#h1_hidden').text(this.times[0][1]);
    $('#h2_hidden').text(this.times[1][1]);
    $('#m1_hidden').text(this.times[2][1]);
    $('#m2_hidden').text(this.times[3][1]);
    $('#s1_hidden').text(this.times[4][1]);
    $('#s2_hidden').text(this.times[5][1]);
    for (var i = 0; i < this.times.length; i++) {
        if (this.times[i][0] != this.times[i][1]) {
            this.numbers_hidden[i].animate({
                top: -90
            }, 300, function () {
                $(this).css("top", 0);
            });
            this.numbers[i].animate({
                top: -90
            }, 300, function () {
                $(this).css("top", 0);
            });
            this.times[i][0] = this.times[i][1];
            var times = this.times;
            setTimeout(function () {
                $('#h1').text(times[0][0]);
                $('#h2').text(times[1][0]);
                $('#m1').text(times[2][0]);
                $('#m2').text(times[3][0]);
                $('#s1').text(times[4][0]);
                $('#s2').text(times[5][0]);
            }, 300)
        }
    }
};

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
    return ( this - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
};

function hashColor(str) {
    if (str) {
        var hash = 0;
        if (str.length == 0) return hash;
        for (let i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        var hue = (Math.abs(hash) % 360) / 360;
        return HSVtoRGB(hue, 1, 0.7);
    } else {
        return {
            r: 255,
            g: 255,
            b: 255
        }
    }
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (h && s === undefined && v === undefined) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            r = v, g = t, b = p;
            break;
        case 1:
            r = q, g = v, b = p;
            break;
        case 2:
            r = p, g = v, b = t;
            break;
        case 3:
            r = p, g = q, b = v;
            break;
        case 4:
            r = t, g = p, b = v;
            break;
        case 5:
            r = v, g = p, b = q;
            break;
    }
    return {
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b * 255)
    };
}
