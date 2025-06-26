# Fix iframe Standard HTML Document Handling

## Overview
Fixed critical issues with iframe injection and element detection for standard HTML documents loaded via iframe src URLs.

## Issues Addressed

### 1. Cross-Origin iframe Access
- **Problem**: Extension couldn't access iframe contentDocument due to cross-origin restrictions or improper error handling
- **Solution**: Added proper try-catch blocks around contentDocument access with explicit cross-origin error detection
- **Improvement**: Clear logging to distinguish between cross-origin restrictions and other access issues

### 2. Missing Nested iframe Method
- **Problem**: Code referenced `injectIntoNestedIframe` method that didn't exist, causing runtime errors
- **Solution**: Implemented complete nested iframe injection workflow with proper error handling
- **Features**: 
  - Full nested iframe detection and injection
  - Parent frame context tracking
  - Robust document ready state checking

### 3. Event Binding Reliability
- **Problem**: Event binding to iframe content was inconsistent, sometimes missing elements
- **Solution**: Enhanced event binding with multiple target coverage
- **Improvements**:
  - Bind events to body, documentElement, and document for maximum coverage
  - Use event delegation with capture phase for better event handling
  - Added detailed logging for debugging event binding issues

### 4. iframe Load Timing Issues
- **Problem**: Complex exponential backoff retry logic was causing unnecessary delays and missed injections
- **Solution**: Simplified timing logic with more reliable load event handling
- **Improvements**:
  - Streamlined retry logic with fixed delays
  - Better load event listener setup for both srcdoc and src iframes
  - Reduced retry count from 10 to 5 for faster failures

### 5. Document Ready State Detection
- **Problem**: Overly strict document ready state checking was preventing injection into valid iframes
- **Solution**: Improved ready state detection logic
- **Changes**:
  - Accept both 'complete' and 'interactive' states when body/documentElement exists
  - Better handling of different iframe document structures
  - More robust fallback mechanisms

## Technical Changes

### Enhanced iframe Access
```javascript
// Before: Simple access check
if (iframe.contentDocument) {
    // ...
}

// After: Robust cross-origin handling
let iframeDoc;
try {
    iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
} catch (e) {
    console.log(`❌ Cannot access iframe content (cross-origin restriction): ${iframe.src || 'srcdoc'}`);
    return false;
}
```

### Improved Event Binding
```javascript
// Before: Single target binding
this.eventTarget.addEventListener('mouseover', handler, true);

// After: Multiple target coverage
const bindToTarget = (target, targetName) => {
    target.addEventListener('mouseover', handler, true);
    // ... other events
};

if (iframeDoc.body) bindToTarget(iframeDoc.body, 'body');
if (iframeDoc.documentElement) bindToTarget(iframeDoc.documentElement, 'documentElement');
bindToTarget(iframeDoc, 'document');
```

### Complete Nested iframe Support
```javascript
// Added missing methods:
- injectIntoNestedIframe()
- waitForNestedIframeDocumentReady()
- Enhanced handleNestedIframeInjection()
```

## Testing Verification

### Test Cases Covered
1. **Standard iframe with src URL**: `test-standard-iframe.html`
2. **Nested iframes with src URLs**: Standard iframe containing nested iframe
3. **Cross-origin iframe handling**: Proper error detection and logging
4. **Mixed srcdoc and src iframes**: Both types working correctly
5. **Dynamic iframe injection**: iframes added after page load

### Expected Behavior
- ✅ Elements inside standard HTML iframes are detectable
- ✅ Hover highlighting works across iframe boundaries
- ✅ Click to copy locators includes proper iframe context
- ✅ Nested iframe hierarchies are properly tracked
- ✅ Cross-origin iframes show clear error messages
- ✅ No JavaScript errors in console during iframe operations

## Validation Steps

1. Load `test-standard-iframe.html` in browser
2. Enable QA Locator Inspector extension
3. Hover over elements inside the standard iframe
4. Verify tooltip shows iframe context with 🖼️ indicator
5. Click elements to copy locators with iframe frame path
6. Check console for successful injection messages
7. Test nested iframe elements for proper hierarchy display

## Files Modified
- `content.js`: Enhanced iframe injection, event binding, and nested iframe support
- `test-standard-iframe.html`: New test file for standard iframe scenarios
- `iframe-content.html`: Standard HTML iframe content for testing
- `nested-iframe-content.html`: Nested iframe content for testing

## Dependencies
- No new dependencies
- Maintains backward compatibility with existing srcdoc iframe support
- Works with all supported automation frameworks (Playwright, Selenium, Cypress)

## Performance Impact
- Reduced retry attempts (10→5) for faster failure detection
- Simplified timing logic reduces CPU overhead
- Multiple event binding targets have minimal memory impact
- Cross-origin error detection prevents unnecessary retry loops
