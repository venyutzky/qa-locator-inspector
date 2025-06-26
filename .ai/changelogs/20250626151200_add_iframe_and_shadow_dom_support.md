---
title: Add Support for iFrame and Shadow DOM Element Detection
description: Enhance the extension to detect and generate locators for elements inside iframes and shadow DOM, which are common in modern web applications
status: applied
---

## Steps
- [x] Add iframe detection and content script injection
- [x] Implement shadow DOM traversal and element detection
- [x] Update tooltip system to work across iframe boundaries
- [x] Add iframe-aware locator generation strategies
- [x] Implement shadow DOM-aware CSS selector generation
- [x] Add visual indicators for iframe and shadow DOM elements
- [x] Update XPath generation to handle iframe contexts
- [x] Add proper event handling for cross-frame communication
- [x] Update popup interface to show iframe/shadow DOM context
- [x] Add comprehensive testing for iframe and shadow DOM scenarios
- [x] Update documentation with iframe and shadow DOM support

## Technical Implementation Details

### 1. iFrame Support
- [x] Detect iframe elements on page load and dynamically
- [x] Inject content script into each iframe using chrome.scripting API
- [x] Implement cross-frame message passing for locator data
- [x] Generate iframe-specific locator paths (e.g., frame[name="checkout"] >> input[name="email"])
- [x] Handle nested iframes with recursive injection
- [x] Add iframe context information to tooltips

### 2. Shadow DOM Support  
- [x] Traverse shadow roots during element inspection
- [x] Generate shadow DOM-aware CSS selectors using ::shadow pseudo-elements
- [x] Implement shadow host detection and traversal
- [x] Handle closed vs open shadow roots appropriately
- [x] Add shadow DOM context indicators in UI
- [x] Update XPath generation for shadow DOM elements

### 3. Enhanced Locator Strategies
- [x] Add iframe context to CSS selectors: `iframe[src*="widget"] >>> .button`
- [x] Implement shadow DOM CSS selectors: `.host::shadow .button`
- [x] Add iframe-aware XPath with frame switching context
- [x] Generate Playwright/Selenium frame-switching code snippets
- [x] Handle dynamic iframe loading scenarios

### 4. UI/UX Improvements
- [x] Add visual indicators for iframe boundaries
- [x] Show iframe/shadow DOM context in tooltips
- [x] Add frame hierarchy information to history
- [x] Implement proper highlighting across frame boundaries
- [x] Add copy options for frame-switching code

### 5. Framework Integration
- [x] Generate Playwright frame locators: `page.frame('checkout').locator('.button')`
- [x] Add Selenium frame switching: `driver.switch_to.frame('checkout')`
- [x] Include Cypress iframe commands: `cy.iframe('#widget').find('.button')`
- [x] Provide shadow DOM piercing locators for each framework

## Additional Instructions
- Ensure iframe content script injection respects security policies
- Handle same-origin and cross-origin iframe scenarios appropriately
- Add proper error handling for inaccessible iframes
- Implement efficient shadow DOM traversal without performance impact
- Add comprehensive logging for debugging iframe/shadow DOM issues
- Consider iframe loading timing and dynamic injection
- Test with popular iframe libraries (Stripe, PayPal widgets, etc.)
- Ensure backward compatibility with existing functionality

## Expected Benefits
- Support for modern web applications using iframes and shadow DOM
- Enhanced coverage for payment widgets, embedded content, and web components
- Better compatibility with frameworks like Lit, Stencil, and native web components
- Improved locator reliability for complex DOM structures
- Comprehensive testing support for advanced web scenarios
