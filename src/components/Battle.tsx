import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress';
import { BattleState, Story } from '@/lib/types';
import { getCombatStats, executePlayerAction, startBattle } from '@/lib/combat';

interface BattleProps {
  story: Story;
  battleState: BattleState;
  variables: Record<string, number | boolean>;
  onBattleEnd: (result: 'victory' | 'defeat' | 'escape', newVariables: Record<string, number | boolean>) => void;
}

export function Battle({ story, battleState, variables: initialVariables, onBattleEnd }: BattleProps) {
  const [messages, setMessages] = useState<string[]>(() => {
    const result = startBattle(story, battleState.enemy.id);
    return result.messages;
  });
  const [currentBattle, setCurrentBattle] = useState(battleState);
  const [currentVariables, setCurrentVariables] = useState(initialVariables);
  const [isActing, setIsActing] = useState(false);
  
  const combatStats = getCombatStats(story, currentVariables);
  
  const enemy = currentBattle.enemy;
  const enemyHealthPercent = (enemy.hp / enemy.maxHp) * 100;
  const playerHealthPercent = (combatStats.health / combatStats.maxHealth) * 100;
  const playerManaPercent = (combatStats.mana / combatStats.maxMana) * 100;
  
  const handleAction = async (action: 'attack' | 'magic' | 'defend' | 'flee') => {
    setIsActing(true);
    
    const result = executePlayerAction(
      action,
      story,
      currentBattle,
      currentVariables,
      story.combatStats
    );
    
    setMessages(prev => [...prev, ...result.messages]);
    setCurrentBattle(result.battleState);
    setCurrentVariables(result.newVariables);
    
    if (!result.battleState.active && result.battleState.result) {
      setTimeout(() => {
        onBattleEnd(result.battleState.result!, result.newVariables);
      }, 1500);
    }
    
    setIsActing(false);
  };
  
  const getHealthColor = (percent: number) => {
    if (percent > 60) return 'bg-green-500';
    if (percent > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const resultMessages: Record<string, string> = {
    victory: `Victory! You defeated the ${enemy.name}!`,
    defeat: 'Defeat! You have been slain...',
    escape: 'Escaped successfully!',
  };

  if (!currentBattle.active && currentBattle.result) {
    return (
      <Card className="mb-4 border-4 border-yellow-500 bg-slate-900">
        <CardContent className="py-12 text-center">
          <div className="text-6xl mb-4">
            {currentBattle.result === 'victory' && '🎉'}
            {currentBattle.result === 'defeat' && '💀'}
            {currentBattle.result === 'escape' && '🏃'}
          </div>
          <h2 className="text-5xl font-bold mb-4 text-yellow-400">
            {currentBattle.result === 'victory' ? 'VICTORY' : currentBattle.result === 'defeat' ? 'DEFEAT' : 'ESCAPED'}
          </h2>
          <p className="text-2xl text-slate-300">{resultMessages[currentBattle.result]}</p>
          <p className="text-lg text-slate-500 mt-4">Loading next scene...</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4 border-4 border-slate-700 bg-gradient-to-b from-emerald-900 to-slate-900 relative overflow-hidden" role="region" aria-label="Battle Screen">
      <CardContent className="p-0 relative" style={{ aspectRatio: '4/3' }}>
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-300/20 via-transparent to-slate-900/80 pointer-events-none" aria-hidden="true" />
        
        {/* Enemy Sprite - Top Right */}
        <div className="absolute top-[10%] right-[10%] flex flex-col items-center" role="img" aria-label={`Enemy: ${enemy.name}`}>
          <div className="text-8xl filter drop-shadow-lg" aria-hidden="true">{enemy.hp > 0 ? '👹' : '💫'}</div>
        </div>
        
        {/* Enemy HUD - Top Left */}
        <div 
          className="absolute bg-slate-800 border-2 border-slate-600 rounded-lg min-w-[220px]" 
          role="status" 
          aria-label="Enemy Status"
          style={{ 
            top: '8%', 
            left: '4%', 
            padding: '16px' 
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-bold text-slate-200" aria-label="Enemy Name">{enemy.name}</span>
            <span className="text-sm text-slate-400" aria-label="Enemy Level">Lv.{enemy.damage * 2}</span>
          </div>
          <div className="text-sm text-slate-400 mb-1" aria-hidden="true">HP</div>
          <Progress value={enemyHealthPercent} className="h-4 bg-slate-950" aria-label={`Enemy HP: ${enemy.hp} of ${enemy.maxHp}`}>
            <ProgressTrack className="h-4 border-2 border-slate-500">
              <ProgressIndicator className={`${getHealthColor(enemyHealthPercent)}`} />
            </ProgressTrack>
          </Progress>
          <div className="text-base text-right mt-1 text-slate-300" aria-label="Enemy HP Values">
            {enemy.hp}/{enemy.maxHp}
          </div>
        </div>
        
        {/* Player Sprite - Bottom Left (back view) */}
        <div className="absolute bottom-[30%] left-[8%] flex flex-col items-center" role="img" aria-label="Player Character">
          <div className="text-9xl filter drop-shadow-lg scale-x-[-1]" aria-hidden="true">🧙</div>
          <div className="w-20 h-1 bg-slate-800/50 rounded-full mt-[-6px]" aria-hidden="true" />
        </div>
        
        {/* Player HUD - Bottom Right */}
        <div 
          className="absolute bg-slate-800 border-2 border-slate-600 rounded-lg min-w-[240px]" 
          role="status" 
          aria-label="Player Status"
          style={{ 
            bottom: '22%', 
            right: '4%', 
            padding: '16px',
            marginBottom: '30px'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-bold text-green-400" aria-label="Player Name">PLAYER</span>
            <span className="text-sm text-slate-400" aria-label="Player Level">Lv.{combatStats.attack * 2}</span>
          </div>
          <div className="text-sm text-slate-400 mb-1" aria-hidden="true">HP</div>
          <Progress value={playerHealthPercent} className="h-4 bg-slate-950" aria-label={`Player HP: ${combatStats.health} of ${combatStats.maxHealth}`}>
            <ProgressTrack className="h-4 border-2 border-slate-500">
              <ProgressIndicator className={`${getHealthColor(playerHealthPercent)}`} />
            </ProgressTrack>
          </Progress>
          <div className="text-base text-right mt-1 text-slate-300" aria-label="Player HP Values">
            {combatStats.health}/{combatStats.maxHealth}
          </div>
          <div className="mt-3">
            <div className="text-sm text-blue-400 mb-1" aria-hidden="true">MP</div>
            <Progress value={playerManaPercent} className="h-4 bg-slate-950" aria-label={`Player MP: ${combatStats.mana} of ${combatStats.maxMana}`}>
              <ProgressTrack className="h-4 border-2 border-slate-500">
                <ProgressIndicator className="bg-blue-500" />
              </ProgressTrack>
            </Progress>
            <div className="text-base text-right mt-1 text-blue-300" aria-label="Player MP Values">
              {combatStats.mana}/{combatStats.maxMana}
            </div>
          </div>
        </div>
        
        {/* Control Bar - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-slate-800 border-t-4 border-slate-600 flex" role="navigation" aria-label="Battle Controls">
          {/* Dialogue Box - Left */}
          <div className="flex-1 border-r-4 border-slate-600 p-3 flex items-center" role="log" aria-live="polite" aria-label="Battle Message">
            <p className="text-base text-slate-200 leading-relaxed">
              {messages.length > 0 ? messages[messages.length - 1] : 'Choose your action!'}
            </p>
          </div>
          {/* Action Menu - Right (2x2 grid) */}
          <div className="w-[45%] p-2 grid grid-cols-2 gap-2" role="group" aria-label="Action Buttons">
            <Button 
              onClick={() => handleAction('attack')}
              disabled={isActing || currentBattle.turn !== 'player'}
              variant="destructive"
              className="h-full text-sm font-bold"
              aria-label="Attack"
            >
              🗡️ ATTACK
            </Button>
            <Button 
              onClick={() => handleAction('magic')}
              disabled={isActing || currentBattle.turn !== 'player' || combatStats.mana < 10}
              className="h-full text-sm font-bold bg-blue-600 hover:bg-blue-700"
              aria-label="Magic (costs 10 MP)"
            >
              ✨ MAGIC
            </Button>
            <Button 
              onClick={() => handleAction('defend')}
              disabled={isActing || currentBattle.turn !== 'player'}
              variant="secondary"
              className="h-full text-sm font-bold"
              aria-label="Defend"
            >
              🛡️ DEFEND
            </Button>
            <Button 
              onClick={() => handleAction('flee')}
              disabled={isActing || currentBattle.turn !== 'player'}
              variant="outline"
              className="h-full text-sm font-bold border-slate-500 text-slate-300 hover:bg-slate-700"
              aria-label="Flee"
            >
              🏃 FLEE
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
