var STORAGE_SNAPCHAT_EXPIRES_IN = 'snapchat.expiresIn';
var ALARM_SNAPCHAT_REFRESH_TOKEN ='alarm_snapchat_refresh_token';
var REFRESH_REQUEST_NO_CONNECTION = 'errorNoConnection';

chrome.storage.local.get(STORAGE_SNAPCHAT_EXPIRES_IN, function(items) {
    // make sure snapchat login is not expired on open
    var currentTime = Date.now();
    if (items[STORAGE_SNAPCHAT_EXPIRES_IN] && (currentTime > items[STORAGE_SNAPCHAT_EXPIRES_IN])){

        chrome.runtime.sendMessage({signal: ALARM_SNAPCHAT_REFRESH_TOKEN}, function(response) {
            if (response.signal !== REFRESH_REQUEST_NO_CONNECTION) {
                ChromeExtensionShow({
                    shareMode: 'DEFAULT',
                    enableLogout: true,
                    closable: false
                });
            }
        });
    } else {
        ChromeExtensionShow({
            shareMode: 'DEFAULT',
            enableLogout: true,
            closable: false
        });
    }
});

// Clear Chrome Storage for debugging
window.clearChromeStorage = function () {
    chrome.storage.local.clear();
    location.reload();
};

window.addEventListener("unload", function() {
    BitmojiWebPicker.unmountBitmojiWebPicker('bitmoji_chrome_extension_container');
}, true);
