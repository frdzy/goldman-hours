chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_PAGE') {
    // Handle the parsed data here to update the page
    const parsedData = message.data;
    // Your DOM manipulation code here
    sendResponse({ success: true });
  }
});
