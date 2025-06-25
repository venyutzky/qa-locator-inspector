---
previous_migration: 20250625143500_remove_erudifi_branding_for_public_release.md
current_migration: 20250625144500_remove_hardcoded_local_paths.md
---

## project-chrome-extension
- Location: ./
- Framework: Chrome Extension (Manifest V3)
- Environment: Browser-based
- Dependency Management: None (vanilla JavaScript)
- Status: Ready for public release as "QA Locator Inspector"

### File Structure
```
qa-locator-inspector/
├── manifest.json          # Extension configuration and permissions
├── content.js             # **ENHANCED** Main locator generation with hierarchical CSS selectors and universal XPath copy support
├── content.css            # Styling for tooltips and element highlights
├── popup.html             # **UPDATED** Extension popup interface with enhanced history display
├── popup.js               # **UPDATED** Popup functionality with dual CSS/XPath copy from history
├── background.js          # Background service worker
├── icons/                 # Extension icons
│   ├── icon.svg           # SVG icon source
│   ├── icon16.png         # 16x16 icon
│   ├── icon48.png         # 48x48 icon
│   └── icon128.png        # 128x128 icon
├── README.md              # Comprehensive documentation
├── INSTALLATION.md        # Quick setup guide for QA team
├── TESTING_CHECKLIST.md   # QA validation checklist
├── DEMO_SCRIPT.md         # Team presentation guide
├── LOCATOR_RULES_TEST.md  # Locator rules compliance testing
├── TEXT_ASSERTION_GUIDE.md # Text locator and assertion testing guide
└── .ai/                   # AI project management
    ├── state.md           # This file
    └── changelogs/        # Change tracking
        ├── 20250620103245_chrome_extension_locator_display.md (applied)
        ├── 20250620105002_fix_locator_generation_strategy.md (applied)
        ├── 20250620132335_add_text_locators_for_assertions.md (applied)
        ├── 20250620133449_enhance_xpath_copy_functionality.md (applied)
        ├── 20250620134709_enhance_hierarchical_locator_generation_strategy.md (applied)
        ├── 20250620140631_fix_uniqueness_validation_and_text_detection_issues.md (applied)
        ├── 20250625143500_remove_erudifi_branding_for_public_release.md (applied)
        └── 20250625144500_remove_hardcoded_local_paths.md (applied)
```

### Dependencies
- Chrome Extensions API (Manifest V3)
- Chrome Storage API for history persistence
- Chrome Tabs API for cross-tab communication
- Native DOM APIs for element inspection
- CSS Escape API for safe selector generation
- XPath API for text-based element evaluation

### Commands
- Load extension: Open chrome://extensions/, enable Developer mode, click "Load unpacked"
- Toggle inspector: Click extension icon, click "Enable Inspector"
- Inspect element: Hover over any element on webpage
- Copy CSS locator: Click any element
- Copy XPath locator: Ctrl+Click, Alt+Click, or Right-click any element
- Export history: Click "Export History" in popup

### Core Features (Latest - Hierarchical Locator Generation)
- **Hierarchical CSS Selectors**: 
  - Smart parent-child relationships when direct attributes are not unique
  - Example: `.navigation > .menu > a[href="/profile"]` for better specificity
  - Semantic parent prioritization (forms, navigation, modals over generic divs)
  - Maximum 3-level depth to prevent fragility
- **Element-Specific Locator Generation**: 
  - Input fields: Placeholder → ID → Name → Unique Class → Hierarchical → Attributes
  - Buttons: ID → Name → Unique Class → Hierarchical → Attributes
  - Links: ID → Href → Unique Class → Hierarchical → Attributes
  - Select elements: ID → Name → Unique Class → Hierarchical → Attributes
  - Text elements: ID → Data-testid → Unique Class → Attributes (CSS) + Text-based XPath
- **Universal XPath Copy Support**: 
  - **Click**: Copy CSS selector for any element
  - **Ctrl+Click**: Copy XPath for any element
  - **Alt+Click**: Alternative XPath copy method
  - **Right-Click**: Context menu XPath copy for any element
- **Text Assertion Support**: 
  - Automatic detection of text-containing elements (p, h1-h6, div, span, etc.)
  - Smart text-based XPath generation (exact match vs contains)
  - Text uniqueness validation and preview
- **Enhanced User Interface**:
  - **Mode Indicators**: Visual feedback showing CSS Mode vs XPath Mode
  - **Hierarchical Indicators**: 🏗️ symbol and depth information for hierarchical selectors
  - **Keyboard Shortcuts**: Real-time tooltip updates when modifier keys pressed
  - **Color-Coded Notifications**: Green for CSS, Purple for XPath
  - **Dual History Display**: Both CSS and XPath shown in popup history
- **Advanced Copy Options**:
  - **Multiple Methods**: Click, Ctrl+Click, Alt+Click, Right-click
  - **History Interface**: Click CSS or XPath in history to copy
  - **Smart Tooltips**: Shows available copy methods for each element
- **Quality Assessment**: 
  - Uniqueness validation for both CSS and XPath
  - Quality indicators (Excellent/Good/Fair/Poor) including "Good (Hierarchical)"
  - Element count display for validation
  - Hierarchy depth information in tooltips
- **Framework Compatibility**: Full compatibility with Playwright, Selenium, Cypress for both interaction and assertion testing
- **Export Capabilities**: JSON export of locator history
- **Framework Compatibility**: Works with Playwright, Selenium, Cypress

### Locator Priority Hierarchy (Enhanced with Hierarchical Strategy)
1. ID Attribute (#id)
2. Name Attribute ([name="value"])
3. Placeholder Text ([placeholder="value"])
4. Unique Classes (.class)
5. **Hierarchical Selectors (parent > child relationships)**
6. Attribute Combinations (element[attr="value"])
7. Structural Selectors (:nth-child)
8. XPath fallbacks for text content and positioning

### Integration Points
- **Content Script**: Injected into all pages for DOM interaction
- **Popup Interface**: Toggle, settings, and history management
- **Background Worker**: Extension lifecycle and storage management
- **Storage API**: Persistent history and settings across sessions
