# Text Templates with Variables - Application Specification

## Overview

A simple web application for managing and using text templates with variable substitution. Primarily designed for reusable text snippets like LLM prompts, email templates, and code snippets that need dynamic content.

## Architecture

### Technology Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: Vanilla TypeScript + HTML/CSS (no framework)
- **Storage**: JSON files in filesystem
- **Deployment**: Docker container with volume mount

### Storage Strategy

- Templates stored as individual JSON files in `/data/templates/`
- Categories are pre-defined in the code (extensibility out of MVP scope)
- Mounted Docker volume for persistence
- Built-in export/import via file operations

## Core Functionality

### 1. Template Management

- **Create** new templates with title and content
- **Edit** existing templates with inline header editing (title/category) and form editing (description/content)
- **Delete** templates (with confirmation dialog)
- **List** all templates in sidebar
- **Categorize** templates for organization

### 2. Variable System

- **Basic variables**: `{{variable}}` - generates text input
- **Dropdown variables**: `{{variable:option1|option2|option3}}` - generates dropdown
- **Real-time detection**: Variables detected as user types in template content
- **Value persistence**: Variable values persist per template during session
- **Reset functionality**: Clear all variable values on demand via "Reset Values" button
- **Validation**: Variable names must be alphanumeric with underscores, no spaces
- **Conditional logic**: Simple if/else blocks
    ```
    {{#if variable}}This shows when variable has value{{/if}}
    ```

### 3. Template Processing

- Real-time processing as variables are filled in view mode
- Client-side template processing for better performance
- Unfilled variables remain as `{{variable}}` in output
- Support for malformed variable syntax with user-friendly error handling
- Copy functionality for processed template content (future phase)

### 4. User Interface

- **Layout**: Resizable sidebar (templates list) + main content area + variables panel
- **Sidebar** (~25% width, resizable):
    - Template list with search functionality
    - Create new template button
- **Header** (template information and actions):
    - **View Mode**: Template title (inline-editable) + category badge (inline-editable) + last modified + Edit/Delete buttons
    - **Edit Mode**: Title input field + category select dropdown + Save/Cancel buttons
- **Main Content Area** (central area):
    - **View Mode**: Description (if present) + processed template content (scrollable)
    - **Edit Mode**: Template editing form (description + content textarea only)
- **Variables Panel** (~25% width, right side):
    - **View Mode**: Dynamic input fields for detected variables + "Reset Values" button
    - **Edit Mode**: Read-only list of detected variables for validation + variable count
- **Mode Switching**:
    - Edit button switches to edit mode
    - Save/Cancel buttons in header control mode switching
    - Unsaved changes trigger confirmation modal
    - Variable values persist when switching modes for same template

## Data Models

### Template File Structure

```json
{
    "id": "unique-id",
    "title": "Template Title",
    "content": "Template content with {{variables}}",
    "categoryId": "category-id",
    "created": "2025-06-28T10:00:00Z",
    "modified": "2025-06-28T10:00:00Z",
    "description": "Optional description",
    "tags": ["tag1", "tag2"]
}
```

### Variable Data Structure

```typescript
interface Variable {
    name: string;
    type: "text" | "dropdown";
    options?: string[]; // for dropdown type
}

interface VariableValues {
    [variableName: string]: string;
}
```

## Template Processing Architecture

### Frontend-Only Processing (Client-Side)

- **Variable Parsing**: Extract `{{variables}}` from template text using regex patterns
- **Real-Time Processing**: Instant template updates as user fills variable values in view mode
- **No Server Round-Trips**: All processing happens client-side for better performance
- **Offline Capability**: Template processing works without server connection
- **Error Handling**: Graceful handling of malformed variable syntax

### Variable Types Supported

- **Basic variables**: `{{variable}}` - generates text input field
- **Dropdown variables**: `{{variable:option1|option2|option3}}` - generates select dropdown
- **Invalid syntax**: `{{}}`, `{{:}}`, `{{var:}}` - detected but marked as invalid

### Processing Flow

1. **Parse Template**: Extract variables and their types from template content
2. **Generate Inputs**: Create appropriate input fields for each variable in variables panel (view mode only)
3. **Real-Time Processing**: Replace variables with values as user types (view mode only)
4. **Preserve Unfilled**: Keep unfilled variables as `{{variable}}` in processed output

## HTML Structure Changes

### Current Structure (Being Removed)

```html
<!-- Tab Navigation -->
<nav class="tab-nav">
    <button class="tab-btn active" data-tab="edit">Edit</button>
    <button class="tab-btn" data-tab="preview">Preview</button>
    <button class="tab-btn" data-tab="output">Output</button>
</nav>

<!-- Tab Content -->
<div class="tab-content">
    <div class="tab-pane active" id="editTab">...</div>
    <div class="tab-pane" id="previewTab">...</div>
    <div class="tab-pane" id="outputTab">...</div>
</div>
```

### New Structure (Target Design)

```html
<!-- Header with inline editing -->
<header class="content-header">
    <div class="template-info">
        <!-- View mode: displays, Edit mode: inputs -->
        <h1 id="templateTitle" class="inline-editable">Template Title</h1>
        <div class="template-meta">
            <span id="templateCategory" class="category-badge inline-editable">Category</span>
            <span id="templateModified" class="last-modified">Modified date</span>
        </div>
    </div>
    <div class="template-actions">
        <!-- View mode: Edit + Delete, Edit mode: Save + Cancel -->
        <button class="btn btn-secondary" id="editTemplateBtn">Edit</button>
        <button class="btn btn-danger" id="deleteTemplateBtn">Delete</button>
    </div>
</header>

<!-- Single content area -->
<div class="main-content-area">
    <!-- View mode: processed template display -->
    <div id="viewContent" class="view-content">
        <p id="templateDescription" class="template-description"></p>
        <div id="processedTemplate" class="processed-template"></div>
    </div>

    <!-- Edit mode: template form -->
    <div id="editContent" class="edit-content hidden">
        <form class="template-form">
            <div class="form-group">
                <label for="templateDescriptionInput">Description (optional)</label>
                <input type="text" id="templateDescriptionInput" class="form-input" />
            </div>
            <div class="form-group">
                <label for="templateContent">Template Content</label>
                <textarea id="templateContent" class="form-textarea"></textarea>
            </div>
        </form>
    </div>
</div>

<!-- Variables Panel -->
<div class="variable-inputs-section">
    <h3>Variables</h3>
    <!-- View mode: input fields -->
    <div id="variableInputs" class="variable-inputs"></div>
    <button id="resetValuesBtn" class="btn btn-secondary btn-small">Reset Values</button>

    <!-- Edit mode: detected variables list -->
    <div id="detectedVariables" class="detected-variables hidden"></div>
</div>
```

## API Endpoints (Implemented)

### Templates API

- **Base URL**: `/api/templates`
- **Authentication**: None (local application)
- **Content-Type**: `application/json`

#### Response Format

```typescript
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    count?: number; // For list operations
}
```

#### Endpoints

- `GET /api/templates` - List all templates
    - **Response**: `{ success: true, data: Template[], count: number }`
- `GET /api/templates/:id` - Get template by ID
    - **Response**: `{ success: true, data: Template }`
    - **Errors**: 404 if not found, 400 if invalid ID
- `POST /api/templates` - Create new template
    - **Body**: `CreateTemplateInput`
    - **Response**: `{ success: true, data: Template, message: string }` (201)
    - **Errors**: 400 if validation fails
- `PUT /api/templates/:id` - Update template
    - **Body**: Partial `UpdateTemplateInput`
    - **Response**: `{ success: true, data: Template, message: string }`
    - **Errors**: 404 if not found, 400 if validation fails
- `DELETE /api/templates/:id` - Delete template
    - **Response**: `{ success: true, message: string }`
    - **Errors**: 404 if not found

## File System Structure - Planned

```
/app/
  src/
    backend/
      server.ts
      models/
        template.ts
        category.ts
      services/
        templateService.ts
        categoryService.ts
      utils/
        fileManager.ts                   👈 JSON file utilities
      routes/
        baseRoute.ts                     👈 Base class for routes
        templates.ts
        categories.ts
    frontend/
      index.html
      styles/
        main.css
      scripts/
        main.ts                          👈 Frontend entry point & app initialization - coordinator
        base/
          EventProvider.ts               👈 Abstract class for components emitting events
        core/
          apiClient.ts                   👈 API communication
          dataManager.ts                 👈 Data state management
          errorHandler.ts                👈 Error system, notifications
        ui/
          editor/
            templateHeader.ts            👈 Header with inline editing + mode-specific action buttons
            templateForm.ts              👈 Single-mode view/edit + variable state management
          templateEditor.ts              👈 State and orchestrator for templateHeader and templateForm
          templateList.ts                👈 Sidebar list + search + selection
          modalSystem.ts                 👈 Confirmation modals
          variablePanel.ts               👈 Right-Sidebar for variables
        utils/
          domHelpers.ts                  👈 DOM query utilities
          formatters.ts                  👈 Date/text formatting
          variableParser.ts              👈 NEW - Variable detection, parsing, and processing
  data/                                  👈 Data directory (Docker volume)
    templates/                           👈 Individual template JSON files
```

### Planned Breaking Changes

- **Removed**: `tabManager.ts` - No longer needed with single-mode interface
- **Modified**: `templateForm.ts` - Major restructure for view/edit modes
- **Modified**: `templateHeader.ts` - Added inline editing capabilities
- **Modified**: `main.ts` - Remove tab manager integration

## Future Enhancements (out of MVP scope)

### Phase 2 Features

- **Copy functionality** - Copy processed template output to clipboard with format options
- **Multiple output formats** - Raw, Markdown
- **Conditional logic** - Simple if/else blocks in templates
- **Template versioning** - Keep history of changes
- **Template sharing** - Export/import individual templates
- **Search functionality** - Full-text search across templates

## Implementation Status

#### T1.1-T1.5: Project Setup

- **Status**: ✅ Completed
- **Implementation**: Node.js + Express + TypeScript project structure; Docker setup

#### T2.1: File System Utilities

- **Status**: ✅ Completed
- **Implementation**: `FileManager` class in `src/backend/utils/fileManager.ts`
- **Approach**:
    - Simple JSON file operations (read, write, delete, exists)
    - Template-specific path helpers (`getTemplatePath`)
    - Directory auto-creation with `recursive: true`
    - Input validation for template IDs (alphanumeric, hyphens, underscores only)
    - Built-in directory initialization (data/, templates/)

#### T2.2: Template Data Models & Validation

- **Status**: ✅ Completed
- **Implementation**: Data models and validation in `src/backend/models/template.ts`
- **Approach**:
    - **Core Interfaces**: `Template`, `CreateTemplateInput`, `UpdateTemplateInput`, `Category`
    - **Validation Strategy**: `TemplateValidator` class with static methods and TypeScript type guards
    - **Utility Functions**: `TemplateUtils` for ID generation, template creation/updating
    - **ID Generation**: Title-based with timestamp suffix for uniqueness
    - **Timestamp Management**: Automatic created/modified ISO date strings
    - **Type Safety**: Comprehensive validation with detailed error messages

#### T2.3: Template Service (CRUD Operations)

- **Status**: ✅ Completed
- **Implementation**: `TemplateService` class in `src/backend/services/templateService.ts`
- **Approach**:
    - **Dependency Injection**: Takes `FileManager` instance in constructor
    - **Core Operations**: getAllTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate
    - **Error Resilience**: `getAllTemplates()` continues loading even if individual templates fail
    - **Validation Integration**: Uses `TemplateValidator` for all input/output validation
    - **Sorting**: Templates sorted by modification date (newest first)
    - **ID Collision Handling**: Automatic ID regeneration with timestamp suffix

#### T2.4: File System Error Handling

- **Status**: ✅ Completed
- **Implementation**: Enhanced error handling in `FileManager` class
- **Approach**:
    - **Centralized Error Processing**: `createFileSystemError()` method maps Node.js error codes to user-friendly messages
    - **Covered Error Types**: ENOENT, EACCES/EPERM, EBUSY, EISDIR/ENOTDIR, EMFILE/ENFILE
    - **Context-Aware Messages**: Include operation being performed in error messages
    - **Docker-Specific Guidance**: Special handling for permission issues common in Docker environments
    - **Graceful Degradation**: Expected scenarios (like deleting non-existent files) handled gracefully
    - **Operation Context**: All errors include what operation was being performed

#### T3.1-T3.5: Template API Endpoints

- **Status**: ✅ Completed
- **Implementation**: REST API routes in `src/backend/routes/templates.ts`
- **Approach**:
    - **Middleware-Based Architecture**: Reusable validation middleware (`validateTemplateId`, `validateRequestBody`)
    - **Centralized Error Handling**: `handleTemplateError()` function with proper HTTP status codes
    - **Async Error Wrapper**: `asyncHandler()` middleware for automatic error catching
    - **Consistent Response Format**: `ApiResponse<T>` interface for standardized JSON responses
    - **HTTP Status Constants**: `HTTP_STATUS` object for maintainable status codes
    - **Route Endpoints**:
        - `GET /api/templates` - List all templates with count
        - `GET /api/templates/:id` - Get single template by ID
        - `POST /api/templates` - Create new template (returns 201)
        - `PUT /api/templates/:id` - Update existing template
        - `DELETE /api/templates/:id` - Delete template
    - **Error Categories**: Proper 400/404/500 responses based on error type
    - **Dependency Injection**: TemplateService injected via factory function
    - **Server Integration**: Connected to Express server with service initialization

#### T4: Category Service & API endpoints

- **Status**: ✅ Completed
- **Implementation**: API Routes and service for predefined categories
- **Approach**: Constant values for categories for this MVP, defined in `src/backend/models/category.ts`

#### T6.1-T6.4: Basic UI Structure

- **Status**: 🔄 Major Update Required
- **Current**: Tab-based layout with Edit/Preview/Output tabs
- **Target**: Single-mode view/edit layout with inline header editing
- **Breaking Changes**: Complete HTML structure redesign, CSS layout changes, removal of tab system

#### T7.1-T7.3: Frontend Data Layer Foundation

- **Status**: ✅ Completed
- **Implementation**: API client, data manager, error handler with event-driven architecture

#### T7.4: Current Template State Management

- **Status**: 🔄 Update Required
- **Current**: Basic template CRUD with tab integration
- **Target**: Mode-based state management with variable value persistence

## Development Phases & Roadmap

### ✅ Phase 1: Foundation & Core Backend (COMPLETED)

1. **Project Setup** (T1.1-T1.5) - Node.js, TypeScript, Express, Docker setup
2. **Data Layer** (T2.1-T2.4) - File utilities, data models, template service, error handling

### ✅ Phase 2: API Layer (COMPLETED)

1. **Template API** (T3.1-T3.5) - CRUD endpoints for templates

### ✅ Phase 3: Frontend Foundation (COMPLETED)

1. **UI Structure** (T6.1-T6.4) - Basic layout and components (requires major update)
2. **Data Layer Foundation** (T7.1-T7.3) - API client, state management, error handling
3. **Current Template State** (T7.4) - Basic CRUD operations (requires update for new layout)

### 🔄 Phase 4: Template Editor Redesign (IN PROGRESS)

1. **Variable Parser Foundation** ✅ (T10.1) (COMPLETED)
    - [x] Create `variableParser.ts` with Variable interface and parsing logic
    - [x] Implement `parseVariables()` and `processTemplate()` functions
    - [x] Add validation for variable syntax and edge cases
    - [x] Unit tests for variable detection and processing

2. **Header Inline Editing** (T9.3-Header)
    - [x] Modify `templateHeader.ts` for inline editing capabilities
    - [x] Add edit mode state management to header
    - [x] Convert title/category to input fields in edit mode
    - [x] Move Save/Cancel buttons from form to header

3. **Content Area Redesign** (T9.3-Content)
    - [ ] Remove tab HTML structure and CSS
    - [x] Create view mode content display (description + processed template)
    - [x] Modify edit mode to show form without title/category
    - [ ] Add smooth transitions between view/edit modes
    - [ ] Implement scrollable content area

4. **Variables Panel Redesign** (T10.2-T10.5)
    - [ ] Create dynamic input field generation for view mode
    - [ ] Implement text inputs and dropdown selects for variables
    - [ ] Add "Reset Values" button and functionality
    - [ ] Create read-only detected variables list for edit mode
    - [ ] Handle variable value persistence per template
        - values are cleared when user switched between templates
        - values are cleared when browser refreshes
        - values persist only while the same template is selected

5. **Template Form Integration** (T9.1-T9.2)
    - [ ] Remove tab-related logic from TemplateForm
    - [ ] Add view/edit mode switching
    - [ ] Integrate variable parser for real-time detection
    - [ ] Connect header buttons to form operations
    - [ ] Maintain unsaved changes detection and modal flow

### 📋 Phase 5: CSS and Layout Updates (PLANNED)

1. **Remove Tab System CSS**
    - [ ] Remove `.tab-nav`, `.tab-btn`, `.tab-content`, `.tab-pane` styles
    - [ ] Update main content area layout for single mode
    - [ ] Add inline editing styles for header elements

2. **Single-Mode Layout Styling**
    - [ ] Style view mode content display area
    - [ ] Style edit mode form layout
    - [ ] Add smooth transitions between modes
    - [ ] Update variables panel styling for both modes

3. **Responsive Design Updates**
    - [ ] Update media queries for single-mode interface
    - [ ] Test and refine responsive behavior

### 📋 Phase 6: Integration and Testing (PLANNED)

1. **Component Integration**
    - [ ] Update `main.ts` to remove TabManager
    - [ ] Connect all components with new event flow
    - [ ] Test mode switching and state persistence
    - [ ] Verify all existing CRUD functionality

2. **End-to-End Testing**
    - [ ] Test create, edit, delete workflows
    - [ ] Test variable detection and value filling
    - [ ] Test responsive design and edge cases
    - [ ] Polish animations and user feedback

### 📋 Phase 7: Copy & Output System (PLANNED)

1. **Copy Functionality**
    - [ ] Add copy button for processed template content
    - [ ] Implement clipboard API integration
    - [ ] Add success notifications for copy operations
    - [ ] Handle copy errors gracefully

2. **Output Format Options**
    - [ ] Add format selector (raw, markdown, plain text)
    - [ ] Implement different output processing modes
    - [ ] Add format-specific copy functionality

### 📋 Phase 8: Enhanced Features (PLANNED)

1. **Single processing**:
    - [ ] **T14.1** - Implement single template export (JSON download)
    - [ ] **T14.3** - Add single template import (JSON upload)
    - [ ] **T14.5** - Add import/export UI components

2. **Bulk processing**:
    - [ ] **T14.2** - Create bulk export (ZIP with all templates)
    - [ ] **T14.4** - Implement bulk import with conflict resolution
    - [ ] **T14.6** - Extend import/export UI

## Success Criteria

- Users can create, edit, and delete templates with inline header editing
- Variable substitution works reliably with real-time feedback in view mode
- Mode switching (view/edit) provides smooth user experience without layout jarring
- Variable values persist when switching modes for the same template
- Data persists across container restarts
- UI is intuitive and responsive across desktop and mobile
- Application starts quickly and runs smoothly in Docker
- All existing functionality continues to work after redesign
