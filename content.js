chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_PAGE') {
    // Handle the parsed data here to update the page
    const parsedData = message.data;
    const table = document.getElementsByClassName('k-scheduler-table')[3];
    if (table) {
        const tableRows = table.children[0].children;
        // TODO: Update the table rows with the parsed data
    }
    // Your DOM manipulation code here
    sendResponse({ success: true });
    return true;
  }
});
