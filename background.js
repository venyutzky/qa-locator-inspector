//QA Locator Inspector - Background Script
chrome.runtime.onInstalled.addListener(() => {
    console.log('QA Locator Inspector installed');
    
    // Set default settings
    chrome.storage.local.set({
        enabled: false,
        history: []
    });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // This will open the popup, no additional action needed
});

// Listen for tab changes to reset state if needed
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Could be used to sync state across tabs in the future
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // Could be used to reinject content script if needed
    }
});
