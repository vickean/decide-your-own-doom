import { describe, it, expect, beforeEach } from 'vitest';
import { startBattle, executePlayerAction, getCombatStats } from '../lib/combat';
import { Story } from '../lib/types';

const TEST_STORY: Story = {
  title: 'Test Story',
  engine: '1.0',
  start: 'start',
  variables: {
    health: 100,
    max_health: 100,
    mana: 50,
    max_mana: 50,
    attack: 15,
    magic: 10,
    defense: 5,
    magic_defense: 0,
    gold: 0,
  },
  scenes: {},
  enemies: {
    goblin: {
      name: 'Goblin Scout',
      hp: 30,
      damage: 8,
      defense: 2,
      strategy: 'aggressive',
    },
  },
  strategies: {
    aggressive: {
      priority: ['attack', 'defend'],
    },
  },
  combatStats: {
    health: 'health',
    maxHealth: 'max_health',
    mana: 'mana',
    maxMana: 'max_mana',
    attack: 'attack',
    magic: 'magic',
    defense: 'defense',
    magicDefense: 'magic_defense',
  },
};

describe('startBattle', () => {
  it('creates a battle state with correct enemy stats', () => {
    const result = startBattle(TEST_STORY, 'goblin', undefined, TEST_STORY.variables);
    
    expect(result.battleState.active).toBe(true);
    expect(result.battleState.enemy.name).toBe('Goblin Scout');
    expect(result.battleState.enemy.hp).toBe(30);
    expect(result.battleState.enemy.damage).toBe(8);
    expect(result.battleState.enemy.defense).toBe(2);
  });
  
  it('sets initial turn to player', () => {
    const result = startBattle(TEST_STORY, 'goblin', undefined, TEST_STORY.variables);
    expect(result.battleState.turn).toBe('player');
  });
  
  it('generates appearance message', () => {
    const result = startBattle(TEST_STORY, 'goblin', undefined, TEST_STORY.variables);
    expect(result.messages[0]).toContain('Goblin Scout');
  });
});

describe('getCombatStats', () => {
  it('returns correct player stats from variables', () => {
    const stats = getCombatStats(TEST_STORY, TEST_STORY.variables);
    
    expect(stats.health).toBe(100);
    expect(stats.maxHealth).toBe(100);
    expect(stats.mana).toBe(50);
    expect(stats.maxMana).toBe(50);
    expect(stats.attack).toBe(15);
    expect(stats.magic).toBe(10);
    expect(stats.defense).toBe(5);
    expect(stats.magicDefense).toBe(0);
  });
});

describe('executePlayerAction - attack', () => {
  let battleResult: ReturnType<typeof startBattle>;
  
  beforeEach(() => {
    battleResult = startBattle(TEST_STORY, 'goblin', undefined, TEST_STORY.variables);
  });
  
  it('player attack deals damage minus enemy defense', () => {
    // Player attack: 15 - enemy defense 2 = 13 damage
    const result = executePlayerAction('attack', TEST_STORY, battleResult.battleState, TEST_STORY.variables, TEST_STORY.combatStats);
    
    // Enemy should take 13 damage (30 - 13 = 17 HP)
    expect(result.battleState.enemy.hp).toBe(17);
    expect(result.messages).toContain('You attack for 13 damage!');
  });
  
  it('enemy turn executes after player attack', () => {
    const result = executePlayerAction('attack', TEST_STORY, battleResult.battleState, TEST_STORY.variables, TEST_STORY.combatStats);
    
    // Should have enemy turn message
    expect(result.messages.some(m => m.includes('Goblin'))).toBe(true);
  });
  
  it('player takes damage from enemy attack - defense is applied', () => {
    const result = executePlayerAction('attack', TEST_STORY, battleResult.battleState, TEST_STORY.variables, TEST_STORY.combatStats);
    
    // Enemy damage 8 - player defense 5 = 3 damage
    // Player should have 97 HP
    expect(result.newVariables.health).toBe(97);
  });
  
  it('defend reduces incoming damage by 50%', () => {
    // First, player defends
    const defendResult = executePlayerAction('defend', TEST_STORY, battleResult.battleState, TEST_STORY.variables, TEST_STORY.combatStats);
    
    // Then enemy attacks - damage should be halved after defense reduction
    // Enemy damage 8 - player defense 5 = 3, then halved = floor(3/2) = 1
    // Player should have 99 HP (100 - 1)
    expect(defendResult.newVariables.health).toBe(99);
  });
  
  it('victory when enemy HP reaches 0', () => {
    // Create a weak enemy
    const weakEnemyResult = startBattle(TEST_STORY, 'goblin', { hp: 10 }, TEST_STORY.variables);
    
    // One attack should kill it (15 - 2 = 13 > 10)
    const result = executePlayerAction('attack', TEST_STORY, weakEnemyResult.battleState, TEST_STORY.variables, TEST_STORY.combatStats);
    
    expect(result.battleState.result).toBe('victory');
    expect(result.battleState.active).toBe(false);
    expect(result.messages).toContain('You defeated the Goblin Scout!');
  });
});

describe('executePlayerAction - magic', () => {
  it('magic costs 10 mana', () => {
    const battleResult = startBattle(TEST_STORY, 'goblin', undefined, TEST_STORY.variables);
    
    const result = executePlayerAction('magic', TEST_STORY, battleResult.battleState, TEST_STORY.variables, TEST_STORY.combatStats);
    
    // Mana should be 50 - 10 = 40
    expect(result.newVariables.mana).toBe(40);
  });
  
  it('magic deals damage minus magic defense', () => {
    const battleResult = startBattle(TEST_STORY, 'goblin', undefined, TEST_STORY.variables);
    
    const result = executePlayerAction('magic', TEST_STORY, battleResult.battleState, TEST_STORY.variables, TEST_STORY.combatStats);
    
    // Magic 10 - enemy magic defense 0 = 10 damage
    expect(result.battleState.enemy.hp).toBe(20);
  });
  
  it('cannot cast magic without enough mana', () => {
    const lowManaVars = { ...TEST_STORY.variables, mana: 5 };
    const battleResult = startBattle(TEST_STORY, 'goblin', undefined, lowManaVars);
    
    const result = executePlayerAction('magic', TEST_STORY, battleResult.battleState, lowManaVars, TEST_STORY.combatStats);
    
    expect(result.messages[0]).toContain('Not enough mana');
  });
});

describe('executePlayerAction - flee', () => {
  it.skip('can successfully flee', () => {
    const originalRandom = Math.random;
    Object.defineProperty(Math, 'random', {
      value: () => 0.1,
      writable: true,
      configurable: true,
    });
    
    const battleResult = startBattle(TEST_STORY, 'goblin', undefined, TEST_STORY.variables);
    const result = executePlayerAction('flee', TEST_STORY, battleResult.battleState, TEST_STORY.variables, TEST_STORY.combatStats);
    
    expect(result.battleState.result).toBe('escape');
    expect(result.battleState.active).toBe(false);
    
    Math.random = originalRandom;
  });
});
