import { Story, Choice, ValidationResult, ENGINE_VERSION, EnemyDefinition, StrategyDefinition, BattleTrigger } from './types';

export function parseStory(content: string): Story {
  const lines = content.split('\n');
  
  let inFrontmatter = false;
  let frontmatter: Record<string, string> = {};
  let frontmatterVariables: Record<string, number | boolean> = {};
  let frontmatterBuffer: string[] = [];
  let enemies: Record<string, EnemyDefinition> = {};
  let strategies: Record<string, StrategyDefinition> = {};
  let combatStats: Record<string, string> = {};
  
  const scenes: Record<string, { id: string; content: string; choices: Choice[]; battle?: BattleTrigger }> = {};
  let currentSceneId: string | null = null;
  let currentContent: string[] = [];
  
  for (const line of lines) {
    if (line.trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
        continue;
      } else {
        inFrontmatter = false;
        
        // Parse simple frontmatter fields (title, engine, start)
        for (const buf of frontmatterBuffer) {
          const trimmed = buf.trim();
          
          // Skip special sections
          if (trimmed.startsWith('variables:') || 
              trimmed.startsWith('enemies:') || 
              trimmed.startsWith('strategies:') ||
              trimmed.startsWith('combat_stats:')) {
            continue;
          }
          
          const colonIndex = buf.indexOf(':');
          if (colonIndex === -1) continue;
          
          const key = buf.slice(0, colonIndex).trim();
          const value = buf.slice(colonIndex + 1).trim();
          
          if (key && value) {
            frontmatter[key] = value;
          }
        }
        
        // Parse variables section
        const varsSection = frontmatterBuffer.find(b => b.trim().startsWith('variables:'));
        if (varsSection) {
          const varsStart = frontmatterBuffer.indexOf(varsSection);
          const varsLines: string[] = [];
          
          for (let i = varsStart + 1; i < frontmatterBuffer.length; i++) {
            const line = frontmatterBuffer[i];
            // Stop if we hit another section
            if (line.match(/^[a-z_]+:/i) && !line.trim().startsWith('variables:')) {
              break;
            }
            if (line.trim()) {
              varsLines.push(line.trim());
            }
          }
          
          if (varsLines.length > 0) {
            frontmatterVariables = parseFrontmatterVariables(varsLines.join(', '));
          }
        }
        
        // Parse enemies section
        const enemiesSection = frontmatterBuffer.find(b => b.trim().startsWith('enemies:'));
        if (enemiesSection) {
          enemies = parseEnemies(frontmatterBuffer);
        }
        
        // Parse strategies section
        const strategiesSection = frontmatterBuffer.find(b => b.trim().startsWith('strategies:'));
        if (strategiesSection) {
          strategies = parseStrategies(frontmatterBuffer);
        }
        
        // Parse combat_stats section
        const combatStatsSection = frontmatterBuffer.find(b => b.trim().startsWith('combat_stats:'));
        if (combatStatsSection) {
          combatStats = parseCombatStats(frontmatterBuffer);
        }
        
        frontmatterBuffer = [];
        continue;
      }
    }
    
    if (inFrontmatter) {
      frontmatterBuffer.push(line);
      continue;
    }
    
    const sceneMatch = line.match(/^#\s+(\w+)/);
    if (sceneMatch) {
      if (currentSceneId) {
        scenes[currentSceneId] = {
          id: currentSceneId,
          content: prepareSceneContent(currentContent.join('\n')),
          choices: parseChoices(currentContent.join('\n')),
          battle: parseBattleTrigger(currentContent.join('\n')),
        };
      }
      currentSceneId = sceneMatch[1];
      currentContent = [];
      continue;
    }
    
    if (currentSceneId) {
      currentContent.push(line);
    }
  }
  
  if (currentSceneId) {
    scenes[currentSceneId] = {
      id: currentSceneId,
      content: prepareSceneContent(currentContent.join('\n')),
      choices: parseChoices(currentContent.join('\n')),
      battle: parseBattleTrigger(currentContent.join('\n')),
    };
  }
  
  return {
    title: frontmatter.title || 'Untitled Story',
    engine: frontmatter.engine || ENGINE_VERSION,
    start: frontmatter.start || Object.keys(scenes)[0] || 'start',
    variables: frontmatterVariables,
    scenes: scenes as Story['scenes'],
    enemies: Object.keys(enemies).length > 0 ? enemies : undefined,
    strategies: Object.keys(strategies).length > 0 ? strategies : undefined,
    combatStats: Object.keys(combatStats).length > 0 ? combatStats as any : undefined,
  };
}

function parseFrontmatterVariables(varsContent: string): Record<string, number | boolean> {
  const result: Record<string, number | boolean> = {};
  const pairs = varsContent.split(',');
  for (const pair of pairs) {
    const colonIndex = pair.indexOf(':');
    if (colonIndex === -1) continue;
    const key = pair.slice(0, colonIndex).trim();
    const value = pair.slice(colonIndex + 1).trim();
    if (!key) continue;
    if (value === 'true') result[key] = true;
    else if (value === 'false') result[key] = false;
    else result[key] = parseFloat(value) || 0;
  }
  return result;
}

function parseEnemies(buffer: string[]): Record<string, EnemyDefinition> {
  const result: Record<string, EnemyDefinition> = {};
  
  const startIdx = buffer.findIndex(b => b.trim().startsWith('enemies:'));
  if (startIdx === -1) return result;
  
  const sectionEnds: number[] = [];
  for (let i = startIdx + 1; i < buffer.length; i++) {
    const trimmed = buffer[i].trim();
    if (trimmed.match(/^(strategies|combat_stats):/)) {
      sectionEnds.push(i);
    }
  }
  const endIdx = sectionEnds.length > 0 ? sectionEnds[0] : buffer.length;
  
  let currentEnemy: string | null = null;
  let currentProps: Record<string, string> = {};
  
  for (let i = startIdx + 1; i < endIdx; i++) {
    const line = buffer[i];
    const trimmed = line.trim();
    
    const enemyMatch = trimmed.match(/^(\w+):$/);
    if (enemyMatch) {
      if (currentEnemy && Object.keys(currentProps).length > 0) {
        result[currentEnemy] = parseEnemyProperties(currentProps);
      }
      currentEnemy = enemyMatch[1];
      currentProps = {};
      continue;
    }
    
    if (currentEnemy && trimmed.length > 0) {
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.slice(0, colonIndex).trim();
        const value = trimmed.slice(colonIndex + 1).trim();
        currentProps[key] = value;
      }
    }
  }
  
  if (currentEnemy && Object.keys(currentProps).length > 0) {
    result[currentEnemy] = parseEnemyProperties(currentProps);
  }
  
  return result;
}

function parseEnemyProperties(props: Record<string, string>): EnemyDefinition {
  return {
    name: props.name || 'Unknown',
    hp: parseNumericOrString(props.hp) || 10,
    damage: parseNumericOrString(props.damage) || 5,
    magic: props.magic ? parseNumericOrString(props.magic) : undefined,
    magicDefense: props.magic_defense ? parseNumericOrString(props.magic_defense) : undefined,
    defense: props.defense ? parseNumericOrString(props.defense) : undefined,
    strategy: props.strategy || 'aggressive',
    respawn: props.respawn !== 'false',
    items: props.items ? props.items.split(',').map(s => s.trim()) : undefined,
  };
}

function parseNumericOrString(value: string | undefined): string | number | undefined {
  if (!value) return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? value : num;
}

function parseStrategies(buffer: string[]): Record<string, StrategyDefinition> {
  const result: Record<string, StrategyDefinition> = {};
  
  const startIdx = buffer.findIndex(b => b.trim().startsWith('strategies:'));
  if (startIdx === -1) return result;
  
  const sectionEnds: number[] = [];
  for (let i = startIdx + 1; i < buffer.length; i++) {
    const trimmed = buffer[i].trim();
    if (trimmed.match(/^combat_stats:/)) {
      sectionEnds.push(i);
    }
  }
  const endIdx = sectionEnds.length > 0 ? sectionEnds[0] : buffer.length;
  
  let currentStrategy: string | null = null;
  let currentProps: Record<string, string> = {};
  
  for (let i = startIdx + 1; i < endIdx; i++) {
    const line = buffer[i];
    const trimmed = line.trim();
    
    const strategyMatch = trimmed.match(/^(\w+):$/);
    if (strategyMatch) {
      if (currentStrategy && Object.keys(currentProps).length > 0) {
        result[currentStrategy] = parseStrategyProperties(currentProps);
      }
      currentStrategy = strategyMatch[1];
      currentProps = {};
      continue;
    }
    
    if (currentStrategy && trimmed.length > 0) {
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.slice(0, colonIndex).trim();
        const value = trimmed.slice(colonIndex + 1).trim();
        currentProps[key] = value;
      }
    }
  }
  
  if (currentStrategy && Object.keys(currentProps).length > 0) {
    result[currentStrategy] = parseStrategyProperties(currentProps);
  }
  
  return result;
}

function parseStrategyProperties(props: Record<string, string>): StrategyDefinition {
  const strategy: StrategyDefinition = {};
  
  if (props.priority) {
    strategy.priority = props.priority.split(',').map(s => s.trim());
  }
  
  if (props.actions) {
    strategy.actions = {};
    const actionPairs = props.actions.split(',');
    for (const pair of actionPairs) {
      const [action, weight] = pair.split(':').map(s => s.trim());
      if (action && weight) {
        strategy.actions[action] = parseFloat(weight) || 0;
      }
    }
  }
  
  return strategy;
}

function parseCombatStats(buffer: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Find the combat_stats section
  const startIdx = buffer.findIndex(b => b.trim().startsWith('combat_stats:'));
  if (startIdx === -1) return result;
  
  for (let i = startIdx + 1; i < buffer.length; i++) {
    const line = buffer[i];
    const trimmed = line.trim();
    
    // Stop if we hit another top-level section
    if (trimmed.match(/^[a-z_]+:$/i) && !trimmed.startsWith('combat_stats:')) {
      break;
    }
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();
      result[key] = value;
    }
  }
  
  return result;
}

function parseBattleTrigger(content: string): BattleTrigger | undefined {
  const battleMatch = content.match(/\{battle:\s*(\w+)(?:\s+with\s+(.*?))?\}/);
  if (!battleMatch) return undefined;
  
  const enemyId = battleMatch[1];
  const overridesStr = battleMatch[2];
  
  const overrides: Record<string, string | number> = {};
  if (overridesStr) {
    const pairs = overridesStr.split(',');
    for (const pair of pairs) {
      const [key, value] = pair.split(':').map(s => s.trim());
      if (key && value) {
        overrides[key] = parseNumericOrString(value) as string | number;
      }
    }
  }
  
  return {
    enemyId,
    overrides: Object.keys(overrides).length > 0 ? overrides as any : undefined,
  };
}

function prepareSceneContent(content: string): string {
  let processed = content;
  
  processed = processed.replace(/\{battle:\s*\w+(?:\s+with\s+.*?)?\}/g, '');
  
  processed = processed.replace(/\{if:\s*([^}]+)\}([\s\S]*?)\{else\}([\s\S]*?)\{\/if\}/g, (_, condition, ifBody, elseBody) => {
    return `{{IF:${condition}}}${ifBody}{{ELSE}}${elseBody}{{ENDIF}}`;
  });
  
  processed = processed.replace(/\{if:\s*([^}]+)\}([\s\S]*?)\{\/if\}/g, (_, condition, body) => {
    return `{{IF:${condition}}}${body}{{ENDIF}}`;
  });
  
  processed = processed.replace(/\{set:\s*([^}]+)\}/g, (_, assignment) => {
    return `{{SET:${assignment}}}`;
  });
  
  return processed;
}

function parseChoices(content: string): Choice[] {
  const choices: Choice[] = [];
  const choiceRegex = /-\s*\[([^\]]+)\]\(([^)]+)\)(?:\[require:\s*([^\]]+)\])?(?:\[remove:\s*([^\]]+)\])?/g;
  
  let match;
  while ((match = choiceRegex.exec(content)) !== null) {
    const label = match[1];
    const target = match[2];
    const requires = match[3] ? match[3].split(',').map(s => s.trim()) : undefined;
    const removes = match[4] ? match[4].split(',').map(s => s.trim()) : undefined;
    
    choices.push({ label, target, requires, removes });
  }
  
  return choices;
}

export function validateStory(story: Story): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!story.start) {
    errors.push('Story is missing a start scene');
  } else if (!story.scenes[story.start]) {
    errors.push(`Start scene "${story.start}" does not exist`);
  }
  
  const sceneIds = new Set(Object.keys(story.scenes));
  
  for (const [sceneId, scene] of Object.entries(story.scenes)) {
    for (const choice of scene.choices) {
      if (!sceneIds.has(choice.target)) {
        errors.push(`Scene "${sceneId}" references non-existent scene "${choice.target}"`);
      }
    }
    
    if (scene.battle && story.enemies) {
      if (!story.enemies[scene.battle.enemyId]) {
        errors.push(`Scene "${sceneId}" references undefined enemy "${scene.battle.enemyId}"`);
      }
    }
  }
  
  if (story.enemies) {
    for (const [enemyId, enemy] of Object.entries(story.enemies)) {
      if (enemy.strategy && story.strategies && !story.strategies[enemy.strategy]) {
        warnings.push(`Enemy "${enemyId}" uses undefined strategy "${enemy.strategy}"`);
      }
    }
  }
  
  const visited = new Set<string>();
  const stack = [story.start];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) {
      warnings.push(`Circular reference detected involving scene "${current}"`);
      continue;
    }
    visited.add(current);
    const scene = story.scenes[current];
    if (scene) {
      for (const choice of scene.choices) {
        if (sceneIds.has(choice.target)) {
          stack.push(choice.target);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function evaluateCondition(condition: string, variables: Record<string, number | boolean>): boolean {
  const trimmed = condition.trim();
  
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  
  const boolVar = variables[trimmed];
  if (typeof boolVar === 'boolean') return boolVar;
  if (typeof boolVar === 'number') return boolVar !== 0;
  
  const match = trimmed.match(/^(\w+)\s*>=\s*(\d+)$/);
  if (match) {
    const [, varName, threshold] = match;
    const val = variables[varName];
    return typeof val === 'number' && val >= parseInt(threshold, 10);
  }
  
  const matchLt = trimmed.match(/^(\w+)\s*<\s*(\d+)$/);
  if (matchLt) {
    const [, varName, threshold] = matchLt;
    const val = variables[varName];
    return typeof val === 'number' && val < parseInt(threshold, 10);
  }
  
  return false;
}

export function renderSceneContent(
  content: string,
  variables: Record<string, number | boolean>,
  _inventory: string[]
): string {
  let processed = content;
  
  processed = processed.replace(/\{battle:\s*\w+(?:\s+with\s+.*?)?\}/g, '');
  
  processed = processed.replace(/\{\{IF:([^}]+)\}\}([\s\S]*?)\{\{ELSE\}\}([\s\S]*?)\{\{ENDIF\}\}/g, (_, condition, ifBody, elseBody) => {
    return evaluateCondition(condition, variables) ? ifBody : elseBody;
  });
  
  processed = processed.replace(/\{\{IF:([^}]+)\}\}([\s\S]*?)\{\{ENDIF\}\}/g, (_, condition, body) => {
    return evaluateCondition(condition, variables) ? body : '';
  });
  
  processed = processed.replace(/\{\{SET:([^}]+)\}\}/g, '');
  
  processed = processed.replace(/^-\s*\[[^\]]+\]\([^)]+\)(?:\[require:[^\]]+\])?(?:\[remove:[^\]]+\])?\s*$/gm, '');
  
  processed = processed.replace(/\n{3,}/g, '\n\n');
  
  return processed.trim();
}

export function extractSetCommands(content: string): string[] {
  const commands: string[] = [];
  const setRegex = /\{\{SET:([^}]+)\}\}/g;
  let match;
  while ((match = setRegex.exec(content)) !== null) {
    commands.push(match[1]);
  }
  return commands;
}

export function applySetCommand(
  variables: Record<string, number | boolean>,
  command: string
): Record<string, number | boolean> {
  const newVars = { ...variables };
  const match = command.match(/^(\w+)\s*(\+=|-=|=)\s*(.+)$/);
  if (match) {
    const [, varName, op, valueStr] = match;
    const currentValue = newVars[varName] ?? 0;
    
    if (op === '=') {
      if (valueStr === 'true') newVars[varName] = true;
      else if (valueStr === 'false') newVars[varName] = false;
      else newVars[varName] = parseFloat(valueStr) || 0;
    } else if (op === '+=') {
      const delta = parseFloat(valueStr) || 0;
      newVars[varName] = (typeof currentValue === 'number' ? currentValue : 0) + delta;
    } else if (op === '-=') {
      const delta = parseFloat(valueStr) || 0;
      newVars[varName] = (typeof currentValue === 'number' ? currentValue : 0) - delta;
    }
  }
  return newVars;
}

export function parseRange(value: string | number): number {
  if (typeof value === 'number') return value;
  
  if (typeof value === 'string' && value.includes('-')) {
    const [min, max] = value.split('-').map(s => parseFloat(s.trim()));
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  return parseFloat(value) || 0;
}
