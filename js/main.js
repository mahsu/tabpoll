$(window).load(function () {
    var items = $('.link-item');
    for (var i = 0; i < items.length; i++) {
        $(items[i]).delay(30 * i).queue(function (next) {
            $(this).addClass("in");
            next();
        });
    }
    chrome.runtime.sendMessage({action: "getLinks", date: Date.now()}, function(response) {
        console.log(response);
    });
});


var lastOffset = $("scroll-wrapper").scrollTop();
var lastDate = new Date().getTime();

chrome.storage.sync.get("given_name", function(item) {
    $('#name').text(item.given_name);
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
    var h = today.getHours() + "";
    if (h >= 13) {
        h = h - 12;
    }
    if (h == 0) {
        h = 12;
    }
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
    return [h[0], h[1], m[0], m[1], s[0], s[1]];
}

$(document).ready(function () {
    var clock = new Clock();
    setInterval(function () {
        clock.update();
    }, 1000);
});

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

    var today = new Date();
    var day_of_week = today.getDay();
    var day = today.getDate();
    var month = "Jan"; //today.getMonth();
    if (day_of_week == 0) {
        day_of_week = "Sunday";
    } else if (day_of_week == 1) {
        day_of_week = "Monday";
    } else if (day_of_week == 2) {
        day_of_week = "Tuesday";
    } else if (day_of_week == 3) {
        day_of_week = "Wednesday";
    } else if (day_of_week == 4) {
        day_of_week = "Thursday";
    } else if (day_of_week == 5) {
        day_of_week = "Friday";
    } else if (day_of_week == 6) {
        day_of_week = "Saturday";
    }
    if (month == 0) {
        month = "Jan"
    } else if (month == 1) {
        month = "Feb"
    } else if (month == 2) {
        month = "Mar"
    } else if (month == 3) {
        month = "Apr"
    } else if (month == 4) {
        month = "May"
    } else if (month == 5) {
        month = "Jun"
    } else if (month == 6) {
        month = "Jul"
    } else if (month == 7) {
        month = "Aug"
    } else if (month == 8) {
        month = "Sep"
    } else if (month == 9) {
        month = "Oct"
    } else if (month == 10) {
        month = "Nov"
    } else if (month == 11) {
        month = "Dec"
    }
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