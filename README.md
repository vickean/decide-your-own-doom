# Decide Your Own Doom

A text adventure game engine with a custom markdown-like DSL ("Markdoom") and built-in turn-based combat system.

## Features

- **Markdoom DSL**: Write interactive fiction stories using a custom markdown syntax
- **Turn-Based Combat**: Enemies with stats, strategies, and AI behavior
- **Variable System**: Track player health, mana, inventory, and custom variables
- **Scene Navigation**: Conditional choices based on items or variable states
- **Pokemon-Style Battle UI**: Classic RPG battle interface with HP/MP bars

## Tech Stack

- React + TypeScript
- Tailwind CSS + shadcn/ui
- Vite for development
- Vitest for testing
- Playwright for E2E testing

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test
```

## Writing Stories

Stories are written in Markdown with frontmatter for game configuration:

```yaml
---
title: Your Story Title
engine: 1.0
start: scene_one
variables:
  health: 100
  mana: 50

enemies:
  goblin:
    name: Goblin Scout
    hp: 30
    damage: 8
    strategy: aggressive

strategies:
  aggressive:
    priority: attack, defend
---

# scene_one
You wake up in a dark cave.

- [Look around](scene_two)
- [Rest](scene_one)

# scene_two
You see a goblin!
{battle: goblin}
```

## Combat Actions

- **Attack**: Deal damage based on your attack stat
- **Magic**: Cast spells (costs MP)
- **Defend**: Reduce incoming damage by 50%
- **Flee**: Attempt to escape (50% success rate)

## Project Structure

```
src/
  lib/
    parser.ts      # Markdoom parser
    combat.ts      # Battle logic
    types.ts       # TypeScript types
  components/
    Battle.tsx     # Combat UI
    ui/            # shadcn components
  stories/         # Game stories
  test/           # Unit tests
```

## License

MIT
