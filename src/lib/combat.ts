import { 
  Story, 
  EnemyDefinition, 
  EnemyInstance, 
  BattleState,
  CombatStatsMapping,
} from './types';
import { parseRange } from './parser';

export interface CombatResult {
  battleState: BattleState;
  messages: string[];
  newVariables: Record<string, number | boolean>;
}

export function startBattle(
  story: Story,
  enemyId: string,
  overrides?: Partial<EnemyDefinition>,
  currentVariables?: Record<string, number | boolean>
): CombatResult {
  const enemyDef = story.enemies?.[enemyId];
  if (!enemyDef) {
    return {
      battleState: { active: false, enemy: {} as EnemyInstance, turn: 'player', round: 0, defending: false, playerDefending: false },
      messages: [`Error: Enemy "${enemyId}" not found`],
      newVariables: currentVariables || {},
    };
  }
  
  const mergedEnemy = { ...enemyDef, ...overrides };
  
  const enemy: EnemyInstance = {
    id: enemyId,
    name: mergedEnemy.name,
    hp: parseRange(mergedEnemy.hp),
    maxHp: parseRange(mergedEnemy.hp),
    damage: parseRange(mergedEnemy.damage),
    magic: parseRange(mergedEnemy.magic || 0),
    magicDefense: parseRange(mergedEnemy.magicDefense || 0),
    defense: parseRange(mergedEnemy.defense || 0),
    strategy: mergedEnemy.strategy,
    respawn: mergedEnemy.respawn ?? true,
    defeated: false,
  };
  
  const battleState: BattleState = {
    active: true,
    enemy,
    turn: 'player',
    round: 1,
    defending: false,
    playerDefending: false,
  };
  
  return {
    battleState,
    messages: [`A ${enemy.name} appears!`],
    newVariables: currentVariables || {},
  };
}

export function executePlayerAction(
  action: 'attack' | 'magic' | 'defend' | 'flee',
  story: Story,
  battleState: BattleState,
  variables: Record<string, number | boolean>,
  combatStats?: CombatStatsMapping
): CombatResult {
  const messages: string[] = [];
  let newVariables = { ...variables };
  let newBattleState = { ...battleState };
  newBattleState.playerDefending = false;
  
  switch (action) {
    case 'attack': {
      const attackStat = combatStats?.attack ? (variables[combatStats.attack] as number) || 10 : 10;
      const enemy = newBattleState.enemy;
      let damage = Math.max(0, attackStat - enemy.defense);
      enemy.hp = Math.max(0, enemy.hp - damage);
      messages.push(`You attack for ${damage} damage!`);
      
      if (enemy.hp <= 0) {
        enemy.defeated = true;
        newBattleState.result = 'victory';
        newBattleState.active = false;
        messages.push(`You defeated the ${enemy.name}!`);
      }
      break;
    }
    
    case 'magic': {
      const magicStat = combatStats?.magic ? (variables[combatStats.magic] as number) || 10 : 10;
      const manaCost = 10;
      const currentMana = combatStats?.mana ? (variables[combatStats.mana] as number) || 0 : 0;
      
      if (currentMana < manaCost) {
        messages.push(`Not enough mana! Need ${manaCost}, have ${currentMana}`);
        return { battleState: newBattleState, messages, newVariables };
      }
      
      newVariables[combatStats?.mana || 'mana'] = currentMana - manaCost;
      
      const enemy = newBattleState.enemy;
      let damage = Math.max(0, magicStat - enemy.magicDefense);
      enemy.hp = Math.max(0, enemy.hp - damage);
      messages.push(`You cast a spell for ${damage} magic damage!`);
      
      if (enemy.hp <= 0) {
        enemy.defeated = true;
        newBattleState.result = 'victory';
        newBattleState.active = false;
        messages.push(`You defeated the ${enemy.name}!`);
      }
      break;
    }
    
    case 'defend': {
      newBattleState.playerDefending = true;
      messages.push('You take a defensive stance!');
      break;
    }
    
    case 'flee': {
      const fleeSuccess = Math.random() > 0.5;
      if (fleeSuccess) {
        newBattleState.result = 'escape';
        newBattleState.active = false;
        messages.push('You successfully fled from battle!');
      } else {
        messages.push('You failed to flee!');
      }
      break;
    }
  }
  
  if (newBattleState.active && newBattleState.result !== 'escape') {
    newBattleState.turn = 'enemy';
    const enemyResult = executeEnemyTurn(story, newBattleState, newVariables, combatStats);
    newVariables = enemyResult.newVariables;
    messages.push(...enemyResult.messages);
    newBattleState = enemyResult.battleState;
  }
  
  if (!newBattleState.active) {
    newBattleState.round = 0;
    newBattleState.turn = 'player';
  }
  
  return { battleState: newBattleState, messages, newVariables };
}

function executeEnemyTurn(
  story: Story,
  battleState: BattleState,
  variables: Record<string, number | boolean>,
  combatStats?: CombatStatsMapping
): CombatResult {
  const messages: string[] = [];
  let newVariables = { ...variables };
  const enemy = battleState.enemy;
  const strategy = story.strategies?.[enemy.strategy];
  
  let action: 'attack' | 'magic' | 'defend' = 'attack';
  
  if (strategy?.actions) {
    const actions = Object.entries(strategy.actions);
    const total = actions.reduce((sum, [, weight]) => sum + weight, 0);
    let rand = Math.random() * total;
    for (const [act, weight] of actions) {
      rand -= weight;
      if (rand <= 0) {
        action = act as 'attack' | 'magic' | 'defend';
        break;
      }
    }
  } else if (strategy?.priority && strategy.priority.length > 0) {
    action = strategy.priority[0] as 'attack' | 'magic' | 'defend';
  }
  
  if (enemy.magic === 0 || enemy.magic === undefined) {
    action = 'attack';
  }
  
  switch (action) {
    case 'attack': {
      const baseDamage = enemy.damage;
      const playerDefense = combatStats?.defense ? (variables[combatStats.defense] as number) || 0 : 0;
      let damage = Math.max(0, baseDamage - playerDefense);
      
      if (battleState.playerDefending) {
        damage = Math.floor(damage / 2);
        messages.push(`The ${enemy.name} attacks, but you defend! Taking ${damage} damage.`);
      } else {
        messages.push(`The ${enemy.name} attacks for ${damage} damage!`);
      }
      
      const healthVar = combatStats?.health || 'health';
      const currentHealth = (newVariables[healthVar] as number) || 0;
      newVariables[healthVar] = Math.max(0, currentHealth - damage);
      
      if ((newVariables[healthVar] as number) <= 0) {
        battleState.result = 'defeat';
        battleState.active = false;
        messages.push('You have been defeated!');
      }
      break;
    }
    
    case 'magic': {
      const baseDamage = enemy.magic || 0;
      const magicDefense = combatStats?.magicDefense ? (newVariables[combatStats.magicDefense] as number) || 0 : 0;
      let damage = Math.max(0, baseDamage - magicDefense);
      
      if (battleState.playerDefending) {
        damage = Math.floor(damage / 2);
        messages.push(`The ${enemy.name} casts a spell, but you defend! Taking ${damage} magic damage.`);
      } else {
        messages.push(`The ${enemy.name} casts a spell for ${damage} magic damage!`);
      }
      
      const healthVar = combatStats?.health || 'health';
      const currentHealth = (newVariables[healthVar] as number) || 0;
      newVariables[healthVar] = Math.max(0, currentHealth - damage);
      
      if ((newVariables[healthVar] as number) <= 0) {
        battleState.result = 'defeat';
        battleState.active = false;
        messages.push('You have been defeated!');
      }
      break;
    }
    
    case 'defend': {
      battleState.defending = true;
      messages.push(`The ${enemy.name} takes a defensive stance.`);
      break;
    }
  }
  
  if (battleState.active && battleState.result !== 'defeat') {
    battleState.turn = 'player';
    battleState.round++;
  }
  
  return { battleState, messages, newVariables };
}

export function getCombatStats(
  story: Story,
  variables: Record<string, number | boolean>
): { health: number; maxHealth: number; mana: number; maxMana: number; attack: number; magic: number; defense: number; magicDefense: number } {
  const stats = story.combatStats;
  
  return {
    health: stats?.health ? (variables[stats.health] as number) ?? 100 : (variables.health as number) ?? 100,
    maxHealth: stats?.maxHealth ? (variables[stats.maxHealth] as number) ?? 100 : (variables.max_health as number) ?? 100,
    mana: stats?.mana ? (variables[stats.mana] as number) ?? 50 : (variables.mana as number) ?? 50,
    maxMana: stats?.maxMana ? (variables[stats.maxMana] as number) ?? 50 : (variables.max_mana as number) ?? 50,
    attack: stats?.attack ? (variables[stats.attack] as number) ?? 10 : (variables.attack as number) ?? 10,
    magic: stats?.magic ? (variables[stats.magic] as number) ?? 10 : (variables.magic as number) ?? 10,
    defense: stats?.defense ? (variables[stats.defense] as number) ?? 5 : (variables.defense as number) ?? 5,
    magicDefense: stats?.magicDefense ? (variables[stats.magicDefense] as number) ?? 0 : (variables.magic_defense as number) ?? 0,
  };
}
