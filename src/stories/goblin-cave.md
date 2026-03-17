---
title: The Goblin Cave
engine: 1.0
start: entrance
variables:
  health: 100
  max_health: 100
  mana: 50
  max_mana: 50
  attack: 15
  magic: 10
  defense: 5
  magic_defense: 0
  gold: 0

enemies:
  goblin:
    name: Goblin Scout
    hp: 30
    damage: 8
    defense: 2
    strategy: aggressive
  boss_goblin:
    name: Goblin Chief
    hp: 60
    damage: 15
    defense: 5
    magic_defense: 3
    strategy: boss

strategies:
  aggressive:
    priority: attack, defend
  boss:
    priority: magic, attack, defend
  defensive:
    priority: defend, attack

combat_stats:
  health: health
  max_health: max_health
  mana: mana
  max_mana: max_mana
  attack: attack
  magic: magic
  defense: defense
  magic_defense: magic_defense
---

# entrance
You stand at the entrance of a dark cave. You've heard rumors of treasure hidden within, guarded by goblins.

- [Enter the cave](hallway)
- [Leave](leave)

# hallway
The cave is dimly lit by torches on the walls. You hear rustling ahead.

- [Continue forward](encounter)
- [Go back](entrance)

# encounter
A goblin jumps out from behind a rock! It draws its dagger and charges at you!

- [Fight the goblin](battle_goblin)
- [Try to flee](flee_goblin)

# battle_goblin
{battle: goblin}

# battle_goblin_victory
You defeated the goblin! It drops a few coins as it falls.

{set: gold += 10}

The path continues deeper into the cave.

- [Go deeper](boss_room)
- [Go back](entrance)

# battle_goblin_defeat
You have been defeated by the goblin...

- [Try again](entrance)

# battle_goblin_escape
You managed to escape from the goblin!

- [Return to entrance](entrance)

# flee_goblin
You try to run away, but the goblin catches you!

- [Fight](battle_goblin)

# boss_room
You enter a large chamber. The Goblin Chief sits on a throne of bones!

"So, another adventurer," the chief growls. "You'll make a fine meal!"

The chief stands ready!

- [Fight the chief](battle_boss)
- [Flee](hallway)

# battle_boss
{battle: boss_goblin}

# battle_boss_victory
With a final blow, the Goblin Chief falls! Behind its throne, you find a chest full of treasure!

{set: gold += 100}

Congratulations! You've cleared the cave!

- [Play again](entrance)

# battle_boss_defeat
The Goblin Chief's magic overwhelms you...

- [Try again](entrance)

# battle_boss_escape
You flee from the boss chamber!

- [Return to hallway](hallway)

# leave
You decide not to enter the cave today.

- [Return](entrance)
