document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleDebugger');
  toggleButton.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    chrome.runtime.sendMessage({type: 'TOGGLE_DEBUGGER', tabId: tab.id});
  });
});
