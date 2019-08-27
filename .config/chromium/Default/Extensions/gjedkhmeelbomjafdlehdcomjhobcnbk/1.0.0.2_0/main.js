// This is the extension's "background" script, which gets run when the
// extension is first loaded.  Nothing interesting happens until the
// content script first tries to connect to it, at which point the
// 'addListener' function is called, which will cause the SmChromeExt
// process to launch.

var hostName = "com.saba.sabameeting.chrome.connector";
var native_port = null;
var cs_port = null;

console.log("in main.js");

function onNativeMessage(message) {
  console.log("Received message: " + JSON.stringify(message));
  cs_port.postMessage(message);
}

function onDisconnected() {
  console.log("Disconnected!");
  native_port = null;
  cs_port.postMessage({"status": "disconnected"});
}

function onMessageFromContentScript(msg) {
  console.log("onMessageFromContentScript: " + JSON.stringify(msg));
  native_port.postMessage(msg);
}

chrome.runtime.onConnect.addListener(function(port) {
  cs_port = port;
  console.assert(cs_port.name == "sm-native-connector");
  
  console.log("hostName = " + hostName);
  try {
    if (native_port == null) {
      native_port = chrome.runtime.connectNative(hostName);
      native_port.onMessage.addListener(onNativeMessage);
      native_port.onDisconnect.addListener(onDisconnected);
    }
    cs_port.postMessage({"status": "connected"});
  } catch (e) {
    cs_port.postMessage({"status": "failed", "exception": e});
  }

  cs_port.onMessage.addListener(function(msg) {
    onMessageFromContentScript(msg);
  });
});
