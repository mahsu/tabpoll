var current_token;
var user_email;
var user_name;

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
                "scope":"https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
                "access_token": current_token
            },
            success: function(data) {
                user_email = data.email;
                user_name = data.given_name;
                console.log(data);
                console.log(user_email);

            }
        });

    }
});

// get history data
var d = new Date();
chrome.history.search({
    text: "",
    startTime: d.setMonth(d.getMonth()-2),
    endTime: Date.now(),
    maxResults: 1e6
    }, function(results) {
    console.log(results);
});