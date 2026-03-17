import { Story, Choice, ValidationResult, ENGINE_VERSION } from './types';

export function parseStory(content: string): Story {
  const lines = content.split('\n');
  
  let inFrontmatter = false;
  let frontmatter: Record<string, string> = {};
  let frontmatterVariables: Record<string, number | boolean> = {};
  let frontmatterBuffer: string[] = [];
  
  const scenes: Record<string, { id: string; content: string; choices: Choice[] }> = {};
  let currentSceneId: string | null = null;
  let currentContent: string[] = [];
  
  for (const line of lines) {
    if (line.trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
        continue;
      } else {
        inFrontmatter = false;
        for (const buf of frontmatterBuffer) {
          const colonIndex = buf.indexOf(':');
          if (colonIndex === -1) continue;
          const key = buf.slice(0, colonIndex).trim();
          const value = buf.slice(colonIndex + 1).trim();
          if (key === 'variables') continue;
          if (key && value) {
            frontmatter[key] = value;
          }
        }
        const varsLines = frontmatterBuffer.filter(b => b.trim().startsWith('has_key') || b.trim().startsWith('gold') || b.trim().startsWith('torch'));
        if (varsLines.length > 0) {
          const varsContent = varsLines.join(', ');
          frontmatterVariables = parseFrontmatterVariables(varsContent);
        } else {
          const varsLine = frontmatterBuffer.find(b => b.startsWith('variables:'));
          if (varsLine) {
            const varsContent = varsLine.replace('variables:', '').trim();
            if (varsContent) {
              frontmatterVariables = parseFrontmatterVariables(varsContent);
            }
          }
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
    };
  }
  
  return {
    title: frontmatter.title || 'Untitled Story',
    engine: frontmatter.engine || ENGINE_VERSION,
    start: frontmatter.start || Object.keys(scenes)[0] || 'start',
    variables: frontmatterVariables,
    scenes: scenes as Story['scenes'],
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

function prepareSceneContent(content: string): string {
  let processed = content;
  
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
