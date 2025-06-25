---
title: Enhance Hierarchical Locator Generation Strategy
description: Improve locator generation to use parent-child CSS hierarchies when direct attributes are not unique, ensuring all locators match only one element
status: applied
---

## Steps
- [x] Enhance link locator generation with hierarchical fallbacks
    - [x] For anchor elements, try direct href first
    - [x] If href is not unique, build parent > child hierarchies
    - [x] Example: `.navigation > .menu > a[href="/profile"]`
    - [x] Test hierarchical selectors for uniqueness before fallback
- [x] Implement hierarchical CSS selector builder
    - [x] Create `generateHierarchicalSelector()` method
    - [x] Walk up parent elements to build contextual selectors
    - [x] Combine parent classes/IDs with child attributes
    - [x] Limit hierarchy depth to 3 levels to avoid fragility
- [x] Apply hierarchical strategy to all element types
    - [x] Input fields: Try `.form-group > input[name="email"]`
    - [x] Buttons: Try `.modal-footer > button[type="submit"]`
    - [x] Links: Try `.sidebar > .nav-menu > a[href="/home"]`
    - [x] Generic elements: Use contextual parent selectors
- [x] Enhance uniqueness validation with hierarchy testing
    - [x] Test each hierarchical level for uniqueness
    - [x] Stop at first unique hierarchical selector
    - [x] Fallback to position-based only if no unique hierarchy found
- [x] Update quality assessment for hierarchical selectors
    - [x] Rate hierarchical selectors as "Good (Hierarchical)"
    - [x] Prefer semantic parent classes over generic ones
    - [x] Maintain "Excellent" rating for direct ID/name matches
- [x] Add visual indicators for hierarchical locators
    - [x] Show hierarchy depth in tooltip
    - [x] Display parent context information
    - [x] Highlight when hierarchical strategy is used

## Additional Instructions
- Prioritize semantic parent elements (forms, navigation, modals) over generic divs
- Ensure hierarchical selectors remain readable and maintainable
- Test hierarchical selectors for cross-page stability
- Avoid deeply nested selectors (max 3 levels) to prevent fragility
- Maintain backward compatibility with existing direct attribute selectors
