---
title: Add Text Locators for Assertion Elements
description: Enhance locator generation to support text-based locators for p, h1-h6, div, span and other text elements commonly used in assertions
status: applied
---

## Steps
- [x] Add text element type detection
    - ✅ Identify text-containing elements (p, h1-h6, div, span, article, section)
    - ✅ Detect elements primarily used for content display vs interaction
    - ✅ Add assertion element category to element type detection
- [x] Implement text-based locator generation strategy
    - ✅ For assertion elements: prioritize text content over other attributes
    - ✅ Generate both exact text match and contains text XPath locators
    - ✅ Create CSS alternative using attribute combinations when possible
    - ✅ Handle multi-line text and normalize whitespace
- [x] Add text locator options in tooltip
    - ✅ Show multiple text locator variants (exact vs contains)
    - ✅ Display text length and complexity indicators
    - ✅ Add assertion-specific locator recommendations
    - ✅ Include both full text and partial text options
- [x] Enhance copy functionality for text assertions
    - ✅ Add Ctrl+click for copying text locators
    - ✅ Provide multiple format options (exact text, contains, attribute-based)
    - ✅ Add assertion code snippet generation for common frameworks
- [x] Update tooltip UI for assertion elements
    - ✅ Show "Text Assertion" category for text elements
    - ✅ Display text content preview (truncated if long)
    - ✅ Add text stability indicators (static vs dynamic content)
    - ✅ Include framework-specific assertion examples

## Additional Instructions
- Prioritize XPath text locators for assertion elements as they are more reliable for text matching
- Handle edge cases like nested text elements and mixed content
- Ensure text normalization (trim whitespace, handle line breaks)
- Add support for partial text matching when full text is too long or dynamic
- Consider text uniqueness on the page for assertion reliability
