chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_PAGE') {
    const parsedData = message.data;
    const table = document.getElementsByClassName('k-scheduler-table')[3];
    if (table && table.parentElement) {
      const tableRows = table.parentElement.getElementsByClassName('schedule-Event-Container');
      if (tableRows.length !== parsedData.length) {
        return;
      }
      // Function to update the text content
      const updateContent = () => {
        for (let i = 0; i < tableRows.length; i++) {
          const row = tableRows[i];
          const availabilityDuration = parsedData[tableRows.length - 1 - i].AvailabilityDuration;
          const anchor = row.getElementsByTagName('a')[0];
          if (anchor) {
            anchor.textContent = `(${availabilityDuration}) ${anchor.textContent.replace(/\(\d+\)\s*/, '')}`;
          }
        }
      };

      // Run immediately
      updateContent();
      // Run again after 2 seconds
      setTimeout(updateContent, 2000);
    }

    sendResponse({ success: true });
    return true;
  }
});
