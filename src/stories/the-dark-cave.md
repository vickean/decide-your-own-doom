---
title: The Dark Cave
engine: 1.0
start: entrance
variables:
  has_torch: false,
  gold_coins: 0
---

# entrance
You stand at the entrance of a dark cave. The air is cold and damp.

- [Enter the cave](cave_entrance)
- [Walk away](leave)

# cave_entrance
{if: has_torch}
You light your torch and venture deeper into the cave. The flickering light reveals ancient carvings on the walls.
{else}
It's too dark to see anything. You need a light source to proceed safely.
{/if}

- [Go deeper](deep_cave)
- [Go back](entrance)

# deep_cave
You stumble upon an old wooden chest! Inside you find 10 gold coins.
{set: gold_coins += 10}

{if: gold_coins >= 10}
- [Buy a torch from the merchant](merchant)
{/if}

- [Return to entrance](entrance)

# merchant
A mysterious merchant appears from the shadows.

{if: gold_coins >= 10}
- [Buy a torch for 10 coins](buy_torch)
{/if}
- [Leave the merchant](deep_cave)

# buy_torch
{set: gold_coins -= 10}
{set: has_torch = true}

You hand the gold to the merchant. He gives you a burning torch!

- [Return to cave entrance](entrance)

# leave
You decide not to enter the cave and walk away. Perhaps another adventure awaits...

- [Return to cave entrance](entrance)
