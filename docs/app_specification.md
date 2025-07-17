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
- **Value persistence**: Variable values persist per template during session (cleared on template switch or refresh)
- **Reset functionality**: Clear all variable values on demand via "Reset Values" button
- **Validation**: Variable names must be alphanumeric with underscores, no spaces
- **Visual feedback**: Variables highlighted in template content during view mode

### 3. Template Processing

- Real-time processing as variables are filled in view mode with instant visual feedback
- Client-side template processing for better performance
- Variable highlighting in template content for better user experience
- Unfilled variables remain as `{{variable}}` in output
- Support for malformed variable syntax with user-friendly error handling
- Copy functionality for processed template content (future phase)

### 4. User Interface

- **Layout**: Resizable sidebar (templates list) + main content area + variables panel
- **Sidebar** (~25% width, resizable):
    - Template list with search functionality
    - Create new template button
- **Header** (template information and actions):
    - **View Mode**: Template title + category badge + last modified + Edit/Delete buttons
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
    - Smooth transitions between view and edit modes

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

### Client-Side Processing (Implemented)

- **Variable Parsing**: Extracts `{{variables}}` from template text using regex patterns
- **Real-Time Processing**: Provides instant template updates as users fill variable values in view mode
- **No Server Round-Trips**: All processing happens client-side for optimal performance
- **Offline Capability**: Template processing works without server connection
- **Error Handling**: Gracefully handles malformed variable syntax

### Supported Variable Types

- **Basic variables**: `{{variable}}` - generates text input field
- **Dropdown variables**: `{{variable:option1|option2|option3}}` - generates select dropdown
- **Invalid syntax**: `{{}}`, `{{:}}`, `{{var:}}` - detected but marked as invalid

### Processing Flow

1. **Parse Template**: Extract variables and their types from template content
2. **Generate Inputs**: Create appropriate input fields for each variable in variables panel (view mode)
3. **Real-Time Processing**: Replace variables with values as user types (view mode)
4. **Preserve Unfilled**: Keep unfilled variables as `{{variable}}` in processed output

## HTML Structure

### Implemented Single-Mode Interface

The application uses a single-mode interface with three main areas:

**Header with Inline Editing**

- View mode: Template title, category badge, modification date, Edit/Delete buttons
- Edit mode: Title input, category dropdown, Save/Cancel buttons

**Main Content Area**

- View mode: Template description (if present) + processed template content with variable highlighting
- Edit mode: Template editing form with description and content fields

**Variables Panel**

- View mode: Dynamic input fields for detected variables + Reset Values button
- Edit mode: Read-only list of detected variables for validation

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

## File System Structure

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
        fileManager.ts
      routes/
        baseRoute.ts
        templates.ts
        categories.ts
    frontend/
      index.html
      styles/
        main.css
      scripts/
        main.ts
        base/
          EventProvider.ts
        core/
          apiClient.ts
          dataManager.ts
          errorHandler.ts
        ui/
          editor/
            templateHeader.ts
            templateForm.ts
          templateEditor.ts
          templateList.ts
          modalSystem.ts
          variablePanel.ts
        utils/
          domHelpers.ts
          formatters.ts
          variableParser.ts
  data/
    templates/
```

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

- **Status**: ✅ Completed
- **Implementation**: Single-mode view/edit layout with inline header editing
- **Changes**: Complete HTML structure redesign, CSS layout changes, removal of tab system

#### T7.1-T7.3: Frontend Data Layer Foundation

- **Status**: ✅ Completed
- **Implementation**: API client, data manager, error handler with event-driven architecture

#### T7.4: Current Template State Management

- **Status**: ✅ Completed
- **Implementation**: Mode-based state management with variable value persistence

## Development Phases & Roadmap

### ✅ Phase 1: Foundation & Core Backend (COMPLETED)

1. **Project Setup** (T1.1-T1.5) - Node.js, TypeScript, Express, Docker setup
2. **Data Layer** (T2.1-T2.4) - File utilities, data models, template service, error handling

### ✅ Phase 2: API Layer (COMPLETED)

1. **Template API** (T3.1-T3.5) - CRUD endpoints for templates

### ✅ Phase 3: Frontend Foundation (COMPLETED)

1. **UI Structure** (T6.1-T6.4) - Single-mode layout with inline header editing
2. **Data Layer Foundation** (T7.1-T7.3) - API client, state management, error handling
3. **Current Template State** (T7.4) - Mode-based state management with variable persistence

### ✅ Phase 4: Template Editor Redesign (COMPLETED)

- Single-mode interface with view/edit modes
- Real-time variable detection and processing
- Inline header editing with smooth transitions
- Dynamic variables panel with input generation
- Variable value persistence per template session

### ✅ Phase 5: CSS and Layout Updates (COMPLETED)

- Removed tab system styling
- Single-mode layout with responsive design
- Smooth mode transitions and visual feedback

### ✅ Phase 6: Integration and Testing (COMPLETED)

- Component integration without TabManager
- End-to-end testing of redesigned interface
- Verified CRUD functionality and variable processing

### ✅ Phase 7: Copy & Output System (COMPLETED)

1. **Copy Functionality**
    - Added copy button to copy current template content with clipboard API integration
    - Success notifications for copy operations

### 📋 Phase 8: Enhanced Features (PLANNED)

0. **Security**:
    - [ ] sanitize user input to template content, description, title
    - [ ] sanitize user input for variable values
    - [ ] check owasp

1. **Single processing**:
    - [ ] Implement single template export (JSON download)
    - [ ] Add single template import (JSON upload)
    - [ ] Add import/export UI components

2. **Bulk processing**:
    - [ ] Create bulk export (ZIP with all templates)
    - [ ] Implement bulk import with conflict resolution
    - [ ] Add import/export elements to UI

3. **Switch to database instead of JSON**:
    - [ ] decide which database
        - I think postgres would be overkill
        - we need a lightweight database for storing template and effective and fast searching withing it

4. **Variable values persistence**:
    - [ ] Save filled values into temporary state
    - [ ] push the temporary state to persistent state (json data file/DB - the same as is for the template)
        - [ ] when users switched templates
        - [ ] regularly, after 3 seconds of inactivity - must be non-blocking and should be ignored in case of server error (but must be logged by server)
            - provide UI notification when state is changing and changed. But it should be small and non-disturbing. I can imagine small pulsing dot during processing and then shining when the save is done.
    - [ ] restore state into the variable panel
    - [ ] handle removed or changed variables between restorations - missing or changed type (text to dropdown or vice versa) should be silently ignored and removed from the state

5. **Search input in template list**: - [ ] a button to clear the search input - cross icon at the very right end of the input - [ ] enhance search to include category (search by name and not by id)

6. **Variables panel:** - the reset button should be placed in the sticky header and the text should be just clear or reset, should be small button

7. **Template Content**: - we do have styling for detected variables and when values are provided, but only in the view mode. Can we do the same for edit mode and highlight detected variables which has correct syntax (yellow as in the view mode), and which has incorrect syntax (red tone colors)?

8. **Testing and refinement of UI**
    - [ ] **Proper colors**:
        - [ ] e.g. background of a list should be different than elements in the list (e.g. template list background)
        - [ ] check all colors and styling, is it modern? Do we need to use pure white everywhere, can we differentiate between elements? is it visually pleasing?
        - [ ] Template description in view mode
            - maybe the grey background is not best?
        - [ ] Template form in edit view has currently white background and the inputs itself are white as well.
        - [ ] search input in template list color should be different from the containing container - e.g. background color of the container - white input on white background look bad

    - [ ] Test responsive design and edge cases

    - [ ] and refine responsive behavior

    - [ ] Polish animations and user feedback

    - [ ] Dark mode - can we use css variables and switch between dark and light (current) mode?

9. **Conditions on template content**
    - to display blocks if condition is met supporting only equal and non-equal operators
    - conditions would be highlighted with different color in the template content
    - should be also displayed in detected variables panel during edit mode when it's properly defined or when not
    - we should also define the conditional syntax - for know it's unknown.

10. **Output formatting**:
    - [ ] Implement different output processing modes to support rendering of markdown syntax
        - raw:
            - the text as it is defined
            - only variables are replaced with values if provided
            - everything else stays (if condition syntax)
        - plain text:
            - variables are visible even if no values are provided
            - if conditions are not visible
            - only text which satisfies if condition is visible
        - Markdown rendering:
            - behavior is same as for plain text
            - renders text to markdown.

### Advanced Features (nice to have, can be dropped)

1. **OPTION A - Plugin system for different syntaxes**:
    - this is for defining a different syntax (like for JIRA) to be able to render the output into that sytax
2. **OPTION B - Rich text editor for template content**:
    - to provide headings, ordered lists, bold, intalic, underlined text
    - and then have single syntax source which can be transformed (exported) to different syntax like markdown or JIRA markup, etc.
    - the syntax support would be like plugin system to provide translation from our unified syntax to the targeted syntax.

3. **Versioning system for templates**
    - support versions for templates
    - versions to be stored in database
    - we should provide a delete for a specific version
    - we should provide UI element for switching between versions
    - the last version is always loaded on UI as default

4. **Full text content search**:
    - user shoudl be able to search across all templates and their contents
    - by default only latest versions (if versioning is already implemented) are searched
    - we might provide an option to search across versions, but it seem unecessary and overkill at this moment
