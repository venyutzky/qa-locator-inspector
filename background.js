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

// Handle iframe communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'iframe_locator') {
        // Handle cross-frame locator communication
        chrome.tabs.sendMessage(sender.tab.id, {
            action: 'locator_from_iframe',
            locator: request.locator,
            frameInfo: request.frameInfo
        });
    }
    
    if (request.action === 'shadow_dom_locator') {
        // Handle shadow DOM locator communication
        chrome.tabs.sendMessage(sender.tab.id, {
            action: 'locator_from_shadow',
            locator: request.locator,
            shadowInfo: request.shadowInfo
        });
    }
});
