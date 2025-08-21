import browser from 'webextension-polyfill';

export interface Message {
  type: string;
  data?: any;
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class MessageHandler {
  static async sendToBackground(message: Message): Promise<MessageResponse> {
    try {
      const response = await browser.runtime.sendMessage(message);
      return response || { success: false, error: 'No response' };
    } catch (error) {
      console.error('Failed to send message to background:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async sendToContentScript(tabId: number, message: Message): Promise<MessageResponse> {
    try {
      const response = await browser.tabs.sendMessage(tabId, message);
      return response || { success: false, error: 'No response' };
    } catch (error) {
      console.error('Failed to send message to content script:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getCurrentTab(): Promise<chrome.tabs.Tab | null> {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      return tabs[0] || null;
    } catch (error) {
      console.error('Failed to get current tab:', error);
      return null;
    }
  }

  static async sendToCurrentTab(message: Message): Promise<MessageResponse> {
    const tab = await this.getCurrentTab();
    if (!tab?.id) {
      return { success: false, error: 'No active tab' };
    }
    return this.sendToContentScript(tab.id, message);
  }
}

// Message type constants
export const MESSAGE_TYPES = {
  // Background -> Content
  GET_LISTINGS: 'GET_LISTINGS',
  CROSS_LIST: 'CROSS_LIST',
  SYNC_INVENTORY: 'SYNC_INVENTORY',
  ANALYZE_SEO: 'ANALYZE_SEO',
  
  // Content -> Background
  LISTING_DATA_EXTRACTED: 'LISTING_DATA_EXTRACTED',
  ITEMS_SELECTED: 'ITEMS_SELECTED',
  
  // Popup -> Content
  GET_SELECTED_ITEMS: 'GET_SELECTED_ITEMS',
  CLEAR_SELECTIONS: 'CLEAR_SELECTIONS',
  
  // General
  OPEN_DASHBOARD: 'OPEN_DASHBOARD',
  AUTH_STATUS_CHANGED: 'AUTH_STATUS_CHANGED'
} as const;