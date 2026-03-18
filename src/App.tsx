import { useState, useEffect } from 'react';
import { Story, GameState, BattleState } from './lib/types';
import { parseStory, validateStory, renderSceneContent, extractSetCommands, applySetCommand } from './lib/parser';
import { startBattle } from './lib/combat';
import ReactMarkdown from 'react-markdown';
import { Battle } from './components/Battle';
import storyContent from './stories/goblin-cave.md?raw';

function App() {
  const [story, setStory] = useState<Story | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [validationResult, setValidationResult] = useState<{ errors: string[]; warnings: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [battleState, setBattleState] = useState<BattleState | null>(null);

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

    if (battleState?.active) return;

    if (requires) {
      for (const req of requires) {
        const hasItem = gameState.inventory.includes(req);
        const hasVar = gameState.variables[req] === true;
        if (!hasItem && !hasVar) return;
      }
    }

    let newVariables = { ...gameState.variables };
    let newInventory = [...gameState.inventory];

    const targetScene = story.scenes[target];
    if (targetScene) {
      const setCommands = extractSetCommands(targetScene.content);
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

    const nextScene = story.scenes[target];
    console.log('[App] Navigating to:', target, 'Has battle:', !!nextScene?.battle);
    
    if (nextScene?.battle) {
      console.log('[App] Starting battle with enemy:', nextScene.battle.enemyId);
      const battleResult = startBattle(
        story,
        nextScene.battle.enemyId,
        nextScene.battle.overrides,
        newVariables
      );
      console.log('[App] Battle result:', battleResult.battleState.active, battleResult.battleState.enemy.name);
      setBattleState(battleResult.battleState);
    }

    setGameState({
      currentScene: target,
      variables: newVariables,
      history: [...gameState.history, gameState.currentScene],
      inventory: newInventory,
    });
  };

  const handleBattleEnd = (result: 'victory' | 'defeat' | 'escape', newVariables: Record<string, number | boolean>) => {
    if (!story || !gameState) return;
    
    const currentScene = story.scenes[gameState.currentScene];
    let resultScene = gameState.currentScene;
    
    if (result === 'victory') {
      resultScene = currentScene.id + '_victory';
      if (!story.scenes[resultScene]) {
        resultScene = 'victory';
      }
    } else if (result === 'defeat') {
      resultScene = currentScene.id + '_defeat';
      if (!story.scenes[resultScene]) {
        resultScene = 'defeat';
      }
    } else if (result === 'escape') {
      resultScene = currentScene.id + '_escape';
      if (!story.scenes[resultScene]) {
        resultScene = 'escape';
      }
    }
    
    if (story.scenes[resultScene]) {
      const setCommands = extractSetCommands(story.scenes[resultScene].content);
      for (const cmd of setCommands) {
        newVariables = applySetCommand(newVariables, cmd);
      }
    }
    
    setGameState({
      currentScene: story.scenes[resultScene] ? resultScene : gameState.currentScene,
      variables: newVariables,
      history: [...gameState.history],
      inventory: gameState.inventory,
    });
    setBattleState(null);
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
    setBattleState(null);
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

      <main>
        {battleState?.active && story && (
          <>
            {console.log('[App] Rendering Battle with:', { battleState: battleState, variables: gameState.variables })}
            <Battle
              story={story}
              battleState={battleState}
              variables={gameState.variables}
              onBattleEnd={handleBattleEnd}
            />
          </>
        )}

        {!battleState?.active && (
          <>
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
          </>
        )}
      </main>

      <footer>
        <div className="debug-info" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
          <h3>Game State</h3>
          <p>Scene: {gameState.currentScene}</p>
          <p>Variables: {JSON.stringify(gameState.variables, null, 2)}</p>
          <p>Inventory: {JSON.stringify(gameState.inventory, null, 2)}</p>
        </div>
        {validationResult && validationResult.warnings.length > 0 && (
          <div className="warnings">
            {validationResult.warnings.map((w, i) => (
              <p key={i} className="warning">Warning: {w}</p>
            ))}
          </div>
        )}
        <div className="controls">
          <button onClick={goBack} disabled={gameState.history.length === 0 || battleState?.active}>
            Go Back
          </button>
          <button onClick={restart}>Restart</button>
        </div>
      </footer>
    </div>
  );
}

export default App;
