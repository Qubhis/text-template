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
- Categories/metadata stored in `/data/categories.json`
- Mounted Docker volume for persistence
- Built-in export/import via file operations

## Core Functionality

### 1. Template Management

- **Create** new templates with title and content
- **Edit** existing templates
- **Delete** templates (with confirmation dialog)
- **List** all templates in sidebar
- **Categorize** templates for organization

### 2. Variable System

- **Basic variables**: `{{variable}}` - generates text input
- **Dropdown variables**: `{{variable:option1|option2|option3}}` - generates dropdown
- **Enhanced variable types**:
    - `{{name:text}}` - text input (default)
    - `{{count:number}}` - number input
    - `{{enabled:boolean}}` - checkbox
    - `{{date:date}}` - date picker
- **Conditional logic**: Simple if/else blocks
    ```
    {{#if variable}}This shows when variable has value{{/if}}
    ```

### 3. Template Processing

- Real-time preview as variables are filled
- Support for Markdown formatting in templates
- Multiple output formats:
    - Formatted (Markdown rendered)
    - Plain text (Markdown syntax removed)
    - Raw (exact template output)

### 4. User Interface

- **Layout**: Resizable sidebar (templates list) + main content area
- **Sidebar** (~25% width, resizable):
    - Template list with categories
    - Create new template button
    - Category management
- **Main Area** (tabbed interface):
    - **Edit Tab**: Template editor with variable inputs
    - **Preview Tab**: Real-time formatted preview
    - **Output Tab**: Final text with copy button
- **Template Actions**:
    - Edit button (pencil icon)
    - Delete button (with confirmation)
    - Copy output button

## Data Models

### Template File Structure

```json
{
    "id": "unique-id",
    "title": "Template Title",
    "content": "Template content with {{variables}}",
    "category": "category-id",
    "created": "2025-06-28T10:00:00Z",
    "modified": "2025-06-28T10:00:00Z",
    "description": "Optional description",
    "tags": ["tag1", "tag2"]
}
```

### Categories File Structure

```json
{
    "categories": [
        {
            "id": "prompts",
            "name": "LLM Prompts",
            "color": "#3b82f6"
        },
        {
            "id": "emails",
            "name": "Email Templates",
            "color": "#10b981"
        }
    ]
}
```

## Template Processing Architecture

### Frontend-Only Processing (Client-Side)

- **Variable Parsing**: Extract `{{variables}}` from template text in browser
- **Real-Time Preview**: Instant updates as user types variable values
- **No Server Round-Trips**: All processing happens client-side for better performance
- **Offline Capability**: Template processing works without server connection

### Variable Types Supported

- **Basic variables**: `{{variable}}` - generates text input
- **Dropdown variables**: `{{variable:option1|option2|option3}}` - generates dropdown
- **Enhanced variable types**: `{{var:number}}`, `{{var:boolean}}`, `{{var:date}}`

### Processing Flow

1. **Parse Template**: Extract variables and their types from template content
2. **Generate Inputs**: Create appropriate input fields for each variable
3. **Real-Time Processing**: Replace variables with values as user types
4. **Output Formats**: Generate markdown, plain text, or raw output

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
      server.ts                            👈 T1.2 - Express server + T3 integration
      models/
        template.ts                      👈 T2.2 - Template data models & validation
        category.ts                      👈 T5.1 - Category data models
      services/
        templateService.ts               👈 T2.3 - Template CRUD operations
        categoryService.ts               👈 T5.2 - Category service operations
      utils/
        fileManager.ts                   👈 T2.1 - JSON file utilities
      routes/
        templates.ts                     👈 T3.1-T3.5 - Template API endpoints ✅
        categories.ts                    👈 T5.2-T5.4 - Category API endpoints
    frontend/
      index.html                         👈 T6.1 - Basic HTML layout
      styles/
        main.css                         👈 T6.2 - CSS styling
      scripts/
        main.ts                          👈 T7.1 - Frontend entry point
        templateManager.ts               👈 T8.1-T8.5 - Template list management
        templateParser.ts                👈 T10.1-T10.5 - Frontend variable parsing & processing
        variableInputs.ts                👈 T10.1-T10.5 - Variable input generation
  data/                                  👈 T2.5 - Data directory (Docker volume)
    templates/                           👈 Individual template JSON files
    categories.json                      👈 Categories configuration
```

## Docker Setup

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["npm", "start"]
```

## Future Enhancements

### Phase 2 Features

- **Template versioning** - Keep history of changes
- **Template sharing** - Export/import individual templates
- **Search functionality** - Full-text search across templates
- **Template validation** - Syntax checking for variables
- **Bulk operations** - Mass edit, delete, categorize

### Phase 3 Features

- **Collaboration** - Multi-user support
- **Template marketplace** - Share templates with community
- **Advanced conditionals** - More complex logic
- **Plugin system** - Custom variable types
- **API integrations** - Connect with external services

## Implementation Status

#### T1.1-T1.5: Project Setup

- **Status**: ✅ Completed
- **Implementation**: Node.js + Express + TypeScript project structure

#### T2.1: File System Utilities

- **Status**: ✅ Completed
- **Implementation**: `FileManager` class in `src/backend/utils/fileManager.ts`
- **Approach**:
    - Simple JSON file operations (read, write, delete, exists)
    - Template-specific path helpers (`getTemplatePath`, `getCategoriesPath`)
    - Directory auto-creation with `recursive: true`
    - Input validation for template IDs (alphanumeric, hyphens, underscores only)
    - Built-in directory initialization (data/, templates/, categories.json)

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

## Development Phases & Roadmap

### ✅ Phase 1: Foundation & Core Backend (COMPLETED)

1. **Project Setup** (T1.1-T1.5) - Node.js, TypeScript, Express, Docker setup
2. **Data Layer** (T2.1-T2.4) - File utilities, data models, template service, error handling

### ✅ Phase 2: API Layer (COMPLETED)

1. **Template API** (T3.1-T3.5) - CRUD endpoints for templates

### 🔄 Phase 3: Template Processing Engine (IN PROGRESS)

1. **Processing Engine** (T4.1-T4.5) - Variable parsing and substitution

### 📋 Phase 4: Basic Frontend (PLANNED)

1. **UI Structure** (T6.1-T6.4) - HTML layout, CSS, basic styling
2. **Data Layer** (T7.1-T7.4) - API client, state management
3. **Template List** (T8.1-T8.5) - Sidebar with template management

### 📋 Phase 4: Core Features (PLANNED)

1. **Template Editor** (T9.1-T9.5) - Edit forms, save/delete functionality
2. **Variable System** (T10.1-T10.5) - Input generation, validation
3. **Preview & Output** (T11.1-T11.5) - Real-time preview, copy functionality

### 📋 Phase 5: Enhanced Features (PLANNED)

1. **Categories** (T5.1-T5.5) - Category system implementation
2. **Enhanced Variables** (T12.1-T12.5) - Number, boolean, date types
3. **Import/Export** (T13.1-T13.5) - File import/export system
4. **Advanced UI** (T14.1-T14.5) - Tabs, shortcuts, advanced features

### 📋 Phase 6: Polish & Deployment (PLANNED)

1. **Error Handling** (T15.1-T15.5) - Validation, user feedback
2. **Testing** (T16.1-T16.5) - Unit tests, integration tests
3. **Production** (T17.1-T17.5) - Docker optimization, deployment

## Success Criteria

- Users can create, edit, and delete templates easily
- Variable substitution works reliably
- Data persists across container restarts
- Export/import works seamlessly
- UI is intuitive and responsive
- Application starts quickly and runs smoothly in Docker
