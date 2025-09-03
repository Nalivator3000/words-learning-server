chrome.runtime.onInstalled.addListener(() => {
    console.log('Meta Ads Expense Tracker installed');
});

chrome.action.onClicked.addListener((tab) => {
    if (tab.url.includes('adsmanager.facebook.com') || tab.url.includes('business.facebook.com')) {
        chrome.action.openPopup();
    } else {
        chrome.tabs.create({ url: 'https://adsmanager.facebook.com' });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'copyToClipboard') {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            function: (text) => {
                navigator.clipboard.writeText(text);
            },
            args: [request.text]
        });
    }
});