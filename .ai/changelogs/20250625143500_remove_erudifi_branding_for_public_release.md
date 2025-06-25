---
title: Remove Erudifi Branding for Public Release
description: Remove all 'erudifi' references from the Chrome extension codebase to make it generic for public GitHub repository release
status: applied
---

## Steps
- [x] Update manifest.json to use generic name "QA Locator Inspector"
- [x] Replace erudifi-specific element IDs and CSS selectors with generic equivalents
- [x] Update content.js header comment and element references
- [x] Update content.css with generic naming
- [x] Update popup.js header comment
- [x] Rewrite README.md for public consumption with generic branding
- [x] Update INSTALLATION.md to be generic for any QA team
- [x] Update TESTING_CHECKLIST.md with generic title
- [x] Update DEMO_SCRIPT.md for generic QA team usage
- [x] Update export filename in popup.js to be generic
- [x] Add LICENSE file for public repository
- [x] Search for any remaining erudifi references and replace them

## Additional Instructions
- Replace "Erudifi" with "QA Locator Inspector" or generic QA terminology
- Change element IDs from "erudifi-locator-tooltip" to "qa-locator-tooltip" 
- Change data attributes from "data-erudifi-highlighted" to "data-qa-highlighted"
- Make all documentation generic for any QA team to use
- Ensure no company-specific references remain
- Maintain all functionality while changing branding
- Consider adding MIT license for open source release
