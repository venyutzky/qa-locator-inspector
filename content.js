// QA Locator Inspector - Content Script
class LocatorInspector {
    constructor() {
        this.isEnabled = false;
        this.hoveredElement = null;
        this.tooltip = null;
        this.locatorHistory = [];
        this.modifierPressed = false;
        this.init();
    }

    init() {
        this.createTooltip();
        this.bindEvents();
        this.loadSettings();
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
                sendResponse({enabled: this.isEnabled});
            }
        });
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        if (!this.isEnabled) {
            this.hideTooltip();
            this.removeHighlight();
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
        
        e.preventDefault();
        e.stopPropagation();
        
        const locators = this.generateLocators(e.target);
        const elementType = this.getElementType(e.target);
        
        // Enhanced XPath copy functionality for all elements
        if (e.ctrlKey || e.altKey) {
            // Ctrl+Click or Alt+Click copies XPath for any element
            this.copyToClipboard(locators.xpath);
            this.addToHistory(locators);
            this.showCopyNotification('XPath');
        } else {
            // Regular click copies CSS selector
            this.copyToClipboard(locators.css);
            this.addToHistory(locators);
            this.showCopyNotification('CSS');
        }
    }

    handleRightClick(e) {
        if (!this.isEnabled) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // Right-click copies XPath for any element
        const locators = this.generateLocators(e.target);
        this.copyToClipboard(locators.xpath);
        this.addToHistory(locators);
        this.showCopyNotification('XPath');
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
                modeIndicator.textContent = '🎯 XPath Mode (Ctrl/Alt+Click)';
                modeIndicator.style.color = '#9f7aea';
            }
        }
    }

    updateTooltipForCSSMode() {
        if (this.tooltip && this.tooltip.style.display !== 'none') {
            // Reset to CSS mode indicator
            const modeIndicator = this.tooltip.querySelector('.mode-indicator');
            if (modeIndicator) {
                modeIndicator.textContent = '🎯 CSS Mode (Click)';
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
        const locators = this.generateLocators(e.target);
        const cssUnique = this.isUniqueSelector(locators.css);
        const elementType = this.getElementType(e.target);
        
        // Get locator quality info
        const cssQuality = this.getLocatorQuality(locators.css, elementType);
        const xpathQuality = this.getXPathQuality(locators.xpath);
        
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
        
        this.tooltip.innerHTML = `
            <div style="margin-bottom: 8px; font-weight: bold; color: #ffd93d;">
                ${elementType === 'text' ? '📝' : '🎯'} ${elementType === 'text' ? 'Text Assertion' : 'Element Locators'} (${elementType})
            </div>
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
                🎯 CSS Mode (Click)
            </div>
            <div style="margin-top: 4px; font-size: 10px; color: #a0aec0;">
                Click: CSS • Ctrl/Alt+Click: XPath • Right-click: XPath • Matches: ${document.querySelectorAll(locators.css).length} elements
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
}

// Initialize the locator inspector
new LocatorInspector();
