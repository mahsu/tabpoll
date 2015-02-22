var current_token;

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
                user_email = data.email;
                user_email_comma = user_email.replace(/\./g, ',')
                console.log(user_email_comma);

                //User authentication with our server
                /*$.post(
                    BASE_URL + "/login",
                    {
                        email: user_email,
                        accessToken: current_token
                    },
                    function(data) {
                        console.log("logged in")
                        connectFirebase();
                        chrome.runtime.onMessage.addListener(
                            function(request, sender, sendResponse) {
                                console.log(request, sender);
                                if (request.command == "email")
                                    sendResponse({email: user_email_comma});
                            });
                    }
                );*/
            }
        });
    }
});