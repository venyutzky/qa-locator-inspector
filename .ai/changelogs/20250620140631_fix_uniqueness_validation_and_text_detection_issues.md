---
title: Fix Uniqueness Validation and Text Detection Issues
description: Fix CSS selector uniqueness validation not forcing hierarchical fallbacks and improve XPath text detection to handle nested text content correctly
status: applied
---

## Steps
- [x] Fix CSS selector uniqueness enforcement in element generators
    - [x] Ensure non-unique base selectors force hierarchical generation
    - [x] Fix button selectors: `button[type="submit"]` should become hierarchical when multiple matches
    - [x] Apply same logic to all element types (input, link, select, generic)
    - [x] Remove early returns that bypass hierarchical fallbacks
- [x] Improve XPath text content detection for buttons and interactive elements  
    - [x] Fix text detection to use `innerText` instead of `textContent` for better accuracy
    - [x] Handle nested text content correctly (e.g., button > p > "Submit")
    - [x] Add fallback logic when direct text is not found in target element
    - [x] Improve text extraction to exclude child element text when appropriate
- [x] Enhance hierarchical selector validation
    - [x] Ensure hierarchical selectors are actually tested for uniqueness
    - [x] Add logging/debugging for uniqueness validation process
    - [x] Fix cases where hierarchical selectors still return non-unique results
- [x] Add better text content analysis for XPath generation
    - [x] Check if element has direct text vs nested text
    - [x] Use `element.childNodes` to find direct text content
    - [x] Generate more accurate text-based XPath expressions
    - [x] Handle edge cases with mixed text and element content

## Additional Instructions
- Test on the hierarchical test page to ensure `button[type="submit"]` gets proper hierarchical selectors
- Verify XPath text detection works correctly with nested text elements
- Ensure all generated selectors are actually unique before returning them
- Add validation to prevent returning selectors that match multiple elements
