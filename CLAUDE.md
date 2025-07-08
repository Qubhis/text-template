# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Specification

see file `docs/app_specification.md`

## Development Commands

### Build and Development

- `npm run build` - Full production build (frontend + backend)
- `npm run build:dev` - Development build without test removal
- `npm run dev` - Build and start development server
- `npm run start` - Start production server (requires build first)
- `npm run clean` - Remove dist directory

### Type Checking and Testing

- `npm run type-check` - Run TypeScript type checking for both frontend and backend
- `npm run type-check:backend` - Type check backend only
- `npm run type-check:frontend` - Type check frontend only
- `npm run test` - Run frontend test suite
- `npm run validate` - Run type-check + lint + test (comprehensive validation)

## Architecture Overview

### Technology Stack

- **Backend**: Node.js + Express + TypeScript (compiled to CommonJS)
- **Frontend**: Vanilla TypeScript + HTML/CSS (compiled to ES2020 modules)
- **Storage**: JSON files in filesystem (`/data/templates/`)
- **Deployment**: Docker container with volume mount

### Project Structure

- **Backend** (`src/backend/`): Express server with file-based data persistence
- **Frontend** (`src/frontend/`): Vanilla TypeScript with event-driven architecture
- **Data** (`/data/`): JSON file storage for templates (Docker volume)
- **Build** (`dist/`): Compiled output (backend as CommonJS, frontend as ES modules)

### Key Components

#### Backend Architecture

- **Server** (`server.ts`): Express server with route initialization and middleware
- **Services**: `TemplateService` (CRUD operations), `CategoryService` (predefined categories)
- **Models**: `Template` interface with validation (`TemplateValidator`, `TemplateUtils`)
- **Routes**: REST API endpoints with centralized error handling (`BaseRoute` pattern)
- **Utils**: `FileManager` for JSON file operations with Docker-aware error handling

#### Frontend Architecture

- **Event-Driven**: Components extend `EventProvider` for decoupled communication
- **State Management**: `DataManager` provides centralized template state with event notifications
- **UI Components**: Modular components for template list, editor, header, and variables
- **Variable System**: `VariableParser` handles `{{variable}}` and `{{variable:option1|option2}}` syntax
- **API Layer**: `ApiClient` provides typed HTTP client with error handling

#### Data Flow

1. **Templates**: Stored as individual JSON files in `/data/templates/`
2. **API**: RESTful endpoints under `/api/templates` and `/api/categories`
3. **State**: `DataManager` caches templates and emits events for UI updates
4. **Variables**: Parsed client-side with real-time processing in view mode

### Key Design Patterns

- **Dependency Injection**: Services injected into routes and components
- **Event-Driven UI**: Components communicate via events, not direct coupling
- **Type Safety**: Comprehensive TypeScript with validation throughout
- **Error Resilience**: Graceful handling of file system errors and API failures
- **Real-time Processing**: Client-side variable substitution without server round-trips

### Development Notes

- **TypeScript Configs**: Separate configs for backend (CommonJS) and frontend (ES modules)
- **File Storage**: Template IDs are filename-safe (alphanumeric + hyphens/underscores)
- **Docker Integration**: File manager includes Docker-specific error handling
- **Testing**: Frontend tests in `suite.test.ts` with utilities in `utils/` subdirectory
- **No Framework**: Frontend uses vanilla TypeScript with DOM manipulation utilities

### Variable System

Templates support two variable types:

- **Basic**: `{{variableName}}` - generates text input
- **Dropdown**: `{{variableName:option1|option2|option3}}` - generates select dropdown

Variables are:

- Parsed client-side with real-time validation
- Processed instantly as user types (view mode only)
- Persistent per template during session
- Cleared when switching templates or refreshing browser
