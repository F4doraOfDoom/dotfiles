// This content script is loaded into all pages on the Chrome browser as
// a result of the configuration in our extension's manifest.json file:
//
//  "content_scripts": [
//    {
//      "matches": ["*://*/*"],
//      "js": ["contentscript.js"]
//    }
//  ]
//
// We limit this script to only do something if the page has an element with
// id="sabaMeetingChromeConnector" and an attribute version="".

var ext = document.getElementById("sabaMeetingChromeConnector");
if ((ext != undefined) && (ext.attributes["version"] != undefined))
{
    console.log("Attempt to connect to sm-native-connector");
    var port = chrome.runtime.connect({"name": "sm-native-connector"});
    console.log("port = " + port);

    port.onMessage.addListener(function(msg) {
        console.log("Got message from sm-native-connector: " + JSON.stringify(msg));
        window.postMessage({ "type": "TO_PAGE", "msg": msg }, "*");
    });

    window.addEventListener("message", function(event) {
      // We only accept messages from ourselves
      if (event.source != window)
        return;

      if (event.data.type && (event.data.type == "FROM_PAGE")) {
        console.log("Content script received msg from page: " + JSON.stringify(event.data.msg));
        port.postMessage(event.data.msg);
      }
    }, false);

    //port.postMessage({"cmd": "version"});
    console.log("Done " );

    //
    // The existance of the "sm-extension-is-installed" will indicate that the extension is installed.
    //
    var isInstalledNode = document.createElement('div');
    isInstalledNode.id = 'sm-extension-is-installed';
    ext.appendChild(isInstalledNode);
}

