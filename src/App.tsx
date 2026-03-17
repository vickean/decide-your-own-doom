import { useState, useEffect } from 'react';
import { Story, GameState } from './lib/types';
import { parseStory, validateStory, renderSceneContent, extractSetCommands, applySetCommand } from './lib/parser';
import ReactMarkdown from 'react-markdown';
import storyContent from './stories/the-dark-cave.md?raw';

function App() {
  const [story, setStory] = useState<Story | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [validationResult, setValidationResult] = useState<{ errors: string[]; warnings: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const parsed = parseStory(storyContent);
      const validation = validateStory(parsed);
      setValidationResult(validation);
      setStory(parsed);
      setGameState({
        currentScene: parsed.start,
        variables: { ...parsed.variables },
        history: [],
        inventory: [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse story');
    }
  }, []);

  const handleChoice = (target: string, requires?: string[], removes?: string[]) => {
    if (!story || !gameState) return;

    if (requires) {
      for (const req of requires) {
        const hasItem = gameState.inventory.includes(req);
        const hasVar = gameState.variables[req] === true;
        if (!hasItem && !hasVar) return;
      }
    }

    let newVariables = { ...gameState.variables };
    let newInventory = [...gameState.inventory];

    const scene = story.scenes[gameState.currentScene];
    if (scene) {
      const setCommands = extractSetCommands(scene.content);
      for (const cmd of setCommands) {
        newVariables = applySetCommand(newVariables, cmd);
      }
    }

    if (removes) {
      for (const item of removes) {
        newInventory = newInventory.filter(i => i !== item);
        delete newVariables[item];
      }
    }

    setGameState({
      currentScene: target,
      variables: newVariables,
      history: [...gameState.history, gameState.currentScene],
      inventory: newInventory,
    });
  };

  const goBack = () => {
    if (!gameState || gameState.history.length === 0) return;
    const newHistory = [...gameState.history];
    const previousScene = newHistory.pop();
    if (previousScene) {
      setGameState({
        ...gameState,
        currentScene: previousScene,
        history: newHistory,
      });
    }
  };

  const restart = () => {
    if (!story) return;
    setGameState({
      currentScene: story.start,
      variables: { ...story.variables },
      history: [],
      inventory: [],
    });
  };

  if (error) {
    return (
      <div className="container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (!story || !gameState) {
    return <div className="container">Loading...</div>;
  }

  const currentScene = story.scenes[gameState.currentScene];
  if (!currentScene) {
    return (
      <div className="container">
        <div className="error">Scene not found: {gameState.currentScene}</div>
        <button onClick={restart}>Restart</button>
      </div>
    );
  }

  const renderedContent = renderSceneContent(
    currentScene.content,
    gameState.variables,
    gameState.inventory
  );

  const availableChoices = currentScene.choices.filter(choice => {
    if (!choice.requires) return true;
    for (const req of choice.requires) {
      const hasItem = gameState.inventory.includes(req);
      const hasVar = gameState.variables[req] === true;
      if (!hasItem && !hasVar) return false;
    }
    return true;
  });

  return (
    <div className="container">
      <header>
        <h1>{story.title}</h1>
      </header>

      {validationResult && validationResult.warnings.length > 0 && (
        <div className="warnings">
          {validationResult.warnings.map((w, i) => (
            <p key={i} className="warning">Warning: {w}</p>
          ))}
        </div>
      )}

      <main>
        <div className="scene">
          <div className="scene-content">
            <ReactMarkdown>{renderedContent}</ReactMarkdown>
          </div>
        </div>

        <div className="choices">
          {availableChoices.map((choice, index) => (
            <button
              key={index}
              className="choice-button"
              onClick={() => handleChoice(choice.target, choice.requires, choice.removes)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </main>

      <footer>
        <div className="debug-info">
          <h3>Game State</h3>
          <p>Scene: {gameState.currentScene}</p>
          <p>Variables: {JSON.stringify(gameState.variables)}</p>
          <p>Inventory: {JSON.stringify(gameState.inventory)}</p>
        </div>
        <div className="controls">
          <button onClick={goBack} disabled={gameState.history.length === 0}>
            Go Back
          </button>
          <button onClick={restart}>Restart</button>
        </div>
      </footer>
    </div>
  );
}

export default App;
