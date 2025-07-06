# Text Templates App - Task Breakdown

## Phase 1: Project Setup & Foundation ✅ COMPLETED

### 1. Project Infrastructure

- [x] **T1.1** - Initialize Node.js project with TypeScript configuration
- [x] **T1.2** - Set up Express server with basic middleware
- [x] **T1.3** - Create project folder structure
- [x] **T1.4** - Configure build scripts and development workflow
- [x] **T1.5** - Create Dockerfile and docker-compose for development

### 2. Data Layer Foundation ✅ COMPLETED

- [x] **T2.1** - Create file system utilities (read/write JSON files)
- [x] **T2.2** - Implement template data model and validation
- [x] **T2.3** - Create template file service (CRUD operations)
- [x] **T2.4** - Add error handling for file operations
- ~~**T2.5** - Create data directory initialization~~ _(Merged into T2.1)_

## Phase 2: Backend API ✅ COMPLETED

### 3. Core API Endpoints ✅ COMPLETED

- [x] **T3.1** - Implement GET /api/templates (list all templates)
- [x] **T3.2** - Implement GET /api/templates/:id (get single template)
- [x] **T3.3** - Implement POST /api/templates (create template)
- [x] **T3.4** - Implement PUT /api/templates/:id (update template)
- [x] **T3.5** - Implement DELETE /api/templates/:id (delete template)

## Phase 3: Frontend Foundation 🔄 IN PROGRESS

### 6. Basic UI Structure

- [x] **T6.1** - Create HTML layout with sidebar and main content area
- [x] **T6.2** - Implement CSS for responsive layout
- [x] **T6.3** - Add resizable sidebar functionality
- [x] **T6.4** - Create basic CSS styling and theme (The actual resize functionality will be implemented when we add the JavaScript in T7+ tasks.)

### 7. Frontend Data Layer

- [x] **T7.1** - Create API client service for backend communication
- [x] **T7.2** - Implement template data management (fetch, cache, update)
- [x] **T7.3** - Add error handling and loading states
- [x] **T7.4** - Create state management for current template
    - [x] Application initialization and dependency injection
    - [x] UI event listeners setup (tabs, search, navigation)
    - [x] Template list display structure
    - [x] Save template functionality (create/update)
    - [x] Load template into form when selected
    - [x] Form state management (dirty state, validation)
    - [x] Cancel/reset functionality

### 8. Template List (Sidebar)

- [x] **T8.1** - Display list of templates in sidebar (depends on T7.4 save functionality, needs move from main.ts)
- [x] **T8.2** - Add template selection functionality (depends on T7.4 load functionality, needs move from main.ts)
- [x] **T8.3** - Implement "Create New Template" button (already basic version in T7.4, needs move from main.ts)
- [ ] **T8.4** - Add category grouping in template list
- [x] **T8.5** - Add template search/filter functionality (basic version in T7.4, needs move from main.ts)

## Phase 4: Core Template Features

### 9. Template Editor

- [x] **T9.1** - Create template edit form (title, content, category) - , needs move from main.ts
- [x] **T9.2** - Implement save/cancel functionality - , needs move from main.ts
- [ ] **T9.3** - Add real-time variable detection and highlighting
- [x] **T9.4** - Create template deletion with confirmation dialog - , needs move from main.ts
- [x] **T9.5** - Add template metadata editing (description, tags) - , needs move from main.ts

### 10. Frontend Template Processing & Variable System

- [ ] **T10.1** - Create frontend variable parser (extract {{variables}} from text)
- [ ] **T10.2** - Generate input fields based on detected variables
- [ ] **T10.3** - Implement text input for basic variables
- [ ] **T10.4** - Add dropdown support for choice variables
- [ ] **T10.5** - Add variable validation and error display

### 11. Template Preview & Output

- [ ] **T11.1** - Implement real-time template processing (client-side)
- [ ] **T11.2** - Create real-time preview pane with variable substitution
- [ ] **T11.3** - Implement Markdown rendering for preview
- [ ] **T11.4** - Add plain text output mode
- [ ] **T11.5** - Create copy-to-clipboard functionality

## Phase 5: Enhanced Features

### 12. Categories System

- [-] **T12.1** - Create categories data model and file service
- [x] **T12.2** - Implement GET /api/categories endpoint
- [-] **T12.3** - Implement POST /api/categories (create category)
- [-] **T12.4** - Implement PUT/DELETE for categories
- [-] **T12.5** - Add category assignment to templates

### 13. Enhanced Variable Types

- [-] **T13.1** - Add number input type ({{var:number}})
- [-] **T13.2** - Add boolean/checkbox type ({{var:boolean}})
- [-] **T13.3** - Add date picker type ({{var:date}})
- [-] **T13.4** - Update variable parser for typed variables
- [-] **T13.5** - Add variable type validation

### 14. Import/Export System

- [ ] **T14.1** - Implement single template export (JSON download)
- [ ] **T14.2** - Create bulk export (ZIP with all templates)
- [ ] **T14.3** - Add single template import (JSON upload)
- [ ] **T14.4** - Implement bulk import with conflict resolution
- [ ] **T14.5** - Add import/export UI components

### 15. Advanced UI Features

- [x] **T15.1** - Add tabbed interface (Edit/Preview/Output)
- [ ] **T15.2** - Implement context menu for variable / conditional pasting to the content
- [-] **T15.2** - Implement keyboard shortcuts
- [-] **T15.3** - Add undo/redo functionality in editor
- [-] **T15.4** - Create template duplication feature
- [-] **T15.5** - Add drag-and-drop for template reordering

## Phase 6: Polish & Deployment

### 16. Error Handling & Validation

- [ ] **T16.1** - Add comprehensive client-side validation
- [ ] **T16.2** - Implement proper error boundaries and user feedback
- [ ] **T16.3** - Add loading states and progress indicators
- [ ] **T16.4** - Create user-friendly error messages
- [ ] **T16.5** - Add data backup/recovery mechanisms

### 17. Testing & Quality

- [ ] **T17.1** - Write unit tests for template parser
- [ ] **T17.2** - Add API endpoint tests
- [ ] **T17.3** - Create integration tests for file operations
- [ ] **T17.4** - Add frontend component tests
- [ ] **T17.5** - Performance testing and optimization

## Future Enhancements (Phase 7+)

### 18. Advanced Features

- [ ] **T18.1** - Implement conditional logic ({{#if}})
- [ ] **T18.2** - Add template versioning system
- [ ] **T18.3** - Create full-text search functionality
- [ ] **T18.4** - Add template sharing capabilities
- [ ] **T18.5** - Implement user preferences and settings

## Task Dependencies

**Critical Path:**
T1.1 → T1.2 → T1.3 → T2.1 → T2.2 → T2.3 → T3.1-T3.5 → T6.1-T6.2 → T7.1-T7.2 → T8.1-T8.2 → T9.1-T9.2 → T10.1-T10.2 → T11.1-T11.2

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

--- UI/UX redesign without tabs

## Implementation Plan: Single-Mode Template Editor

### Phase 1: Variable Parser Foundation

- [x] **1.1** Create `src/frontend/scripts/utils/variableParser.ts`
    - [x] Define `Variable` interface (name, type, options, defaultValue)
    - [x] Implement `parseVariables(content: string): Variable[]`
    - [x] Handle basic variables: `{{variableName}}`
    - [x] Handle dropdown variables: `{{name:option1|option2|option3}}`
    - [x] Add input validation for variable syntax
    - [x] Add unit tests for edge cases (malformed syntax, duplicates)

- [x] **1.2** Implement template processing logic
    - [x] Create `processTemplate(content: string, values: VariableValues): string`
    - [x] Replace filled variables with their values
    - [x] Keep unfilled variables as `{{variableName}}` in output
    - [x] Handle special characters and escaping properly

### Phase 2: Header Inline Editing

- [ ] **2.1** Modify `templateHeader.ts` for inline editing
    - [ ] Add edit mode state management
    - [ ] Convert title display to inline input field in edit mode
    - [ ] Convert category display to inline select in edit mode
    - [ ] Add CSS transitions for smooth mode switching
    - [ ] Handle Enter key to save, Escape key to cancel

- [ ] **2.2** Update header button logic
    - [ ] Move Save/Cancel buttons from form to header
    - [ ] Update button visibility based on mode (view: Edit+Delete, edit: Save+Cancel)
    - [ ] Connect header Save button to template form save logic
    - [ ] Update button states and styling

### Phase 3: Content Area Redesign

- [ ] **3.1** Create view mode content display
    - [ ] Remove existing tab structure from HTML
    - [ ] Create new content layout for view mode
    - [ ] Add description display (when present)
    - [ ] Create scrollable processed template display area
    - [ ] Add CSS styling for clean content presentation

- [ ] **3.2** Modify edit mode content display
    - [ ] Keep form fields but remove title/category (now in header)
    - [ ] Remove Save/Cancel buttons from form (now in header)
    - [ ] Adjust form layout for remaining fields
    - [ ] Ensure proper focus management in edit mode

### Phase 4: Variables Panel Redesign

- [ ] **4.1** Create variable state management
    - [ ] Add variable values storage in TemplateForm component
    - [ ] Implement variable value persistence per template
    - [ ] Add Reset Values functionality
    - [ ] Handle variable value changes and template updates

- [ ] **4.2** Build view mode variables panel
    - [ ] Create dynamic input field generation from parsed variables
    - [ ] Implement text input for basic variables
    - [ ] Implement dropdown for choice variables
    - [ ] Add real-time template processing on value changes
    - [ ] Add Reset Values button and functionality

- [ ] **4.3** Build edit mode variables panel
    - [ ] Create read-only detected variables list
    - [ ] Add visual indicators for variable validation
    - [ ] Show variable type and options (for dropdowns)
    - [ ] Add "No variables detected" state

### Phase 5: Template Form Integration

- [ ] **5.1** Modify `templateForm.ts` for new layout
    - [ ] Remove tab-related logic
    - [ ] Add mode switching between view/edit
    - [ ] Integrate variable parser for real-time detection
    - [ ] Connect header buttons to form operations
    - [ ] Handle variable value state management

- [ ] **5.2** Update form validation and saving
    - [ ] Adapt validation for inline header editing
    - [ ] Update save operation to handle header + content data
    - [ ] Ensure proper error handling and user feedback
    - [ ] Maintain existing CRUD operations compatibility

### Phase 6: CSS and Layout Updates

- [ ] **6.1** Update main CSS layout
    - [ ] Remove tab navigation styling
    - [ ] Update content area layout for single mode
    - [ ] Add smooth transitions between view/edit modes
    - [ ] Ensure responsive design works with new layout

- [ ] **6.2** Style variable panels and content areas
    - [ ] Style view mode content display
    - [ ] Style variable input fields and reset button
    - [ ] Style detected variables list for edit mode
    - [ ] Add proper scrolling and height management

### Phase 7: Integration and Testing

- [ ] **7.1** Update main.ts and component connections
    - [ ] Remove tab manager integration
    - [ ] Update component initialization for new layout
    - [ ] Test mode switching and state persistence
    - [ ] Verify all existing functionality still works

- [ ] **7.2** End-to-end testing and refinement
    - [ ] Test create, edit, delete template workflows
    - [ ] Test variable detection and value filling
    - [ ] Test responsive design and edge cases
    - [ ] Polish animations and user feedback

### Phase 8: Future Enhancements (Post-MVP)

- [ ] **8.1** Add copy functionality
    - [ ] Add copy button for processed template content
    - [ ] Implement multiple output formats (raw, markdown, plain text)
    - [ ] Add success notifications for copy operations

## Implementation Strategy

**Working approach:**

1. Start with Phase 1 (variable parser) - foundational and testable in isolation
2. Move to Phase 2 (header editing) - visible progress and UI improvement
3. Continue sequentially, testing each phase thoroughly
4. Each checkbox represents a focused, completable task
5. Pause after each phase for review and refinement

**Key decision points where we should pause and review:**

- After Phase 1: Variable parser API and test results
- After Phase 2: Header editing UX and feel
- After Phase 3: Content layout and transitions
- After Phase 5: Overall mode switching behavior

This plan follows the smart way: incremental progress, frequent validation, and opportunities for course correction.
