import { parseStory } from './src/lib/parser';
import storyContent from './src/stories/goblin-cave.md?raw';

const story = parseStory(storyContent);
console.log('Battle_goblin scene:', JSON.stringify(story.scenes['battle_goblin'], null, 2));
console.log('Enemies:', JSON.stringify(story.enemies, null, 2));
