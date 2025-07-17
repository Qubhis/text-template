# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Specification

see file @docs/app_specification.md for application information. Note,this is a living document, and some parts doesn't have to be up to date.

## Development Commands

### Development

- `npm run type-check` - Run TypeScript type checking for both frontend and backend
- `npm run type-check:backend` - Type check backend only
- `npm run type-check:frontend` - Type check frontend only
- `npm run test` - Run frontend test suite
- `npm run validate` - Run type-check + lint + test (comprehensive validation)
- `npm run dev` - Build and start development server
- `npm run dev:watch` - Auto-reload development server (watches src/ for changes)
- `npm run start` - Start production server (requires build first)
- `npm run clean` - Remove dist directory

### Build Commands

- `npm run build` - Production build (backend + frontend + cleanup)
- `npm run build:dev` - Development build (backend + frontend)
- `npm run build:backend` - Build backend only (TypeScript compilation)
- `npm run build:frontend` - Build frontend only (Vite bundling with sourcemaps)

## Code Guidelines

- Use comments sparingly. Only comment complex code.

## Workflow

- You work in a smart way:
    1. You work carefully, incrementally, and considering every aspect and decision for your task.
    2. When you are done with a change, you check your work and offer yourself some criticism
    3. if you find some inconsistencies or mistakes, you immediately fix them
    4. you repeat step 1., 2., and step 3. until you cannot find any inconsistencies or mistakes, and until you are done with completing the whole task
    5. you output the final version of your work.
- anytime during your working (smart way) you realize you need my answers and clarification, you stop and ask me. Then, If my answer or decision is enough, you continue where you left off and still work in the smart way.
- refrain from creating methods which are not needed immediately and only create what is needed to complete the task.
- follow KISS principle
- reserve time to make refactoring to keep code readable, modular, and maintainable.
- if you are unsure, stop, take a moment, ask yourself questions to find a way, ask me for an opinion or decision.
- you utilize a temporary file for storing a task list you create during the planning phase.
- anytime you find the task list needs to be updated with the tasks (steps), you explain why and request my approval.
- use scratchpad in a markdown file stored in the root of the project
