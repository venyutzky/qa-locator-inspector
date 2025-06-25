# QA Locator Inspector

A professional Chrome extension designed for QA engineers and automation testers to generate reliable CSS selectors and XPath locators for web elements. This tool helps streamline the process of creating robust automated tests by providing high-quality locators that follow industry best practices.

## Features

### 🎯 Smart Locator Generation
- **CSS Selectors**: Prioritizes ID, name, placeholder, and unique classes
- **XPath**: Generates both text-based and attribute-based XPath expressions
- **Framework Compatible**: Works with Playwright, Selenium, and Cypress (no jQuery extensions)

### 🖱️ Interactive Inspection
- **Hover to Inspect**: Simply hover over any element to see its locators
- **Visual Highlighting**: Elements are outlined in red for clear identification
- **Click to Copy**: Click any element to copy its CSS selector to clipboard
- **Real-time Tooltips**: See both CSS and XPath locators instantly

### 📋 Locator Management
- **History Tracking**: Keeps track of recently copied locators
- **Export Functionality**: Export locator history as JSON for documentation
- **Easy Toggle**: Enable/disable inspector with one click

## Installation

### From Source (Development)
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your toolbar

### Usage

1. **Enable the Inspector**
   - Click the extension icon in your toolbar
   - Click "Enable Inspector" in the popup

2. **Inspect Elements**
   - Hover over any element on the page
   - View CSS selector and XPath in the tooltip
   - Click the element to copy its CSS selector

3. **View History**
   - Open the extension popup to see recently copied locators
   - Click any history item to copy it again
   - Export history for documentation

## Locator Priority

The extension follows QA best practices for locator generation:

### CSS Selectors (Primary)
1. **ID Attribute** - `#login-btn`
2. **Name Attribute** - `[name="submit"]`
3. **Placeholder Text** - `[placeholder="Enter username"]`
4. **Unique Classes** - `.login-form-submit`
5. **Attribute Combinations** - `button[type="submit"][class="btn-primary"]`
6. **Structural Selectors** - `:nth-child()` as fallback

### XPath (Fallback)
1. **Text-based** - `//button[text()="Login"]`
2. **Attribute-based** - `//input[@name="username"]`
3. **Relative positioning** - `//form[@class="login"]//button`

## Framework Compatibility

✅ **Compatible with:**
- Playwright
- Selenium WebDriver
- Cypress
- WebdriverIO
- TestCafe

❌ **Avoids jQuery extensions:**
- No `:contains()` selectors
- No `:visible` or `:hidden` pseudo-classes
- No `:eq()` selectors

## File Structure

```
qa-locator-inspector/
├── manifest.json          # Extension configuration
├── content.js             # Main locator generation logic
├── content.css            # Styling for tooltips and highlights
├── popup.html             # Extension popup interface
├── popup.js               # Popup functionality
├── background.js          # Background service worker
├── icons/                 # Extension icons
└── README.md              # This file
```

## Technical Details

### Locator Generation Algorithm

The extension uses a sophisticated algorithm that:
1. Analyzes element attributes and properties
2. Generates multiple locator candidates
3. Tests for uniqueness within the page
4. Selects the most reliable and maintainable option
5. Follows QA industry best practices

### Security & Privacy
- No data is sent to external servers
- All locator history is stored locally
- Minimal permissions required (activeTab, storage)
- No tracking or analytics

## Development

### Building from Source
```bash
# Clone the repository
git clone <repository-url>
cd qa-locator-inspector

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select this folder
```

### Testing
Test the extension on various websites to ensure:
- Locator accuracy and uniqueness
- Performance on complex pages
- Compatibility with different frameworks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

We welcome contributions from the QA and automation testing community! Please feel free to submit issues, feature requests, or pull requests.

## Support

For issues or feature requests, please create an issue in this repository.

---

**Made with ❤️ for the QA community**
