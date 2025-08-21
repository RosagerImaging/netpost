import browser from 'webextension-polyfill';

export class StorageManager {
  // Sync storage for user preferences and settings
  static async setSync(key: string, value: any): Promise<void> {
    await browser.storage.sync.set({ [key]: value });
  }

  static async getSync(key: string): Promise<any> {
    const result = await browser.storage.sync.get(key);
    return result[key];
  }

  // Local storage for temporary data and selections
  static async setLocal(key: string, value: any): Promise<void> {
    await browser.storage.local.set({ [key]: value });
  }

  static async getLocal(key: string): Promise<any> {
    const result = await browser.storage.local.get(key);
    return result[key];
  }

  // User authentication
  static async setUserToken(token: string): Promise<void> {
    await this.setSync('userToken', token);
  }

  static async getUserToken(): Promise<string | null> {
    return await this.getSync('userToken');
  }

  static async clearUserToken(): Promise<void> {
    await browser.storage.sync.remove('userToken');
  }

  // User settings
  static async setSettings(settings: any): Promise<void> {
    await this.setSync('settings', settings);
  }

  static async getSettings(): Promise<any> {
    return await this.getSync('settings') || {
      autoDelisting: true,
      seoOptimization: true,
      notifications: true,
      theme: 'light'
    };
  }

  // Selected items for cross-listing
  static async setSelectedItems(items: any[]): Promise<void> {
    await this.setLocal('selectedItems', items);
  }

  static async getSelectedItems(): Promise<any[]> {
    return await this.getLocal('selectedItems') || [];
  }

  static async clearSelectedItems(): Promise<void> {
    await browser.storage.local.remove('selectedItems');
  }

  // Platform credentials (encrypted)
  static async setPlatformCredentials(platform: string, credentials: any): Promise<void> {
    const allCredentials = await this.getSync('platformCredentials') || {};
    allCredentials[platform] = credentials;
    await this.setSync('platformCredentials', allCredentials);
  }

  static async getPlatformCredentials(platform: string): Promise<any> {
    const allCredentials = await this.getSync('platformCredentials') || {};
    return allCredentials[platform];
  }
}