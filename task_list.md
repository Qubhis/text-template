# Text Templates App - Task Breakdown

## Phase 1: Project Setup & Foundation

### 1. Project Infrastructure

- [x] **T1.1** - Initialize Node.js project with TypeScript configuration
- [x] **T1.2** - Set up Express server with basic middleware
- [x] **T1.3** - Create project folder structure
- [x] **T1.4** - Configure build scripts and development workflow
- [x] **T1.5** - Create Dockerfile and docker-compose for development

### 2. Data Layer Foundation

- [ ] **T2.1** - Create file system utilities (read/write JSON files)
- [ ] **T2.2** - Implement template data model and validation
- [ ] **T2.3** - Create template file service (CRUD operations)
- [ ] **T2.4** - Add error handling for file operations
- [ ] **T2.5** - Create data directory initialization

## Phase 2: Backend API

### 3. Core API Endpoints

- [ ] **T3.1** - Implement GET /api/templates (list all templates)
- [ ] **T3.2** - Implement GET /api/templates/:id (get single template)
- [ ] **T3.3** - Implement POST /api/templates (create template)
- [ ] **T3.4** - Implement PUT /api/templates/:id (update template)
- [ ] **T3.5** - Implement DELETE /api/templates/:id (delete template)

### 4. Template Processing Engine

- [ ] **T4.1** - Create variable parser (extract {{variables}} from text)
- [ ] **T4.2** - Implement basic variable substitution
- [ ] **T4.3** - Add support for dropdown variables ({{var:opt1|opt2}})
- [ ] **T4.4** - Create POST /api/templates/:id/process endpoint
- [ ] **T4.5** - Add template validation (check for malformed variables)

### 5. Categories System

- [ ] **T5.1** - Create categories data model and file service
- [ ] **T5.2** - Implement GET /api/categories endpoint
- [ ] **T5.3** - Implement POST /api/categories (create category)
- [ ] **T5.4** - Implement PUT/DELETE for categories
- [ ] **T5.5** - Add category assignment to templates

## Phase 3: Frontend Foundation

### 6. Basic UI Structure

- [ ] **T6.1** - Create HTML layout with sidebar and main content area
- [ ] **T6.2** - Implement CSS for responsive layout
- [ ] **T6.3** - Add resizable sidebar functionality
- [ ] **T6.4** - Create basic CSS styling and theme

### 7. Frontend Data Layer

- [ ] **T7.1** - Create API client service for backend communication
- [ ] **T7.2** - Implement template data management (fetch, cache, update)
- [ ] **T7.3** - Add error handling and loading states
- [ ] **T7.4** - Create state management for current template

### 8. Template List (Sidebar)

- [ ] **T8.1** - Display list of templates in sidebar
- [ ] **T8.2** - Add template selection functionality
- [ ] **T8.3** - Implement "Create New Template" button
- [ ] **T8.4** - Add category grouping in template list
- [ ] **T8.5** - Add template search/filter functionality

## Phase 4: Core Template Features

### 9. Template Editor

- [ ] **T9.1** - Create template edit form (title, content, category)
- [ ] **T9.2** - Implement save/cancel functionality
- [ ] **T9.3** - Add real-time variable detection and highlighting
- [ ] **T9.4** - Create template deletion with confirmation dialog
- [ ] **T9.5** - Add template metadata editing (description, tags)

### 10. Variable Input System

- [ ] **T10.1** - Generate input fields based on detected variables
- [ ] **T10.2** - Implement text input for basic variables
- [ ] **T10.3** - Add dropdown support for choice variables
- [ ] **T10.4** - Create variable validation and error display
- [ ] **T10.5** - Add variable value persistence during session

### 11. Template Preview & Output

- [ ] **T11.1** - Create real-time preview pane
- [ ] **T11.2** - Implement Markdown rendering for preview
- [ ] **T11.3** - Add plain text output mode
- [ ] **T11.4** - Create copy-to-clipboard functionality
- [ ] **T11.5** - Add output format selection (markdown/plain/raw)

## Phase 5: Enhanced Features

### 12. Enhanced Variable Types

- [ ] **T12.1** - Add number input type ({{var:number}})
- [ ] **T12.2** - Add boolean/checkbox type ({{var:boolean}})
- [ ] **T12.3** - Add date picker type ({{var:date}})
- [ ] **T12.4** - Update variable parser for typed variables
- [ ] **T12.5** - Add variable type validation

### 13. Import/Export System

- [ ] **T13.1** - Implement single template export (JSON download)
- [ ] **T13.2** - Create bulk export (ZIP with all templates)
- [ ] **T13.3** - Add single template import (JSON upload)
- [ ] **T13.4** - Implement bulk import with conflict resolution
- [ ] **T13.5** - Add import/export UI components

### 14. Advanced UI Features

- [ ] **T14.1** - Add tabbed interface (Edit/Preview/Output)
- [ ] **T14.2** - Implement keyboard shortcuts
- [ ] **T14.3** - Add undo/redo functionality in editor
- [ ] **T14.4** - Create template duplication feature
- [ ] **T14.5** - Add drag-and-drop for template reordering

## Phase 6: Polish & Deployment

### 15. Error Handling & Validation

- [ ] **T15.1** - Add comprehensive client-side validation
- [ ] **T15.2** - Implement proper error boundaries and user feedback
- [ ] **T15.3** - Add loading states and progress indicators
- [ ] **T15.4** - Create user-friendly error messages
- [ ] **T15.5** - Add data backup/recovery mechanisms

### 16. Testing & Quality

- [ ] **T16.1** - Write unit tests for template parser
- [ ] **T16.2** - Add API endpoint tests
- [ ] **T16.3** - Create integration tests for file operations
- [ ] **T16.4** - Add frontend component tests
- [ ] **T16.5** - Performance testing and optimization

### 17. Production Setup

- [ ] **T17.1** - Optimize Docker image for production
- [ ] **T17.2** - Add health check endpoints
- [ ] **T17.3** - Create production configuration
- [ ] **T17.4** - Add logging and monitoring
- [ ] **T17.5** - Create deployment documentation

## Future Enhancements (Phase 7+)

### 18. Advanced Features

- [ ] **T18.1** - Implement conditional logic ({{#if}})
- [ ] **T18.2** - Add template versioning system
- [ ] **T18.3** - Create full-text search functionality
- [ ] **T18.4** - Add template sharing capabilities
- [ ] **T18.5** - Implement user preferences and settings

## Task Dependencies

**Critical Path:**
T1.1 → T1.2 → T1.3 → T2.1 → T2.2 → T2.3 → T3.1-T3.5 → T4.1-T4.4 → T6.1-T6.2 → T7.1-T7.2 → T8.1-T8.2 → T9.1-T9.2 → T10.1-T10.2 → T11.1-T11.2

**Parallel Work Opportunities:**

- Frontend CSS/styling can be done alongside backend API development
- Category system can be developed in parallel with core template features
- Enhanced variable types can be added after basic system works
- Import/export features are independent and can be added later

## Estimated Timeline

- **Phase 1-2 (Foundation + Backend):** ~1-2 weeks
- **Phase 3-4 (Frontend Core):** ~1-2 weeks
- **Phase 5 (Enhanced Features):** ~1 week
- **Phase 6 (Polish):** ~3-5 days
- **Total MVP:** ~4-6 weeks (part-time development)

## Next Steps

1. Start with **T1.1** - Initialize Node.js project
2. Work through Phase 1 and 2 to get a working backend
3. Create a simple frontend to test the API
4. Iterate and build features incrementally
