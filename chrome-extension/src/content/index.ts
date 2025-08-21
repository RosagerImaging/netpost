import browser from 'webextension-polyfill';

console.log('NetPost content script loaded on:', window.location.hostname);

// Platform detection
const currentPlatform = detectPlatform();
console.log('Detected platform:', currentPlatform);

function detectPlatform(): string {
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.includes('ebay.com')) return 'ebay';
  if (hostname.includes('mercari.com')) return 'mercari';
  if (hostname.includes('poshmark.com')) return 'poshmark';
  if (hostname.includes('facebook.com') && window.location.pathname.includes('marketplace')) return 'facebook_marketplace';
  if (hostname.includes('depop.com')) return 'depop';
  if (hostname.includes('etsy.com')) return 'etsy';
  
  return 'unknown';
}

// Initialize platform-specific functionality
if (currentPlatform !== 'unknown') {
  initializePlatformFeatures(currentPlatform);
}

function initializePlatformFeatures(platform: string) {
  switch (platform) {
    case 'ebay':
      initializeEbayFeatures();
      break;
    case 'mercari':
      initializeMercariFeatures();
      break;
    case 'poshmark':
      initializePoshmarkFeatures();
      break;
    case 'facebook_marketplace':
      initializeFacebookFeatures();
      break;
    case 'depop':
      initializeDepopFeatures();
      break;
    case 'etsy':
      initializeEtsyFeatures();
      break;
  }
}

// eBay specific functionality
function initializeEbayFeatures() {
  console.log('Initializing eBay features');
  
  // Add selection checkboxes to listing items
  addSelectionCheckboxes('.s-item, .listingcard');
  
  // Monitor for listing pages
  if (window.location.pathname.includes('/itm/')) {
    extractListingData();
  }
}

// Mercari specific functionality
function initializeMercariFeatures() {
  console.log('Initializing Mercari features');
  
  // Add selection checkboxes to items
  addSelectionCheckboxes('.item-cell, [data-testid="item-cell"]');
  
  // Monitor for item pages
  if (window.location.pathname.includes('/item/')) {
    extractListingData();
  }
}

// Poshmark specific functionality
function initializePoshmarkFeatures() {
  console.log('Initializing Poshmark features');
  
  // Add selection checkboxes to tiles
  addSelectionCheckboxes('.tile, .item-tile');
  
  // Monitor for listing pages  
  if (window.location.pathname.includes('/listing/')) {
    extractListingData();
  }
}

// Facebook Marketplace specific functionality
function initializeFacebookFeatures() {
  console.log('Initializing Facebook Marketplace features');
  
  // Facebook has complex DOM structure, need more sophisticated selectors
  addSelectionCheckboxes('[role="main"] a[href*="/marketplace/item/"]');
}

// Depop specific functionality
function initializeDepopFeatures() {
  console.log('Initializing Depop features');
  
  addSelectionCheckboxes('.sc-gPEVay, .ProductCard');
}

// Etsy specific functionality
function initializeEtsyFeatures() {
  console.log('Initializing Etsy features');
  
  addSelectionCheckboxes('.listing-link, [data-test-id="listing-link"]');
}

// Generic function to add selection checkboxes
function addSelectionCheckboxes(selector: string) {
  const items = document.querySelectorAll(selector);
  
  items.forEach((item, index) => {
    if (item.querySelector('.netpost-checkbox')) {
      return; // Already added
    }

    const checkbox = createNetPostCheckbox(index);
    
    // Position checkbox in top-right corner
    const container = item.closest('div') || item;
    if (container) {
      container.style.position = 'relative';
      container.appendChild(checkbox);
    }
  });
}

function createNetPostCheckbox(index: number): HTMLElement {
  const checkbox = document.createElement('div');
  checkbox.className = 'netpost-checkbox';
  checkbox.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    background: white;
    border: 2px solid #3b82f6;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: all 0.2s ease;
  `;

  const checkmark = document.createElement('div');
  checkmark.style.cssText = `
    width: 12px;
    height: 12px;
    background: #3b82f6;
    border-radius: 2px;
    opacity: 0;
    transition: opacity 0.2s ease;
  `;

  checkbox.appendChild(checkmark);

  let isSelected = false;
  checkbox.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    isSelected = !isSelected;
    checkmark.style.opacity = isSelected ? '1' : '0';
    checkbox.style.background = isSelected ? '#3b82f6' : 'white';
    
    // Store selection state
    browser.storage.local.get('selectedItems').then(result => {
      const selectedItems = result.selectedItems || [];
      const itemData = extractItemData(checkbox.closest(selector) as HTMLElement);
      
      if (isSelected) {
        selectedItems.push({ ...itemData, platform: currentPlatform });
      } else {
        const itemIndex = selectedItems.findIndex(item => item.id === itemData.id);
        if (itemIndex > -1) {
          selectedItems.splice(itemIndex, 1);
        }
      }
      
      browser.storage.local.set({ selectedItems });
    });
  });

  return checkbox;
}

// Extract item data from DOM element
function extractItemData(element: HTMLElement): any {
  const title = element.querySelector('[data-testid="item-name"], .s-size-mini, h3, .title')?.textContent?.trim() || '';
  const price = element.querySelector('.notranslate, .price, [data-testid="item-price"]')?.textContent?.trim() || '';
  const image = element.querySelector('img')?.src || '';
  const link = element.querySelector('a')?.href || window.location.href;
  
  return {
    id: Date.now() + Math.random(), // Temporary ID
    title,
    price,
    image,
    link,
    extractedAt: new Date().toISOString()
  };
}

// Extract detailed listing data from individual listing pages
function extractListingData() {
  console.log('Extracting listing data from current page');
  
  // This would be platform-specific data extraction
  const listingData = {
    platform: currentPlatform,
    url: window.location.href,
    title: document.title,
    // Add more extraction logic based on platform
  };

  // Send to background script
  browser.runtime.sendMessage({
    type: 'LISTING_DATA_EXTRACTED',
    data: listingData
  });
}

// Listen for messages from popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_SELECTED_ITEMS') {
    browser.storage.local.get('selectedItems').then(result => {
      sendResponse({ selectedItems: result.selectedItems || [] });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.type === 'CLEAR_SELECTIONS') {
    browser.storage.local.remove('selectedItems');
    // Remove visual selections
    document.querySelectorAll('.netpost-checkbox').forEach(checkbox => {
      const checkmark = checkbox.querySelector('div');
      if (checkmark) {
        checkmark.style.opacity = '0';
        checkbox.style.background = 'white';
      }
    });
    sendResponse({ success: true });
  }
});

// Observer for dynamic content
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      // Re-initialize checkboxes for new content
      setTimeout(() => {
        if (currentPlatform !== 'unknown') {
          initializePlatformFeatures(currentPlatform);
        }
      }, 1000);
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});