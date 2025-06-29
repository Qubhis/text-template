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

## API Endpoints

### Templates

- `GET /api/templates` - List all templates
- `GET /api/templates/:id` - Get specific template
- `POST /api/templates` - Create new template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Categories

- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Template Processing

- `POST /api/templates/:id/process` - Process template with variables
- `POST /api/templates/:id/preview` - Generate preview

### Import/Export

- `GET /api/export` - Export all templates as ZIP
- `POST /api/import` - Import templates from ZIP/JSON
- `GET /api/templates/:id/export` - Export single template

## File System Structure

```
/app/
  src/
    backend/
      server.ts                          👈 T1.2 - Express server setup
      models/
        template.ts                      👈 T2.2 - Template data models & validation
        category.ts                      👈 T5.1 - Category data models
      services/
        templateService.ts               👈 T2.3 - Template CRUD operations
        categoryService.ts               👈 T5.2 - Category service operations
      utils/
        fileManager.ts                   👈 T2.1 - JSON file utilities
        templateParser.ts                👈 T4.1 - Variable parsing logic
      routes/
        templates.ts                     👈 T3.1-T3.5 - Template API endpoints
        categories.ts                    👈 T5.2-T5.4 - Category API endpoints
        processing.ts                    👈 T4.4 - Template processing endpoint
    frontend/
      index.html                         👈 T6.1 - Basic HTML layout
      styles/
        main.css                         👈 T6.2 - CSS styling
      scripts/
        main.ts                          👈 T7.1 - Frontend entry point
        templateManager.ts               👈 T8.1-T8.5 - Template list management
        variableParser.ts                👈 T10.1-T10.5 - Variable input generation
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

## Development Phases

### Phase 1: Foundation & Core Backend (T1-T2)

1. **Project Setup** (T1.1-T1.5) - Node.js, TypeScript, Express, Docker setup
2. **Data Layer** (T2.1-T2.4) - File utilities, data models, template service, error handling

### Phase 2: API Layer (T3-T4)

1. **Template API** (T3.1-T3.5) - CRUD endpoints for templates
2. **Processing Engine** (T4.1-T4.5) - Variable parsing and substitution

### Phase 3: Basic Frontend (T6-T8)

1. **UI Structure** (T6.1-T6.4) - HTML layout, CSS, basic styling
2. **Data Layer** (T7.1-T7.4) - API client, state management
3. **Template List** (T8.1-T8.5) - Sidebar with template management

### Phase 4: Core Features (T9-T11)

1. **Template Editor** (T9.1-T9.5) - Edit forms, save/delete functionality
2. **Variable System** (T10.1-T10.5) - Input generation, validation
3. **Preview & Output** (T11.1-T11.5) - Real-time preview, copy functionality

### Phase 5: Enhanced Features (T5, T12-T14)

1. **Categories** (T5.1-T5.5) - Category system implementation
2. **Enhanced Variables** (T12.1-T12.5) - Number, boolean, date types
3. **Import/Export** (T13.1-T13.5) - File import/export system
4. **Advanced UI** (T14.1-T14.5) - Tabs, shortcuts, advanced features

### Phase 6: Polish & Deployment (T15-T17)

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
