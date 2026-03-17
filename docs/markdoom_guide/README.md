# Markdoom Guide

Markdoom is a markdown-like Domain Specific Language (DSL) for creating interactive choose-your-own-adventure text games.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Frontmatter](#frontmatter)
3. [Scenes](#scenes)
4. [Choices](#choices)
5. [Variables](#variables)
6. [Conditionals](#conditionals)
7. [Item System](#item-system)
8. [Example Story](#example-story)
9. [Common Patterns](#common-patterns)
10. [Best Practices](#best-practices)
11. [Debugging Tips](#debugging-tips)
12. [Engine Version](#engine-version)
13. [Future Features](#future-features)

---

## Getting Started

A Markdoom story is a `.md` file with special syntax. Each file defines:

- Story metadata (title, starting scene, variables)
- Scenes (nodes in the story graph)
- Choices (transitions between scenes)
- Game state (variables, inventory)

### Basic Structure

```markdown
---
title: Your Story Title
engine: 1.0
start: first_scene
variables:
  has_key: false,
  gold: 0
---

# first_scene
Your story begins here.

- [Go to next scene](second_scene)

# second_scene
More content here.

- [Go back](first_scene)
```

---

## Frontmatter

The frontmatter is a YAML-like block at the top of your file, wrapped in `---`.

### Required Fields

| Field | Description |
|-------|-------------|
| `title` | The display name of your story |
| `engine` | Engine version (currently `1.0`) |
| `start` | The ID of the first scene |

### Optional Fields

| Field | Description |
|-------|-------------|
| `variables` | Initial game state variables |

### Variables Syntax

```yaml
variables:
  has_key: false,
  gold: 0,
  health: 100
```

Supported types:
- `true` / `false` (booleans)
- Numbers (integers)

---

## Scenes

Scenes are the nodes in your story graph. Each scene has:

1. A header (`# scene_id`)
2. Content text
3. Choices

### Scene ID

```markdown
# entrance
# cave_entrance
# boss_fight
```

- Must start with `# `
- ID can only contain letters, numbers, and underscores
- Must be unique within the story

### Scene Content

Text after the header becomes the scene content. Supports:

- Plain text
- **Bold** and *italic* text
- Lists (though choices use special syntax)
- Multiple paragraphs

```markdown
# cave_entrance
You stand at the entrance of a dark cave.
The air is cold and damp.

You see a glimmer in the distance.
```

---

## Choices

Choices define transitions between scenes.

### Basic Syntax

```markdown
- [Choice Label](target_scene_id)
```

- Label: What the player reads
- Target: The scene ID to jump to

### Examples

```markdown
- [Enter the cave](cave_entrance)
- [Walk away](leave)
- [Return to town](town_square)
```

---

## Variables

Variables track game state and can be modified when entering a scene.

### Setting Variables

Use `{set: variable = value}` to set a variable:

```markdown
# find_treasure
You find a chest filled with gold!
{set: gold = 100}
{set: has_treasure = true}
```

### Modifying Numbers

Use `+=` or `-=` to modify numeric variables:

```markdown
# find_coins
You pick up 10 gold coins.
{set: gold += 10}

# buy_item
You spend 5 gold.
{set: gold -= 5}
```

### Variables are applied when entering a scene

The variable changes happen when the player **enters** the target scene, not when leaving the current scene.

```markdown
# chest_scene
{set: gold += 50}

You open the chest and find 50 gold!
```

---

## Conditionals

Show different content based on game state.

### If Statement

```markdown
{if: has_torch}
You light your torch and venture deeper into the cave.
{/if}
```

### If-Else Statement

```markdown
{if: has_key}
You unlock the door and enter.
{else}
The door is locked. You need a key.
{/if}
```

### Supported Conditions

| Condition | Description |
|-----------|-------------|
| `has_torch` | True if variable is `true` |
| `gold >= 10` | True if `gold` is 10 or more |
| `gold < 50` | True if `gold` is less than 50 |
| `true` | Always true |
| `false` | Always false |

### Examples

```markdown
# merchant_scene
{if: gold >= 10}
You have enough gold to buy the torch.
- [Buy torch for 10 gold](buy_torch)
{/if}

- [Leave](town)
```

---

## Item System

Choices can require or remove items.

### Requiring Items

Add `[require: item_name]` to a choice:

```markdown
- [Open the door](door_scene)[require: has_key]
```

This choice only appears if:
- `has_key` variable is `true`, OR
- `has_key` is in the player's inventory

### Removing Items

Add `[remove: item_name]` to a choice:

```markdown
- [Use key](unlock_door)[remove: key]
```

This removes the item from inventory after the choice is made.

### Combined

```markdown
- [Use magical key](door_scene)[require: magical_key][remove: magical_key]
```

---

## Example Story

Here's a complete example demonstrating all features:

```markdown
---
title: The Dark Cave
engine: 1.0
start: entrance
variables:
  has_torch: false,
  gold: 0
---

# entrance
You stand at the entrance of a dark cave. The air is cold and damp.

- [Enter the cave](cave_entrance)
- [Walk away](leave)

# cave_entrance
{if: has_torch}
You light your torch. The flickering light reveals ancient carvings on the walls.
{else}
It's too dark to see anything. You need a light source.
{/if}

- [Go deeper](deep_cave)
- [Go back](entrance)

# deep_cave
You stumble upon an old wooden chest!

{if: gold >= 10}
- [Buy a torch](merchant)
{/if}

{set: gold += 10}
You find 10 gold coins inside!

- [Return to entrance](entrance)

# merchant
A mysterious merchant appears from the shadows.

{if: gold >= 10}
- [Buy torch for 10 gold](buy_torch)
{/if}

- [Leave](deep_cave)

# buy_torch
{set: gold -= 10}
{set: has_torch = true}

You hand the gold to the merchant. He gives you a burning torch!

- [Return to entrance](entrance)

# leave
You decide not to enter the cave and walk away.

- [Return to entrance](entrance)
```

---

## Tips

1. **Test frequently** - Use the debug panel to see variable values
2. **Circular references are allowed** - The engine warns but doesn't block them (useful for hub scenes)
3. **Scene IDs must match** - Make sure your choice targets exactly match scene headers
4. **Variables update on entry** - Set commands run when entering a scene, not leaving

---

## Common Patterns

### Health System

```markdown
---
title: Dungeon Crawler
engine: 1.0
start: start
variables:
  health: 100,
  has_potion: false
---

# start
You enter a dark dungeon.

- [Fight the goblin](combat)

# combat
The goblin attacks you for 15 damage!
{set: health -= 15}

{if: health <= 0}
- [Continue](game_over)
{else}
- [Continue](loot)
{/if}

# loot
You defeat the goblin and find a healing potion!

{if: health < 100}
- [Drink potion](drink_potion)
{/if}
- [Continue](start)

# drink_potion
{set: health += 50}
{set: has_potion = false}
{set: health = Math.min(health, 100)}

You drink the potion and restore 50 health!

- [Continue](start)

# game_over
Your health has dropped to zero. You have fallen in battle.

- [Restart](start)
```

### Inventory System

```markdown
---
title: Adventure
engine: 1.0
start: start
variables:
  has_sword: false,
  has_shield: false,
  gold: 0
---

# town
You are in the town square.

- [Visit the blacksmith](blacksmith)
- [Visit the merchant](merchant)
- [Explore the dungeon](dungeon_entrance)

# blacksmith
The blacksmith offers weapons for sale.

{if: gold >= 50}
- [Buy sword (50 gold)](buy_sword)
{/if}

- [Return to town](town)

# buy_sword
{set: gold -= 50}
{set: has_sword = true}

You purchase a gleaming sword!

- [Return to town](town)

# merchant
The merchant has various items.

{if: gold >= 30}
- [Buy shield (30 gold)](buy_shield)
{/if}

- [Return to town](town)

# buy_shield
{set: gold -= 30}
{set: has_shield = true}

You purchase a sturdy shield!

- [Return to town](town)

# dungeon_entrance
You stand before the dungeon entrance.

{if: has_sword}
You draw your sword, ready for battle.
{else}
You have no weapon! This seems dangerous.
{/if}

- [Enter the dungeon](dungeon)
- [Return to town](town)

# dungeon
You venture into the darkness...

- [Return to dungeon entrance](dungeon_entrance)
```

### Multiple Endings

```markdown
---
title: The Choice
engine: 1.0
start: start
variables:
  karma: 0
---

# start
A merchant drops his coins. No one is watching.

- [Help him](help_merchant)
- [Steal the coins](steal)

# help_merchant
{set: karma += 10}
You help the merchant pick up his coins.

"Thank you, kind stranger!" he says.

- [Continue](ending)

# steal
{set: karma -= 10}
You quickly pocket a few coins while he isn't looking.

- [Continue](ending)

# ending
{if: karma >= 10}
# good_ending
Your kindness has been rewarded. The merchant gives you a magical amulet.

**THE END - Good Ending**
{else}
# bad_ending
Your greed consumes you. The town guards catch up with you.

**THE END - Bad Ending**
{/if}

- [Play again](start)
```

### Branching Paths

```markdown
---
title: The Forest Path
engine: 1.0
start: crossroads
variables:
  met_wizard: false,
  found_herb: false
---

# crossroads
You stand at a crossroads in the forest.

- [Take the left path](wizard_clearing)
- [Take the right path](river_bank)
- [Go straight](dark_cave)

# wizard_clearing
A wise wizard sits under a tree.

{if: met_wizard}
The wizard nods at you knowingly.
{else}
{set: met_wizard = true}
"Greetings, traveler," the wizard says. "Take this herb - it may prove useful."
{set: found_herb = true}
{/if}

- [Ask about the cave](wizard_cave)
- [Return to crossroads](crossroads)

# wizard_cave
The wizard frowns. "The dark cave is treacherous. Many have entered. Few have returned."

- [Return to crossroads](crossroads)

# river_bank
The river flows gently. You see a boat.

- [Take the boat](bridge)
- [Search the riverbank](search_river)
- [Return to crossroads](crossroads)

# search_river
You find some shiny pebbles.

- [Return to river bank](river_bank)

# bridge
You cross the bridge and find a beautiful castle in the distance.

- [Continue](castle)

# dark_cave
{if: found_herb}
The cave is filled with poisonous gas, but the herb protects you!
{set: found_herb = false}
{else}
The poisonous gas overwhelms you! You stumble back out.
{/if}

- [Return to crossroads](crossroads)

# castle
You have reached the castle. Your adventure continues...

**TO BE CONTINUED**

- [Start over](crossroads)
```

---

## Best Practices

### 1. Plan Your Story Structure

Before writing, sketch out your scenes and connections:

```
[start] --> [scene1] --> [scene2] --> [ending1]
    |           |
    v           v
 [scene3] --> [scene4] --> [ending2]
```

### 2. Use Descriptive Scene IDs

```markdown
# Good
# enter_the_treasure_room
# talk_to_the_wise_elder
# fight_the_final_boss

# Bad
# room1
# scene_a
# boss
```

### 3. Group Related Variables

```markdown
# Good - grouped logically
variables:
  # Player stats
  health: 100,
  mana: 50,
  # Inventory
  has_sword: false,
  has_key: false,
  gold: 0,
  # Story flags
  met_ally: false,
  betrayed_king: false
```

### 4. Keep Scenes Focused

Each scene should cover one location or event. Split long narratives into multiple scenes.

```markdown
# Instead of one long scene...
# town_visit_blacksmith_merchant_inn
# ...split into:
# town_square
# blacksmith
# merchant
# inn
```

### 5. Test Edge Cases

- What happens if the player has 0 gold?
- What if they visit the same scene multiple times?
- Can they get stuck with no valid choices?

---

## Debugging Tips

### Using the Debug Panel

The game includes a debug panel showing:
- Current scene ID
- All variable values
- Inventory contents

Use this to verify your variables are updating correctly.

### Common Issues

#### Choices Not Appearing

If a choice with `[require: item]` doesn't appear:
- Check the variable name matches exactly (case-sensitive)
- Verify the variable is set to `true`

#### Variables Not Updating

If variables don't seem to change:
- Remember: set commands run when **entering** the target scene
- Check the scene ID in your `{set:}` commands

#### Scene Not Found Errors

This means a choice points to a non-existent scene:
```markdown
# Wrong - "town_sqare" doesn't exist
- [Go to town](town_sqare)

# Correct
- [Go to town](town_square)
```

#### Circular Reference Warnings

These are informational only. Use them intentionally for:
- Hub scenes that link to multiple areas
- Save points the player can return to

---

## Engine Version

Always specify the engine version in your frontmatter:

```yaml
engine: 1.0
```

This ensures compatibility with future versions of the engine.

---

## Future Features

Planned features (not yet implemented):

- **Images** - Embed images in scene content
- **Multiple stories** - Load different story files
- **Save/Load** - Persist game progress
- **Sound** - Add audio effects
- **Visual editor** - GUI for creating stories
