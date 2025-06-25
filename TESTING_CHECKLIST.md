# 🧪 Testing Checklist for QA Locator Inspector

## ✅ Pre-Installation Verification
- [ ] Chrome browser version 88+ (Manifest V3 support)
- [ ] Developer mode enabled in chrome://extensions/
- [ ] All extension files present in workspace

## ✅ Installation Testing
1. **Load Extension**
   - [ ] Open `chrome://extensions/`
   - [ ] Enable "Developer mode" toggle
   - [ ] Click "Load unpacked"
   - [ ] Select the extension folder (where you downloaded/cloned this repository)
   - [ ] Extension appears with target icon ✅

2. **Initial State**
   - [ ] Extension icon visible in toolbar
   - [ ] Click icon opens popup
   - [ ] Popup shows "Enable Inspector" button
   - [ ] Status shows "Click to start inspecting elements"

## ✅ Core Functionality Testing

### Basic Inspector Operations
1. **Enable Inspector**
   - [ ] Click "Enable Inspector" button
   - [ ] Button changes to "Disable Inspector" 
   - [ ] Status shows "Inspector is active - hover over elements"

2. **Element Hovering**
   - [ ] Navigate to any website (try `google.com`)
   - [ ] Hover over search input field
   - [ ] Red outline appears around element ✅
   - [ ] Tooltip displays with CSS and XPath ✅
   - [ ] Tooltip shows correct element info ✅

3. **Click to Copy**
   - [ ] Click on any element while inspector is active
   - [ ] Green notification appears: "CSS Selector copied to clipboard!"
   - [ ] Paste clipboard content - should contain valid CSS selector ✅

### Locator Quality Testing
Test on different element types:

1. **Input Fields**
   - [ ] Text inputs show `[placeholder="..."]` or `[name="..."]`
   - [ ] Password fields show appropriate selectors
   - [ ] Email fields show `input[type="email"]` combinations

2. **Buttons**
   - [ ] ID-based buttons show `#button-id`
   - [ ] Class-based buttons show `.unique-class`
   - [ ] XPath shows `//button[text()="Button Text"]` for text content

3. **Links**
   - [ ] Links with IDs show `#link-id`
   - [ ] Links with classes show `.link-class`
   - [ ] XPath shows text-based selectors when appropriate

4. **Form Elements**
   - [ ] Select dropdowns show appropriate selectors
   - [ ] Checkboxes and radio buttons show unique selectors
   - [ ] Labels and form containers show structural selectors

## ✅ Advanced Features Testing

### History Management
1. **History Tracking**
   - [ ] Copy multiple locators
   - [ ] Open popup - history section shows recent items
   - [ ] Click history item copies it again
   - [ ] History persists after closing popup

2. **Export Functionality**
   - [ ] Copy several locators from different pages
   - [ ] Click "Export History" button
   - [ ] JSON file downloads with timestamp
   - [ ] JSON contains all copied locators with metadata

### Cross-Page Testing
1. **Multiple Tabs**
   - [ ] Enable inspector on one tab
   - [ ] Switch to another tab
   - [ ] Inspector state is independent per tab
   - [ ] History is shared across tabs

2. **Page Refresh**
   - [ ] Enable inspector
   - [ ] Refresh page
   - [ ] Inspector automatically disabled (expected)
   - [ ] Re-enable works normally

## ✅ Framework Compatibility Testing

### CSS Selector Validation
Test generated selectors in browser console:
```javascript
// Test each copied selector
document.querySelector('COPIED_SELECTOR'); // Should return the element
document.querySelectorAll('COPIED_SELECTOR').length; // Should be 1 for unique selectors
```

### Automation Framework Testing
1. **Playwright Compatible**
   - [ ] No jQuery syntax (`:contains`, `:visible`, `:eq`)
   - [ ] All selectors work with `page.locator()`
   
2. **Selenium Compatible**
   - [ ] All CSS selectors work with `By.CSS_SELECTOR`
   - [ ] XPath works with `By.XPATH`

3. **Cypress Compatible**
   - [ ] All selectors work with `cy.get()`

## ✅ Error Handling Testing

1. **Edge Cases**
   - [ ] Elements without IDs, classes, or names
   - [ ] Elements deep in nested structures
   - [ ] Dynamic content (AJAX-loaded elements)
   - [ ] SVG elements and complex graphics

2. **Permissions**
   - [ ] Test on secured sites (banking, etc.)
   - [ ] Test on sites with strict CSP
   - [ ] Verify no console errors

## ✅ Performance Testing

1. **Large Pages**
   - [ ] Test on complex sites (Amazon, Facebook)
   - [ ] Hover response time < 100ms
   - [ ] No memory leaks after extended use

2. **Resource Usage**
   - [ ] Check Chrome task manager
   - [ ] Extension should use minimal memory
   - [ ] No excessive CPU usage

## 🎯 Success Criteria

**Extension passes testing if:**
- ✅ All core functionality works without errors
- ✅ Generated locators are unique and reliable
- ✅ UI is responsive and intuitive
- ✅ Compatible with major testing frameworks
- ✅ No performance issues on typical websites

## 🚀 Ready for QA Team Deployment!

Once all tests pass, the extension is ready for your QA team to use in their daily testing workflow.
