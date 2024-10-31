let attachedTabId = null;

// Add tab update and removal listeners
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' &&
      tab.url &&
      tab.url.includes('app.courtreserve.com/Online/Reservations')) {
    attachDebugger(tabId);
  } else if (changeInfo.status === 'complete' &&
             attachedTabId === tabId) {
    // Detach if navigating away from Court Reserve
    detachDebugger(tabId);
  }
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  if (attachedTabId === tabId) {
    detachDebugger(tabId);
  }
});

function attachDebugger (tabId) {
  chrome.debugger.attach({tabId: tabId}, '1.0', () => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    console.log('Debugger attached');
    attachedTabId = tabId;
    chrome.debugger.sendCommand(
      {tabId: tabId},
      'Network.enable',
      {maxResourceBufferSize: 10000000, maxTotalBufferSize: 20000000},
    );
    chrome.debugger.onEvent.addListener(onEvent);
  });
}

function detachDebugger (tabId) {
  chrome.debugger.detach({tabId: tabId}, () => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    console.log('Debugger detached');
    attachedTabId = null;
    chrome.debugger.onEvent.removeListener(onEvent);
  });
}

function onEvent (debuggeeId, message, params) {
  if (
    message !== 'Network.responseReceived' ||
    // Check if the URL matches exactly -- 12465 appears to be the Goldman Tennis Center location ID
    params.response.url !== 'https://app.courtreserve.com/Online/Reservations/ReadConsolidated/12465'
  ) {
    return;
  }


  getResponseBodyWithRetry(debuggeeId, params.requestId)
    .then(response => {
      const results = parseResponseBody(response.body);

      // After parsing, send to content script
      chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'UPDATE_PAGE',
            data: results
          }, () => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
            }
            return true;
          });
        }

        return true;
      });

    })
    .catch(error => {
      console.warn(`Failed to get response after retries for ${params.requestId}:`, error);
    });
}

/**
 * Given an example body with a list of objects, each representing a court reservation,
 * augment the object with a new key "availabilityDuration" with values 30, 60, or 90.
 * The duration is calculated by examining adjacent objects and seeing if any AvailableCourtIds
 * overlap. If they do, the duration is the difference between the start of the first and end of the last.
 * Note that three or more adjacent objects can have overlapping AvailableCourtIds, in which case the
 * duration is the difference between the start of the first and end of the last, capped at 90.
 *
 * {
 *   "Data": [
 *     {
 *       "Id": "Hard10/27/2024 14:00:00",
 *       "Title": null,
 *       "Description": null,
 *       "IsAllDay": false,
 *       "Start": "/Date(1730037600000)/",
 *       "End": "/Date(1730039400000)/",
 *       "StartTimezone": null,
 *       "EndTimezone": null,
 *       "RecurrenceRule": null,
 *       "RecurrenceException": null,
 *       "CourtType": "Hard",
 *       "AvailableCourts": 1,
 *       "IsClosed": false,
 *       "IsInPast": true,
 *       "IsWaitListSlot": false,
 *       "ShowWaitList": false,
 *       "WaitListCount": null,
 *       "IsAvailableTemplate": false,
 *       "IsCourtAssignmentHiddenOnPortal": false,
 *       "MemberIds": [],
 *       "AvailableCourtIds": [51369],
 *       "QueuedMembers": [],
 *       "ShowCourtWaitlistOrderNumber": false
 *     },
 *     {
 *       "Id": "Hard10/27/2024 14:30:00",
 *       "Title": null,
 *       "Description": null,
 *       "IsAllDay": false,
 *       "Start": "/Date(1730039400000)/",
 *       "End": "/Date(1730041200000)/",
 *       "StartTimezone": null,
 *       "EndTimezone": null,
 *       "RecurrenceRule": null,
 *       "RecurrenceException": null,
 *       "CourtType": "Hard",
 *       "AvailableCourts": 1,
 *       "IsClosed": false,
 *       "IsInPast": true,
 *       "IsWaitListSlot": false,
 *       "ShowWaitList": false,
 *       "WaitListCount": null,
 *       "IsAvailableTemplate": false,
 *       "IsCourtAssignmentHiddenOnPortal": false,
 *       "MemberIds": [],
 *       "AvailableCourtIds": [51369],
 *       "QueuedMembers": [],
 *       "ShowCourtWaitlistOrderNumber": false
 *     }
 *   ]
 * }
 *
 * @param {*} body
 */
function parseResponseBody (body) {
  const data = JSON.parse(body);
  if (!data || !Array.isArray(data.Data)) {
    return null;
  }

  const results = [];
  const availabilitiesByCourtIds = {};
  for (const slot of data.Data.reverse()) {
    let maxDuration = 0;
    const slotStartResult = slot.Start.match(/[0-9]+/);
    if (!slotStartResult) {
      continue;
    }
    const slotStartCleaned = +slotStartResult[0];
    for (const courtId of slot.AvailableCourtIds) {
      if (!availabilitiesByCourtIds[courtId]) {
        availabilitiesByCourtIds[courtId] = {};
      }
      const duration = getAvailableDurationFromStartTime(
        availabilitiesByCourtIds[courtId],
        slotStartCleaned,
      );
      availabilitiesByCourtIds[courtId][slotStartCleaned] = duration;
      maxDuration = Math.max(maxDuration, duration);
    }
    results.push({
      StartTime: new Date(slotStartCleaned),
      AvailabilityDuration: maxDuration,
    });
  }

  return results;
}

function getAvailableDurationFromStartTime (availabilitiesForCourtId, startTime) {
  let duration = 30;
  // If availabilitiesForCourtId[startTime - 30 minutes] is available, set duration to 60;
  // if availabilitiesForCourtId[startTime - 60 minutes] is ALSO available, set duration to 90
  if (availabilitiesForCourtId[startTime + 30 * 60 * 1000]) {
    duration = 60;
    if (availabilitiesForCourtId[startTime + 90 * 60 * 1000]) {
      duration = 90;
    }
  }
  return duration;
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Chrome extension installed!');
});

function getResponseBodyWithRetry (debuggeeId, requestId, retries = 3, delay = 100) {
  return new Promise((resolve, reject) => {
    const attempt = (attemptsLeft) => {
      chrome.debugger.sendCommand(
        {tabId: debuggeeId.tabId},
        'Network.getResponseBody',
        {requestId: requestId},
        (response) => {
          if (chrome.runtime.lastError) {
            if (attemptsLeft > 0) {
              console.log(`Retry attempt for request ${requestId}, ${attemptsLeft} attempts left`);
              setTimeout(() => attempt(attemptsLeft - 1), delay);
              return;
            }
            reject(chrome.runtime.lastError);
            return;
          }
          resolve(response);
        }
      );
    };

    attempt(retries);
  });
}

// Add this near the other chrome.runtime listeners
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: 'https://app.courtreserve.com/Online/Reservations/Bookings/12465?sId=16819'
  });
});