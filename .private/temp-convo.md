Great! Let's get started with aligning how we collaborate:

- Anytime you need any of the files from our project structure just tell me.
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

---

Hey, why don't you check your answer and offer yourself some criticism?

---

We've been building a text template management application for storing and using templates with variable substitution (like LLM prompts, email templates). The app runs locally in Docker with a file-based backend and browser-based frontend.

The app_specification.md document provides the technical reference. Some parts are subject to change.

We collaborate together, with you, on the application design, architecture, ideas, and development. I'm open to any suggestions or ideas from your side. I expect you to give all your experiences about software engineering into it, I will give all of mine.

We have already done design and architecture and made several decisions during the first phases of our development. However, we've recently taken decision to change the current design. We've updated the `app_specification.md` document which now contains what is going to be changed. Here is the summary of our previous conversation and work:

<summary>

# Project Summary: Template Editor Redesign

## What We're Building

A local text template management application that allows users to create templates with variables (like `{{name}}` or `{{priority:high|medium|low}}`) and then fill those variables to generate customized content. Think LLM prompts, email templates, or code snippets that need dynamic values.

## Current State

We have a **working backend** (Node.js + file storage) and **basic frontend** with template CRUD operations. However, the UI uses a **tab-based interface** (Edit/Preview/Output tabs) that creates UX confusion and unnecessary complexity.

## The Problem with Current Design

1. **Tab confusion**: Users don't understand when to use Edit vs Preview vs Output
2. **Scattered workflow**: Template definition and template usage are mixed together
3. **Poor separation of concerns**: Edit tab shows both template creation AND variable filling
4. **Complex mental model**: Three overlapping purposes instead of clear distinct modes

## Our Design Solution: Single-Mode Interface

### Core Concept

**Two distinct modes with clear purposes:**

- **View Mode**: Use the template (fill variables, see results, copy output)
- **Edit Mode**: Define the template (edit title, content, description)

### Key Design Decisions

#### 1. **No More Tabs**

- **Why**: Eliminates cognitive overhead and workflow confusion
- **Instead**: Single content area that switches between view/edit modes
- **Benefit**: One mode = one clear purpose

#### 2. **Header Inline Editing**

- **Why**: Prevents jarring layout shifts when switching modes
- **How**: Title and category become editable directly in the header during edit mode
- **Benefit**: Smooth transitions, familiar UX pattern (like GitHub, Gmail)

#### 3. **Variables Panel Location Strategy**

- **View Mode**: Right panel shows **input fields** for filling variable values
- **Edit Mode**: Right panel shows **detected variables list** for validation
- **Why**: Same location, different purpose based on mode context
- **Benefit**: Consistent layout, clear visual feedback

#### 4. **Client-Side Variable Processing**

- **Why**: Real-time feedback without server round-trips
- **How**: Parse `{{variables}}` in browser, replace with values instantly
- **Benefit**: Better performance, offline capability

#### 5. **Variable Value Persistence**

- **Why**: Users often need to tweak values and see results
- **How**: Store variable values per template during session
- **Benefit**: No frustrating re-entry of data when switching modes

## Technical Architecture

### Variable System

```typescript
// Basic: {{name}} → text input
// Dropdown: {{priority:high|medium|low}} → select dropdown
// Unfilled variables remain as {{name}} in output
```

### Mode Switching

```
View Mode: [Template Title] [Category] [Edit] [Delete]
Edit Mode: [Title Input] [Category Select] [Save] [Cancel]
```

### Layout Structure

```
Sidebar (templates) | Main Content (view/edit) | Variables Panel (inputs/detection)
```

## Why This Design is Better

1. **Clear Mental Model**: Define vs Use - intuitive and matches real-world workflows
2. **Reduced Cognitive Load**: One mode = one purpose, no tab confusion
3. **Faster Workflow**: Fill variables → see results immediately → copy/use
4. **Familiar Patterns**: Matches modern app behavior (view/edit modes)
5. **Better Performance**: Real-time client-side processing
6. **Space Efficient**: No tab navigation overhead

## Implementation Impact

### Major Changes Required

- **Remove**: Entire tab system (HTML, CSS, TabManager component)
- **Redesign**: TemplateForm for view/edit modes instead of tabs
- **Add**: Variable parser for real-time detection and processing
- **Modify**: Header for inline editing capabilities
- **Update**: Variables panel for dual-purpose behavior

### What Stays the Same

- All backend APIs and data storage
- Template CRUD operations
- Sidebar template list
- Basic component architecture
- Event-driven state management

## Development Strategy

We have prepared a task list which will be provided to you.

**Bottom Line**: We're trading tab complexity for mode simplicity, resulting in a cleaner, more intuitive user experience that better matches how people actually think about templates - defining them vs using them.

</summary>

See the all existing files for frontend.

First, let yourself understand all of that. Then, if you need some clarification or something is unclear, ask me as many questions and needed to avoid wrong assumptions. If everything is clear, say so. And wait for my next input.

---

... answer questions

Go through my answers. If you still have any questions ask them. Either way, wait for my next instructions.

---

(attach task list)

Perfect!

Here is a task list we have previously crafted together for this transition. See it and let me know anything you might have, otherwise, let's begin with the Phase 3.

---

The view mode showing description and content is done. Inputs elements are enabled When user switches to edit mode. However, I would like to have description and content as other than input/textArea elements which are only disabled in view mode. This has two reasons. First, it can be styled when switching to edit mode the same way it's done for templateHeader's title and category. Second, I will be easier, in future advanced features, to split the text to chunks of text and a variable and highlight the variable by styling (since it's gonna be a separate element from any text chunk). For now, the raw text output is enough.
