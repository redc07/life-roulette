export interface HabitEvent {
  id: string;
  name: string;
  type: 'positive' | 'negative';
  value: number; // base score, represented as "权重" in the UI
  color: string;
  emoji?: string;
}

export interface ActiveWheelItem {
  id: string; // instance ID on current wheel
  eventId: string; // original library item ID
  name: string;
  type: 'positive' | 'negative';
  value: number; // base score, represented as "权重" in the UI
  weight: number; // occupied grid count on current turn (out of 100), represented as "占格" in the UI
  color: string;
  emoji?: string;
}

export interface ProtagonistRecord {
  id: string;
  timestamp: string;
  eventName: string;
  type: 'positive' | 'negative';
  value: number; // score/weight of the event
  completed: boolean;
}

export interface SpinLog {
  id: string;
  timestamp: string;
  protagonistEventId: string;
  protagonistEventName: string;
  protagonistEventValue: number;
  randomNumber: number;
  expectedValue: number;
  totalChange: number;
  previousPoints: number;
  newPoints: number;
  eventBreakdown: Array<{
    name: string;
    weight: number; // 占格
    value: number; // 权重 score
    contribution: number;
  }>;
}

export interface PresetConfig {
  name: string;
  description: string;
  events: HabitEvent[];
}
