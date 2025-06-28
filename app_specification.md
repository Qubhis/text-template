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
      server.ts
      routes/
        templates.ts
        categories.ts
        processing.ts
      services/
        templateService.ts
        categoryService.ts
      utils/
        fileManager.ts
        templateParser.ts
    frontend/
      index.html
      styles/
        main.css
      scripts/
        main.ts
        templateManager.ts
        variableParser.ts
  data/                    # Docker volume mount point
    templates/             # Individual template JSON files
    categories.json        # Categories configuration
    backups/              # Automatic backups
```

## Docker Setup

```dockerfile
FROM node:22-alpine
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

### Phase 1: MVP (Core Features)

1. Basic template CRUD operations
2. Simple variable substitution (`{{variable}}`)
3. File-based storage
4. Basic UI with list and editor

### Phase 2: Enhanced UX

1. Categories and organization
2. Enhanced variable types
3. Real-time preview
4. Import/export functionality

### Phase 3: Advanced Features

1. Conditional logic
2. Template validation
3. Search and filtering
4. Backup/restore system

## Success Criteria

- Users can create, edit, and delete templates easily
- Variable substitution works reliably
- Data persists across container restarts
- Export/import works seamlessly
- UI is intuitive and responsive
- Application starts quickly and runs smoothly in Docker
