# ✅ Locator Rules Compliance Test

## Test Cases for Locator-Rules.mdc Compliance

### 🎯 Input Field Priority Test
**Expected Priority: Placeholder → ID → Name → Unique Class → Attributes**

1. **Test Input with Placeholder**
   ```html
   <input type="text" placeholder="Enter username" name="user" id="username-field">
   ```
   - ✅ **Expected CSS**: `[placeholder="Enter username"]`
   - ✅ **Expected XPath**: `//input[@placeholder="Enter username"]`
   - ✅ **Quality**: "Excellent (Placeholder)"

2. **Test Input without Placeholder (should prioritize ID)**
   ```html
   <input type="text" name="user" id="username-field">
   ```
   - ✅ **Expected CSS**: `#username-field`
   - ✅ **Expected XPath**: `//input[@id="username-field"]`
   - ✅ **Quality**: "Excellent (ID)"

3. **Test Input with only Name**
   ```html
   <input type="text" name="username">
   ```
   - ✅ **Expected CSS**: `[name="username"]`
   - ✅ **Expected XPath**: `//input[@name="username"]`
   - ✅ **Quality**: "Good (Name)"

### 🎯 Button Priority Test
**Expected Priority: ID → Name → Unique Class → Attributes**

1. **Test Button with ID**
   ```html
   <button id="submit-btn" class="btn-primary">Submit</button>
   ```
   - ✅ **Expected CSS**: `#submit-btn`
   - ✅ **Expected XPath**: `//button[@id="submit-btn"]`
   - ✅ **Quality**: "Excellent (ID)"

2. **Test Button with Text (should use XPath)**
   ```html
   <button class="btn">Login</button>
   ```
   - ✅ **Expected XPath**: `//button[text()="Login"]`
   - ✅ **Quality**: "Good (Text Content)"

### 🎯 Link Priority Test
**Expected Priority: ID → Href → Unique Class → Attributes**

1. **Test Link with ID**
   ```html
   <a href="/home" id="home-link">Home</a>
   ```
   - ✅ **Expected CSS**: `#home-link`
   - ✅ **Quality**: "Excellent (ID)"

2. **Test Link without ID (should use href)**
   ```html
   <a href="/profile">Profile</a>
   ```
   - ✅ **Expected CSS**: `[href="/profile"]`
   - ✅ **Quality**: "Good (Href)"

### 🎯 Uniqueness Validation Test

1. **Test Unique vs Non-Unique Selectors**
   - Tooltip should show "✓ UNIQUE" for selectors matching 1 element
   - Tooltip should show "⚠ NOT UNIQUE" for selectors matching multiple elements
   - Element count should be displayed: "Matches: X elements"

### 🎯 Quality Indicators Test

1. **Quality Ratings Should Display:**
   - "Excellent" for: ID, Placeholder, Test ID attributes
   - "Good" for: Name, Unique Class, Text Content
   - "Fair" for: Type Attribute, Attribute-based
   - "Poor" for: Position-based selectors

### 🎯 Framework Compatibility Test

1. **No jQuery Syntax**
   - ❌ Should NOT generate: `:contains("text")`
   - ❌ Should NOT generate: `:visible`, `:hidden`
   - ❌ Should NOT generate: `:eq(n)`
   - ✅ Should generate standard CSS and XPath only

## 🧪 Manual Testing Steps

1. **Install the updated extension**
2. **Navigate to a test page with various input types**
3. **Enable the inspector**
4. **Test each element type:**
   - Hover over input with placeholder
   - Verify placeholder is prioritized over ID/name
   - Check tooltip shows "Excellent (Placeholder)"
   - Verify uniqueness indicator
5. **Test buttons and links similarly**
6. **Verify framework compatibility**

## ✅ Expected Results

After the fixes:
- ✅ Input fields with placeholders show `[placeholder="..."]` as primary selector
- ✅ Uniqueness validation works and displays correctly
- ✅ Quality indicators help identify reliable vs fragile selectors
- ✅ Element type detection works for inputs, buttons, links, selects
- ✅ XPath generation follows element-specific priorities
- ✅ All generated selectors are framework-compatible (no jQuery syntax)

The extension now properly follows your locator-rules.mdc strategy! 🎯
