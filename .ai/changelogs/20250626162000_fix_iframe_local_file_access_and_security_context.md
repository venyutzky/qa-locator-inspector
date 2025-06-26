# Fix iframe Local File Access and Cross-Frame Security Issues

## Overview
Address iframe content access issues when testing with local files and enhance iframe detection for various security contexts.

## Issues Identified

### 1. Local File Protocol Restrictions
- **Problem**: Browsers prevent iframe `contentDocument` access when using `file://` protocol
- **Impact**: Extension cannot inject into iframes when testing locally
- **Solution**: Add fallback detection and messaging for local file restrictions

### 2. iframe Content Loading Verification
- **Problem**: Need better verification that iframe content is actually loaded and accessible
- **Impact**: Extension may attempt injection before iframe is ready
- **Solution**: Enhanced iframe readiness detection with multiple verification methods

### 3. Permission and Security Context Detection
- **Problem**: Various security contexts (file://, cross-origin, sandboxed) need different handling
- **Impact**: Users don't understand why iframe detection fails
- **Solution**: Clear detection and messaging for different security contexts

## Technical Implementation

### Enhanced iframe Access Detection
```javascript
// Comprehensive iframe access verification
function canAccessIframe(iframe) {
    try {
        // Test basic access
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return { accessible: false, reason: 'no-document' };
        
        // Test if we can read properties
        const readyState = doc.readyState;
        const hasElements = doc.body || doc.documentElement;
        
        return { 
            accessible: true, 
            readyState, 
            hasElements,
            protocol: doc.location?.protocol 
        };
    } catch (e) {
        if (e.name === 'SecurityError') {
            return { accessible: false, reason: 'security-error', error: e.message };
        }
        return { accessible: false, reason: 'unknown-error', error: e.message };
    }
}
```

### User-Friendly Error Messages
```javascript
// Provide context-specific guidance
function getIframeAccessGuidance(accessResult, iframe) {
    if (!accessResult.accessible) {
        switch (accessResult.reason) {
            case 'security-error':
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
}
```

### Local Development Server Recommendation
```javascript
// Detect file:// protocol and provide guidance
function checkLocalFileContext() {
    if (window.location.protocol === 'file:') {
        console.warn(`
🔧 QA Locator Inspector - Local File Detection
For iframe testing with local files, consider using a local development server:
- Python: python3 -m http.server 8000
- Node.js: npx serve .
- VS Code: Live Server extension
Then access via http://localhost:8000/test-standard-iframe.html
        `);
        return true;
    }
    return false;
}
```

## Changes Required

### 1. Enhanced iframe Access Verification
- Add comprehensive iframe accessibility checking
- Detect different types of access restrictions
- Provide specific error messages for each restriction type

### 2. Local File Protocol Detection
- Detect when extension is running on file:// protocol
- Show helpful guidance for local development setup
- Recommend local server for iframe testing

### 3. Improved User Feedback
- Show specific tooltips for inaccessible iframes
- Display iframe access status in extension popup
- Provide actionable guidance for different scenarios

### 4. Development Documentation
- Add section about local development setup
- Document iframe testing requirements
- Provide examples for different hosting scenarios

## Expected Outcomes

### For Local File Testing
- Clear warning about file:// protocol limitations
- Guidance to use local development server
- Better error messages explaining why iframe access fails

### For Cross-Origin iframes
- Proper detection of cross-origin restrictions
- Framework-specific guidance for iframe switching
- No console errors or failed injection attempts

### For Same-Origin iframes
- Reliable detection and injection
- Proper element highlighting and locator generation
- Robust handling of different iframe loading states

## Testing Strategy

### 1. Local File Testing
- Test with file:// protocol - should show helpful warnings
- Verify no JavaScript errors occur
- Confirm guidance messages appear in console

### 2. Local Server Testing
- Set up simple HTTP server (python3 -m http.server 8000)
- Test same files via http://localhost:8000
- Verify iframe injection works correctly

### 3. Cross-Origin Testing
- Test with external iframe sources
- Verify proper error detection and messaging
- Confirm no failed injection attempts

## Implementation Priority
1. **High**: Enhanced iframe access detection with proper error handling
2. **High**: Local file protocol detection and guidance
3. **Medium**: Improved user feedback and messaging
4. **Low**: Enhanced development documentation

## Success Criteria
- [ ] Clear error messages for different iframe access restrictions
- [ ] No JavaScript errors when iframe access is blocked
- [ ] Helpful guidance for local development setup
- [ ] Proper iframe injection when security context allows
- [ ] User understands why iframe access might fail
