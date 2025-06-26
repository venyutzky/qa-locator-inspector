# iframe and Shadow DOM Testing Guide

This guide covers advanced testing scenarios for QA Locator Inspector with iframe and shadow DOM elements.

## Testing Setup

### Local Development Server (Recommended)

For the most reliable iframe testing, use a local development server instead of opening files directly:

**Option 1: Python (if installed)**
```bash
# Navigate to the extension directory
cd /path/to/qa-locator-inspector

# Start simple HTTP server
python3 -m http.server 8000

# Access test files at:
# http://localhost:8000/test-standard-iframe.html
# http://localhost:8000/test-iframe-shadow.html
```

**Option 2: Node.js**
```bash
# Install serve globally
npm install -g serve

# Start server in extension directory
serve .

# Access via provided URL (usually http://localhost:3000)
```

**Option 3: VS Code Live Server**
- Install "Live Server" extension in VS Code
- Right-click on test HTML file
- Select "Open with Live Server"

### Why Use a Local Server?

- **Security**: Browsers restrict iframe access with `file://` protocol
- **Same-origin**: Local server ensures same-origin policy compliance
- **Real-world testing**: Mimics actual web application behavior
- **No restrictions**: All iframe functionality works as expected

### Direct File Access Limitations

If you open files directly (`file://` protocol):
- ⚠️ iframe content may not be accessible due to browser security
- ⚠️ Extension will show warnings about local file restrictions
- ⚠️ Some iframe injection features may not work
- ✅ Regular DOM elements still work normally

## Overview

Modern web applications often use iframes and shadow DOM for:
- **iframes**: Payment widgets, embedded content, third-party integrations
- **Shadow DOM**: Web components, custom elements, encapsulated UI libraries

QA Locator Inspector automatically detects and handles these advanced DOM structures.

## iframe Support

### What is iframe Support?

The extension automatically:
1. Detects iframe elements on the page
2. Injects inspector functionality into accessible iframes
3. Generates frame-aware locators
4. Provides context information in tooltips

### iframe Locator Generation

When you inspect an element inside an iframe, the extension generates:

**CSS Selector for iframe Element:**
```css
/* Element CSS (works within iframe document): */
input[placeholder="Card Number"]

/* iframe selector (to locate iframe element): */
iframe[name="payment-widget"]

/* Note: CSS cannot cross iframe boundaries like XPath
   Framework switching required for iframe content */
```

**XPath with Frame Context:**
```xpath
# Element XPath (works within iframe document):
//input[@placeholder='Card Number']

# iframe locator (to locate iframe element):
//iframe[@name='payment-widget']

# Note: XPath cannot cross iframe boundaries
# Use framework-specific frame switching methods
```

**Framework-Specific Locators:**
```javascript
// Playwright - automatic frame handling
page.frame('payment-widget').locator('input[placeholder="Card Number"]')

// Selenium - explicit frame switching
driver.switch_to.frame('payment-widget')
driver.find_element(By.XPATH, '//input[@placeholder="Card Number"]')

// Cypress with iframe plugin
cy.iframe('#payment-widget').find('input[placeholder="Card Number"]')
```

### Important CSS and XPath Notes for iframes

⚠️ **CSS & XPath Limitation**: Both CSS selectors and XPath cannot traverse iframe boundaries. The extension provides:
- **Element CSS/XPath**: Works within the iframe document context
- **iframe Locator**: CSS/XPath to locate the iframe element itself
- **Framework Examples**: How to combine them properly

When testing CSS manually:
1. Switch to iframe context: `document.querySelector('iframe[name="frame-name"]').contentDocument`
2. Then test element CSS: `querySelector('button[id="btn"]')`

When testing XPath manually:
1. Switch to iframe context: `document.querySelector('iframe[name="frame-name"]').contentDocument`
2. Then test element XPath: `$x('//button[text()="Click"]')`

### iframe Context Indicators

When inspecting iframe elements, tooltips show:
- 🖼️ iframe context indicator
- Frame name or identifier
- Hierarchical frame path for nested iframes

### Testing iframe Scenarios

Use the provided test files to validate iframe functionality:

#### 1. Standard iframe Testing (`test-standard-iframe.html`)
Test standard HTML documents loaded via iframe src URLs:
- **Basic iframe Elements**: Form inputs, buttons, interactive elements inside standard HTML iframe
- **Standard HTML Structure**: iframe with proper `<!DOCTYPE html>` and full HTML document
- **Cross-Origin Handling**: Proper error detection for cross-origin iframe restrictions
- **Nested Standard iframes**: Standard iframe containing another standard iframe

#### 2. Advanced iframe Testing (`test-iframe-shadow.html`)
Test complex iframe scenarios with srcdoc and mixed content:
- **srcdoc iframes**: HTML content embedded directly in iframe element
- **Nested iframes**: Parent iframe containing child iframe
- **Deep nesting scenarios**: Multiple levels of iframe nesting
- **Dynamic iframes**: iframes loaded after page load

#### 3. Real-World Scenarios
Test with actual web applications:
- **Payment widgets**: Third-party payment forms in iframes
- **Embedded content**: YouTube videos, maps, social media widgets
- **Multiple iframes**: Pages with several iframe elements

### iframe Limitations

- **Same-origin Policy**: Can only access same-origin iframes
- **Cross-origin iframes**: Will show "Cannot access iframe content" message
- **Sandboxed iframes**: May have restricted access depending on sandbox attributes

## Shadow DOM Support

### What is Shadow DOM Support?

The extension automatically:
1. Traverses shadow roots during element inspection
2. Generates shadow-piercing selectors
3. Handles both open and closed shadow roots
4. Works with custom web components

### Shadow DOM Locator Generation

When you inspect an element inside shadow DOM, the extension generates:

**CSS Selector with Shadow Piercing:**
```css
custom-widget::shadow button[data-testid="submit"]
```

**Framework-Specific Locators:**
```javascript
// Playwright (automatic shadow piercing)
page.locator('custom-widget').locator('button[data-testid="submit"]')

// Cypress with shadow support
cy.get('custom-widget').shadow().find('button[data-testid="submit"]')

// WebDriver (requires shadow root access)
shadow_root = driver.execute_script('return arguments[0].shadowRoot', host_element)
shadow_root.find_element(By.CSS_SELECTOR, 'button[data-testid="submit"]')
```

### Shadow DOM Context Indicators

When inspecting shadow DOM elements, tooltips show:
- 🌑 Shadow DOM context indicator
- Host element selector
- Shadow root type (open/closed)

### Testing Shadow DOM Scenarios

Use `test-iframe-shadow.html` to test:

1. **Custom Web Components**
   - Elements inside shadow roots
   - Slotted content
   - Shadow DOM forms

2. **Mixed Scenarios**
   - Shadow DOM inside iframes
   - Nested shadow roots
   - Multiple custom elements

3. **Framework Components**
   - Lit elements
   - Stencil components
   - Native web components

### Shadow DOM Best Practices

1. **Use data-testid attributes** inside shadow DOM for reliable testing
2. **Avoid relying on internal structure** - shadow DOM can change
3. **Test with framework-specific shadow piercing** methods
4. **Consider accessibility attributes** for better locators

## Combined Scenarios

### iframe with Shadow DOM

When elements are inside both iframe and shadow DOM:

```css
/* Element CSS (within iframe context): */
custom-component::shadow button

/* iframe selector: */
iframe[name="widget-frame"]

/* Note: Both iframe and shadow DOM require framework-specific handling */
```

```javascript
// Playwright
page.frame('widget-frame').locator('custom-component').locator('button')

// Selenium (complex frame + shadow navigation)
driver.switch_to.frame('widget-frame')
host_element = driver.find_element(By.TAG_NAME, 'custom-component')
shadow_root = driver.execute_script('return arguments[0].shadowRoot', host_element)
button = shadow_root.find_element(By.TAG_NAME, 'button')
```

### Testing Strategy

1. **Start Simple**: Test regular DOM elements first
2. **Add iframe Layer**: Test same elements inside iframes
3. **Add Shadow Layer**: Test shadow DOM elements
4. **Combine Layers**: Test complex nested scenarios
5. **Verify Framework Compatibility**: Test generated locators in your automation framework

## Troubleshooting

### Common Issues

1. **iframe Access Denied**
   - **Cause**: Cross-origin iframe or sandboxing restrictions
   - **Solution**: Use frame switching without element inspection
   - **Detection**: Check browser console for "Cannot access iframe content (cross-origin restriction)" messages

2. **Elements Not Detectable in Standard iframes**
   - **Cause**: iframe content may not be fully loaded or accessible
   - **Solution**: Wait for iframe to fully load, check for cross-origin restrictions
   - **Debug**: Enable console logging to see iframe injection status

3. **Shadow Root Not Found**
   - **Cause**: Closed shadow root or timing issues
   - **Solution**: Use host element locator and framework shadow piercing

4. **Locator Not Working in Tests**
   - **Cause**: Framework doesn't support shadow/iframe piercing
   - **Solution**: Use framework-specific methods or wait strategies

### Debugging Tips

1. **Check Console Logs**: Extension logs iframe injection and shadow DOM detection
2. **Verify Context Indicators**: Look for 🖼️ and 🌑 symbols in tooltips
3. **Test iframe Accessibility**: Try accessing iframe.contentDocument in browser console
4. **Use Framework DevTools**: Playwright Inspector, Cypress Test Runner, etc.
5. **Test Different iframe Types**: Compare behavior between src and srcdoc iframes

## Framework-Specific Notes

### Playwright
- Excellent iframe and shadow DOM support
- Automatic shadow piercing
- Frame locators work seamlessly

### Selenium
- Requires explicit frame switching
- Manual shadow root access needed
- More verbose but reliable

### Cypress
- Good iframe support with plugins
- Built-in shadow DOM commands
- Clean API for complex scenarios

### WebdriverIO
- Similar to Selenium approach
- Good iframe handling
- Shadow DOM requires custom implementation

## Performance Considerations

- **iframe Injection**: Minimal performance impact
- **Shadow DOM Traversal**: Efficient recursive scanning
- **Event Delegation**: Uses optimized event handling
- **Memory Usage**: Cleans up event listeners automatically

## Security Considerations

- **Same-origin Policy**: Respects browser security boundaries
- **Content Security Policy**: Works within CSP restrictions
- **Sandboxed Content**: Limited access to sandboxed iframes
- **No Data Leakage**: All processing happens locally
