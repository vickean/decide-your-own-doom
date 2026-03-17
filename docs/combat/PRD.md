# Product Requirements Document - Markdoom Combat System

---

## 1. Executive Summary

**Project Name:** Markdoom Combat System  
**Type:** Game Engine Enhancement  
**Core Feature:** Add a turn-based battle system to Markdoom with reusable enemy definitions, initiative-based combat, and extensible player actions.  
**Target Users:** Story authors creating combat-focused adventure games.

---

## 2. Problem Statement

The current Markdoom DSL handles variables and conditional logic well, but lacks any combat mechanics. Authors cannot create battles, define enemies, or implement strategic combat encounters. This enhancement adds a complete battle system while maintaining the simple, declarative style of Markdoom.

---

## 3. Functional Requirements

### 3.1 Enemy Definitions (Global)

Define reusable enemy templates in frontmatter:

```yaml
enemies:
  goblin:
    name: Goblin Scout
    hp: 30
    damage: 8
    strategy: aggressive
  dragon:
    name: Ancient Dragon
    hp: 200
    damage: 25
    magic: 15
    strategy: boss
```

**Enemy Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Display name |
| `hp` | number | Health points (or range "20-30") |
| `damage` | number | Physical attack damage (or range) |
| `magic` | number (optional) | Magic attack damage (or range) |
| `magic_defense` | number (optional) | Reduces magic damage taken |
| `defense` | number (optional) | Reduces physical damage taken |
| `strategy` | string | AI strategy reference |
| `respawn` | boolean | If false, enemy stays defeated (default: true) |
| `items` | array (optional) | Loot dropped on defeat |

### Random Enemy Values (Optional Enhancement)

If implementation complexity allows, support ranges for enemy stats:

```yaml
enemies:
  goblin:
    name: Goblin Scout
    hp: "20-30"  # Random between 20 and 30
    damage: "5-10"
```

Per-scene overrides can also use ranges:
```markdown
{battle: goblin with hp: "25-35", damage: "8-12"}
```

### Scene-Level Enemy Overrides

Override enemy properties per scene:

```markdown
# hard_encounter
{battle: goblin with hp: 50, respawn: false}
```

This creates a boss variant of the goblin that has 50 HP and stays defeated.

### 3.2 Scene-Based Battle Instance

Trigger battles in scenes:

```markdown
# dungeon_encounter
You encounter a goblin!

{battle: goblin}

The goblin prepares to attack!
```

**Battle Syntax:**
- `{battle: enemy_id}` - Instant battle with named enemy
- `{battle: enemy_id with hp: 20}` - Override specific properties
- `{battle: enemy1, enemy2}` - Multiple enemies (future)

### 3.3 Player Stats

Define player combat stats in frontmatter:

```yaml
variables:
  health: 100
  max_health: 100
  mana: 50
  max_mana: 50
  attack: 15
  magic: 10
  magic_defense: 5
  defense: 5

combat_stats:
  health: health
  max_health: max_health
  mana: mana
  max_mana: max_mana
  attack: attack
  magic: magic
  magic_defense: magic_defense
  defense: defense
```

### 3.4 Battle Actions

Extended action set for players:

```markdown
# combat_scene
{battle: goblin}

- [Attack](victory)[set: enemy.hp -= attack]
- [Cast Fireball](victory)[set: enemy.hp -= magic]
- [Defend](combat_scene)
- [Use Potion](combat_scene)[require: potion][remove: potion][set: health += 30]
- [Flee](escape)
```

**Battle Actions:**
- **Attack** - Deal damage based on attack stat
- **Magic** - Deal magic damage
- **Defend** - Reduce incoming damage next turn
- **Use Item** - Consume inventory item for healing/buffs
- **Flee** - Attempt to escape (success based on stat check)

### 3.5 Turn System (Initiative-Based)

- Each combat round, determine initiative (player or enemy goes first)
- Higher agility/speed stat wins initiative
- Turn order alternates until battle ends
- Player chooses action each turn
- Enemy acts based on strategy

### 3.6 Enemy Strategies

Define AI behaviors in frontmatter:

```yaml
strategies:
  aggressive:
    priority:
      - attack
      - magic
      - defend
  defensive:
    priority:
      - defend
      - attack
  boss:
    priority:
      - magic
      - attack
      - special
      - defend
  random:
    actions:
      - attack: 50
      - defend: 25
      - magic: 25
```

### 3.7 Battle Outcomes

Separate scenes for different outcomes:

```markdown
# combat_win
You defeat the enemy!

- [Continue](loot_scene)

# combat_lose
You have been defeated...

- [Try again](start)
- [View stats](game_over)

# combat_escape
You successfully flee from battle!

- [Continue](safe_zone)
```

### 3.8 Damage Calculation

```
# Physical damage (reduced by defense)
physical_damage = max(0, attacker.attack - defender.defense)

# Magic damage (reduced by magic_defense)
magic_damage = max(0, attacker.magic - defender.magic_defense)

# Defending reduces incoming damage by 50%
defended_damage = floor(raw_damage / 2)

# Example:
# Player attacks (attack: 15) vs Goblin (defense: 5)
# Damage = max(0, 15 - 5) = 10

# Enemy casts magic (magic: 10) vs Player (magic_defense: 5)
# Magic damage = max(0, 10 - 5) = 5
```

### 3.9 Mana System

Magic attacks consume mana:

```yaml
combat_actions:
  fireball:
    damage: magic
    mana_cost: 10
  heal:
    effect: heal
    mana_cost: 15
```

If player lacks sufficient mana, magic action is unavailable.

---

## 4. Technical Implementation

### 4.1 Syntax Extensions

**New Frontmatter Fields:**

```typescript
interface EnemyDefinition {
  name: string;
  hp: number;
  damage: number;
  magic?: number;
  defense?: number;
  strategy: string;
  items?: string[];
}

interface StrategyDefinition {
  priority?: string[];  // Action names in order of preference
  actions?: Record<string, number>;  // action: weight
}

interface CombatStatsMapping {
  health: string;      // Variable name for current HP
  max_health: string; // Variable name for max HP
  attack: string;     // Variable name for attack
  magic?: string;     // Variable name for magic
  defense?: string;   // Variable name for defense
}
```

**New Markdoom Tags:**

| Tag | Description |
|-----|-------------|
| `{battle: enemy_id}` | Trigger battle with enemy |
| `{battle: enemy_id with hp: 20}` | Battle with overrides |
| `{set: enemy.hp -= 10}` | Damage enemy |
| `{set: player.hp -= enemy.damage}` | Enemy attacks player |

### 4.2 Parser Changes

Update parser to:
1. Parse `enemies` object in frontmatter
2. Parse `strategies` object in frontmatter
3. Parse `combat_stats` mapping
4. Extract `{battle:}` tags from scene content
5. Handle `{set: enemy.X}` syntax for combat updates

### 4.3 New Data Types

```typescript
interface BattleState {
  active: boolean;
  enemy: EnemyInstance;
  playerStats: CombatStats;
  turn: 'player' | 'enemy';
  round: number;
  defending: boolean;
}

interface EnemyInstance {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  damage: number;
  magic: number;
  defense: number;
  strategy: string;
}

interface CombatStats {
  health: number;
  maxHealth: number;
  attack: number;
  magic: number;
  defense: number;
}
```

---

## 5. UI/UX Requirements

### 5.1 Battle Interface

- Dedicated battle screen/panel
- Display enemy name and HP bar
- Display player HP bar
- Show available actions as buttons
- Show combat log/message area

### 5.2 Visual Feedback

- Damage numbers (flash red)
- Healing numbers (flash green)
- Low HP warning (red pulse)
- Victory/defeat animations

---

## 6. Non-Functional Requirements

1. **Performance** - Battle transitions < 100ms
2. **Extensibility** - Easy to add new actions/strategies
3. **Error Handling** - Clear errors for invalid enemy references
4. **Validation** - Warn if enemy references undefined enemy type

---

## 7. Implementation Phases

### Phase 1: Core Battle System (Week 1)
- Add enemy definitions to frontmatter parser
- Add battle trigger syntax
- Implement basic turn system
- Create battle UI component

### Phase 2: Combat Logic (Week 1-2)
- Implement damage calculation
- Add player actions (attack, defend, magic, flee)
- Add enemy strategy execution
- Implement initiative system

### Phase 3: Polish (Week 2)
- Add visual feedback
- Create battle outcomes handling
- Add enemy overrides per scene
- Test edge cases

---

## 8. Out of Scope

- Multiple simultaneous enemies
- Status effects (poison, stun, etc.)
- Enemy AI learning/adapting
- Complex combo systems
- Equipment/item crafting

---

## 9. Open Questions

~~1. Should defeated enemies stay defeated (global flag)?~~  
→ **Answered:** Add `respawn` attribute globally or per scene.

~~2. Do we need random enemy variations?~~  
→ **Answered:** If not too complex, support ranges like "20-30".

~~3. Should magic have a mana cost?~~  
→ **Answered:** Yes, add mana system.

~~4. How does defense work against magic?~~  
→ **Answered:** Add separate `magic_defense` stat.

**Future Considerations:**
- Multi-enemy battles (postponed to future update)

---

## 10. Success Criteria

- [ ] Authors can define enemies globally with all properties
- [ ] `respawn` attribute works globally and per scene
- [ ] Random value ranges work (if implemented)
- [ ] Authors can trigger battles in scenes
- [ ] Initiative system works correctly
- [ ] All player actions function (attack, magic, defend, flee, items)
- [ ] Mana system with costs works
- [ ] Magic defense reduces magic damage
- [ ] Enemy strategies affect AI behavior
- [ ] Battle outcomes lead to separate scenes
- [ ] HP/Mana variables update during combat
- [ ] Battle UI displays correctly
