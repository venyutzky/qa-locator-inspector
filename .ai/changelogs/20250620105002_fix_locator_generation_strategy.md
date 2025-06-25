---
title: Fix Locator Generation Strategy Implementation
description: Update content.js to properly follow locator-rules.mdc priority hierarchy and implement uniqueness validation for reliable locators
status: applied
---

## Steps
- [x] Fix CSS selector generation to follow element-specific priority rules
    - ✅ For input fields: placeholder first, then ID, then name
    - ✅ For buttons: ID first, then name, then unique class
    - ✅ For links: ID first, then href, then unique class
    - ✅ Implement element type detection logic
- [x] Add uniqueness validation for all generated selectors
    - ✅ Test each selector to ensure it matches exactly one element
    - ✅ Fallback to more specific selectors if current one is not unique
    - ✅ Add uniqueness indicators in tooltip display
- [x] Improve attribute combinations logic
    - ✅ Combine relevant attributes for better specificity
    - ✅ Prioritize semantic attributes (data-testid, aria-label)
    - ✅ Use tag-specific attribute combinations
- [x] Enhance XPath generation
    - ✅ Add placeholder-based XPath for input fields
    - ✅ Improve text-based XPath with trim and normalization
    - ✅ Add fallback attribute-based XPath logic
- [x] Add visual indicators for locator quality
    - ✅ Show uniqueness status in tooltip (unique vs non-unique)
    - ✅ Highlight preferred locator types
    - ✅ Add warning for fragile selectors

## Additional Instructions
- Ensure element type detection correctly identifies inputs, buttons, links, selects
- Test uniqueness on the actual DOM at generation time
- Maintain performance while adding validation logic
- Keep fallback logic for edge cases where no unique selector exists
