let attachedTabId = null;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_DEBUGGER') {
    if (attachedTabId === message.tabId) {
      detachDebugger(message.tabId);
    } else {
      attachDebugger(message.tabId);
    }
  }
});

function attachDebugger(tabId) {
  chrome.debugger.attach({tabId: tabId}, "1.0", () => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    console.log("Debugger attached");
    attachedTabId = tabId;
    chrome.debugger.sendCommand({tabId: tabId}, "Network.enable");
    chrome.debugger.onEvent.addListener(onEvent);
  });
}

function detachDebugger(tabId) {
  chrome.debugger.detach({tabId: tabId}, () => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    console.log("Debugger detached");
    attachedTabId = null;
    chrome.debugger.onEvent.removeListener(onEvent);
  });
}

function onEvent(debuggeeId, message, params) {
  if (message === "Network.responseReceived") {
    chrome.debugger.sendCommand(
      {tabId: debuggeeId.tabId},
      "Network.getResponseBody",
      {requestId: params.requestId},
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
        console.log("URL:", params.response.url);
        console.log("Response Body:", response.body);
      }
    );
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Chrome extension installed!');
});
