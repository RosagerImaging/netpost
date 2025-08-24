import React, { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { Platform } from '@shared/types/inventory';

interface SelectedItem {
  id: string;
  title: string;
  price: string;
  image: string;
  link: string;
  platform: Platform;
  extractedAt: string;
}

const PopupApp: React.FC = () => {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadSelectedItems();
    getCurrentTab();
    checkAuthStatus();
  }, []);

  const loadSelectedItems = async () => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        const response = await browser.tabs.sendMessage(tabs[0].id, {
          type: 'GET_SELECTED_ITEMS'
        });
        setSelectedItems(response?.selectedItems || []);
      }
    } catch (error) {
      console.error('Failed to load selected items:', error);
      // Fallback to storage
      const result = await browser.storage.local.get('selectedItems');
      setSelectedItems(result.selectedItems || []);
    }
  };

  const getCurrentTab = async () => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      setCurrentTab(tabs[0] || null);
    } catch (error) {
      console.error('Failed to get current tab:', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const result = await browser.storage.sync.get('userToken');
      setIsAuthenticated(!!result.userToken);
    } catch (error) {
      console.error('Failed to check auth status:', error);
    }
  };

  const handleCrossListing = async () => {
    if (selectedItems.length === 0) {
      alert('Please select items to cross-list');
      return;
    }

    setIsLoading(true);
    try {
      const response = await browser.runtime.sendMessage({
        type: 'CROSS_LIST',
        data: {
          items: selectedItems,
          targetPlatforms: ['ebay', 'mercari', 'poshmark'] // Default platforms
        }
      });

      if (response.success) {
        alert('Cross-listing initiated successfully!');
        clearSelections();
      } else {
        alert('Failed to initiate cross-listing: ' + response.error);
      }
    } catch (error) {
      console.error('Cross-listing failed:', error);
      alert('Failed to initiate cross-listing');
    } finally {
      setIsLoading(false);
    }
  };

  const clearSelections = async () => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        await browser.tabs.sendMessage(tabs[0].id, {
          type: 'CLEAR_SELECTIONS'
        });
      }
      setSelectedItems([]);
    } catch (error) {
      console.error('Failed to clear selections:', error);
    }
  };

  const openDashboard = () => {
    const dashboardUrl = process.env.REACT_APP_APP_URL || 'https://netpost.app';
    browser.tabs.create({ url: dashboardUrl });
  };

  const getSupportedPlatform = (hostname: string): string | null => {
    if (hostname.includes('ebay.com')) return 'eBay';
    if (hostname.includes('mercari.com')) return 'Mercari';
    if (hostname.includes('poshmark.com')) return 'Poshmark';
    if (hostname.includes('facebook.com')) return 'Facebook';
    if (hostname.includes('depop.com')) return 'Depop';
    if (hostname.includes('etsy.com')) return 'Etsy';
    return null;
  };

  const currentPlatform = currentTab?.url ? getSupportedPlatform(new URL(currentTab.url).hostname) : null;

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">N</span>
            </div>
            <h1 className="text-lg font-semibold">NetPost</h1>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs ${
            currentPlatform ? 'bg-green-500' : 'bg-yellow-500'
          }`}>
            {currentPlatform ? `${currentPlatform} ✓` : 'Unsupported'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {!isAuthenticated ? (
          <div className="text-center py-8">
            <div className="text-gray-600 mb-4">
              <p className="text-sm">Sign in to start cross-listing</p>
            </div>
            <button
              onClick={openDashboard}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Selected Items */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Selected Items ({selectedItems.length})
                </h3>
                {selectedItems.length > 0 && (
                  <button
                    onClick={clearSelections}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {selectedItems.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">
                  {currentPlatform 
                    ? `Browse ${currentPlatform} listings and click checkboxes to select items`
                    : 'Navigate to a supported marketplace to select items'
                  }
                </p>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      {item.image && (
                        <img src={item.image} alt="" className="w-8 h-8 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500">{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleCrossListing}
                disabled={selectedItems.length === 0 || isLoading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span className="text-sm">Processing...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm">🚀</span>
                    <span className="text-sm">Cross-List Items</span>
                  </>
                )}
              </button>

              <button
                onClick={openDashboard}
                className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm">📊 Open Dashboard</span>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <button className="text-xs bg-blue-50 text-blue-700 py-2 px-3 rounded hover:bg-blue-100 transition-colors">
                  📈 SEO Analysis
                </button>
                <button className="text-xs bg-purple-50 text-purple-700 py-2 px-3 rounded hover:bg-purple-100 transition-colors">
                  🤖 AI Optimize
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            NetPost v1.0 • Cross-platform listing made easy
          </p>
        </div>
      </div>
    </div>
  );
};

export default PopupApp;