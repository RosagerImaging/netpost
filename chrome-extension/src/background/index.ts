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

// Core functionality implementations
async function handleGetListings(data: any) {
  console.log('Getting listings:', data);
  
  try {
    const userToken = await getUserToken();
    if (!userToken) {
      return { success: false, error: 'User not authenticated' };
    }

    const response = await fetch(`${getApiUrl()}/inventory/list`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, listings: result.data?.items || [] };
  } catch (error) {
    console.error('Failed to get listings:', error);
    return { success: false, error: (error as Error).message };
  }
}

async function handleCrossListing(data: any) {
  console.log('Cross-listing items:', data);
  
  try {
    const userToken = await getUserToken();
    if (!userToken) {
      return { success: false, error: 'User not authenticated' };
    }

    // Convert selected items to inventory items or create new ones
    const inventoryItems = await processSelectedItems(data.items, userToken);
    
    if (inventoryItems.length === 0) {
      return { success: false, error: 'No valid items to cross-list' };
    }

    // Determine source platform from first item
    const sourcePlatform = data.items[0]?.platform || 'unknown';
    
    // Filter out source platform from target platforms
    const targetPlatforms = data.targetPlatforms.filter((p: string) => p !== sourcePlatform);
    
    if (targetPlatforms.length === 0) {
      return { success: false, error: 'No target platforms selected' };
    }

    // Create cross-listing request
    const response = await fetch(`${getApiUrl()}/crosslisting/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourcePlatform,
        targetPlatforms,
        inventoryItems: inventoryItems.map(item => item.id),
        optimizeSEO: true,
        generateDescriptions: false
      })
    });

    if (!response.ok) {
      throw new Error(`Cross-listing request failed: ${response.status}`);
    }

    const result = await response.json();
    
    // Show notification
    if (result.success) {
      showNotification('Cross-listing initiated', `Started cross-listing ${inventoryItems.length} items to ${targetPlatforms.length} platforms`);
    }
    
    return result;
  } catch (error) {
    console.error('Cross-listing failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

async function handleSyncInventory() {
  console.log('Syncing inventory');
  
  try {
    const userToken = await getUserToken();
    if (!userToken) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get inventory metrics to check sync status
    const response = await fetch(`${getApiUrl()}/inventory/metrics`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Sync request failed: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result.data, message: 'Inventory synced successfully' };
  } catch (error) {
    console.error('Inventory sync failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

async function handleSEOAnalysis(data: any) {
  console.log('Analyzing SEO:', data);
  
  try {
    const userToken = await getUserToken();
    if (!userToken) {
      return { success: false, error: 'User not authenticated' };
    }

    const { inventoryItemId, platform } = data;
    
    const response = await fetch(`${getApiUrl()}/seo/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inventoryItemId, platform })
    });

    if (!response.ok) {
      throw new Error(`SEO analysis failed: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, analysis: result.data };
  } catch (error) {
    console.error('SEO analysis failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Helper functions
async function getUserToken(): Promise<string | null> {
  const result = await browser.storage.sync.get('userToken');
  return result.userToken || null;
}

function getApiUrl(): string {
  // Use environment variable or fall back to production URL
  const apiUrl = process.env.REACT_APP_API_URL || 'https://netpost.app/api';
  
  // In development, use localhost if environment variable is not set
  if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_URL) {
    return 'http://localhost:3000/api';
  }
  
  return apiUrl;
}

async function processSelectedItems(selectedItems: any[], userToken: string): Promise<any[]> {
  const inventoryItems = [];
  
  for (const item of selectedItems) {
    try {
      // Check if item already exists in inventory (by title or URL)
      const existingResponse = await fetch(`${getApiUrl()}/inventory/list?search=${encodeURIComponent(item.title)}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (existingResponse.ok) {
        const existingResult = await existingResponse.json();
        const existingItem = existingResult.data?.items?.find((inv: any) => 
          inv.title.toLowerCase().includes(item.title.toLowerCase()) ||
          inv.title.toLowerCase() === item.title.toLowerCase()
        );
        
        if (existingItem) {
          inventoryItems.push(existingItem);
          continue;
        }
      }
      
      // Create new inventory item
      const newItemData = {
        title: item.title,
        description: `Imported from ${item.platform}: ${item.title}`,
        images: item.image ? [item.image] : [],
        sku: `IMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        costBasis: 0,
        retailPrice: parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0,
        quantityTotal: 1,
        quantityAvailable: 1,
        category: 'other',
        condition: 'good',
        status: 'draft'
      };
      
      const createResponse = await fetch(`${getApiUrl()}/inventory/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newItemData)
      });
      
      if (createResponse.ok) {
        const createResult = await createResponse.json();
        if (createResult.success) {
          inventoryItems.push(createResult.data.item);
        }
      }
    } catch (error) {
      console.error('Failed to process item:', item, error);
    }
  }
  
  return inventoryItems;
}

function showNotification(title: string, message: string) {
  browser.notifications.create({
    type: 'basic',
    iconUrl: '/icons/icon48.png',
    title,
    message
  });
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