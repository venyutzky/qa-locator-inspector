# Installation Guide

## Quick Setup for QA Teams

### 1. Install the Extension
1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension folder (wherever you downloaded/cloned this repository)
6. The extension will appear in your toolbar with a target icon

### 2. Test the Extension
1. **Enable Inspector**:
   - Click the extension icon in toolbar
   - Click "Enable Inspector" button

2. **Test on Any Website**:
   - Navigate to any website (try google.com)
   - Hover over elements to see locators
   - Click elements to copy CSS selectors

3. **Verify Features**:
   - ✅ Red outline appears on hover
   - ✅ Tooltip shows CSS and XPath
   - ✅ Click copies to clipboard
   - ✅ History tracks copied locators

### 3. Usage Tips
- **For Login Forms**: Hover over username/password fields
- **For Buttons**: Click buttons to get reliable selectors
- **For Links**: Hover over navigation links
- **Export History**: Use popup to export locator history

### 4. Framework Integration
Copy the generated selectors directly into your test scripts:

**Playwright Example**:
```javascript
await page.click('#login-btn');
await page.fill('[name="username"]', 'testuser');
```

**Selenium Example**:
```python
driver.find_element(By.CSS_SELECTOR, '#login-btn').click()
driver.find_element(By.CSS_SELECTOR, '[name="username"]').send_keys('testuser')
```

### 5. Troubleshooting
- **Extension not working**: Refresh the page and try again
- **No tooltip showing**: Make sure inspector is enabled
- **Can't copy**: Check browser clipboard permissions

---
Ready to enhance your QA workflow! 🎯
