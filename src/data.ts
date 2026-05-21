import { HabitEvent } from './types';

export const DEFAULT_LIBRARY: HabitEvent[] = [
  {
    id: 'ex-1',
    name: '早睡早起',
    type: 'positive',
    value: 5,
    color: '#6366f1', // Indigo
    emoji: '🌅',
  },
  {
    id: 'ex-2',
    name: 'AI写作',
    type: 'positive',
    value: 5,
    color: '#0ea5e9', // Sky
    emoji: '✍️',
  },
  {
    id: 'ex-3',
    name: '建模学习',
    type: 'positive',
    value: 5,
    color: '#06b6d4', // Cyan
    emoji: '📐',
  },
  {
    id: 'ex-4',
    name: 'unity学习',
    type: 'positive',
    value: 3,
    color: '#8b5cf6', // Violet
    emoji: '🎮',
  },
  {
    id: 'ex-5',
    name: '跑步',
    type: 'positive',
    value: 2,
    color: '#10b981', // Emerald
    emoji: '🏃',
  },
  {
    id: 'ex-6',
    name: '涂药',
    type: 'positive',
    value: 1,
    color: '#14b8a6', // Teal
    emoji: '💊',
  },
  {
    id: 'ex-7',
    name: '冥想',
    type: 'positive',
    value: 1,
    color: '#ec4899', // Pink
    emoji: '🧘',
  },
  {
    id: 'ex-8',
    name: '麻将2半庄',
    type: 'negative',
    value: -1,
    color: '#f59e0b', // Amber
    emoji: '🀄',
  },
  {
    id: 'ex-9',
    name: '100元',
    type: 'negative',
    value: -1,
    color: '#f97316', // Orange
    emoji: '💵',
  },
  {
    id: 'ex-10',
    name: '游戏2小时',
    type: 'negative',
    value: -1,
    color: '#ef4444', // Red
    emoji: '🎮',
  },
  {
    id: 'ex-11',
    name: '针线活',
    type: 'negative',
    value: -5,
    color: '#f43f5e', // Rose
    emoji: '🪡',
  },
  {
    id: 'ex-12',
    name: '430元',
    type: 'negative',
    value: -10,
    color: '#991b1b', // Dark red
    emoji: '💰',
  }
];

export const PALETTE = [
  '#10b981', // Emerald
  '#0ea5e9', // Sky
  '#6366f1', // Indigo
  '#84cc16', // Lime
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#1e3a8a', // Dark Blue
  '#15803d', // Forest Green
  '#a21caf', // Magenta / Fuchsia
  '#d97706', // Ochre / Bronze
  '#b91c1c', // Deep Crimson
  '#0284c7', // Cyan-Blue
  '#4d7c0f', // Lime-Green
  '#6d28d9', // Deep Purple
  '#be185d', // Deep Rose
  '#0f766e', // Deep Teal
  '#e11d48', // Rubine Red
  '#c2410c', // Bright Rust
];
