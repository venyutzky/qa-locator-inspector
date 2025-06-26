---
title: Fix iframe Locator Detection for srcdoc and Nested iframes
description: Address issues with iframe element detection not working properly for srcdoc iframes and nested iframe scenarios in test-iframe-shadow.html
status: applied
---

## Issue Analysis
The current iframe implementation has several problems:
1. **srcdoc iframes**: Content is injected via srcdoc attribute, not loaded from external source
2. **Timing Issues**: iframe content may not be ready when injection attempts occur
3. **Nested iframe Handling**: Recursive injection for nested iframes needs improvement
4. **Event Propagation**: Events in iframes aren't properly bubbling to main inspector

## Steps
- [x] Add proper timing mechanism for srcdoc iframe content loading
- [x] Implement iframe content ready detection using load events
- [x] Fix event handling for iframe and nested iframe elements
- [x] Add debugging logs to track iframe injection success/failure
- [x] Update iframe selector generation to handle srcdoc content
- [x] Test with both simple and nested iframe scenarios
- [x] Ensure tooltip display works correctly for iframe elements
- [x] Fix context indicators for iframe elements

## Technical Implementation Details

### 1. iframe Load Detection
- [x] Listen for iframe load events before attempting injection
- [x] Add fallback timing for srcdoc content using setTimeout
- [x] Implement retry mechanism for failed injections
- [x] Handle both src and srcdoc iframe types differently

### 2. Enhanced Event Handling
- [x] Fix event propagation from iframe to parent document
- [x] Ensure mouseover/click events work correctly in iframes
- [x] Update tooltip positioning for iframe elements
- [x] Add proper event cleanup for iframe inspectors

### 3. Debugging and Logging
- [x] Add comprehensive console logging for iframe detection
- [x] Log successful vs failed iframe injections
- [x] Track event handling in iframe contexts
- [x] Add visual feedback for successful iframe injection

### 4. Testing Validation
- [x] Test with test-iframe-shadow.html simple iframe section
- [x] Test with nested iframe scenarios
- [x] Verify tooltip display and context indicators
- [x] Ensure locator generation works for iframe elements

## Expected Outcome
- iframe elements in test-iframe-shadow.html show proper tooltips with 🖼️ indicators
- Locators generated for iframe elements include frame context
- Both simple and nested iframe scenarios work correctly
- Console shows successful iframe injection messages

## Testing Instructions
1. Open test-iframe-shadow.html in browser
2. Load the extension and enable inspector
3. Hover over elements inside "Simple iframe" section
4. Verify tooltip appears with iframe context indicator
5. Test nested iframe elements
6. Check console for injection success messages
