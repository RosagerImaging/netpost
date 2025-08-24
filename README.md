# NetPost - Cross-Platform E-commerce Listing Management

A comprehensive browser extension and web dashboard system for managing inventory across multiple e-commerce marketplaces.

## Features

- **Cross-Platform Listing**: Automatically list products across eBay, Mercari, Poshmark, and more
- **Intelligent Inventory Management**: Unified dashboard for tracking stock across all platforms
- **AI-Powered Optimization**: SEO analysis and automated description generation
- **Automated Delisting**: Prevent overselling with automatic inventory synchronization
- **Business Intelligence**: Sales analytics, profit tracking, and tax preparation tools

## Architecture

This is a monorepo containing:

- **chrome-extension/**: Chrome Extension (Manifest V3) with React UI
- **dashboard/**: Next.js web dashboard for inventory management
- **backend/**: Vercel serverless functions for API and automation
- **shared/**: Common types, schemas, and utilities

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Fill in your API keys and configuration
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

4. **Load extension in Chrome:**
   - Open Chrome Extensions (chrome://extensions/)
   - Enable Developer mode
   - Load unpacked: `chrome-extension/dist`

## Development

### Prerequisites

- Node.js 18+
- npm 8+
- Chrome browser for extension testing

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build:extension
npm run build:dashboard
npm run build:backend
```

### Testing

```bash
# Run all tests
npm run test

# Run specific package tests
npm run test:extension
npm run test:dashboard
npm run test:backend
```

## Supported Platforms

### Phase 1 (MVP)
- ✅ eBay (API Integration)
- ✅ Mercari (Web Automation)
- ✅ Poshmark (Web Automation)

### Phase 2
- 🔄 Facebook Marketplace
- 🔄 Depop
- 🔄 Etsy

## Security & Compliance

- AES-256 encryption for stored credentials
- Platform ToS compliant automation
- GDPR compliant data handling
- Rate limiting and anti-detection measures

## License

Private - All Rights Reserved
# Dashboard deployment test Sat 23 Aug 2025 10:19:47 PM PDT
