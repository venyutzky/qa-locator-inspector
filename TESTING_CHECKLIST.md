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
   - [ ] **Ctrl+Click** on any element while inspector is active
   - [ ] Green notification appears: "CSS Selector copied to clipboard!"
   - [ ] Paste clipboard content - should contain valid CSS selector ✅
   - [ ] **Alt+Click** copies XPath with purple notification ✅
   - [ ] **Normal clicks work normally** - no interference with page functionality ✅

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

## ✅ Advanced DOM Testing

### iframe Testing
Use both test files for comprehensive iframe testing:

#### Standard iframe Testing (`test-standard-iframe.html`)
1. **Standard HTML iframe Elements**
   - [ ] Open `test-standard-iframe.html` via local server (http://localhost:8000)
   - [ ] Enable inspector and hover over elements inside standard iframe
   - [ ] Tooltip shows 🖼️ iframe context indicator with warning about XPath
   - [ ] CSS locator shows element CSS only (no iframe prefix)
   - [ ] XPath shows element XPath only (no iframe prefix)
   - [ ] Click iframe elements copies frame-aware CSS or element-only XPath ✅
   - [ ] Test nested iframe elements for proper hierarchy
   - [ ] Verify console shows successful iframe injection messages

2. **iframe CSS Testing**
   - [ ] Click iframe element to copy CSS
   - [ ] CSS should be element-only: `button[id="iframe-btn-1"]`
   - [ ] Manual test in DevTools:
     - Switch context: `document.querySelector('iframe[name="standard-frame"]').contentDocument`
     - Test CSS: `querySelector('button[id="iframe-btn-1"]')` - should find element ✅
   - [ ] Check console for iframe switching guidance

3. **iframe XPath Testing**
   - [ ] Ctrl+Click iframe element to copy XPath
   - [ ] XPath should be element-only: `//button[text()="iframe Button"]`
   - [ ] Manual test in DevTools:
     - Switch context: `document.querySelector('iframe[name="standard-frame"]').contentDocument`
     - Test XPath: `$x('//button[text()="iframe Button"]')` - should find element ✅
   - [ ] Check console for iframe switching guidance

#### Advanced iframe Testing (`test-iframe-shadow.html`)  
2. **srcdoc iframe Elements**
   - [ ] Enable inspector and hover over elements inside "Simple iframe" (srcdoc)
   - [ ] Tooltip shows 🖼️ iframe context indicator
   - [ ] CSS locator includes iframe context: `iframe[name="simple-frame"] >>> button`
   - [ ] Click iframe elements copies frame-aware locators ✅

3. **Nested iframe Elements**
   - [ ] Hover over elements in "Parent iframe" 
   - [ ] Hover over elements in "Nested iframe"
   - [ ] Context indicators show correct frame hierarchy
   - [ ] Generated locators include proper frame path

4. **Cross-origin iframe Testing**
   - [ ] Test on sites with external iframe widgets (YouTube, PayPal, etc.)
   - [ ] Extension shows "Cannot access iframe content" for cross-origin frames
   - [ ] Console shows clear cross-origin error messages
   - [ ] No JavaScript errors for inaccessible iframes

### Shadow DOM Testing
Use `test-iframe-shadow.html` shadow DOM section:

1. **Custom Web Components**
   - [ ] Hover over elements inside "Custom Widget"
   - [ ] Tooltip shows 🌑 Shadow DOM context indicator
   - [ ] CSS locator includes shadow piercing: `custom-widget::shadow button`
   - [ ] Shadow DOM elements highlight correctly ✅

2. **Shadow DOM Forms**
   - [ ] Test input fields inside shadow DOM
   - [ ] Test buttons and interactive elements
   - [ ] Verify shadow context appears in history

3. **Mixed Scenarios**
   - [ ] Test "iframe with Shadow DOM" section
   - [ ] Elements show both 🖼️ and 🌑 context indicators
   - [ ] Complex locators generated correctly

### Framework Compatibility (Advanced)
1. **Playwright iframe/Shadow Testing**
   ```javascript
   // Test these in Playwright console
   page.frame('simple-frame').locator('button') // Should work
   page.locator('custom-widget').locator('button') // Should work
   ```

2. **Selenium iframe Testing**
   ```python
   # Test frame switching
   driver.switch_to.frame('simple-frame')
   driver.find_element(By.CSS_SELECTOR, 'button')
   ```

## ✅ Performance Testing

1. **Large Pages**
   - [ ] Test on complex sites (Amazon, Facebook)
   - [ ] Hover response time < 100ms
   - [ ] No memory leaks after extended use

2. **Resource Usage**
   - [ ] Check Chrome task manager
   - [ ] Extension should use minimal memory
   - [ ] No excessive CPU usage

3. **Advanced DOM Performance**
   - [ ] Test on pages with many iframes (news sites, dashboards)
   - [ ] Test on pages with many web components
   - [ ] iframe injection should be fast and efficient

## 🎯 Success Criteria

**Extension passes testing if:**
- ✅ All core functionality works without errors
- ✅ Generated locators are unique and reliable
- ✅ UI is responsive and intuitive
- ✅ Compatible with major testing frameworks
- ✅ iframe elements detected and locators generated correctly
- ✅ Shadow DOM elements accessible with proper context indicators
- ✅ No performance issues on typical websites

## 🎁 Advanced Feature Success

**iframe & Shadow DOM features pass if:**
- ✅ iframe context indicators (🖼️) appear in tooltips
- ✅ Shadow DOM context indicators (🌑) appear in tooltips  
- ✅ Frame-aware locators generated for iframe elements
- ✅ Shadow-piercing locators generated for web components
- ✅ Mixed scenarios (iframe + shadow DOM) work correctly
- ✅ Cross-origin iframe limitations handled gracefully

## 🚀 Ready for QA Team Deployment!

Once all tests pass, the extension is ready for your QA team to use in their daily testing workflow, including advanced scenarios with iframes and shadow DOM elements commonly found in modern web applications.
