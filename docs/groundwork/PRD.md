# Product Requirements Document (PRD)

## Decide Your Own Doom - Text Adventure Game Engine

---

## 1. Executive Summary

**Project Name:** Decide Your Own Doom  
**Type:** Web Application (React)  
**Core Functionality:** A game engine that parses markdown-like story files to render interactive choose-your-own-adventure text-based games with branching narratives and persistent game state.  
**Target Users:** Game designers, writers, and players who want to create or play branching narrative games.

---

## 2. Problem Statement

Currently, creating choose-your-own-adventure games requires custom coding for each story. There is no standardized, easy-to-use format for defining branching narratives with conditional logic, inventory items, and game flags. This project aims to solve that by providing:

- A simple markdown-like format for defining story nodes and choices
- A React-based engine to render and navigate these stories
- Support for variables, items, and flags to track player progress

---

## 3. Target Users

1. **Story Authors** - Writers who want to create branching narratives without coding
2. **Players** - End users who play the generated games
3. **Developers** - May extend the engine with custom features

---

## 4. Functional Requirements

### 4.1 Story File Format (Custom Markdown)

The core of this project is defining a markdown-like syntax for stories. Example:

```markdown
---
title: The Dark Cave
start: entrance
variables:
  has_torch: false
  gold_coins: 0
---

# entrance
You stand at the entrance of a dark cave. The air is cold and damp.

- [Enter the cave](cave_entrance)
- [Walk away](leave)

# cave_entrance
{if: has_torch}
You light your torch and venture deeper into the cave.
{else}
It's too dark to see anything. You need a light source.
{/if}

- [Go deeper](deep_cave)
- [Go back](entrance)

# deep_cave
You find a chest! You gain 10 gold coins.
{set: gold_coins += 10}

{if: gold_coins >= 10}
- [Buy a torch from merchant](merchant)
{/if}

- [Return to entrance](entrance)
```

**Required Syntax Features:**

| Feature | Syntax | Description |
|---------|--------|-------------|
| Scene ID | `# scene_id` | Unique identifier for a scene |
| Scene Text | (markdown content) | The narrative text displayed to the player |
| Choice | `- [Label](target_scene)` | Clickable option that leads to another scene |
| Variable Set | `{set: variable = value}` | Assign a value to a variable |
| Variable Modify | `{set: variable += value}` | Modify numeric variable |
| Conditional | `{if: condition}...{/if}` | Show content only if condition is true |
| Conditional Else | `{if: condition}...{else}...{/if}` | Show alternate content |
| Item Consumption | `- [Label](target_scene)[require: has_key]` | Choice only available if player has item |
| Item Removal | `- [Label](target_scene)[remove: has_key]` | Item is removed from inventory after choice |

**Supported Conditions:**
- Boolean: `has_torch`, `has_key`, etc.
- Comparisons: `gold_coins >= 10`, `health < 50`
- Combined: `has_torch AND gold_coins > 0`

### 4.2 Story Parser

- Parse multiple `.md` files from a designated stories directory
- Build a directed graph of scenes with transitions
- Extract and validate all scene references
- Validate story compatibility with engine version (see 4.5)
- Handle undefined scenes gracefully (show error)
- **Warning only** for circular scene references (not blocked - useful for hub scenes)

### 4.3 Game Engine (React)

**Core Features:**
1. **Scene Rendering** - Display current scene text with markdown support
2. **Choice Navigation** - Render clickable choices that transition between scenes
3. **Variable Management** - Track and update game state variables
4. **Conditional Rendering** - Show/hide content based on conditions
5. **Scene History** - Track visited scenes for "go back" functionality

**UI Components:**
- StoryDisplay - Renders the current scene text
- ChoiceList - Displays available choices
- InventoryPanel - Shows current items/flags (optional)
- SceneTitle - Displays scene name
- NavigationControls - Back/Restart buttons

### 4.4 Story Loader

- Load stories from a local directory (client-side) at runtime
- Support story selection menu if multiple stories exist
- Validate story structure on load

### 4.5 Engine Version Validation

Each story file declares its required engine version:

```markdown
---
title: My Story
engine: 1.0
start: intro
---
```

The engine provides a validation function that checks:
- Story declares required engine version
- All syntax features used are supported by the engine
- Returns warnings for circular references
- Returns errors for incompatible features

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

---

## 5. Technical Architecture

### 5.1 Tech Stack
- **Framework:** React 18+ with Vite
- **UI Library:** shadcn/ui (or similar)
- **State Management:** React Context + useReducer
- **Routing:** React Router (for story/scene URLs)
- **Markdown:** react-markdown for rendering text

### 5.2 File Structure
```
src/
├── components/
│   ├── GameEngine.tsx
│   ├── SceneDisplay.tsx
│   ├── ChoiceList.tsx
│   └── StoryLoader.tsx
├── lib/
│   ├── parser.ts        # Story markdown parser
│   ├── engine.ts        # Game state management
│   └── types.ts         # TypeScript interfaces
├── stories/             # Sample story files
└── App.tsx
```

### 5.3 Data Types

```typescript
interface Story {
  title: string;
  engine: string;
  start: string;
  variables: Record<string, number | boolean>;
  scenes: Record<string, Scene>;
}

interface Scene {
  id: string;
  content: string;
  choices: Choice[];
}

interface Choice {
  label: string;
  target: string;
  condition?: string;
  requires?: string[];    // Items needed to make this choice
  removes?: string[];     // Items consumed by this choice
  effects?: Effect[];
}

interface GameState {
  currentScene: string;
  variables: Record<string, number | boolean>;
  history: string[];
}
```

---

## 6. Non-Functional Requirements

1. **Performance** - Scene transitions should be instant (<100ms)
2. **Accessibility** - Support keyboard navigation for choices
3. **Responsive** - Works on mobile and desktop
4. **Error Handling** - Clear error messages for invalid story files
5. **Extensibility** - Easy to add new syntax features

---

## 7. Implementation Phases

### Phase 1: Core Engine (Week 1)
- Set up React project with Vite and shadcn
- Implement markdown parser for scene syntax
- Build basic scene rendering with choices

### Phase 2: Variable System (Week 1-2)
- Implement variable storage and updates
- Add conditional rendering ({if:} blocks)
- Add set/modify variable commands ({set:})

### Phase 3: UI/UX Polish (Week 2)
- Add story loader component
- Implement scene history (back button)
- Style with shadcn components
- Add inventory/variables display

### Phase 4: Testing & Refinement (Week 2)
- Create sample story files
- Test edge cases and error handling
- Polish UI and fix bugs

---

## 8. Out of Scope

- Server-side story storage or API
- Save/load game progress (localStorage)
- Multiplayer or shared stories
- Audio/video media support
- Complex script logic beyond variables
- **Future Consideration:** Inline images in scene text
- **Future Consideration:** Visual story editor (file-based first, with export to text format for interoperability)

---

## 10. Success Criteria

- [ ] Users can load a folder of markdown story files
- [ ] All syntax features (scenes, choices, variables, conditionals, item consumption) work correctly
- [ ] Game state persists across scene transitions
- [ ] Invalid stories show helpful error messages
- [ ] Engine version validation function exists and works correctly
- [ ] Circular references produce warnings (not errors)
- [ ] At least one complete sample story is playable
- [ ] UI is responsive and accessible

---

*Document Version: 1.0*  
*Created: March 2026*
