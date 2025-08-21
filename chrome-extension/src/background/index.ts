import browser from 'webextension-polyfill';

console.log('NetPost background script loaded');

// Handle extension installation
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('NetPost extension installed');
    // Set default settings
    browser.storage.sync.set({
      settings: {
        autoDelisting: true,
        seoOptimization: true,
        notifications: true,
        theme: 'light'
      }
    });
  }
});

// Handle messages from content scripts and popup
browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('Background received message:', request);

  switch (request.type) {
    case 'GET_LISTINGS':
      return await handleGetListings(request.data);
    
    case 'CROSS_LIST':
      return await handleCrossListing(request.data);
    
    case 'SYNC_INVENTORY':
      return await handleSyncInventory();
    
    case 'ANALYZE_SEO':
      return await handleSEOAnalysis(request.data);
    
    default:
      console.warn('Unknown message type:', request.type);
      return { success: false, error: 'Unknown message type' };
  }
});

// Handle tab updates to inject content scripts when needed
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const supportedDomains = [
      'ebay.com',
      'mercari.com',
      'poshmark.com',
      'facebook.com/marketplace',
      'depop.com',
      'etsy.com'
    ];

    const isSupported = supportedDomains.some(domain => 
      tab.url?.includes(domain)
    );

    if (isSupported) {
      try {
        await browser.scripting.executeScript({
          target: { tabId },
          func: injectNetPostOverlay
        });
      } catch (error) {
        console.error('Failed to inject content script:', error);
      }
    }
  }
});

// Placeholder functions for core functionality
async function handleGetListings(data: any) {
  console.log('Getting listings:', data);
  // TODO: Implement listing retrieval logic
  return { success: true, listings: [] };
}

async function handleCrossListing(data: any) {
  console.log('Cross-listing items:', data);
  // TODO: Implement cross-listing logic
  return { success: true, message: 'Cross-listing initiated' };
}

async function handleSyncInventory() {
  console.log('Syncing inventory');
  // TODO: Implement inventory sync logic
  return { success: true, message: 'Inventory synced' };
}

async function handleSEOAnalysis(data: any) {
  console.log('Analyzing SEO:', data);
  // TODO: Implement SEO analysis logic
  return { success: true, analysis: {} };
}

// Function to inject NetPost overlay on supported sites
function injectNetPostOverlay() {
  if (document.getElementById('netpost-overlay')) {
    return; // Already injected
  }

  const overlay = document.createElement('div');
  overlay.id = 'netpost-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 999999;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
  `;
  overlay.textContent = '🚀 NetPost Active';
  
  overlay.addEventListener('mouseenter', () => {
    overlay.style.transform = 'scale(1.05)';
    overlay.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
  });

  overlay.addEventListener('mouseleave', () => {
    overlay.style.transform = 'scale(1)';
    overlay.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  });

  overlay.addEventListener('click', () => {
    browser.runtime.sendMessage({ type: 'OPEN_DASHBOARD' });
  });

  document.body.appendChild(overlay);
}

// Set up periodic inventory sync
browser.alarms.create('inventorySync', { periodInMinutes: 30 });

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'inventorySync') {
    handleSyncInventory();
  }
});