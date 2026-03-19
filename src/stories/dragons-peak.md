---
title: The Dragon's Peak
engine: 1.0
start: village_square
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
  has_key: false
  rescued_knight: false

enemies:
  wolf:
    name: Dire Wolf
    hp: 25
    damage: 7
    defense: 1
    strategy: aggressive
  bandit:
    name: Forest Bandit
    hp: 35
    damage: 10
    defense: 3
    strategy: defensive
  skeleton:
    name: Skeleton Warrior
    hp: 40
    damage: 12
    defense: 5
    magic_defense: 2
    strategy: aggressive
  dragon:
    name: Young Dragon
    hp: 80
    damage: 18
    defense: 8
    magic_defense: 5
    magic: 15
    strategy: boss

strategies:
  aggressive:
    priority: attack, defend
  defensive:
    priority: defend, attack
  boss:
    priority: magic, attack, defend

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

# village_square
The village of Oakhollow is in an uproar! A young dragon has taken residence in the mountain cave to the north, and it's demanding tribute. The village elder stands before you, eyes desperate.

"Brave adventurer, will you face the dragon? The path is treacherous, but the village's survival depends on you."

- [Accept the quest](forest_path)
- [Decline and explore the village](village_shop)
- [I need more information](elder_talk)

# elder_talk
The elder's weathered face creases with worry.

"The dragon's name is Pyraxis. It arrived three moons ago, driving away the wildlife and scaring our hunters. It demands gold, but more importantly—it guards an ancient artifact we need to protect our village."

"The path goes through Darkwood Forest, then up the mountain. Beware the skeletal guardians at the mountain pass—they serve no master but their cursed existence."

- [I'll face the dragon](forest_path)
- [Maybe I should explore first](village_shop)

# village_shop
The village shop is dimly lit, smelling of herbs and old leather. The shopkeeper, a stout woman with knowing eyes, nods as you enter.

"Adventurer, eh? Looking to face Pyraxis? I've got supplies that might help."

- [Buy health potion - 20 gold](buy_potion)[require: gold>=20]
- [Buy mana potion - 25 gold](buy_mana)[require: gold>=25]
- [Leave shop](village_square)

# buy_potion
{set: gold -= 20}
{set: health += 30}

The shopkeeper hands you a glowing red vial. "Drink when you're in trouble!"

- [Leave shop](village_square)

# buy_mana
{set: gold -= 25}
{set: mana += 20}

The shopkeeper passes you a shimmering blue orb. "For when magic fails you."

- [Leave shop](village_square)

# forest_path
The Darkwood Forest looms before you, ancient trees twisting toward the sky. Shafts of pale light filter through the canopy. The path is overgrown but passable.

You hear rustling in the bushes. A low growl emerges from the shadows!

- [Press forward cautiously](wolf_encounter)
- [Draw your weapon ready](wolf_encounter_bold)
- [Try to sneak around](sneak_attempt)

# wolf_encounter
A massive Dire Wolf leaps from the undergrowth, hackles raised and fangs bared! Its amber eyes fix on you with predatory hunger.

- [Fight the wolf](battle_wolf)
- [Use magic to intimidate](wolf_magic)

# wolf_encounter_bold
You draw your sword with a flourish, charging into the clearing. A massive Dire Wolf bursts forth, startled by your aggression!

- [Fight the wolf](battle_wolf)

# sneak_attempt
You try to creep around, but your foot snaps a twig. The wolf lunges from the shadows, attack surprised!

- [Fight the wolf](battle_wolf)

# wolf_magic
You raise your hands and conjure a burst of arcane light! The wolf whimpers and flees deeper into the forest.

{set: rescued_knight = true}

You find a wounded knight unconscious behind a bush—the source of the wolf's aggression. She was defending herself against its attack!

- [Search the knight](search_knight)
- [Carry her to safety](carry_knight)

# search_knight
The knight carries a silver key on her belt and a sealed letter marked with the village elder's seal.

{set: has_key = true}

She stirs and opens her eyes. "The dragon... Pyraxis... it's not what you think. Read the letter!" She passes out again.

- [Take the key and continue](forest_path_continue)

# carry_knight
You lift the knight carefully. She mumbles, "Silver key... for the dragon's lair..."

She faints again, but you've learned something useful.

{set: has_key = true}

- [Continue down the path](forest_path_continue)

# forest_path_continue
The forest grows denser as you press on. Suddenly, a figure emerges from behind a tree—a bandit, blade gleaming!

"None pass without paying the toll, traveler!"

- [Fight the bandit](battle_bandit)
- [Pay 10 gold](pay_toll)
- [Try to reason with them](reason_bandit)

# pay_toll
{set: gold -= 10}

The bandit snatches the gold and vanishes into the shadows. The path ahead is clear.

- [Continue to mountain](mountain_base)

# reason_bandit
"You seem troubled," you say. "What's your story?"

The bandit hesitates, then lowers their blade. "I'm a refugee from the dragon's first attack. Lost everything. I've been surviving off travelers." They drop their weapon. "Go. I won't stop you."

- [Continue to mountain](mountain_base)

# battle_wolf
{battle: wolf}

The wolf lies defeated at your feet. The path ahead is clear.

- [Continue deeper into forest](forest_deep)

# battle_bandit
{battle: bandit}

The bandit yields, groveling at your feet. "Mercy! I'll never toll again!"

They flee into the forest. The path to the mountain is open.

- [Continue to mountain](mountain_base)

# forest_deep
The forest thins out and the air grows colder. You can see the mountain peak above, wreathed in smoke. A skeletal guardian stands at the entrance to the mountain pass, empty eye sockets gleaming.

- [Fight the skeleton](battle_skeleton)
- [Try to pass by](try_pass_skeleton)

# try_pass_skeleton
The skeleton's jaw creaks open. "None... may pass... without battle..."

It raises its ancient sword.

- [Fight the skeleton](battle_skeleton)

# battle_skeleton
{battle: skeleton}

The skeleton crumbles to dust, ancient bones scattering on the wind. Beyond lies the mountain path.

- [Ascend the mountain](mountain_shrine)

# mountain_base
The base of the mountain looms above you. A winding path leads upward through rocky terrain. Smoke rises from the peak.

A small shrine sits here, offerings left by previous travelers. A knight's grave marker stands nearby.

- [Pray at shrine](shrine_prayer)
- [Read the grave](read_grave)
- [Ascend the mountain](mountain_shrine)

# shrine_prayer
You kneel and pray. A warmth spreads through your body, healing your wounds.

{set: health = max_health}
{set: mana = max_mana}

The shrine's power restored you. You feel ready for whatever lies ahead.

- [Ascend the mountain](mountain_shrine)

# read_grave
Here lies Sir Aldric the Brave, who faced Pyraxis alone.
He failed, but his courage inspires those who follow.

A silver key gleams half-buried at the base of the marker!

{set: has_key = true}

- [Ascend the mountain](mountain_shrine)

# mountain_shrine
You reach the mountain peak. The cave entrance yawns before you, flames flickering within. A heavy iron door bars the way in.

- [Enter the cave](cave_entrance)
- [Knock on the door](cave_entrance)

# cave_entrance
{if: has_key}You use the silver key to unlock the door. It swings open with a groan.{/if}
{if: !has_key}The door is locked. You'll need to find the key.{/if}

The cave is vast, lit by crystals embedded in the walls. At the far end, a dragon the color of molten gold regards you with ancient eyes.

"So. Another hero." Pyraxis's voice rumbles like distant thunder. "The villagers sent you to slay me, no doubt."

- [Attack the dragon](dragon_battle)
- [Wait and listen](dragon_dialogue)

# dragon_dialogue
Pyraxis settles back, smoke curling from her nostrils.

"I am no mindless beast, human. I came here to protect an artifact—the Heartstone of Oakhollow. It was stolen by the villagers' own knight, Sir Aldric. He wished to use its power for himself."

"But the artifact corrupts. It twists good intentions. When I took it, the village prospered for years without it. Their greed brought them low."

"I only demand tribute so they fear me enough to stay away. For their own good."

- [I don't believe you](dragon_battle)
- [What do you really want?](dragon_wants)

# dragon_wants
"I want the Heartstone destroyed. Its power is too dangerous in this world. But I cannot leave this cave—my magic binds me here as guardian."

"If you destroy it, I will be free. And Oakhollow will finally know peace."

She eyes you carefully. "Do this, and I will share my treasure with you. My word as a dragon."

- [I'll destroy the Heartstone](find_heartstone)
- [This is a trap](dragon_battle)

# dragon_battle
{battle: dragon}

The dragon lies defeated. But as Pyraxis draws her final breath, she whispers: "The Heartstone... will find... another host..."

Her body dissolves into golden light.

- [Continue](village_aftermath)

# find_heartstone
You navigate the treacherous cave, finding a hidden chamber. Within pulses a crimson gem, beating like a heart.

With a mighty spell, you shatter the artifact! Energy erupts outward, and you feel Pyraxis's curse lift.

When you return to the entrance, the dragon bows her massive head. "You have done what I could not. The village is safe, and I am free."

She gifts you with a scale that glows with ancient power.

{set: gold += 500}

"The treasure of ages, earned. Go with honor."

- [Return to the village](village_victory)

# locked_door
The iron door is sealed. You'll need to find the silver key.

- [Return to search](mountain_base)

# mountain_path
The path winds upward through treacherous terrain.

- [Continue climbing](mountain_shrine)

# village_aftermath
You return to Oakhollow a hero, though Pyraxis's dying words haunt you. The Heartstone's corruption has been defeated... for now.

The village celebrates your victory, but you wonder if you truly won.

{set: gold += 200}

- [Celebrate](village_victory)

# village_victory
The village of Oakhollow celebrates! Bonfires lit the night sky as music fills the streets.

You are a hero—for now. But somewhere, a crimson light pulses in the darkness.

Perhaps some evils are never truly destroyed.

**THE END**

- [Play again](village_square)
