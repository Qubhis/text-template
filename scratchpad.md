# Theme Color Changer Feature - Development Plan

## Overview

Implementation of a comprehensive theme color changer that replaces the current dark/light toggle with a Material Design 3 settings dialog allowing users to switch between different color themes and dark/light modes.

## Current State Analysis

**✅ What we have:**

- Material Design 3 color system with CSS custom properties in `color-palette.css`
- Dark/light mode switching using `data-theme="dark|light"` attribute
- Existing button system (`.btn`, `.btn-primary`, etc.) and modal system
- `OutlinedTextField` component that can work as a select dropdown
- Current theme toggle button with emoji icons in `index.html:11-13`

**🔄 What we need to build:**

- Replace current theme button with MD3 Icon Button + settings wheel SVG
- Create theme settings dialog with dark/light toggle + color theme dropdown
- Multiple color theme palettes (extend current single yellow/brown palette)
- Enhanced theme management system

---

## Task Breakdown

### **Phase 1: Icon & Button Components**

#### **T1.1 - Create SVG Settings Wheel Icon** `[PENDING]`

- Create reusable SVG settings/gear wheel icon
- Material Design 3 specifications (24x24dp)
- Store as inline SVG
- **Requirements**: SVG with proper viewBox, currentColor fill
- **Files to modify**: None, we will provide the SVG directly in the index.html once we have the button. Store it in this scratchpad until we are at the right task.
- **SVG definition**: `<svg-definition-here>`

#### **T1.2 - Implement MD3 Icon Button Component** `[PENDING]`

- Create icon button following Material Design 3 specs
- Reuse existing `.btn` system but create `.btn-icon` variant
- 40x40dp container height, proper hover/focus state
- Button should be transparent as it will be placed in the top right corner and serves as settings menu button
- **Requirements**: Extends current button system, accessibility support
- **Files to modify**: `/src/frontend/styles/main.css`

### **Phase 2: Dialog & Theme Management**

#### **T2.1 - Create Theme Settings Dialog Component** `[PENDING]`

- Build dialog using existing modal system as base
- Include dark/light mode toggle (replace current emoji button functionality)
- Include color theme dropdown using `OutlinedTextField` as select
- **Requirements**:
    - Reuses and update existing `.modal` classes and follows MD3 specification stored in `src/frontend/components/basic-dialogs/specification.md` (note that some css variables are already existing so check `color-palette.css` and `material-design-dp-variables.css` before creating any new.)
- **Files to create**: `/src/frontend/scripts/ui/themeSettingsDialog.ts`

#### **T2.2 - Implement Theme Management Service** `[PENDING]`

- Create `ThemeManager` class to handle all theme operations
- Methods: `setLightMode()`, `setDarkMode()`, `setColorTheme()`, `getCurrentTheme()`
- Handle localStorage persistence
- **Requirements**: TypeScript class, event emission for theme changes
- **Files to create**: `/src/frontend/scripts/core/themeManager.ts`

### **Phase 3: Color Theme System**

#### **T3.1 - Define Additional Color Palettes** `[PENDING]`

- **APPROACH:** Separate CSS files for each color theme (e.g., `color-palette-blue.css`, `color-palette-green.css`)
- **TEMPLATE PROVIDED:** `color-palette-template.css` - copy this for each theme
- **USER GENERATES:** Multiple theme files using the template structure
- **PROCESS:** 
  1. Copy `color-palette-template.css` → `color-palette-[THEME_NAME].css`
  2. Replace `"THEME_NAME"` with actual theme name (blue, green, etc.)
  3. Replace all RGB values with theme-specific colors
  4. Import in `main.css`: `@import url("./color-palette-[THEME_NAME].css");`
- **Requirements**: Each theme file targets `[data-color-theme="THEME_NAME"]` selector
- **Files to create**: `/src/frontend/styles/color-palette-blue.css`, etc.

#### **T3.2 - Update CSS Import Structure** `[PENDING]`

- Add `data-color-theme="yellow"` selector to current `color-palette.css` for consistency
- Import all theme CSS files in `main.css`
- Update ThemeManager to handle separate theme files
- Maintain backward compatibility (default to yellow theme)
- **Requirements**: CSS import system, default theme fallback
- **Files to modify**: `/src/frontend/styles/main.css`, `/src/frontend/styles/color-palette.css`

### **Phase 4: Integration & Testing**

#### **T4.1 - Replace Current Theme Toggle** `[PENDING]`

- Remove current emoji button and inline script from `index.html`
- Replace with new MD3 icon button
- Wire up to open theme settings dialog
- **Requirements**: Clean removal of old code, proper event handling
- **Files to modify**: `/src/frontend/index.html`

#### **T4.2 - Wire Dialog Interactions** `[PENDING]`

- Connect dialog controls to `ThemeManager`
- Real-time theme preview as user selects options
- Proper dialog open/close/cancel behavior
- **Requirements**: Event handling, state management
- **Files to modify**: Theme dialog component, main app initialization

#### **T4.3 - Enhanced Theme Persistence** `[PENDING]`

- Store both `mode` (dark/light) and `colorTheme` (yellow/blue/etc) in localStorage
- Load saved preferences on app startup
- **Requirements**: localStorage schema, initialization logic
- **Files to modify**: `ThemeManager.ts`, main app initialization

#### **T4.4 - Cross-Component Testing** `[PENDING]`

- Test theme switching affects all UI components
- Verify template content, buttons, modals, inputs all respond to theme changes
- Test theme persistence across browser sessions
- **Requirements**: Manual testing plan, edge case validation

---

## Technical Requirements Summary

### **Components to Create:**

- `SettingsIcon` component or inline SVG
- `.btn-icon` CSS variant
- `ThemeSettingsDialog.ts` component
- `ThemeManager.ts` service class

### **What We'll Reuse:**

- Existing `.btn` and `.modal` styling systems
- `OutlinedTextField` component for the dropdown
- Current CSS custom property system
- Existing `localStorage` theme persistence pattern

### **Key Files to Modify:**

- `/src/frontend/index.html` - Replace theme button
- `/src/frontend/styles/main.css` - Add icon button styles
- `/src/frontend/styles/color-palette.css` - Multi-theme support
- `/src/frontend/scripts/main.ts` - Initialize new theme system

---

## Development Notes

### User Selection Context

User highlighted `--md-sys-color-surface-container` which suggests focus on dialog background colors for the theme settings dialog.

### Current Theme Implementation Location

- Theme toggle functionality: `index.html:130-153`
- Theme button HTML: `index.html:11-13`
- Color variables: `color-palette.css:4-119`

---

## Progress Tracking

**Completed Tasks:** 0/10
**In Progress:** Task breakdown documentation
**Next Steps:** Begin with T1.1 - SVG Settings Icon creation

---

_Last Updated: [Current Date]_
_Status: Planning Phase_
