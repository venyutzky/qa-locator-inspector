---
title: Fix Nested iframe Locator Detection and Recursive Injection
description: Address the issue where elements in nested iframes (iframe within iframe) are not detected due to lack of recursive iframe injection
status: applied
---

## Issue Analysis
The current iframe implementation only injects into top-level iframes but doesn't recursively inject into iframes found within those iframes. In test-iframe-shadow.html, the nested iframe structure has:
1. Parent iframe (`name="parent-frame"`) containing:
   - Direct elements (buttons) that work
   - A nested iframe (`name="nested-frame"`) containing elements that don't work

## Steps
- [x] Add recursive iframe detection within injected iframes
- [x] Implement nested iframe injection with proper frame hierarchy tracking
- [x] Update frame context to include parent frame information
- [x] Fix locator generation for nested iframe elements
- [x] Add proper frame path generation for nested scenarios
- [x] Update tooltip context indicators for nested frames
- [x] Add comprehensive logging for nested iframe detection
- [x] Test nested iframe element inspection and locator generation

## Technical Implementation Details

### 1. Recursive iframe Injection
- [x] Modify createIframeInspector to detect child iframes
- [x] Implement recursive injection for nested iframes
- [x] Track parent-child frame relationships
- [x] Handle multiple levels of nesting

### 2. Enhanced Frame Context
- [x] Update frameInfo to include parent frame information
- [x] Generate hierarchical frame paths (parent-frame > nested-frame)
- [x] Support frame path in locator generation
- [x] Add frame hierarchy to tooltip display

### 3. Nested Locator Generation
- [x] Generate nested frame locators: iframe[name="parent"] iframe[name="nested"] >>> element
- [x] Update XPath for nested frame scenarios
- [x] Add framework-specific nested frame switching code
- [x] Handle complex frame navigation paths

### 4. Testing and Validation
- [x] Test parent iframe elements (should still work)
- [x] Test nested iframe elements (currently broken)
- [x] Verify nested frame context indicators
- [x] Validate nested frame locator generation

## Expected Outcome
- Elements in parent-frame iframe show: 🖼️ parent-frame
- Elements in nested-frame iframe show: 🖼️ parent-frame > nested-frame
- Nested locators: iframe[name="parent-frame"] iframe[name="nested-frame"] >>> button
- Console shows successful recursive injection messages

## Testing Instructions
1. Open test-iframe-shadow.html in browser
2. Enable inspector and check console for injection messages
3. Hover over "Parent iframe Button" (should work)
4. Hover over "Nested iframe Button" (currently broken, should work after fix)
5. Verify nested frame context indicators in tooltips
6. Check generated locators include full frame path
