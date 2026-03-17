export interface Story {
  title: string;
  engine: string;
  start: string;
  variables: Record<string, number | boolean>;
  scenes: Record<string, Scene>;
  enemies?: Record<string, EnemyDefinition>;
  strategies?: Record<string, StrategyDefinition>;
  combatStats?: CombatStatsMapping;
}

export interface Scene {
  id: string;
  content: string;
  choices: Choice[];
  battle?: BattleTrigger;
}

export interface Choice {
  label: string;
  target: string;
  condition?: string;
  requires?: string[];
  removes?: string[];
}

export interface GameState {
  currentScene: string;
  variables: Record<string, number | boolean>;
  history: string[];
  inventory: string[];
  battle?: BattleState;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const ENGINE_VERSION = '1.0';

// Combat Types

export interface EnemyDefinition {
  name: string;
  hp: string | number;
  damage: string | number;
  magic?: string | number;
  magicDefense?: string | number;
  defense?: string | number;
  strategy: string;
  respawn?: boolean;
  items?: string[];
}

export interface StrategyDefinition {
  priority?: string[];
  actions?: Record<string, number>;
}

export interface CombatStatsMapping {
  health: string;
  maxHealth: string;
  mana?: string;
  maxMana?: string;
  attack: string;
  magic?: string;
  magicDefense?: string;
  defense?: string;
}

export interface BattleTrigger {
  enemyId: string;
  overrides?: Partial<EnemyDefinition>;
}

export interface EnemyInstance {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  damage: number;
  magic: number;
  magicDefense: number;
  defense: number;
  strategy: string;
  respawn: boolean;
  defeated: boolean;
}

export interface BattleState {
  active: boolean;
  enemy: EnemyInstance;
  turn: 'player' | 'enemy';
  round: number;
  defending: boolean;
  playerDefending: boolean;
  result?: 'victory' | 'defeat' | 'escape';
}

export type BattleAction = 'attack' | 'magic' | 'defend' | 'flee' | 'item';

export interface CombatAction {
  type: BattleAction;
  label: string;
  target: string;
  requires?: string[];
  removes?: string[];
  manaCost?: number;
  healAmount?: number;
  damageMultiplier?: number;
}
