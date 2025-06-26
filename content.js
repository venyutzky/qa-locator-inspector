// QA Locator Inspector - Content Script
class LocatorInspector {
    constructor() {
        this.isEnabled = false;
        this.hoveredElement = null;
        this.tooltip = null;
        this.locatorHistory = [];
        this.modifierPressed = false;
        this.frameContext = null; // Track current frame context
        this.shadowContext = null; // Track current shadow DOM context
        this.init();
    }

    init() {
        this.createTooltip();
        this.bindEvents();
        this.loadSettings();
        this.checkLocalFileContext();
        this.injectIntoIframes();
        this.setupShadowDOMObserver();
    }

    checkLocalFileContext() {
        if (window.location.protocol === 'file:') {
            console.warn(`
🔧 QA Locator Inspector - Local File Detection
For iframe testing with local files, consider using a local development server:
- Python: python3 -m http.server 8000
- Node.js: npx serve .
- VS Code: Live Server extension
Then access via http://localhost:8000/test-standard-iframe.html

iframe content may not be accessible due to browser security restrictions with file:// protocol.
            `);
            return true;
        }
        return false;
    }

    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'qa-locator-tooltip';
        this.tooltip.style.cssText = `
            position: fixed;
            background: #2d3748;
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 400px;
            display: none;
            border: 1px solid #4a5568;
        `;
        document.body.appendChild(this.tooltip);
    }

    bindEvents() {
        document.addEventListener('mouseover', (e) => this.handleMouseOver(e));
        document.addEventListener('mouseout', (e) => this.handleMouseOut(e));
        document.addEventListener('click', (e) => this.handleClick(e));
        document.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        
        // Keyboard event listeners for modifier key feedback
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'toggle') {
                this.toggle();
                sendResponse({enabled: this.isEnabled});
            } else if (request.action === 'getStatus') {
                sendResponse({
                    enabled: this.isEnabled,
                    iframeCount: this.iframeInspectors ? this.iframeInspectors.length : 0,
                    inaccessibleCount: this.inaccessibleIframes ? this.inaccessibleIframes.length : 0,
                    localFileWarning: window.location.protocol === 'file:'
                });
            } else if (request.action === 'getIframeStatus') {
                // Debug command to check iframe injection status
                const iframes = document.querySelectorAll('iframe');
                const status = {
                    totalIframes: iframes.length,
                    injectedIframes: this.iframeInspectors ? this.iframeInspectors.length : 0,
                    inaccessibleIframes: this.inaccessibleIframes ? this.inaccessibleIframes.length : 0,
                    localFileContext: window.location.protocol === 'file:',
                    protocol: window.location.protocol,
                    iframeDetails: [],
                    inaccessibleDetails: this.inaccessibleIframes || []
                };
                
                iframes.forEach((iframe, index) => {
                    const accessResult = this.canAccessIframe(iframe);
                    status.iframeDetails.push({
                        name: iframe.name || iframe.id || `iframe-${index}`,
                        src: iframe.src || 'srcdoc',
                        accessible: accessResult.accessible,
                        reason: accessResult.reason || 'accessible',
                        readyState: accessResult.readyState || 'unknown'
                    });
                });
                
                console.log('iframe injection status:', status);
                sendResponse(status);
            }
        });
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        if (!this.isEnabled) {
            this.hideTooltip();
            this.removeHighlight();
        } else {
            // Show helpful guidance when extension is enabled
            console.log(`
🎯 QA Locator Inspector Enabled
Quick Copy Options:
- Hover over elements to see locators
- Ctrl+Click: Copy CSS selector (PRIORITY)
- Alt+Click: Copy XPath
- Shift+Click: Log both to console
- Right-Click: Copy XPath (default)
- Ctrl+Right-Click: Copy CSS (Ctrl priority)

Normal clicks work as usual - no interference!
Debug: Watch console for modifier key detection logs.
            `);
        }
        chrome.storage.local.set({enabled: this.isEnabled});
    }

    loadSettings() {
        chrome.storage.local.get(['enabled'], (result) => {
            this.isEnabled = result.enabled || false;
        });
    }

    handleMouseOver(e) {
        if (!this.isEnabled) return;
        
        // Reset contexts when hovering over regular DOM elements
        this.resetContexts();
        
        this.hoveredElement = e.target;
        this.addHighlight(e.target);
        this.showTooltip(e);
    }

    handleMouseOut(e) {
        if (!this.isEnabled) return;
        
        this.removeHighlight();
        this.hideTooltip();
    }

    handleClick(e) {
        if (!this.isEnabled) return;
        
        // Only intercept clicks with modifier keys - allow normal clicks to proceed
        if (e.ctrlKey || e.altKey || e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            
            // Reset contexts for regular DOM elements
            this.resetContexts();
            
            const locators = this.generateLocators(e.target);
            const elementType = this.getElementType(e.target);
            
            // Priority order: Ctrl (CSS) > Alt (XPath) > Shift (both)
            if (e.ctrlKey) {
                // Ctrl+Click ALWAYS copies CSS selector (highest priority)
                console.log('🎯 Ctrl+Click detected - copying CSS selector');
                this.copyToClipboard(locators.css);
                this.addToHistory(locators);
                this.showCopyNotification('CSS');
            } else if (e.altKey) {
                // Alt+Click copies XPath (second priority)
                console.log('🎯 Alt+Click detected - copying XPath');
                this.copyToClipboard(locators.xpath);
                this.addToHistory(locators);
                this.showCopyNotification('XPath');
            } else if (e.shiftKey) {
                // Shift+Click shows both options in console (third priority)
                console.log('🎯 Shift+Click detected - showing both locators');
                this.showLocatorOptions(locators);
            }
        }
        // Normal clicks proceed without interference
    }

    showLocatorOptions(locators) {
        console.log(`
🎯 Element Locators:
CSS: ${locators.css}
XPath: ${locators.xpath}

Quick Copy:
- Ctrl+Click: Copy CSS
- Alt+Click: Copy XPath
- Right-Click: Copy XPath
        `);
        
        // Show notification about console output
        this.showCopyNotification('Locators logged to console');
    }

    handleRightClick(e) {
        if (!this.isEnabled) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // Reset contexts for regular DOM elements
        this.resetContexts();
        
        const locators = this.generateLocators(e.target);
        
        // Check for modifier keys - Ctrl/Alt take precedence over right-click
        if (e.ctrlKey) {
            // Ctrl+Right-click copies CSS (Ctrl precedence)
            console.log('🎯 Ctrl+Right-click detected - copying CSS selector');
            this.copyToClipboard(locators.css);
            this.addToHistory(locators);
            this.showCopyNotification('CSS');
        } else if (e.altKey) {
            // Alt+Right-click copies XPath (Alt precedence)
            console.log('🎯 Alt+Right-click detected - copying XPath');
            this.copyToClipboard(locators.xpath);
            this.addToHistory(locators);
            this.showCopyNotification('XPath');
        } else {
            // Pure right-click copies XPath (default)
            console.log('🎯 Right-click detected - copying XPath');
            this.copyToClipboard(locators.xpath);
            this.addToHistory(locators);
            this.showCopyNotification('XPath');
        }
    }

    handleKeyDown(e) {
        if (!this.isEnabled) return;
        
        if (e.ctrlKey || e.altKey) {
            this.modifierPressed = true;
            this.updateTooltipForXPathMode();
        }
    }

    handleKeyUp(e) {
        if (!this.isEnabled) return;
        
        if (!e.ctrlKey && !e.altKey) {
            this.modifierPressed = false;
            this.updateTooltipForCSSMode();
        }
    }

    updateTooltipForXPathMode() {
        if (this.tooltip && this.tooltip.style.display !== 'none') {
            // Add XPath mode indicator to tooltip
            const modeIndicator = this.tooltip.querySelector('.mode-indicator');
            if (modeIndicator) {
                modeIndicator.textContent = '🎯 XPath Mode (Alt+Click)';
                modeIndicator.style.color = '#9f7aea';
            }
        }
    }

    updateTooltipForCSSMode() {
        if (this.tooltip && this.tooltip.style.display !== 'none') {
            // Reset to CSS mode indicator
            const modeIndicator = this.tooltip.querySelector('.mode-indicator');
            if (modeIndicator) {
                modeIndicator.textContent = '🎯 CSS Mode (Ctrl + Click)';
                modeIndicator.style.color = '#68d391';
            }
        }
    }

    addHighlight(element) {
        this.removeHighlight();
        element.style.outline = '2px solid #ff6b6b';
        element.style.outlineOffset = '1px';
        element.setAttribute('data-qa-highlighted', 'true');
    }

    removeHighlight() {
        const highlighted = document.querySelector('[data-qa-highlighted]');
        if (highlighted) {
            highlighted.style.outline = '';
            highlighted.style.outlineOffset = '';
            highlighted.removeAttribute('data-qa-highlighted');
        }
    }

    showTooltip(e) {
        const locators = this.frameContext ? 
            this.generateIframeLocators(e.target, this.frameContext) :
            this.shadowContext ? 
                this.generateShadowDOMLocators(e.target, this.shadowContext) :
                this.generateLocators(e.target);
                
        // For iframe locators, we need to check uniqueness differently
        let cssUnique = false;
        if (this.frameContext) {
            // For iframe elements, check uniqueness within the iframe document
            try {
                const iframeDoc = document.querySelector(`iframe[name="${this.frameContext.name}"]`).contentDocument;
                const baseSelector = this.generateLocators(e.target).css;
                cssUnique = iframeDoc.querySelectorAll(baseSelector).length === 1;
            } catch (error) {
                console.log('Error checking iframe CSS uniqueness:', error);
                cssUnique = false;
            }
        } else {
            cssUnique = this.isUniqueSelector(locators.css);
        }
        
        const elementType = this.getElementType(e.target);
        
        // Get locator quality info
        const cssQuality = this.getLocatorQuality(locators.css, elementType);
        const xpathQuality = this.getXPathQuality(locators.xpath);
        
        // Get context information
        const contextInfo = this.getContextInfo();
        
        // Special handling for text elements
        let textInfo = '';
        if (elementType === 'text') {
            const textContent = e.target.textContent?.trim() || '';
            const textPreview = textContent.length > 50 ? textContent.substring(0, 50) + '...' : textContent;
            const textUnique = this.isTextUnique(e.target, textContent);
            
            textInfo = `
                <div style="margin-bottom: 6px; padding: 6px; background: #2a4a3a; border-radius: 4px;">
                    <div style="font-size: 10px; color: #90cba8; margin-bottom: 2px;">
                        📝 Text Content ${textUnique ? '(UNIQUE)' : '(NOT UNIQUE)'}
                    </div>
                    <div style="font-size: 11px; color: #e2e8f0; font-style: italic;">
                        "${this.escapeHtml(textPreview)}"
                    </div>
                </div>
            `;
        }
        
        const matchCount = this.frameContext ? 'N/A (iframe)' : document.querySelectorAll(locators.css).length;
        
        this.tooltip.innerHTML = `
            <div style="margin-bottom: 8px; font-weight: bold; color: #ffd93d;">
                ${elementType === 'text' ? '📝' : '🎯'} ${elementType === 'text' ? 'Text Assertion' : 'Element Locators'} (${elementType})
            </div>
            ${contextInfo}
            ${textInfo}
            <div style="margin-bottom: 6px;">
                <span style="color: #68d391; font-weight: bold;">CSS:</span>
                <span style="font-size: 10px; margin-left: 8px; color: ${cssUnique ? '#68d391' : '#f56565'};">
                    ${cssUnique ? '✓ UNIQUE' : '⚠ NOT UNIQUE'}
                </span>
                ${locators.css.includes(' > ') ? `<span style="font-size: 10px; margin-left: 8px; color: #ffd93d;">🏗️ HIERARCHICAL</span>` : ''}
                <div style="background: #1a202c; padding: 4px 6px; border-radius: 4px; margin-top: 2px; word-break: break-all;">
                    ${this.escapeHtml(locators.css)}
                </div>
                <div style="font-size: 10px; color: #a0aec0; margin-top: 2px;">
                    Quality: ${cssQuality}${locators.css.includes(' > ') ? ` • Depth: ${locators.css.split(' > ').length} levels` : ''}
                </div>
            </div>
            <div style="margin-bottom: 6px;">
                <span style="color: #9f7aea; font-weight: bold;">XPath:</span>
                <div style="background: #1a202c; padding: 4px 6px; border-radius: 4px; margin-top: 2px; word-break: break-all;">
                    ${this.escapeHtml(locators.xpath)}
                </div>
                <div style="font-size: 10px; color: #a0aec0; margin-top: 2px;">
                    Quality: ${xpathQuality}
                </div>
            </div>
            <div class="mode-indicator" style="margin-top: 8px; font-size: 11px; font-weight: bold; color: #68d391;">
                ⌨️ Modifier Keys for Copy
            </div>
            <div style="margin-top: 4px; font-size: 10px; color: #a0aec0;">
                Ctrl+Click: CSS • Alt+Click: XPath • Shift+Click: Both • Right-click: XPath • Ctrl priority: CSS everywhere • Matches: ${matchCount} elements
            </div>
        `;
        
        this.tooltip.style.display = 'block';
        this.positionTooltip(e);
    }

    getLocatorQuality(selector, elementType) {
        if (selector.startsWith('#')) return 'Excellent (ID)';
        if (selector.includes('[placeholder=')) return 'Excellent (Placeholder)';
        if (selector.includes('[name=')) return 'Good (Name)';
        if (selector.includes('[data-testid=')) return 'Excellent (Test ID)';
        if (selector.startsWith('.') && !selector.includes(' >')) return 'Good (Unique Class)';
        if (selector.includes(' > ')) return 'Good (Hierarchical)';
        if (selector.includes('[type=')) return 'Fair (Type Attribute)';
        if (selector.includes(':nth-child')) return 'Poor (Position-based)';
        return 'Fair (Attribute-based)';
    }

    getXPathQuality(xpath) {
        if (xpath.includes('[@placeholder=')) return 'Excellent (Placeholder)';
        if (xpath.includes('[@id=')) return 'Excellent (ID)';
        if (xpath.includes('[@name=')) return 'Good (Name)';
        if (xpath.includes('[@data-testid=')) return 'Excellent (Test ID)';
        if (xpath.includes('[text()=')) return 'Good (Text Content)';
        if (xpath.includes('contains(text()')) return 'Fair (Text Contains)';
        if (xpath.includes('[') && !xpath.includes('position()')) return 'Good (Attribute-based)';
        return 'Poor (Position-based)';
    }

    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    positionTooltip(e) {
        const rect = this.tooltip.getBoundingClientRect();
        let x = e.clientX + 10;
        let y = e.clientY + 10;
        
        if (x + rect.width > window.innerWidth) {
            x = e.clientX - rect.width - 10;
        }
        if (y + rect.height > window.innerHeight) {
            y = e.clientY - rect.height - 10;
        }
        
        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = y + 'px';
    }

    generateLocators(element) {
        return {
            css: this.generateCSSSelector(element),
            xpath: this.generateXPath(element)
        };
    }

    generateCSSSelector(element) {
        // Follow locator-rules.mdc priority hierarchy based on element type
        const tagName = element.tagName.toLowerCase();
        const elementType = this.getElementType(element);
        
        let selectors = [];
        
        // Generate selectors based on element type priority
        if (elementType === 'input') {
            selectors = this.generateInputSelectors(element);
        } else if (elementType === 'button') {
            selectors = this.generateButtonSelectors(element);
        } else if (elementType === 'link') {
            selectors = this.generateLinkSelectors(element);
        } else if (elementType === 'select') {
            selectors = this.generateSelectSelectors(element);
        } else if (elementType === 'text') {
            selectors = this.generateTextSelectors(element);
        } else {
            selectors = this.generateGenericSelectors(element);
        }
        
        // Test each selector for uniqueness and return the first unique one
        for (const selector of selectors) {
            if (this.isUniqueSelector(selector)) {
                console.log(`Found unique selector: ${selector}`);
                return selector;
            } else {
                console.log(`Selector not unique: ${selector} (matches ${document.querySelectorAll(selector).length} elements)`);
            }
        }
        
        // If no unique selector found, validate and warn
        const fallbackSelector = selectors[0] || this.generateFallbackSelector(element);
        const matchCount = document.querySelectorAll(fallbackSelector).length;
        
        if (matchCount > 1) {
            console.warn(`No unique selector found for ${elementType} element. Using fallback: ${fallbackSelector} (matches ${matchCount} elements)`);
        }
        
        return fallbackSelector;
    }

    getElementType(element) {
        const tagName = element.tagName.toLowerCase();
        
        if (tagName === 'input' || tagName === 'textarea') {
            return 'input';
        } else if (tagName === 'button' || (tagName === 'input' && element.type === 'button') || 
                   (tagName === 'input' && element.type === 'submit')) {
            return 'button';
        } else if (tagName === 'a') {
            return 'link';
        } else if (tagName === 'select') {
            return 'select';
        } else if (this.isTextElement(element)) {
            return 'text';
        }
        
        return 'generic';
    }

    isTextElement(element) {
        const tagName = element.tagName.toLowerCase();
        const textTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'article', 'section', 'header', 'footer', 'main'];
        
        if (!textTags.includes(tagName)) {
            return false;
        }
        
        // Check if element primarily contains text content (not just structural)
        const textContent = element.textContent?.trim() || '';
        const hasSignificantText = textContent.length > 3;
        
        // Check if it's not primarily an interactive container
        const interactiveChildren = element.querySelectorAll('input, button, select, textarea, a[href]');
        const hasMinimalInteractiveContent = interactiveChildren.length <= 1;
        
        return hasSignificantText && hasMinimalInteractiveContent;
    }

    generateInputSelectors(element) {
        const selectors = [];
        
        // 1. Placeholder Text (highest priority for inputs)
        if (element.placeholder && element.placeholder.trim()) {
            const placeholderSelector = `[placeholder="${CSS.escape(element.placeholder)}"]`;
            if (this.isUniqueSelector(placeholderSelector)) {
                selectors.push(placeholderSelector);
            } else {
                // Try hierarchical selector with placeholder
                const hierarchical = this.generateHierarchicalSelector(element, `input${placeholderSelector}`);
                selectors.push(hierarchical);
            }
        }
        
        // 2. ID Attribute
        if (element.id) {
            const idSelector = `#${CSS.escape(element.id)}`;
            if (this.isUniqueSelector(idSelector)) {
                selectors.push(idSelector);
            } else {
                // Try hierarchical selector with ID
                const hierarchical = this.generateHierarchicalSelector(element, idSelector);
                selectors.push(hierarchical);
            }
        }
        
        // 3. Name Attribute
        if (element.name) {
            const nameSelector = `[name="${CSS.escape(element.name)}"]`;
            if (this.isUniqueSelector(nameSelector)) {
                selectors.push(nameSelector);
            } else {
                // Try hierarchical selector with name
                const hierarchical = this.generateHierarchicalSelector(element, `input${nameSelector}`);
                selectors.push(hierarchical);
            }
        }
        
        // 4. Unique Class
        const uniqueClass = this.getUniqueClass(element);
        if (uniqueClass) {
            selectors.push(`.${CSS.escape(uniqueClass)}`);
        }
        
        // 5. Attribute Combinations
        const attrCombinations = this.getInputAttributeCombinations(element);
        selectors.push(...attrCombinations);
        
        return selectors;
    }

    generateButtonSelectors(element) {
        const selectors = [];
        
        // 1. ID Attribute (highest priority for buttons)
        if (element.id) {
            const idSelector = `#${CSS.escape(element.id)}`;
            if (this.isUniqueSelector(idSelector)) {
                selectors.push(idSelector);
            } else {
                // Try hierarchical selector with ID
                const hierarchical = this.generateHierarchicalSelector(element, idSelector);
                selectors.push(hierarchical);
            }
        }
        
        // 2. Name Attribute
        if (element.name) {
            const nameSelector = `[name="${CSS.escape(element.name)}"]`;
            if (this.isUniqueSelector(nameSelector)) {
                selectors.push(nameSelector);
            } else {
                // Try hierarchical selector with name
                const hierarchical = this.generateHierarchicalSelector(element, `button${nameSelector}`);
                selectors.push(hierarchical);
            }
        }
        
        // 3. Type Attribute (common for buttons)
        if (element.type) {
            const typeSelector = `button[type="${CSS.escape(element.type)}"]`;
            if (this.isUniqueSelector(typeSelector)) {
                selectors.push(typeSelector);
            } else {
                // Force hierarchical when type is not unique
                const hierarchical = this.generateHierarchicalSelector(element, typeSelector);
                selectors.push(hierarchical);
            }
        }
        
        // 4. Unique Class
        const uniqueClass = this.getUniqueClass(element);
        if (uniqueClass) {
            selectors.push(`.${CSS.escape(uniqueClass)}`);
        } else {
            // Try hierarchical with semantic classes
            const semanticClasses = this.getSemanticClasses(element);
            if (semanticClasses.length > 0) {
                const classSelector = `.${CSS.escape(semanticClasses[0])}`;
                const hierarchical = this.generateHierarchicalSelector(element, `button${classSelector}`);
                selectors.push(hierarchical);
            }
        }
        
        // 5. Attribute Combinations
        const attrCombinations = this.getButtonAttributeCombinations(element);
        for (const combination of attrCombinations) {
            if (this.isUniqueSelector(combination)) {
                selectors.push(combination);
            } else {
                // Force hierarchical for non-unique attribute combinations
                const hierarchical = this.generateHierarchicalSelector(element, combination);
                selectors.push(hierarchical);
            }
        }
        
        return selectors;
    }

    generateLinkSelectors(element) {
        const selectors = [];
        
        // 1. ID Attribute (highest priority for links)
        if (element.id) {
            const idSelector = `#${CSS.escape(element.id)}`;
            if (this.isUniqueSelector(idSelector)) {
                selectors.push(idSelector);
            } else {
                // Try hierarchical selector with ID
                const hierarchical = this.generateHierarchicalSelector(element, idSelector);
                selectors.push(hierarchical);
            }
        }
        
        // 2. Href Attribute
        if (element.href && !element.href.startsWith('javascript:')) {
            const href = element.getAttribute('href');
            const hrefSelector = `[href="${CSS.escape(href)}"]`;
            
            if (this.isUniqueSelector(hrefSelector)) {
                selectors.push(hrefSelector);
            } else {
                // Try hierarchical selector with href
                const hierarchical = this.generateHierarchicalSelector(element, `a${hrefSelector}`);
                selectors.push(hierarchical);
            }
        }
        
        // 3. Unique Class
        const uniqueClass = this.getUniqueClass(element);
        if (uniqueClass) {
            selectors.push(`.${CSS.escape(uniqueClass)}`);
        } else {
            // Try hierarchical with class combinations
            const semanticClasses = this.getSemanticClasses(element);
            if (semanticClasses.length > 0) {
                const classSelector = `.${CSS.escape(semanticClasses[0])}`;
                const hierarchical = this.generateHierarchicalSelector(element, `a${classSelector}`);
                selectors.push(hierarchical);
            }
        }
        
        // 4. Attribute Combinations
        const attrCombinations = this.getLinkAttributeCombinations(element);
        selectors.push(...attrCombinations);
        
        return selectors;
    }

    generateSelectSelectors(element) {
        const selectors = [];
        
        // 1. ID Attribute
        if (element.id) {
            const idSelector = `#${CSS.escape(element.id)}`;
            if (this.isUniqueSelector(idSelector)) {
                selectors.push(idSelector);
            } else {
                // Try hierarchical selector with ID
                const hierarchical = this.generateHierarchicalSelector(element, idSelector);
                selectors.push(hierarchical);
            }
        }
        
        // 2. Name Attribute
        if (element.name) {
            const nameSelector = `[name="${CSS.escape(element.name)}"]`;
            if (this.isUniqueSelector(nameSelector)) {
                selectors.push(nameSelector);
            } else {
                // Try hierarchical selector with name
                const hierarchical = this.generateHierarchicalSelector(element, `select${nameSelector}`);
                selectors.push(hierarchical);
            }
        }
        
        // 3. Unique Class
        const uniqueClass = this.getUniqueClass(element);
        if (uniqueClass) {
            selectors.push(`.${CSS.escape(uniqueClass)}`);
        }
        
        // 4. Attribute Combinations
        const attrCombinations = this.getSelectAttributeCombinations(element);
        for (const combination of attrCombinations) {
            if (this.isUniqueSelector(combination)) {
                selectors.push(combination);
            } else {
                // Force hierarchical for non-unique attribute combinations
                const hierarchical = this.generateHierarchicalSelector(element, combination);
                selectors.push(hierarchical);
            }
        }
        
        return selectors;
    }

    generateGenericSelectors(element) {
        const selectors = [];
        
        // 1. ID Attribute
        if (element.id) {
            const idSelector = `#${CSS.escape(element.id)}`;
            if (this.isUniqueSelector(idSelector)) {
                selectors.push(idSelector);
            } else {
                // Try hierarchical selector with ID
                const hierarchical = this.generateHierarchicalSelector(element, idSelector);
                selectors.push(hierarchical);
            }
        }
        
        // 2. Unique Class
        const uniqueClass = this.getUniqueClass(element);
        if (uniqueClass) {
            selectors.push(`.${CSS.escape(uniqueClass)}`);
        } else {
            // Try hierarchical with semantic classes
            const semanticClasses = this.getSemanticClasses(element);
            if (semanticClasses.length > 0) {
                const classSelector = `.${CSS.escape(semanticClasses[0])}`;
                const hierarchical = this.generateHierarchicalSelector(element, `${element.tagName.toLowerCase()}${classSelector}`);
                selectors.push(hierarchical);
            }
        }
        
        // 3. Attribute Combinations
        const attributes = this.getRelevantAttributes(element);
        if (attributes.length > 0) {
            const attrSelector = attributes.map(attr => 
                `[${attr.name}="${CSS.escape(attr.value)}"]`
            ).join('');
            const combinedSelector = element.tagName.toLowerCase() + attrSelector;
            
            if (this.isUniqueSelector(combinedSelector)) {
                selectors.push(combinedSelector);
            } else {
                // Try hierarchical with attributes
                const hierarchical = this.generateHierarchicalSelector(element, combinedSelector);
                selectors.push(hierarchical);
            }
        }
        
        // 4. Fallback
        selectors.push(this.generateNthChildSelector(element));
        
        return selectors;
    }

    generateHierarchicalSelector(element, baseSelector) {
        // Build hierarchical CSS selector by walking up parent elements
        let current = element.parentElement;
        let hierarchy = [baseSelector];
        let depth = 0;
        const maxDepth = 3; // Limit to prevent fragility
        
        while (current && current !== document.body && depth < maxDepth) {
            const parentSelector = this.getParentSelector(current);
            if (parentSelector) {
                hierarchy.unshift(parentSelector);
                
                // Test if this hierarchy level is unique
                const hierarchicalSelector = hierarchy.join(' > ');
                if (this.isUniqueSelector(hierarchicalSelector)) {
                    console.log(`Hierarchical selector found unique at depth ${depth + 1}: ${hierarchicalSelector}`);
                    return hierarchicalSelector;
                }
            }
            
            current = current.parentElement;
            depth++;
        }
        
        // Final validation: if still not unique, try different parent strategies
        const finalSelector = hierarchy.join(' > ');
        if (!this.isUniqueSelector(finalSelector)) {
            console.warn(`Hierarchical selector still not unique: ${finalSelector} (matches ${document.querySelectorAll(finalSelector).length} elements)`);
            
            // Try alternative strategy with more specific parent selectors
            const alternativeSelector = this.generateAlternativeHierarchicalSelector(element, baseSelector);
            if (alternativeSelector && this.isUniqueSelector(alternativeSelector)) {
                return alternativeSelector;
            }
        }
        
        return finalSelector;
    }

    generateAlternativeHierarchicalSelector(element, baseSelector) {
        // Alternative strategy using nth-child or attribute combinations for parents
        let current = element.parentElement;
        let hierarchy = [baseSelector];
        let depth = 0;
        const maxDepth = 2; // Shorter depth for alternative strategy
        
        while (current && current !== document.body && depth < maxDepth) {
            // Try different parent selector strategies
            let parentSelector = null;
            
            // 1. Try tag + nth-child combination
            const tagName = current.tagName.toLowerCase();
            const siblings = Array.from(current.parentElement?.children || [])
                .filter(child => child.tagName.toLowerCase() === tagName);
            
            if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                parentSelector = `${tagName}:nth-child(${index})`;
            } else {
                parentSelector = tagName;
            }
            
            if (parentSelector) {
                hierarchy.unshift(parentSelector);
                
                const hierarchicalSelector = hierarchy.join(' > ');
                if (this.isUniqueSelector(hierarchicalSelector)) {
                    console.log(`Alternative hierarchical selector found: ${hierarchicalSelector}`);
                    return hierarchicalSelector;
                }
            }
            
            current = current.parentElement;
            depth++;
        }
        
        return null;
    }

    getParentSelector(element) {
        // Prioritize semantic parent selectors
        const semanticSelectors = [];
        
        // 1. ID (highest priority for parent context)
        if (element.id) {
            semanticSelectors.push(`#${CSS.escape(element.id)}`);
        }
        
        // 2. Semantic classes (forms, navigation, modals, etc.)
        const semanticClasses = this.getSemanticClasses(element);
        if (semanticClasses.length > 0) {
            semanticSelectors.push(`.${semanticClasses[0]}`);
        }
        
        // 3. Role attribute
        if (element.getAttribute('role')) {
            semanticSelectors.push(`[role="${CSS.escape(element.getAttribute('role'))}"]`);
        }
        
        // 4. Data-testid for parent context
        const testId = element.getAttribute('data-testid') || element.getAttribute('data-test');
        if (testId) {
            semanticSelectors.push(`[data-testid="${CSS.escape(testId)}"]`);
        }
        
        // Return the first available semantic selector
        return semanticSelectors[0] || null;
    }

    getSemanticClasses(element) {
        // Identify semantic classes that provide meaningful context
        const semanticKeywords = [
            'nav', 'navigation', 'navbar', 'menu', 'sidebar', 'header', 'footer',
            'form', 'modal', 'dialog', 'popup', 'dropdown', 'toolbar', 'panel',
            'section', 'container', 'wrapper', 'content', 'main', 'aside',
            'card', 'item', 'list', 'table', 'row', 'column', 'grid'
        ];
        
        const classes = Array.from(element.classList);
        return classes.filter(cls => 
            semanticKeywords.some(keyword => 
                cls.toLowerCase().includes(keyword)
            )
        );
    }

    getInputAttributeCombinations(element) {
        const combinations = [];
        const tagName = element.tagName.toLowerCase();
        
        // Type + other attributes
        if (element.type) {
            combinations.push(`${tagName}[type="${CSS.escape(element.type)}"]`);
            
            if (element.required) {
                combinations.push(`${tagName}[type="${CSS.escape(element.type)}"][required]`);
            }
            
            if (element.maxLength && element.maxLength > 0) {
                combinations.push(`${tagName}[type="${CSS.escape(element.type)}"][maxlength="${element.maxLength}"]`);
            }
        }
        
        // Data attributes
        const testId = element.getAttribute('data-testid') || element.getAttribute('data-test');
        if (testId) {
            combinations.push(`[data-testid="${CSS.escape(testId)}"]`);
        }
        
        // Aria label
        if (element.getAttribute('aria-label')) {
            combinations.push(`[aria-label="${CSS.escape(element.getAttribute('aria-label'))}"]`);
        }
        
        return combinations;
    }

    getButtonAttributeCombinations(element) {
        const combinations = [];
        const tagName = element.tagName.toLowerCase();
        
        // Type + class combinations
        if (element.type) {
            combinations.push(`${tagName}[type="${CSS.escape(element.type)}"]`);
        }
        
        // Value attribute for input buttons
        if (element.value && tagName === 'input') {
            combinations.push(`${tagName}[value="${CSS.escape(element.value)}"]`);
        }
        
        // Data attributes
        const testId = element.getAttribute('data-testid') || element.getAttribute('data-test');
        if (testId) {
            combinations.push(`[data-testid="${CSS.escape(testId)}"]`);
        }
        
        // Aria label
        if (element.getAttribute('aria-label')) {
            combinations.push(`[aria-label="${CSS.escape(element.getAttribute('aria-label'))}"]`);
        }
        
        return combinations;
    }

    getLinkAttributeCombinations(element) {
        const combinations = [];
        
        // Data attributes
        const testId = element.getAttribute('data-testid') || element.getAttribute('data-test');
        if (testId) {
            combinations.push(`[data-testid="${CSS.escape(testId)}"]`);
        }
        
        // Aria label
        if (element.getAttribute('aria-label')) {
            combinations.push(`[aria-label="${CSS.escape(element.getAttribute('aria-label'))}"]`);
        }
        
        // Title attribute
        if (element.title) {
            combinations.push(`[title="${CSS.escape(element.title)}"]`);
        }
        
        return combinations;
    }

    getSelectAttributeCombinations(element) {
        const combinations = [];
        
        // Multiple attribute
        if (element.multiple) {
            combinations.push(`select[multiple]`);
        }
        
        // Data attributes
        const testId = element.getAttribute('data-testid') || element.getAttribute('data-test');
        if (testId) {
            combinations.push(`[data-testid="${CSS.escape(testId)}"]`);
        }
        
        return combinations;
    }

    generateTextSelectors(element) {
        const selectors = [];
        const textContent = element.textContent?.trim() || '';
        
        // For text elements, we prioritize based on text content length and uniqueness
        if (textContent.length > 0) {
            // 1. ID Attribute (still highest priority if available)
            if (element.id) {
                selectors.push(`#${CSS.escape(element.id)}`);
            }
            
            // 2. Data-testid (semantic attribute for testing)
            const testId = element.getAttribute('data-testid') || element.getAttribute('data-test');
            if (testId) {
                selectors.push(`[data-testid="${CSS.escape(testId)}"]`);
            }
            
            // 3. Unique Class
            const uniqueClass = this.getUniqueClass(element);
            if (uniqueClass) {
                selectors.push(`.${CSS.escape(uniqueClass)}`);
            }
            
            // 4. Attribute Combinations
            const attributes = this.getRelevantAttributes(element);
            if (attributes.length > 0) {
                const attrSelector = attributes.map(attr => 
                    `[${attr.name}="${CSS.escape(attr.value)}"]`
                ).join('');
                selectors.push(element.tagName.toLowerCase() + attrSelector);
            }
            
            // 5. Tag + Class combination
            if (element.className) {
                const classes = Array.from(element.classList).map(cls => CSS.escape(cls));
                if (classes.length > 0) {
                    selectors.push(`${element.tagName.toLowerCase()}.${classes.join('.')}`);
                }
            }
            
            // Note: Text-based selectors are handled in XPath generation
            // CSS doesn't support text content selection natively
        }
        
        // Fallback
        if (selectors.length === 0) {
            selectors.push(this.generateNthChildSelector(element));
        }
        
        return selectors;
    }

    getUniqueClass(element) {
        const classes = Array.from(element.classList);
        
        // Try each class to see if it's unique
        for (const cls of classes) {
            if (document.querySelectorAll(`.${CSS.escape(cls)}`).length === 1) {
                return cls;
            }
        }
        
        return null;
    }

    isUniqueSelector(selector) {
        try {
            const elements = document.querySelectorAll(selector);
            return elements.length === 1;
        } catch (error) {
            return false;
        }
    }

    generateFallbackSelector(element) {
        return this.generateNthChildSelector(element);
    }

    generateXPath(element) {
        const tagName = element.tagName.toLowerCase();
        const elementType = this.getElementType(element);
        
        // Text-based XPath for buttons, links, and text elements (high priority)
        if (elementType === 'button' || elementType === 'link' || elementType === 'text') {
            const text = this.getEffectiveTextContent(element);
            if (text) {
                // Analyze text structure for better XPath generation
                const directText = this.getDirectTextContent(element);
                const hasDirectText = directText && directText.length > 0;
                const hasNestedText = !hasDirectText && text.length > 0;
                
                console.log(`Text analysis for ${elementType}: direct="${directText}", effective="${text}", hasDirectText=${hasDirectText}, hasNestedText=${hasNestedText}`);
                
                // For text elements (assertions), prioritize text content
                if (elementType === 'text') {
                    // Handle different text matching strategies
                    if (text.length <= 50 && this.isTextUnique(element, text)) {
                        // Use exact text match for short, unique text
                        return `//${tagName}[text()="${this.normalizeText(text)}"]`;
                    } else if (text.length > 50) {
                        // Use contains for long text with first 30 characters
                        const shortText = this.normalizeText(text.substring(0, 30));
                        return `//${tagName}[contains(text(),"${shortText}")]`;
                    } else {
                        // Use contains for non-unique text
                        return `//${tagName}[contains(text(),"${this.normalizeText(text)}")]`;
                    }
                }
                
                // For buttons and links, use improved text detection
                if (hasDirectText) {
                    // Use exact text match for direct text content
                    if (elementType === 'button') {
                        return `//${tagName}[text()="${this.normalizeText(directText)}"]`;
                    }
                    if (elementType === 'link' && directText.length < 50) {
                        return `//${tagName}[contains(text(),"${this.normalizeText(directText)}")]`;
                    }
                } else if (hasNestedText) {
                    // Text is nested, use contains() with normalized text
                    if (text.length <= 30) {
                        return `//${tagName}[contains(text(),"${this.normalizeText(text)}")]`;
                    } else {
                        // Use first 20 characters for long nested text
                        const shortText = this.normalizeText(text.substring(0, 20));
                        return `//${tagName}[contains(text(),"${shortText}")]`;
                    }
                }
            }
        }
        
        // Attribute-based XPath with element-specific priority
        if (elementType === 'input') {
            // For inputs, prioritize placeholder, then name, then id
            if (element.placeholder && element.placeholder.trim()) {
                return `//${tagName}[@placeholder="${element.placeholder}"]`;
            }
            if (element.name) {
                return `//${tagName}[@name="${element.name}"]`;
            }
            if (element.id) {
                return `//${tagName}[@id="${element.id}"]`;
            }
        } else {
            // For other elements, prioritize id, then name, then other attributes
            if (element.id) {
                return `//${tagName}[@id="${element.id}"]`;
            }
            if (element.name) {
                return `//${tagName}[@name="${element.name}"]`;
            }
        }
        
        // Data attributes (semantic attributes)
        const testId = element.getAttribute('data-testid') || element.getAttribute('data-test');
        if (testId) {
            return `//${tagName}[@data-testid="${testId}"]`;
        }
        
        // Class-based XPath
        if (element.className && element.className.trim()) {
            return `//${tagName}[@class="${element.className}"]`;
        }
        
        // Type-based XPath for inputs and buttons
        if (element.type) {
            return `//${tagName}[@type="${element.type}"]`;
        }
        
        // Href for links
        if (elementType === 'link' && element.href && !element.href.startsWith('javascript:')) {
            const href = element.getAttribute('href');
            return `//${tagName}[@href="${href}"]`;
        }
        
        // Fallback to position-based XPath (least preferred)
        return this.generatePositionalXPath(element);
    }

    generatePositionalXPath(element) {
        const path = [];
        let current = element;
        
        while (current && current.nodeType === Node.ELEMENT_NODE) {
            const tagName = current.tagName.toLowerCase();
            const siblings = Array.from(current.parentNode?.children || [])
                .filter(child => child.tagName.toLowerCase() === tagName);
            
            if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                path.unshift(`${tagName}[${index}]`);
            } else {
                path.unshift(tagName);
            }
            
            current = current.parentNode;
            if (current === document.body) break;
        }
        
        return '/' + path.join('/');
    }

    getDirectTextContent(element) {
        // Get only direct text content, excluding nested elements
        let directText = '';
        for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                directText += node.textContent;
            }
        }
        return directText.trim();
    }

    getEffectiveTextContent(element) {
        // Try multiple strategies to get the best text content for XPath
        
        // 1. Direct text content (text nodes directly in the element)
        const directText = this.getDirectTextContent(element);
        if (directText && directText.length > 0) {
            console.log(`Using direct text content: "${directText}"`);
            return directText;
        }
        
        // 2. Check for single text-containing child element
        const textChildren = Array.from(element.children).filter(child => {
            const childText = child.textContent?.trim();
            return childText && childText.length > 0 && 
                   !child.querySelector('input, button, select, textarea, a[href]');
        });
        
        if (textChildren.length === 1) {
            const childText = textChildren[0].textContent?.trim();
            if (childText) {
                console.log(`Using single child text content: "${childText}"`);
                return childText;
            }
        }
        
        // 3. innerText (respects styling and visibility)
        if (element.innerText && element.innerText.trim()) {
            console.log(`Using innerText content: "${element.innerText.trim()}"`);
            return element.innerText.trim();
        }
        
        // 4. textContent as fallback
        if (element.textContent && element.textContent.trim()) {
            console.log(`Using textContent fallback: "${element.textContent.trim()}"`);
            return element.textContent.trim();
        }
        
        return '';
    }

    isTextUnique(element, text) {
        // Check if the text content is unique on the page
        const normalizedText = this.normalizeText(text);
        const xpath = `//${element.tagName.toLowerCase()}[text()="${normalizedText}"]`;
        try {
            const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            return result.snapshotLength === 1;
        } catch (error) {
            return false;
        }
    }

    getRelevantAttributes(element) {
        const relevantAttrs = ['type', 'role', 'data-testid', 'data-test', 'aria-label', 'title'];
        const attributes = [];
        
        for (const attr of relevantAttrs) {
            if (element.hasAttribute(attr)) {
                attributes.push({
                    name: attr,
                    value: element.getAttribute(attr)
                });
            }
        }
        
        return attributes;
    }

    generateNthChildSelector(element) {
        const parent = element.parentNode;
        if (!parent) return element.tagName.toLowerCase();
        
        const siblings = Array.from(parent.children)
            .filter(child => child.tagName === element.tagName);
        
        if (siblings.length === 1) {
            return element.tagName.toLowerCase();
        }
        
        const index = siblings.indexOf(element) + 1;
        return `${element.tagName.toLowerCase()}:nth-child(${index})`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }

    showCopyNotification(type = 'CSS') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'XPath' ? '#9f7aea' : '#48bb78'};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        notification.textContent = `✓ ${type} ${type === 'XPath' ? 'locator' : 'Selector'} copied to clipboard!`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 2000);
    }

    addToHistory(locators) {
        this.locatorHistory.unshift({
            css: locators.css,
            xpath: locators.xpath,
            timestamp: new Date().toISOString(),
            url: window.location.href
        });
        
        // Keep only last 50 entries
        if (this.locatorHistory.length > 50) {
            this.locatorHistory = this.locatorHistory.slice(0, 50);
        }
        
        chrome.storage.local.set({history: this.locatorHistory});
    }

    normalizeText(text) {
        // Normalize text for XPath by trimming and escaping special characters
        return text.trim()
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\s+/g, ' '); // Replace multiple whitespace with single space
    }

    // ================== IFRAME SUPPORT ==================

    injectIntoIframes() {
        // Find all iframes and inject content script
        const iframes = document.querySelectorAll('iframe');
        console.log(`Found ${iframes.length} iframes to inject into`);
        
        iframes.forEach((iframe, index) => {
            this.handleIframeInjection(iframe, index);
        });

        // Watch for dynamically added iframes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'IFRAME') {
                            this.handleIframeInjection(node, Date.now());
                        } else if (node.querySelectorAll) {
                            const newIframes = node.querySelectorAll('iframe');
                            newIframes.forEach((iframe, index) => {
                                this.handleIframeInjection(iframe, Date.now() + index);
                            });
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    handleIframeInjection(iframe, frameId) {
        console.log(`Attempting injection for iframe:`, iframe.name || iframe.id || 'unnamed', iframe);
        
        // Set up load event listener first for both srcdoc and src iframes
        const handleLoad = () => {
            console.log(`iframe load event fired for ${iframe.srcdoc ? 'srcdoc' : 'src'} iframe`);
            setTimeout(() => {
                this.injectIntoIframe(iframe, frameId);
            }, 50); // Small delay to ensure content is ready
        };
        
        iframe.addEventListener('load', handleLoad, { once: true });
        
        // For srcdoc iframes, also try immediate injection with delay
        if (iframe.srcdoc) {
            console.log(`Detected srcdoc iframe, setting up immediate and delayed injection`);
            setTimeout(() => {
                this.injectIntoIframe(iframe, frameId);
            }, 100);
        } else if (iframe.src) {
            // For src iframes, try immediate injection in case already loaded
            console.log(`Detected src iframe: ${iframe.src}, trying immediate injection`);
            this.injectIntoIframe(iframe, frameId);
        }
    }

    injectIntoIframe(iframe, frameId) {
        try {
            console.log(`Trying to inject into iframe:`, iframe.name || iframe.id || 'unnamed');
            console.log(`iframe src:`, iframe.src);
            console.log(`iframe srcdoc:`, iframe.srcdoc ? 'has srcdoc content' : 'no srcdoc');
            
            // Enhanced iframe access verification
            const accessResult = this.canAccessIframe(iframe);
            
            if (!accessResult.accessible) {
                const guidance = this.getIframeAccessGuidance(accessResult, iframe);
                console.log(`❌ ${guidance.message}: ${guidance.guidance}`);
                
                // Store iframe info for debugging even if not accessible
                this.storeInaccessibleIframe(iframe, accessResult);
                return false;
            }
            
            console.log(`✅ iframe accessible:`, accessResult);
            
            // Wait for document to be ready before injecting
            this.waitForIframeDocumentReady(iframe, frameId);
            
            return true;
        } catch (error) {
            console.log(`❌ Failed to inject into iframe: ${error.message}`);
            return false;
        }
    }

    canAccessIframe(iframe) {
        try {
            // Test basic access to contentDocument
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            
            if (!doc) {
                return { 
                    accessible: false, 
                    reason: 'no-document',
                    message: 'iframe document not available'
                };
            }
            
            // Test if we can read properties (this might throw SecurityError)
            const readyState = doc.readyState;
            const hasElements = !!(doc.body || doc.documentElement);
            const protocol = doc.location?.protocol || 'unknown';
            
            console.log(`iframe access check passed:`, {
                readyState,
                hasElements,
                protocol,
                url: doc.location?.href || 'unknown'
            });
            
            return { 
                accessible: true, 
                readyState, 
                hasElements,
                protocol,
                document: doc
            };
        } catch (e) {
            console.log(`iframe access check failed:`, e.name, e.message);
            
            if (e.name === 'SecurityError' || e.message.includes('cross-origin')) {
                return { 
                    accessible: false, 
                    reason: 'security-error', 
                    error: e.message,
                    message: 'Cross-origin or security restriction'
                };
            }
            
            return { 
                accessible: false, 
                reason: 'unknown-error', 
                error: e.message,
                message: 'Unknown access error'
            };
        }
    }

    getIframeAccessGuidance(accessResult, iframe) {
        const isLocalFile = window.location.protocol === 'file:';
        
        if (!accessResult.accessible) {
            switch (accessResult.reason) {
                case 'security-error':
                    if (isLocalFile) {
                        return {
                            message: "🔧 Local file security restriction",
                            guidance: "Use a local development server (python3 -m http.server 8000) to test iframe functionality."
                        };
                    }
                    return {
                        message: "🔒 Cross-origin iframe detected",
                        guidance: "This iframe cannot be inspected due to browser security. Use framework-specific iframe switching."
                    };
                case 'no-document':
                    return {
                        message: "⏳ iframe not ready",
                        guidance: "iframe content is still loading. Please wait and try again."
                    };
                default:
                    return {
                        message: "❌ iframe access blocked",
                        guidance: "iframe content cannot be accessed. Check iframe source and security settings."
                    };
            }
        }
        
        return {
            message: "✅ iframe accessible",
            guidance: "iframe content is ready for inspection."
        };
    }

    storeInaccessibleIframe(iframe, accessResult) {
        // Store information about inaccessible iframes for debugging
        this.inaccessibleIframes = this.inaccessibleIframes || [];
        this.inaccessibleIframes.push({
            name: iframe.name || iframe.id || 'unnamed',
            src: iframe.src || 'srcdoc',
            reason: accessResult.reason,
            message: accessResult.message,
            timestamp: Date.now()
        });
    }

    waitForIframeDocumentReady(iframe, frameId, retryCount = 0) {
        const maxRetries = 5;
        const retryDelay = 100; // Simplified to fixed delay
        
        try {
            // Re-check accessibility on each retry
            const accessResult = this.canAccessIframe(iframe);
            
            if (!accessResult.accessible) {
                console.log(`❌ iframe document not accessible on retry ${retryCount + 1}, reason: ${accessResult.reason}`);
                return;
            }
            
            const iframeDoc = accessResult.document;
            console.log(`Checking iframe document ready state: ${accessResult.readyState}`);
            
            // Check if document is ready and has proper structure
            if (accessResult.readyState === 'complete' || 
                (accessResult.readyState === 'interactive' && accessResult.hasElements)) {
                console.log(`✅ iframe document ready, proceeding with injection`);
                this.performIframeInjection(iframe, frameId);
            } else if (retryCount < maxRetries) {
                console.log(`iframe document not ready (${accessResult.readyState}), waiting... retry ${retryCount + 1}`);
                
                // Set up one-time event listener for readyState change
                const readyStateListener = () => {
                    console.log(`iframe document readyState changed to: ${iframeDoc.readyState}`);
                    if (iframeDoc.readyState === 'complete' || iframeDoc.readyState === 'interactive') {
                        iframeDoc.removeEventListener('readystatechange', readyStateListener);
                        this.waitForIframeDocumentReady(iframe, frameId, retryCount + 1);
                    }
                };
                
                iframeDoc.addEventListener('readystatechange', readyStateListener);
                
                // Also set up a fallback timeout
                setTimeout(() => {
                    this.waitForIframeDocumentReady(iframe, frameId, retryCount + 1);
                }, retryDelay);
            } else {
                console.log(`❌ Max retries reached for iframe document ready state`);
            }
        } catch (error) {
            console.log(`❌ Error waiting for iframe document ready: ${error.message}`);
            if (retryCount < maxRetries) {
                setTimeout(() => {
                    this.waitForIframeDocumentReady(iframe, frameId, retryCount + 1);
                }, retryDelay);
            }
        }
    }

    performIframeInjection(iframe, frameId) {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            // Set frame context for this iframe
            const frameInfo = {
                id: frameId,
                name: iframe.name || iframe.id || `frame-${frameId}`,
                src: iframe.src || 'srcdoc',
                selector: this.generateCSSSelector(iframe),
                parent: null // Will be set for nested iframes
            };

            // Create a new inspector instance for the iframe
            this.createIframeInspector(iframeDoc, frameInfo);
            
            console.log(`✅ Successfully injected locator inspector into iframe: ${frameInfo.name}`);
            return true;
        } catch (error) {
            console.log(`❌ Failed to perform iframe injection: ${error.message}`);
            return false;
        }
    }

    createIframeInspector(iframeDoc, frameInfo, parentFrameInfo = null) {
        console.log(`Creating iframe inspector for: ${frameInfo.name}`);
        console.log(`iframe document structure check:`, {
            readyState: iframeDoc.readyState,
            hasDocumentElement: !!iframeDoc.documentElement,
            hasBody: !!iframeDoc.body,
            bodyChildCount: iframeDoc.body ? iframeDoc.body.children.length : 0
        });
        
        // Set parent frame information for nested iframes
        if (parentFrameInfo) {
            frameInfo.parent = parentFrameInfo;
            console.log(`Setting parent frame: ${parentFrameInfo.name} for child: ${frameInfo.name}`);
        }
        
        // Determine the best element to bind events to
        const eventTarget = iframeDoc.body || iframeDoc.documentElement || iframeDoc;
        console.log(`Using event target:`, eventTarget.tagName || 'document');
        
        // Create a lightweight inspector for iframe content
        const iframeInspector = {
            frameInfo: frameInfo,
            parentInspector: this,
            eventTarget: eventTarget,
            
            bindEvents() {
                console.log(`Binding events for iframe: ${this.frameInfo.name} on target: ${this.eventTarget.tagName || 'document'}`);
                
                // Use event delegation with multiple event targets for better coverage
                const bindToTarget = (target, targetName) => {
                    console.log(`Binding events to ${targetName} in iframe: ${this.frameInfo.name}`);
                    
                    target.addEventListener('mouseover', (e) => {
                        if (this.parentInspector.isEnabled) {
                            console.log(`Mouse over iframe element (${targetName}):`, e.target.tagName, e.target.id || e.target.className);
                            this.parentInspector.handleIframeMouseOver(e, this.frameInfo);
                        }
                    }, true); // Use capture phase for better event handling
                    
                    target.addEventListener('mouseout', (e) => {
                        if (this.parentInspector.isEnabled) {
                            this.parentInspector.handleMouseOut(e);
                        }
                    }, true);
                    
                    target.addEventListener('click', (e) => {
                        if (this.parentInspector.isEnabled) {
                            console.log(`Click on iframe element (${targetName}):`, e.target.tagName, e.target.id || e.target.className);
                            this.parentInspector.handleIframeClick(e, this.frameInfo);
                        }
                    }, true);
                    
                    target.addEventListener('contextmenu', (e) => {
                        if (this.parentInspector.isEnabled) {
                            this.parentInspector.handleIframeClick(e, this.frameInfo);
                        }
                    }, true);
                };
                
                // Bind to multiple targets for maximum coverage
                if (iframeDoc.body) {
                    bindToTarget(iframeDoc.body, 'body');
                }
                if (iframeDoc.documentElement) {
                    bindToTarget(iframeDoc.documentElement, 'documentElement');
                }
                bindToTarget(iframeDoc, 'document');
                
                console.log(`✅ Events bound for iframe: ${this.frameInfo.name}`);
            },
            
            // Add method to inject into nested iframes
            injectIntoNestedIframes() {
                console.log(`Looking for nested iframes in: ${this.frameInfo.name}`);
                const nestedIframes = iframeDoc.querySelectorAll('iframe');
                console.log(`Found ${nestedIframes.length} nested iframes in ${this.frameInfo.name}`);
                
                nestedIframes.forEach((nestedIframe, index) => {
                    const nestedFrameId = `${this.frameInfo.id}-nested-${index}`;
                    console.log(`Attempting to inject into nested iframe: ${nestedIframe.name || nestedIframe.id || 'unnamed'}`);
                    
                    // Handle nested iframe injection with timing
                    this.parentInspector.handleNestedIframeInjection(nestedIframe, nestedFrameId, this.frameInfo);
                });
            }
        };
        
        iframeInspector.bindEvents();
        
        // After binding events, look for nested iframes
        setTimeout(() => {
            iframeInspector.injectIntoNestedIframes();
        }, 300); // Increased delay for document structure to stabilize
        
        // Store reference for debugging
        this.iframeInspectors = this.iframeInspectors || [];
        this.iframeInspectors.push(iframeInspector);
        
        return iframeInspector;
    }

    handleNestedIframeInjection(nestedIframe, nestedFrameId, parentFrameInfo) {
        console.log(`Handling nested iframe injection: ${nestedIframe.name || nestedIframe.id || 'unnamed'} in parent: ${parentFrameInfo.name}`);
        
        // Set up load event listener first for both srcdoc and src iframes
        const handleLoad = () => {
            console.log(`Nested iframe load event fired for ${nestedIframe.srcdoc ? 'srcdoc' : 'src'} iframe`);
            setTimeout(() => {
                this.injectIntoNestedIframe(nestedIframe, nestedFrameId, parentFrameInfo);
            }, 50);
        };
        
        nestedIframe.addEventListener('load', handleLoad, { once: true });
        
        // For srcdoc iframes, also try immediate injection with delay
        if (nestedIframe.srcdoc) {
            console.log(`Detected nested srcdoc iframe, setting up immediate and delayed injection`);
            setTimeout(() => {
                this.injectIntoNestedIframe(nestedIframe, nestedFrameId, parentFrameInfo);
            }, 150);
        } else if (nestedIframe.src) {
            // For src iframes, try immediate injection in case already loaded
            console.log(`Detected nested src iframe: ${nestedIframe.src}, trying immediate injection`);
            this.injectIntoNestedIframe(nestedIframe, nestedFrameId, parentFrameInfo);
        }
    }

    injectIntoNestedIframe(nestedIframe, nestedFrameId, parentFrameInfo) {
        try {
            console.log(`Trying to inject into nested iframe:`, nestedIframe.name || nestedIframe.id || 'unnamed');
            
            // Check if iframe is accessible (same-origin)
            let nestedIframeDoc;
            try {
                nestedIframeDoc = nestedIframe.contentDocument || nestedIframe.contentWindow.document;
            } catch (e) {
                console.log(`❌ Cannot access nested iframe content (cross-origin restriction): ${nestedIframe.src || 'srcdoc'}`);
                return false;
            }
            
            if (nestedIframeDoc) {
                console.log(`nested iframe contentDocument accessible:`, !!nestedIframeDoc);
                console.log(`nested iframe document readyState:`, nestedIframeDoc.readyState);
                
                // Create frame info for nested iframe
                const nestedFrameInfo = {
                    id: nestedFrameId,
                    name: nestedIframe.name || nestedIframe.id || `nested-frame-${nestedFrameId}`,
                    src: nestedIframe.src || 'srcdoc',
                    selector: this.generateCSSSelector(nestedIframe),
                    parent: parentFrameInfo
                };
                
                // Wait for document to be ready before injecting
                this.waitForNestedIframeDocumentReady(nestedIframe, nestedFrameInfo);
                
                return true;
            } else {
                console.log(`❌ Cannot access nested iframe contentDocument: ${nestedIframe.src || 'srcdoc'}`);
                return false;
            }
        } catch (error) {
            console.log(`❌ Failed to inject into nested iframe: ${error.message}`);
            return false;
        }
    }

    waitForNestedIframeDocumentReady(nestedIframe, nestedFrameInfo, retryCount = 0) {
        const maxRetries = 5;
        const retryDelay = 100;
        
        try {
            const nestedIframeDoc = nestedIframe.contentDocument || nestedIframe.contentWindow.document;
            
            if (!nestedIframeDoc) {
                console.log(`❌ nested iframe document not accessible, retry ${retryCount + 1}/${maxRetries}`);
                if (retryCount < maxRetries) {
                    setTimeout(() => {
                        this.waitForNestedIframeDocumentReady(nestedIframe, nestedFrameInfo, retryCount + 1);
                    }, retryDelay);
                }
                return;
            }
            
            console.log(`Checking nested iframe document ready state: ${nestedIframeDoc.readyState}`);
            
            // Check if document is ready and has proper structure
            if (nestedIframeDoc.readyState === 'complete' || 
                (nestedIframeDoc.readyState === 'interactive' && (nestedIframeDoc.body || nestedIframeDoc.documentElement))) {
                console.log(`✅ nested iframe document ready, proceeding with injection`);
                this.createIframeInspector(nestedIframeDoc, nestedFrameInfo, nestedFrameInfo.parent);
            } else if (retryCount < maxRetries) {
                console.log(`nested iframe document not ready (${nestedIframeDoc.readyState}), waiting... retry ${retryCount + 1}`);
                
                setTimeout(() => {
                    this.waitForNestedIframeDocumentReady(nestedIframe, nestedFrameInfo, retryCount + 1);
                }, retryDelay);
            } else {
                console.log(`❌ Max retries reached for nested iframe document ready state`);
            }
        } catch (error) {
            console.log(`❌ Error waiting for nested iframe document ready: ${error.message}`);
            if (retryCount < maxRetries) {
                setTimeout(() => {
                    this.waitForNestedIframeDocumentReady(nestedIframe, nestedFrameInfo, retryCount + 1);
                }, retryDelay);
            }
        }
    }

    injectIntoNestedIframe(nestedIframe, nestedFrameId, parentFrameInfo) {
        try {
            console.log(`Trying to inject into nested iframe:`, nestedIframe.name || nestedIframe.id || 'unnamed');
            console.log(`Nested iframe parent:`, parentFrameInfo.name);
            
            // Check if nested iframe is accessible (same-origin)
            if (nestedIframe.contentDocument) {
                const nestedIframeDoc = nestedIframe.contentDocument;
                console.log(`Nested iframe contentDocument accessible:`, !!nestedIframeDoc);
                console.log(`Nested iframe document readyState:`, nestedIframeDoc.readyState);
                
                // Set frame context for this nested iframe
                const nestedFrameInfo = {
                    id: nestedFrameId,
                    name: nestedIframe.name || nestedIframe.id || `nested-frame-${nestedFrameId}`,
                    src: nestedIframe.src || 'srcdoc',
                    selector: this.generateCSSSelector(nestedIframe),
                    parent: parentFrameInfo // Set parent frame reference
                };

                // Create a new inspector instance for the nested iframe
                this.createIframeInspector(nestedIframeDoc, nestedFrameInfo, parentFrameInfo);
                
                console.log(`✅ Successfully injected locator inspector into nested iframe: ${nestedFrameInfo.name}`);
                return true;
            } else {
                console.log(`❌ Cannot access nested iframe content (cross-origin or not ready): ${nestedIframe.src || 'srcdoc'}`);
                return false;
            }
        } catch (error) {
            console.log(`❌ Failed to inject into nested iframe: ${error.message}`);
            return false;
        }
    }

    handleIframeMouseOver(e, frameInfo) {
        console.log(`Iframe mouse over: ${frameInfo.name}, element:`, e.target.tagName, e.target.id || e.target.className);
        
        this.frameContext = frameInfo;
        this.hoveredElement = e.target;
        
        // Add highlight to iframe element
        this.addHighlight(e.target);
        
        // Show tooltip with iframe context
        this.showTooltip(e);
    }

    handleIframeClick(e, frameInfo) {
        console.log(`Iframe click: ${frameInfo.name}, element:`, e.target.tagName, e.target.id || e.target.className);
        
        // Only intercept clicks with modifier keys - allow normal iframe interactions
        if (e.ctrlKey || e.altKey || e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            
            this.frameContext = frameInfo;
            const locators = this.generateIframeLocators(e.target, frameInfo);
            
            console.log(`Generated iframe locators:`, locators);
            
            if (e.ctrlKey) {
                this.copyToClipboard(locators.css);
                this.addToHistory(locators);
                this.showIframeCSSNotification(frameInfo);
            } else if (e.altKey) {
                this.copyToClipboard(locators.xpath);
                this.addToHistory(locators);
                this.showIframeXPathNotification(frameInfo);
            } else if (e.shiftKey) {
                this.showIframeLocatorOptions(locators, frameInfo);
            }
        }
        // Normal clicks in iframe proceed without interference
    }

    showIframeLocatorOptions(locators, frameInfo) {
        console.log(`
🖼️ iframe Element Locators (${frameInfo.name}):
CSS: ${locators.css}
XPath: ${locators.xpath}
iframe Selector: ${locators.iframeSelector || 'N/A'}

Quick Copy:
- Ctrl+Click: Copy CSS
- Alt+Click: Copy XPath
- Right-Click: Copy XPath
        `);
        
        this.showCopyNotification('iframe locators logged to console');
    }

    showIframeCSSNotification(frameInfo) {
        // Show enhanced notification for iframe CSS
        this.showCopyNotification('CSS (iframe element)');
        
        // Log additional context for iframe CSS usage
        console.log(`
🖼️ iframe CSS Usage Guide:
- Copied CSS: Works within iframe document context
- iframe selector: iframe[name='${frameInfo.name}']
- Frame switching required for automation:
  
Selenium: 
  driver.switch_to.frame('${frameInfo.name}')
  element = driver.find_element(By.CSS_SELECTOR, '${this.hoveredElement ? this.generateCSSSelector(this.hoveredElement) : 'copied-css'}')
  
Playwright:
  page.frame('${frameInfo.name}').locator('${this.hoveredElement ? this.generateCSSSelector(this.hoveredElement) : 'copied-css'}')
        `);
    }

    showIframeXPathNotification(frameInfo) {
        // Show enhanced notification for iframe XPath
        this.showCopyNotification('XPath (iframe element)');
        
        // Log additional context for iframe XPath usage
        console.log(`
🖼️ iframe XPath Usage Guide:
- Copied XPath: Works within iframe document context
- iframe locator: //iframe[@name='${frameInfo.name}']
- Frame switching required for automation:
  
Selenium: 
  driver.switch_to.frame('${frameInfo.name}')
  element = driver.find_element(By.XPATH, '${this.hoveredElement ? this.generateXPath(this.hoveredElement) : 'copied-xpath'}')
  
Playwright:
  page.frame('${frameInfo.name}').locator('xpath=${this.hoveredElement ? this.generateXPath(this.hoveredElement) : 'copied-xpath'}')
        `);
    }

    generateIframeLocators(element, frameInfo) {
        const baseLocators = this.generateLocators(element);
        
        console.log(`Generating iframe locators for frame: ${frameInfo.name}`);
        console.log(`Base locators:`, baseLocators);
        
        // Build frame path for iframe identification
        const framePath = this.buildFramePath(frameInfo);
        console.log(`Frame path: ${framePath}`);
        
        // For XPath, provide separate iframe and element locators
        const iframeXPath = this.buildIframeLocatorXPath(frameInfo);
        
        const iframeLocators = {
            css: baseLocators.css, // Element CSS only - works within iframe context
            cssNote: "CSS requires frame switching - use framework-specific methods",
            iframeSelector: framePath, // CSS to locate iframe element
            xpath: baseLocators.xpath, // Element XPath only - works within iframe context
            iframeLocator: iframeXPath, // XPath to locate the iframe itself
            frameSwitching: {
                selenium: `driver.switch_to.frame('${frameInfo.name}'); element = driver.find_element(By.CSS_SELECTOR, '${baseLocators.css}')`,
                playwright: `page.frame('${frameInfo.name}').locator('${baseLocators.css}')`,
                cypress: `cy.iframe('[name="${frameInfo.name}"]').find('${baseLocators.css}')`
            },
            note: "iframe content requires frame switching in automation tools"
        };
        
        console.log(`Final iframe locators:`, iframeLocators);
        return iframeLocators;
    }

    buildIframeLocatorXPath(frameInfo) {
        const frames = [];
        let currentFrame = frameInfo;
        
        // Build XPath to locate iframe elements (not content)
        while (currentFrame) {
            frames.unshift(`//iframe[@name='${currentFrame.name}']`);
            currentFrame = currentFrame.parent;
        }
        
        return frames.join('');
    }

    buildFramePath(frameInfo) {
        const frames = [];
        let currentFrame = frameInfo;
        
        // Build frame hierarchy from child to parent
        while (currentFrame) {
            frames.unshift(`iframe[name="${currentFrame.name}"]`);
            currentFrame = currentFrame.parent;
        }
        
        return frames.join(' ');
    }

    buildXPathFramePath(frameInfo) {
        // This method is deprecated - XPath cannot traverse iframe boundaries
        // Use buildIframeLocatorXPath for iframe element location
        // and regular XPath for element within iframe document
        console.warn('buildXPathFramePath is deprecated - use buildIframeLocatorXPath instead');
        return this.buildIframeLocatorXPath(frameInfo);
    }

    buildPlaywrightFramePath(frameInfo, baseSelector) {
        const frames = [];
        let currentFrame = frameInfo;
        
        // Build frame hierarchy from parent to child
        while (currentFrame) {
            frames.push(currentFrame.name);
            currentFrame = currentFrame.parent;
        }
        
        // Reverse to get parent -> child order
        frames.reverse();
        
        if (frames.length === 1) {
            return `page.frame('${frames[0]}').locator('${baseSelector}')`;
        } else {
            // For nested frames, chain the frame calls
            let result = `page.frame('${frames[0]}')`;
            for (let i = 1; i < frames.length; i++) {
                result += `.frame('${frames[i]}')`;
            }
            result += `.locator('${baseSelector}')`;
            return result;
        }
    }

    buildSeleniumFramePath(frameInfo, baseSelector) {
        const frames = [];
        let currentFrame = frameInfo;
        
        // Build frame hierarchy from parent to child
        while (currentFrame) {
            frames.push(currentFrame.name);
            currentFrame = currentFrame.parent;
        }
        
        // Reverse to get parent -> child order
        frames.reverse();
        
        let result = frames.map(frameName => `driver.switch_to.frame('${frameName}')`).join('; ');
        result += `; driver.find_element(By.CSS_SELECTOR, '${baseSelector}')`;
        return result;
    }

    // ================== SHADOW DOM SUPPORT ==================

    setupShadowDOMObserver() {
        // Watch for elements with shadow roots
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.shadowRoot) {
                        this.observeShadowRoot(node.shadowRoot, node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Check existing shadow roots
        this.traverseExistingShadowRoots(document.body);
    }

    traverseExistingShadowRoots(root) {
        if (root.shadowRoot) {
            this.observeShadowRoot(root.shadowRoot, root);
        }
        
        if (root.children) {
            Array.from(root.children).forEach(child => {
                this.traverseExistingShadowRoots(child);
            });
        }
    }

    observeShadowRoot(shadowRoot, shadowHost) {
        // Add event listeners to shadow DOM elements
        shadowRoot.addEventListener('mouseover', (e) => {
            if (this.isEnabled) {
                this.handleShadowMouseOver(e, shadowHost);
            }
        });
        
        shadowRoot.addEventListener('click', (e) => {
            if (this.isEnabled) {
                this.handleShadowClick(e, shadowHost);
            }
        });
    }

    handleShadowMouseOver(e, shadowHost) {
        this.shadowContext = {
            host: shadowHost,
            hostSelector: this.generateCSSSelector(shadowHost)
        };
        this.hoveredElement = e.target;
        this.addHighlight(e.target);
        this.showTooltip(e);
    }

    handleShadowClick(e, shadowHost) {
        // Only intercept clicks with modifier keys - allow normal shadow DOM interactions
        if (e.ctrlKey || e.altKey || e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            
            this.shadowContext = {
                host: shadowHost,
                hostSelector: this.generateCSSSelector(shadowHost)
            };
            
            const locators = this.generateShadowDOMLocators(e.target, this.shadowContext);
            
            if (e.ctrlKey) {
                this.copyToClipboard(locators.css);
                this.addToHistory(locators);
                this.showCopyNotification('CSS (Shadow DOM)');
            } else if (e.altKey) {
                this.copyToClipboard(locators.xpath);
                this.addToHistory(locators);
                this.showCopyNotification('XPath (Shadow DOM)');
            } else if (e.shiftKey) {
                this.showShadowLocatorOptions(locators, this.shadowContext);
            }
        }
        // Normal clicks in shadow DOM proceed without interference
    }

    showShadowLocatorOptions(locators, shadowContext) {
        console.log(`
🌑 Shadow DOM Element Locators:
CSS: ${locators.css}
XPath: ${locators.xpath}
Host: ${shadowContext.hostSelector}

Quick Copy:
- Ctrl+Click: Copy CSS
- Alt+Click: Copy XPath
- Right-Click: Copy XPath
        `);
        
        this.showCopyNotification('Shadow DOM locators logged to console');
    }

    generateShadowDOMLocators(element, shadowContext) {
        const elementSelector = this.generateCSSSelector(element);
        
        return {
            css: `${shadowContext.hostSelector}::shadow ${elementSelector}`,
            xpath: `//${shadowContext.hostSelector}//shadow-root//${elementSelector}`,
            framework: {
                playwright: `page.locator('${shadowContext.hostSelector}').locator('${elementSelector}')`,
                cypress: `cy.get('${shadowContext.hostSelector}').shadow().find('${elementSelector}')`
            }
        };
    }

    // ================== ENHANCED TOOLTIP WITH CONTEXT ==================

    getContextInfo() {
        let contextInfo = '';
        
        if (this.frameContext) {
            const frameHierarchy = this.buildFrameHierarchy(this.frameContext);
            contextInfo += `
                <div style="margin-bottom: 6px; padding: 4px 6px; background: #2d5aa0; border-radius: 4px;">
                    <span style="color: #90cdf4; font-weight: bold;">🖼️ iframe:</span>
                    <span style="color: #e2e8f0; font-size: 11px;">${frameHierarchy}</span><br>
                    <span style="color: #ffd700; font-size: 10px;">⚠️ XPath requires frame switching</span>
                </div>
            `;
        }
        
        if (this.shadowContext) {
            contextInfo += `
                <div style="margin-bottom: 6px; padding: 4px 6px; background: #553c9a; border-radius: 4px;">
                    <span style="color: #c4b5fd; font-weight: bold;">🌑 Shadow DOM:</span>
                    <span style="color: #e2e8f0; font-size: 11px;">${this.shadowContext.hostSelector}</span>
                </div>
            `;
        }
        
        return contextInfo;
    }

    buildFrameHierarchy(frameInfo) {
        const frames = [];
        let currentFrame = frameInfo;
        
        // Build frame hierarchy from child to parent
        while (currentFrame) {
            frames.unshift(currentFrame.name);
            currentFrame = currentFrame.parent;
        }
        
        return frames.join(' > ');
    }

    resetContexts() {
        this.frameContext = null;
        this.shadowContext = null;
    }
}

// Initialize the locator inspector
new LocatorInspector();
