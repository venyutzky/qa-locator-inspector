---
title: Chrome Extension Element Locator Display
description: Create a Chrome extension for QA team to display CSS selectors and XPath locators for web page elements
status: applied
---

## Steps
- [x] Set up Chrome extension project structure
    - ✅ Create manifest.json with required permissions
    - ✅ Create content script for DOM manipulation
    - ✅ Create popup HTML for extension UI
    - ✅ Create background script for extension lifecycle
- [x] Implement locator generation logic
    - ✅ Create utility functions for CSS selector generation following locator-rules
    - ✅ Create utility functions for XPath generation
    - ✅ Implement priority hierarchy from locator-rules.mdc
    - ✅ Handle different element types (inputs, buttons, links, etc.)
- [x] Create element highlighting system
    - ✅ Add hover effects to show element boundaries
    - ✅ Display locator tooltip on hover
    - ✅ Implement click-to-copy functionality for locators
- [x] Build extension UI components
    - ✅ Create toggle button to enable/disable locator display
    - ✅ Add settings panel for locator preferences
    - ✅ Implement locator history/favorites feature
- [x] Add advanced features
    - ✅ Support for iframe elements
    - ✅ Export locators to different formats (JSON, CSV, test code snippets)
    - ✅ Integration with popular testing frameworks (Playwright, Selenium, Cypress)
- [x] Test and validate extension
    - ✅ Test on various websites
    - ✅ Validate locator accuracy and uniqueness
    - ✅ Test cross-browser compatibility
- [x] Package and document extension
    - ✅ Create installation instructions
    - ✅ Add user documentation
    - ✅ Prepare for Chrome Web Store submission

## Additional Instructions
- Follow the locator priority hierarchy defined in .cursor/rules/locator-rules.mdc
- Ensure CSS selectors are compatible with modern automation frameworks (no jQuery extensions)
- Prioritize CSS selectors over XPath when possible
- Include proper error handling for edge cases
- Make the extension intuitive for QA engineers with varying technical backgrounds
