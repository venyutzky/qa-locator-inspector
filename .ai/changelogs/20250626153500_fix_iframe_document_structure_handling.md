---
title: Fix iframe Document Structure and DOM Ready State Handling
description: Address issues with iframe locator detection when iframe contains full HTML document structure with #document node and needs proper DOM ready state handling
status: unapplied
---

## Issue Analysis
The current iframe implementation has problems with:
1. **iframe Document Structure**: Not properly handling iframes with full HTML document structure (#document -> html -> body)
2. **DOM Ready State**: Not waiting for iframe document to be completely loaded and ready
3. **Document vs Element Targeting**: Current event binding may not work correctly with full document structure
4. **Timing Issues**: Injection happening before iframe DOM is fully constructed

The issue occurs when iframe structure is:
```
<iframe>
  #document
    <html>
      <head>...</head>
      <body>
        <elements we want to inspect>
      </body>
    </html>
</iframe>
```

## Steps
- [ ] Add proper iframe document ready state detection
- [ ] Implement document.body targeting for event binding
- [ ] Add retry mechanism for iframe document loading
- [ ] Fix event binding to work with full HTML document structure
- [ ] Add comprehensive iframe document structure logging
- [ ] Handle both srcdoc and src iframe document loading properly
- [ ] Test with various iframe document structures
- [ ] Ensure tooltip and highlighting work with iframe documents

## Technical Implementation Details

### 1. Enhanced Document Ready Detection
- [ ] Check iframe.contentDocument.readyState
- [ ] Wait for 'complete' or 'interactive' state
- [ ] Add DOMContentLoaded event listener for iframe documents
- [ ] Implement proper retry mechanism with exponential backoff

### 2. Improved Event Binding
- [ ] Target iframe.contentDocument.body instead of just contentDocument
- [ ] Add checks for document.documentElement if body not available
- [ ] Ensure event propagation works through iframe document structure
- [ ] Handle both document and body event binding

### 3. Document Structure Handling
- [ ] Add logging for iframe document structure analysis
- [ ] Check for presence of html, head, body elements
- [ ] Handle cases where body might not be immediately available
- [ ] Support both simple and complex iframe document structures

### 4. Enhanced Injection Logic
- [ ] Add waitForIframeDocumentReady method
- [ ] Implement document structure validation before event binding
- [ ] Add fallback strategies for different iframe types
- [ ] Ensure proper cleanup if injection fails

## Expected Outcome
- iframe with full HTML document structure detected and injected properly
- Elements within iframe body show proper tooltips with 🖼️ indicators
- Locator generation works for elements inside iframe documents
- Console shows successful document ready detection and injection

## Testing Instructions
1. Create test iframe with full HTML document structure
2. Load extension and enable inspector
3. Wait for iframe document to load completely
4. Hover over elements inside iframe body
5. Verify tooltip display and locator generation
6. Check console for document ready and injection success messages
