import { describe, it, expect } from 'vitest';
import { parseStory, validateStory, evaluateCondition, renderSceneContent, extractSetCommands, applySetCommand } from '../lib/parser';

const SAMPLE_STORY = `---
title: Test Story
engine: 1.0
start: start
variables:
  has_key: false,
  gold: 10
---

# start
You are at the beginning.

- [Go to middle](middle)
- [Go to end](end)

# middle
{if: has_key}
You have the key!
{else}
You need a key.
{/if}

- [Go back](start)

# end
{set: has_key = true}
You found the key!

- [Return to start](start)
`;

describe('parseStory', () => {
  it('parses frontmatter correctly', () => {
    const story = parseStory(SAMPLE_STORY);
    expect(story.title).toBe('Test Story');
    expect(story.engine).toBe('1.0');
    expect(story.start).toBe('start');
    expect(story.variables.has_key).toBe(false);
    expect(story.variables.gold).toBe(10);
  });

  it('parses scenes correctly', () => {
    const story = parseStory(SAMPLE_STORY);
    expect(Object.keys(story.scenes)).toContain('start');
    expect(Object.keys(story.scenes)).toContain('middle');
    expect(Object.keys(story.scenes)).toContain('end');
  });

  it('parses choices correctly', () => {
    const story = parseStory(SAMPLE_STORY);
    const startScene = story.scenes['start'];
    expect(startScene.choices).toHaveLength(2);
    expect(startScene.choices[0]).toEqual({
      label: 'Go to middle',
      target: 'middle',
      requires: undefined,
      removes: undefined,
    });
  });

  it('parses choice requirements', () => {
    const story = `---
title: Test
start: start
---

# start
- [Take key](get_key)[require: has_sword]

# get_key
You got the key.
`;
    const parsed = parseStory(story);
    expect(parsed.scenes['start'].choices[0].requires).toEqual(['has_sword']);
  });

  it('parses choice removals', () => {
    const story = `---
title: Test
start: start
---

# start
- [Use key](use_key)[remove: key]

# use_key
Key used.
`;
    const parsed = parseStory(story);
    expect(parsed.scenes['start'].choices[0].removes).toEqual(['key']);
  });
});

describe('validateStory', () => {
  it('returns error for missing start scene', () => {
    const story = parseStory(`---
title: Test
start: nonexistent
---

# scene1
Content here.
`);
    const result = validateStory(story);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Start scene "nonexistent" does not exist');
  });

  it('returns error for invalid scene references', () => {
    const story = parseStory(`---
title: Test
start: start
---

# start
- [Go to nowhere](fake_scene)
`);
    const result = validateStory(story);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('non-existent scene'))).toBe(true);
  });

  it('returns warning for circular references', () => {
    const story = parseStory(`---
title: Test
start: start
---

# start
- [Loop](middle)

# middle
- [Loop back](start)
`);
    const result = validateStory(story);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('evaluateCondition', () => {
  it('evaluates boolean variables', () => {
    expect(evaluateCondition('has_key', { has_key: true })).toBe(true);
    expect(evaluateCondition('has_key', { has_key: false })).toBe(false);
  });

  it('evaluates numeric comparisons', () => {
    expect(evaluateCondition('gold >= 10', { gold: 10 })).toBe(true);
    expect(evaluateCondition('gold >= 10', { gold: 5 })).toBe(false);
    expect(evaluateCondition('gold < 10', { gold: 5 })).toBe(true);
  });

  it('handles literal true/false', () => {
    expect(evaluateCondition('true', {})).toBe(true);
    expect(evaluateCondition('false', {})).toBe(false);
  });
});

describe('renderSceneContent', () => {
  it('renders conditional if block (true)', () => {
    const content = `{{IF:has_key}}You have the key{{ENDIF}}`;
    const result = renderSceneContent(content, { has_key: true }, []);
    expect(result).toBe('You have the key');
  });

  it('renders conditional if block (false)', () => {
    const content = `{{IF:has_key}}You have the key{{ENDIF}}`;
    const result = renderSceneContent(content, { has_key: false }, []);
    expect(result).toBe('');
  });

  it('renders if-else blocks', () => {
    const content = `{{IF:has_key}}Yes{{ELSE}}No{{ENDIF}}`;
    expect(renderSceneContent(content, { has_key: true }, [])).toBe('Yes');
    expect(renderSceneContent(content, { has_key: false }, [])).toBe('No');
  });

  it('removes set commands', () => {
    const content = `Text {{SET:gold = 10}} after.`;
    const result = renderSceneContent(content, {}, []);
    expect(result).toBe('Text  after.');
  });

  it('removes choice links from content', () => {
    const content = `Some text

- [Go here](somewhere)

More text.`;
    const result = renderSceneContent(content, {}, []);
    expect(result).not.toContain('[Go here]');
    expect(result).toContain('Some text');
  });
});

describe('extractSetCommands', () => {
  it('extracts set commands', () => {
    const content = `{{SET:gold += 10}}{{SET:has_key = true}}`;
    const commands = extractSetCommands(content);
    expect(commands).toEqual(['gold += 10', 'has_key = true']);
  });
});

describe('applySetCommand', () => {
  it('sets boolean values', () => {
    const result = applySetCommand({}, 'has_key = true');
    expect(result.has_key).toBe(true);
  });

  it('sets numeric values', () => {
    const result = applySetCommand({}, 'gold = 10');
    expect(result.gold).toBe(10);
  });

  it('adds to numeric values', () => {
    const result = applySetCommand({ gold: 5 }, 'gold += 10');
    expect(result.gold).toBe(15);
  });

  it('subtracts from numeric values', () => {
    const result = applySetCommand({ gold: 10 }, 'gold -= 3');
    expect(result.gold).toBe(7);
  });
});
