(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global location */
'use strict';

var PageDetectorService = require('./services/page_detector_service');

if (location.hostname.match(/mail.google.com$/)) {
    PageDetectorService.enableInboxSDKFor('GMAIL');
} else if (location.hostname.match(/inbox.google.com$/)) {
    PageDetectorService.enableInboxSDKFor('INBOX');
} else if (location.hostname.match(/github.com$/)) {
    PageDetectorService.listenForHistoryAPIChangeState();
    PageDetectorService.setPageDetectorListener('GITHUB');
} else if (location.hostname.match(/bitbucket.org$/)) {
    PageDetectorService.setPageDetectorListener('BITBUCKET');
} else if (location.hostname.match(/atlassian.net$/)) {
    PageDetectorService.setPageDetectorListener('JIRA');
}

},{"./services/page_detector_service":2}],2:[function(require,module,exports){
/* global chrome */
'use strict';

var DragUtil = require('../util/drag_util');
var Constants = require('../util/constants');
var Config = require('../util/config');

var ANON_FLOATER = chrome.runtime.getURL(Config.misc.ANON_FLOATER_PATH);
var WIDGET_WIDTH = 342;
var WIDGET_HEIGHT = 478;
var ICON_URL = Config.endpoints.RENDERING_ENDPOINT + 'v2/cpanel/8581656-%s-v1.png?width=50&transparent=1&trim=symmetric';
var modal = undefined;
var _avatarUUID = null;

// generic loader
var backgroundLoaderImg = 'url(' + chrome.runtime.getURL('static/media/bitmoji-loader.svg') + ') center center no-repeat';
var $loader = $('<div class="loader" />');
$loader.css({
    height: WIDGET_HEIGHT,
    width: WIDGET_WIDTH,
    background: backgroundLoaderImg,
    backgroundSize: '90px',
    animation: 'pulsate-loader 1.0s infinite ease-in-out'
});

var initFloatingExtension = function initFloatingExtension(shareMode, target) {
    setTimeout(function () {
        var widgetId = 'bitmoji_chrome_extension_container';
        var bitmojiUI = $('<div>');

        var leftPosition = window.innerWidth / 3;
        var topPosition = $(window).scrollTop() + window.innerHeight / 3;

        ChromeExtensionHide(widgetId);

        bitmojiUI.css({
            background: 'white',
            position: 'absolute',
            left: leftPosition,
            top: topPosition,
            minWidth: WIDGET_WIDTH,
            minHeight: WIDGET_HEIGHT,
            overflow: 'hidden',
            zIndex: 4000,
            border: '1px rgba(0, 0, 0, .3)',
            boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.15)'
        });

        bitmojiUI.attr('id', widgetId);

        bitmojiUI.off('mousedown mouseup');

        bitmojiUI.on('mousedown', '.bitmoji-sdk-top-bar', function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            DragUtil.startMoving(document.getElementById(widgetId), evt);
        });
        bitmojiUI.on('mouseup', '.bitmoji-sdk-top-bar', function () {
            DragUtil.stopMoving();
        });

        chrome.storage.local.get([Constants.STORAGE_LOGIN_TOKEN_TYPE, Constants.STORAGE_SNAPCHAT_EXPIRES_IN, Constants.STORAGE_AVATAR_UUID], function (items) {

            /*
             *  User should be redirected to bitmoji.com login page if:
             *     1) User is not logged into chrome extension
             *     2) User is logged into chrome extension but does not an avatar
             *         -> Redirecting to bitmoji.com will trigger the site to check
             *         if new avatar data is available
             */
            if (!items[Constants.STORAGE_LOGIN_TOKEN_TYPE] || !items[Constants.STORAGE_AVATAR_UUID]) {
                window.open(Config.misc.BITMOJI_COM_URL);
                return;
            }

            /*
             *  User should be shown the alert to refresh their page if:
             *     1) User's current saved avatarUUID is different from the one
             *        found in chrome storage.  This state occurs when user has logged out and
             *        logged in with another account.
             */
            if (_avatarUUID !== items[Constants.STORAGE_AVATAR_UUID]) {
                showAlert();
                return;
            }

            bitmojiUI.append($loader);
            $('body').append(bitmojiUI);

            // make sure snapchat login is not expired on open
            var currentTime = Date.now();
            if (items[Constants.STORAGE_SNAPCHAT_EXPIRES_IN] && currentTime > items[Constants.STORAGE_SNAPCHAT_EXPIRES_IN]) {

                chrome.runtime.sendMessage({ signal: Constants.ALARM_SNAPCHAT_REFRESH_TOKEN }, function (response) {
                    if (response.signal !== Constants.REFRESH_REQUEST_NO_CONNECTION) {
                        ChromeExtensionShow({
                            closableCallback: function closableCallback() {
                                ChromeExtensionHide(widgetId);
                            },
                            shareMode: shareMode,
                            target: target
                        });
                    }
                });
            } else {
                ChromeExtensionShow({
                    closableCallback: function closableCallback() {
                        ChromeExtensionHide(widgetId);
                    },
                    shareMode: shareMode,
                    target: target
                });
            }
        });
    }, 200);
};

var showAlert = function showAlert() {
    sweetAlert({
        title: 'Uh oh',
        text: "We couldn't load your avatar. Please refresh the page and try again.",
        type: "error",
        confirmButtonColor: "#38CA8E",
        confirmButtonText: "Okay"
    });
};

/**
 * Listens for Chrome runtime message for `push_replace_state` from
 * background.js to re-enable the extension on sites that use the
 * History API
 */
function listenForHistoryAPIChangeState() {
    chrome.runtime.onMessage.addListener(function (message, sender, response) {
        if (message !== 'push_replace_state') {
            return;
        }
        ChromeExtensionHide('bitmoji_chrome_extension_container');
        setPageDetectorListener('GITHUB');
    });
};

function enableInboxSDKFor(shareModeID) {
    var welcomeModalCallback = function welcomeModalCallback() {
        modal.close();
    };

    var googleWelcomeModalOptions = {
        el: "<p>We've added your avatar to the compose bar.</p><p>Simply click on it to insert a Bitmoji into any email!</p>",
        title: 'Bitmoji for ' + shareModeID + ' is ready to go',
        buttons: [{ text: 'Got It', onClick: welcomeModalCallback, type: 'PRIMARY_ACTION' }]
    };

    chrome.storage.local.get(Constants.STORAGE_AVATAR_UUID, function (items) {
        if (items && items[Constants.STORAGE_AVATAR_UUID]) {
            _avatarUUID = items[Constants.STORAGE_AVATAR_UUID];
        }
    });

    InboxSDK.load('2.0', 'sdk_Bitmoji_ddf863a878').then(function (sdk) {
        registerComposeViewHandler(sdk, shareModeID);
        showWelcomeModal(sdk, shareModeID);
    });

    /**
     * Initializes the Bitmoji button in the GMail compose window toolbar
     * @param  {object} sdk loaded InboxSDK
     * @param  {String} shareModeID - Currently supports GMAIL or INBOX
     * @return {null}
     */
    var registerComposeViewHandler = function registerComposeViewHandler(sdk, shareModeID) {
        if (!sdk) {
            throw new Error('SDK required to show Bitmoji in ' + shareModeID + ' toolbar.');
        }

        sdk.Compose.registerComposeViewHandler(function (composeView) {
            var iconUrl = ANON_FLOATER;

            if (_avatarUUID) {
                iconUrl = ICON_URL.replace('%s', _avatarUUID);
            }

            composeView.addButton({
                title: 'Insert Bitmoji',
                iconUrl: iconUrl,
                hasDropdown: true,
                onClick: function onClick(event) {
                    event.dropdown.el.id = 'GmailComposerPicker';
                    var timeoutID = window.setTimeout(function () {
                        showAlert();
                    }, 1000);

                    var floaterCSS = {
                        minHeight: WIDGET_HEIGHT,
                        minWidth: WIDGET_WIDTH
                    };

                    $(event.dropdown.el).css(floaterCSS);
                    $(event.dropdown.el).append($loader);

                    chrome.storage.local.get([Constants.STORAGE_LOGIN_TOKEN_TYPE, Constants.STORAGE_SNAPCHAT_EXPIRES_IN, Constants.STORAGE_AVATAR_UUID], function (items) {
                        window.clearTimeout(timeoutID);

                        /*
                         *  User should be redirected to bitmoji.com login page if:
                         *     1) User is not logged into chrome extension
                         *     2) User is logged into chrome extension but does not an avatar
                         *         -> Redirecting to bitmoji.com will trigger the site to check
                         *         if new avatar data is available
                         */
                        if (!items[Constants.STORAGE_LOGIN_TOKEN_TYPE] || !items[Constants.STORAGE_AVATAR_UUID]) {
                            window.open(Config.misc.BITMOJI_COM_URL);
                            event.dropdown.close();
                            return;
                        }

                        /*
                         *  User should be shown the alert to refresh their page if:
                         *     1) User's current saved avatarUUID is different from the one
                         *        found in chrome storage.  This state occurs when user has logged out and
                         *        logged in with another account.
                         */
                        if (_avatarUUID !== items[Constants.STORAGE_AVATAR_UUID]) {
                            event.dropdown.close();
                            showAlert();
                            return;
                        }

                        // make sure snapchat login is not expired onopen
                        var currentTime = Date.now();
                        if (items[Constants.STORAGE_SNAPCHAT_EXPIRES_IN] && currentTime > items[Constants.STORAGE_SNAPCHAT_EXPIRES_IN]) {

                            chrome.runtime.sendMessage({ signal: Constants.ALARM_SNAPCHAT_REFRESH_TOKEN }, function (response) {
                                if (response.signal !== Constants.REFRESH_REQUEST_NO_CONNECTION) {
                                    ChromeExtensionShow({
                                        closableCallback: function closableCallback() {
                                            event.dropdown.close();
                                        },
                                        shareMode: shareModeID,
                                        target: event.composeView,
                                        element: event.dropdown.el
                                    });
                                }
                            });
                        } else {

                            ChromeExtensionShow({
                                closableCallback: function closableCallback() {
                                    event.dropdown.close();
                                },
                                shareMode: shareModeID,
                                target: event.composeView,
                                element: event.dropdown.el
                            });
                        }

                        event.dropdown.on('destroy', function () {
                            ChromeExtensionHide(event.dropdown.el.id);
                        });
                    });
                }
            });
        });
    };

    /**
     * Shows the welcome modal on the first load of GMail or Inbox once extension installed
     * @param  {object} sdk loaded InboxSDK
     * @param  {String} shareModeID - Currently supports GMAIL or INBOX
     * @return {null}
     */
    var showWelcomeModal = function showWelcomeModal(sdk, shareModeID) {
        if (!sdk) {
            throw new Error('SDK required to show welcome modal.');
        }

        var welcomeModalKey = 'bitmoji.hasSeenWelcomeModal' + shareModeID;

        chrome.storage.local.get(welcomeModalKey, function (items) {
            if (items && items[welcomeModalKey]) {
                return;
            }

            modal = sdk.Widgets.showModalView(googleWelcomeModalOptions);

            var options = {};
            options[welcomeModalKey] = true;
            chrome.storage.local.set(options);
        });
    };
};

function setPageDetectorListener(shareMode) {
    chrome.storage.local.get(Constants.STORAGE_AVATAR_UUID, function (items) {
        if (items && items[Constants.STORAGE_AVATAR_UUID]) {
            _avatarUUID = items[Constants.STORAGE_AVATAR_UUID];
        }
    });

    var displayFloater = function displayFloater(evt, element) {
        var backgroundImageValue = undefined;
        var $bitmojiButton = $('<div class="bitmoji-floater">');
        var iconUrl = ANON_FLOATER;

        if (_avatarUUID) {
            iconUrl = ICON_URL.replace('%s', _avatarUUID);
        }

        backgroundImageValue = 'url(' + iconUrl + ')';

        $bitmojiButton.css({
            backgroundPosition: 0,
            backgroundImage: backgroundImageValue,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat'
        });

        $bitmojiButton.on('click', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            initFloatingExtension(shareMode, evt && evt.target ? evt.target : element);
        });

        var alreadyOnPage = $('.bitmoji-floater').length;

        if (shareMode === 'GITHUB' || !alreadyOnPage) {

            switch (shareMode) {

                case 'BITBUCKET':
                    // Custom styles
                    $bitmojiButton.css({
                        width: '35px',
                        height: '35px',
                        marginRight: '10px',
                        float: 'left'
                    });

                    // Append to DOM
                    $('.markItUpHeader > ul').before($bitmojiButton);
                    break;

                case 'JIRA':
                case 'CORP-JIRA':
                    // Custom styles
                    $bitmojiButton.css({
                        width: '25px',
                        height: '25px',
                        margin: '-2px 0 0 -1px',
                        float: 'left'
                    });

                    // Append to DOM
                    var $buttonContainer = $('<div class="aui-buttons" />');
                    var $auiButton = $('<a class="aui-button aui-button-subtle" />');

                    $auiButton.append($bitmojiButton);
                    $buttonContainer.append($auiButton);

                    $('.aui-toolbar2-primary').append($buttonContainer);
                    break;

                case 'GITHUB':
                case 'CORP-GITHUB':
                    // Custom styles
                    $bitmojiButton.css({
                        width: '28px',
                        height: '28px',
                        marginBottom: '-8px',
                        display: 'inline-block'
                    });

                    // Append to DOM
                    var tabBar = $(element).closest('.js-previewable-comment-form').find('.comment-form-head .tabnav-tabs');
                    tabBar.append($bitmojiButton);
                    break;

                default:
                    throw new Error('Unknown share mode: ' + shareMode);
            }
        }
    };

    // BIT-1974
    /**
     * When textareas are visible by default and we want to
     * show the Bitmoji floater
     */
    var showBitmojiFloaterForVisibleTextarea = function showBitmojiFloaterForVisibleTextarea() {
        $('.bitmoji-floater').remove();
        $('textarea:visible').each(function (index, el) {
            displayFloater(null, el);
        });
    };

    /**
     * When textareas are hidden by default, often clicking a button
     * will make a textarea appear and come in focus.
     * Shows the floater once the textarea is focused.
     */
    var showBitmojiFloaterOnTextareaFocus = function showBitmojiFloaterOnTextareaFocus() {
        $('body').on('focusin', 'textarea', displayFloater);
    };

    // When to display the Bitmoji floater
    switch (shareMode) {
        case 'GITHUB':
        case 'CORP-GITHUB':
            $(document).ready(showBitmojiFloaterForVisibleTextarea);

            $('.js-toggle-inline-comment-form, .js-add-line-comment').on('click', function () {
                setTimeout(function () {
                    showBitmojiFloaterForVisibleTextarea();
                }, 500);
            });

            break;

        case 'BITBUCKET':
        case 'JIRA':
        case 'CORP-JIRA':
        default:
            showBitmojiFloaterOnTextareaFocus();
    }
};

module.exports = {
    enableInboxSDKFor: enableInboxSDKFor,
    setPageDetectorListener: setPageDetectorListener,
    listenForHistoryAPIChangeState: listenForHistoryAPIChangeState
};

},{"../util/config":3,"../util/constants":4,"../util/drag_util":5}],3:[function(require,module,exports){
'use strict';

var dev = {
    endpoints: {
        BITMOJI_API: 'http://devbox-api.bitmoji.com:8080/',
        RENDERING_ENDPOINT: 'https://staging-render.bitstrips.com/'
    },
    oauth: {
        SNAPCHAT_LOGIN_TOKEN_URL: 'https://accounts.snap-dev.net/accounts/oauth2/token',
        SNAPCHAT_REVOKE_TOKEN_URL: 'https://accounts.snap-dev.net/accounts/oauth2/revoke',
        SNAPCHAT_ACCOUNTS_REDIRECT_URI: 'https://test.bitmoji.com/account_v2/',
        // chrome extension oauth2 related constants
        CHROME_EXT_CLIENT_ID: 'a05e5439-807d-49f3-8161-f6c4a50581b5',
        /**
         * Approved by security to store secret in repository.
         * */
        CHROME_EXT_CLIENT_SECRET: 'j9kY-vS6nR9FOzNedlaHND-T6_OqZPh9owWCgYCogyU',
        CHROME_EXT_SCOPE: 'https://auth.snapchat.com/oauth2/api/bitmoji.read'
    },
    misc: {
        BITMOJI_COM_URL: 'https://test.bitmoji.com/account_v2/',
        BITMOJI_COM_DOMAIN: 'test.bitmoji.com',
        ANON_FLOATER_PATH: 'static/media/bitmoji-icon-48.png'
    }
};

var staging = {
    endpoints: {
        BITMOJI_API: 'https://staging-api.bitmoji.com/',
        RENDERING_ENDPOINT: 'https://staging-render.bitstrips.com/'
    },
    oauth: {
        SNAPCHAT_LOGIN_TOKEN_URL: 'https://accounts.snap-dev.net/accounts/oauth2/token',
        SNAPCHAT_REVOKE_TOKEN_URL: 'https://accounts.snap-dev.net/accounts/oauth2/revoke',
        SNAPCHAT_ACCOUNTS_REDIRECT_URI: 'https://test.bitmoji.com/account_v2/',
        // chrome extension oauth2 related constants
        CHROME_EXT_CLIENT_ID: 'a05e5439-807d-49f3-8161-f6c4a50581b5',
        /**
         * Approved by security to store secret in repository.
         * */
        CHROME_EXT_CLIENT_SECRET: 'j9kY-vS6nR9FOzNedlaHND-T6_OqZPh9owWCgYCogyU',
        CHROME_EXT_SCOPE: 'https://auth.snapchat.com/oauth2/api/bitmoji.read'
    },
    misc: {
        BITMOJI_COM_URL: 'https://test.bitmoji.com/account_v2/',
        BITMOJI_COM_DOMAIN: 'test.bitmoji.com',
        ANON_FLOATER_PATH: 'static/media/bitmoji-icon-48.png'
    }
};

var prod = {
    endpoints: {
        BITMOJI_API: 'https://api.bitmoji.com/',
        RENDERING_ENDPOINT: 'https://render.bitstrips.com/'
    },
    oauth: {
        SNAPCHAT_LOGIN_TOKEN_URL: 'https://accounts.snapchat.com/accounts/oauth2/token',
        SNAPCHAT_REVOKE_TOKEN_URL: 'https://accounts.snapchat.com/accounts/oauth2/revoke',
        SNAPCHAT_ACCOUNTS_REDIRECT_URI: 'https://www.bitmoji.com/account_v2/',
        // chrome extension oauth2 related constants
        CHROME_EXT_CLIENT_ID: 'b8b2fb03-128e-459f-b2bf-71a0890d2413',
        /**
         * Approved by security to store secret in repository.
         * */
        CHROME_EXT_CLIENT_SECRET: 'atqHYu1s_8XORC4eolr1B6433gKSHCs2LvxlTFo8vqk',
        CHROME_EXT_SCOPE: 'https://auth.snapchat.com/oauth2/api/bitmoji.read'
    },
    misc: {
        BITMOJI_COM_URL: 'https://www.bitmoji.com/account_v2/',
        BITMOJI_COM_DOMAIN: 'www.bitmoji.com',
        ANON_FLOATER_PATH: 'static/media/bitmoji-icon-48.png'
    }
};

var internalProd = {
    endpoints: {
        BITMOJI_API: 'https://api.bitmoji.com/',
        RENDERING_ENDPOINT: 'https://render.bitstrips.com/'
    },
    oauth: {
        SNAPCHAT_LOGIN_TOKEN_URL: 'https://accounts.snapchat.com/accounts/oauth2/token',
        SNAPCHAT_REVOKE_TOKEN_URL: 'https://accounts.snapchat.com/accounts/oauth2/revoke',
        SNAPCHAT_ACCOUNTS_REDIRECT_URI: 'https://www.bitmoji.com/internal_account_v2/',
        // chrome extension oauth2 related constants
        CHROME_EXT_CLIENT_ID: 'b8b2fb03-128e-459f-b2bf-71a0890d2413',
        /**
         * Approved by security to store secret in repository.
         * */
        CHROME_EXT_CLIENT_SECRET: 'atqHYu1s_8XORC4eolr1B6433gKSHCs2LvxlTFo8vqk',
        CHROME_EXT_SCOPE: 'https://auth.snapchat.com/oauth2/api/bitmoji.read'
    },
    misc: {
        BITMOJI_COM_URL: 'https://www.bitmoji.com/internal_account_v2/',
        BITMOJI_COM_DOMAIN: 'www.bitmoji.com',
        ANON_FLOATER_PATH: 'static/media/bitmoji-internal-icon-48.png'
    }
};

// values used in chrome ext
module.exports = prod;

},{}],4:[function(require,module,exports){
'use strict';

module.exports = {
    // bitmoji auth related constants
    BITMOJI_BSAUTH_COOKIE: 'bitmoji_bsauth_token',
    BITMOJI_LOGIN_TYPE_COOKIE: 'bitmoji_login_token_type',

    STORAGE_AVATAR_ID: 'bitmoji.avatarId',
    STORAGE_AVATAR_ID_HASH: 'bitmoji.avatarIdHash',
    STORAGE_AVATAR_UUID: 'bitmoji.avatarUUID',
    STORAGE_LOGIN_TOKEN_TYPE: 'bitmoji.loginTokenType',
    STORAGE_BSAUTH_TOKEN: 'bitmoji.bsauthToken',
    STORAGE_LAST_TAB: 'bitmoji.lastTab',

    // snapchat oauth2 related constants
    OAUTH2_STATE_BYTES: 32,
    OAUTH2_CODE_VERIFIER_BYTES: 32,

    LOGIN_TOKEN_TYPE_BSAUTH: 'bsAuth',
    LOGIN_TOKEN_TYPE_SNAPCHAT: 'snapAuth',

    STORAGE_SNAPCHAT_STATE: 'snapchat.state',
    STORAGE_SNAPCHAT_CODE_VERIFIER: 'snapchat.codeVerifier',
    STORAGE_SNAPCHAT_CODE_CHALLENGE: 'snapchat.codeChallenge',
    STORAGE_SNAPCHAT_ACCESS_TOKEN: 'snapchat.accessToken',
    STORAGE_SNAPCHAT_REFRESH_TOKEN: 'snapchat.refreshToken',
    STORAGE_SNAPCHAT_EXPIRES_IN: 'snapchat.expiresIn',
    STORAGE_CHROME_EXT_ACCESS_EXPIRY: 'chromeExt.accessExpiry',

    ALARM_SNAPCHAT_REFRESH_TOKEN: 'alarm_snapchat_refresh_token',
    ALARM_SNAPCHAT_REFRESH_TIME_OFFSET_MS: 600000,
    GET_BITMOJI_AVATAR_DATA: 'get_bitmoji_avatar_data',
    GET_BITMOJI_PACKS_DATA: 'get_bitmoji_packs_data',
    REFRESH_REQUEST_NO_CONNECTION: 'errorNoConnection',

    BITMOJI_WEB_SDK_ANALYTICS_ID: 12
};

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var DragUtil = (function () {
    function DragUtil() {
        _classCallCheck(this, DragUtil);
    }

    _createClass(DragUtil, null, [{
        key: 'move',
        value: function move(floatingElement, xPos, yPos) {
            floatingElement.style.left = xPos + 'px';
            floatingElement.style.top = yPos + 'px';
        }
    }, {
        key: 'startMoving',
        value: function startMoving(floatingElement, evt) {
            var _this = this;

            evt = evt || window.event;

            var posX = evt.clientX;
            var posY = evt.clientY;
            var floatingElementTop = floatingElement.style.top;
            var floatingElementLeft = floatingElement.style.left;
            var eWi = +floatingElement.style.width;
            var eHe = +floatingElement.style.height;

            document.body.style.cursor = 'move';

            floatingElementTop = floatingElementTop.replace('px', '');
            floatingElementLeft = floatingElementLeft.replace('px', '');
            var diffX = posX - floatingElementLeft;
            var diffY = posY - floatingElementTop;

            document.onmousemove = function (evt) {
                evt = evt || window.event;

                evt.stopPropagation();
                evt.preventDefault();

                var posX = evt.clientX;
                var posY = evt.clientY;
                var aX = posX - diffX;
                var aY = posY - diffY;

                if (aX < 0) aX = 0;
                if (aY < 0) aY = 0;
                if (aX + eWi > window.innerWidth) aX = window.innerWidth - eWi;
                if (aY + eHe > window.innerHeight) aY = window.innerHeight - eHe;

                _this.move(floatingElement, aX, aY);
            };
        }
    }, {
        key: 'stopMoving',
        value: function stopMoving(container) {
            document.body.style.cursor = 'default';
            document.onmousemove = function () {};
        }
    }]);

    return DragUtil;
})();

exports['default'] = DragUtil;
;
module.exports = exports['default'];

},{}]},{},[1]);
