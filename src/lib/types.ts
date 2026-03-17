export interface Story {
  title: string;
  engine: string;
  start: string;
  variables: Record<string, number | boolean>;
  scenes: Record<string, Scene>;
}

export interface Scene {
  id: string;
  content: string;
  choices: Choice[];
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
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const ENGINE_VERSION = '1.0';
