import React, { useState } from 'react';
import { HabitEvent, ActiveWheelItem } from '../types';
import { PALETTE } from '../data';
import {
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  Sparkles,
  RefreshCw,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Info,
  Scale,
  Hand,
  Check,
  ChevronRight,
  ShieldAlert,
  Edit2,
  Compass
} from 'lucide-react';

interface EventListProps {
  registryEvents: HabitEvent[];
  onRegistryChange: (updated: HabitEvent[]) => void;
  wheelItems: ActiveWheelItem[];
  onWheelItemsChange: (updated: ActiveWheelItem[]) => void;
  expectedValue: number;
}

export default function EventList({
  registryEvents,
  onRegistryChange,
  wheelItems,
  onWheelItemsChange,
  expectedValue,
}: EventListProps) {
  // New Event Form States
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
  const [newType, setNewType] = useState<'positive' | 'negative'>('positive');
  const [newWeightValue, setNewWeightValue] = useState<number>(3); // UI name: "权重" (replaces baseline score/value)

  // Tab switching state
  const [registryTab, setRegistryTab] = useState<'all' | 'positive' | 'negative'>('all');

  // Edit fields states
  const [editingEvent, setEditingEvent] = useState<HabitEvent | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editEmoji, setEditEmoji] = useState('');

  // Batch text import states
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [batchInputText, setBatchInputText] = useState('');
  const [batchImportError, setBatchImportError] = useState('');
  const [batchImportSuccess, setBatchImportSuccess] = useState('');

  // Drag-and-drop support state
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Status metrics variables
  const totalGrid = wheelItems.reduce((sum, e) => sum + e.weight, 0); // "占格" total
  const positiveGridTotal = wheelItems.filter((e) => e.type === 'positive').reduce((sum, e) => sum + e.weight, 0);
  const negativeGridTotal = wheelItems.filter((e) => e.type === 'negative').reduce((sum, e) => sum + e.weight, 0);

  const isTotal100 = totalGrid === 100;
  const isPositiveValid = positiveGridTotal <= 80;
  const isNegativeValid = negativeGridTotal <= 80;
  const isSetupValid = isTotal100 && isPositiveValid && isNegativeValid;

  // Add customized event to the registry event library (left)
  const handleAddToRegistry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // Use selected newColor or fallback
    const finalColor = newColor || PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const signedValue = newType === 'positive' 
      ? Math.abs(newWeightValue || 3) 
      : -Math.abs(newWeightValue || 3);

    const defaultEmojis = ['🎯', '💡', '🔥', '📚', '🌟', '🍀', '🚀', '🔑', '🌈', '🍿', '⚡', '☕'];
    const finalEmoji = newEmoji.trim() || defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)];

    const newRegistryHabit: HabitEvent = {
      id: 'reg-' + Math.random().toString(36).substr(2, 9),
      name: newName.trim(),
      type: newType,
      value: signedValue,
      color: finalColor,
      emoji: finalEmoji,
    };

    onRegistryChange([...registryEvents, newRegistryHabit]);
    setNewName('');
    setNewEmoji('');
    setNewWeightValue(3);
    setNewColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]); // Randomize color for next habit entry
  };

  // Trigger editing a specific habit event
  const triggerEditEvent = (item: HabitEvent) => {
    setEditingEvent(item);
    setEditName(item.name);
    setEditColor(item.color);
    setEditEmoji(item.emoji || '✨');
  };

  // Save modified habit properties across libraries
  const handleSaveEditEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editName.trim()) return;

    const matchedEmoji = editEmoji.trim() || '✨';

    const updatedRegistry = registryEvents.map((item) => {
      if (item.id === editingEvent.id) {
        return {
          ...item,
          name: editName.trim(),
          color: editColor,
          emoji: matchedEmoji
        };
      }
      return item;
    });

    onRegistryChange(updatedRegistry);

    // Synchronize modifications with today's wheel items
    const updatedWheel = wheelItems.map((wi) => {
      if (wi.eventId === editingEvent.id) {
        return {
          ...wi,
          name: editName.trim(),
          color: editColor,
          emoji: matchedEmoji
        };
      }
      return wi;
    });
    onWheelItemsChange(updatedWheel);

    setEditingEvent(null);
  };

  // Batch paste & parse import
  const handleBatchImportSubmit = () => {
    if (!batchInputText.trim()) {
      setBatchImportError('请输入或粘贴符合格式的文本段落');
      return;
    }

    const lines = batchInputText.split('\n');
    const importedEvents: HabitEvent[] = [];
    let successCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine) continue;

      // Regular Expression matching any name + optional trailing numeric value with sign
      const match = rawLine.match(/(.*?)\s*([-+]?\d+)$/);
      let name = rawLine;
      let score = 3; // default fallback weight

      if (match) {
        name = match[1].trim();
        score = parseInt(match[2], 10);
      }

      if (!name) continue;

      const isPositive = score >= 0;
      const type = isPositive ? 'positive' : 'negative';
      const randomColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];

      const batchEmojis = ['🍀', '⭐', '⚡', '🍿', '💡', '🔥', '📚', '🎯', '🚀', '☕'];
      const matchedEmoji = batchEmojis[i % batchEmojis.length];

      const newRegistryHabit: HabitEvent = {
        id: 'reg-' + Math.random().toString(36).substr(2, 9) + '-' + i,
        name: name,
        type: type,
        value: score,
        color: randomColor,
        emoji: matchedEmoji,
      };

      importedEvents.push(newRegistryHabit);
      successCount++;
    }

    if (importedEvents.length === 0) {
      setBatchImportError('未能解析出有效的事件，请检查格式');
      return;
    }

    onRegistryChange([...registryEvents, ...importedEvents]);
    setBatchImportSuccess(`成功追加 ${successCount} 项习惯到您的分值仓库内！`);
    setBatchInputText('');

    setTimeout(() => {
      setIsBatchImportOpen(false);
      setBatchImportSuccess('');
    }, 2200);
  };

  // Delete event from Registry
  const handleDeleteFromRegistry = (id: string) => {
    onRegistryChange(registryEvents.filter((e) => e.id !== id));
    onWheelItemsChange(wheelItems.filter((wi) => wi.eventId !== id));
  };

  // Add Item to active wheel configuration (right)
  const handleAddFromRegistryToWheel = (regItem: HabitEvent) => {
    const alreadyExists = wheelItems.find((wi) => wi.eventId === regItem.id);
    if (alreadyExists) {
      alert(`「${regItem.name}」已在当次命盘中！请在右侧直接调节其轮盘占格。`);
      return;
    }

    // Smart default grid allocation (e.g. 20, or remaining if smaller)
    const remaining = 100 - totalGrid;
    const initialGrid = remaining > 0 ? Math.min(20, remaining) : 10;

    const newWheelItem: ActiveWheelItem = {
      id: 'wheel-' + Math.random().toString(36).substr(2, 9),
      eventId: regItem.id,
      name: regItem.name,
      type: regItem.type,
      value: regItem.value,
      weight: initialGrid,
      color: regItem.color,
      emoji: regItem.emoji,
    };

    onWheelItemsChange([...wheelItems, newWheelItem]);
  };

  // Drag-and-drop: drag trigger
  const handleDragStart = (e: React.DragEvent, habitId: string) => {
    e.dataTransfer.setData('text/plain', habitId);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  // Drag-and-drop: drop target
  const handleDropToWheel = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const habitId = e.dataTransfer.getData('text/plain');
    if (!habitId) return;

    const matchedHabit = registryEvents.find((h) => h.id === habitId);
    if (matchedHabit) {
      handleAddFromRegistryToWheel(matchedHabit);
    }
  };

  // Remove item from simulated active wheel
  const handleRemoveFromWheel = (wheelItemId: string) => {
    onWheelItemsChange(wheelItems.filter((wi) => wi.id !== wheelItemId));
  };

  // Quick action: proportionally scale and balance grid sizes to sum strictly to 100
  // RULE: First satisfy that neither the positive items' nor negative items' sum exceeds 80 grids.
  const handleAutoBalance = () => {
    if (wheelItems.length === 0) return;

    const posItems = wheelItems.filter((wi) => wi.type === 'positive');
    const negItems = wheelItems.filter((wi) => wi.type === 'negative');

    const posCurrentSum = posItems.reduce((sum, item) => sum + item.weight, 0);
    const negCurrentSum = negItems.reduce((sum, item) => sum + item.weight, 0);
    const totalCurrentSum = posCurrentSum + negCurrentSum;

    let targetPosSum = 0;
    let targetNegSum = 0;

    if (posItems.length > 0 && negItems.length > 0) {
      if (totalCurrentSum === 0) {
        // If current weights are all 0, split 50/50
        targetPosSum = 50;
        targetNegSum = 50;
      } else {
        const ratioPos = posCurrentSum / totalCurrentSum;
        // Clamp positive grids to [20, 80] to guarantee positive grid sum <= 80 AND negative grid sum <= 80
        targetPosSum = Math.max(20, Math.min(80, Math.round(ratioPos * 100)));
        targetNegSum = 100 - targetPosSum;
      }
    } else if (posItems.length > 0) {
      // Only positive items exist - total grid must be 100
      targetPosSum = 100;
      targetNegSum = 0;
    } else {
      // Only negative items exist - total grid must be 100
      targetPosSum = 0;
      targetNegSum = 100;
    }

    // Helper to distribute target sum proportionally
    const distributeGrids = (items: ActiveWheelItem[], targetSum: number): { [id: string]: number } => {
      if (items.length === 0 || targetSum === 0) return {};
      const currentSum = items.reduce((sum, item) => sum + item.weight, 0);

      if (currentSum === 0) {
        const baseShare = Math.floor(targetSum / items.length);
        const remainder = targetSum % items.length;
        const res: { [id: string]: number } = {};
        items.forEach((item, idx) => {
          res[item.id] = baseShare + (idx === 0 ? remainder : 0);
        });
        return res;
      }

      const fractional = items.map((item) => (item.weight / currentSum) * targetSum);
      const rounded = fractional.map((f) => Math.round(f));
      let sum = rounded.reduce((a, b) => a + b, 0);

      // Adjust discrepancy on the largest item
      if (sum !== targetSum) {
        const diff = targetSum - sum;
        let maxIdx = 0;
        let maxVal = -1;
        items.forEach((item, idx) => {
          if (item.weight > maxVal) {
            maxVal = item.weight;
            maxIdx = idx;
          }
        });
        rounded[maxIdx] += diff;
      }

      // Ensure every item gets at least 1 grid
      const res: { [id: string]: number } = {};
      items.forEach((item, idx) => {
        res[item.id] = Math.max(1, rounded[idx]);
      });

      // Compensate for Math.max(1) adjustments if any
      let finalSum = items.reduce((s, item) => s + res[item.id], 0);
      if (finalSum !== targetSum) {
        const diff = targetSum - finalSum;
        let maxIdx = 0;
        let maxVal = -1;
        items.forEach((item, idx) => {
          if (item.weight > maxVal) {
            maxVal = item.weight;
            maxIdx = idx;
          }
        });
        res[items[maxIdx].id] = Math.max(1, res[items[maxIdx].id] + diff);
      }

      return res;
    };

    const posAlloc = distributeGrids(posItems, targetPosSum);
    const negAlloc = distributeGrids(negItems, targetNegSum);

    const balanced = wheelItems.map((item) => {
      const grid = item.type === 'positive' ? posAlloc[item.id] : negAlloc[item.id];
      return {
        ...item,
        weight: grid !== undefined ? grid : 0,
      };
    });

    onWheelItemsChange(balanced);
  };

  // Quick Action: clear today's active wheel cards
  const handleClearWheelLayout = () => {
    onWheelItemsChange([]);
  };

  // Directly increment or decrement registry event's core weight value (+/- 权重)
  const adjustRegistryWeightValue = (id: string, amount: number) => {
    const updated = registryEvents.map((item) => {
      if (item.id === id) {
        const currentAbs = Math.abs(item.value);
        const nextAbs = Math.max(1, currentAbs + amount); // cannot drop below absolute 1
        const nextSigned = item.type === 'positive' ? nextAbs : -nextAbs;
        return { ...item, value: nextSigned };
      }
      return item;
    });
    onRegistryChange(updated);

    // Sync any corresponding active wheel scores as well for frictionless consistency!
    const updatedWheel = wheelItems.map((wi) => {
      const matchedReg = updated.find((r) => r.id === wi.eventId);
      if (wi.eventId === id && matchedReg) {
        return { ...wi, value: matchedReg.value };
      }
      return wi;
    });
    onWheelItemsChange(updatedWheel);
  };

  // Directly change active wheel item's occuping grid count (+/- the grid slide)
  const handleUpdateItemGrid = (id: string, newWeightGrid: number) => {
    const updated = wheelItems.map((item) => {
      if (item.id === id) {
        return { ...item, weight: Math.max(0, Math.min(100, newWeightGrid)) };
      }
      return item;
    });
    onWheelItemsChange(updated);
  };

  return (
    <div className="flex flex-col gap-6">

      {/* 1. Compact Status Alert & Info banner */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs leading-normal transition-all duration-300 ${
        isSetupValid 
          ? 'bg-emerald-50/50 border-emerald-150 text-emerald-800' 
          : 'bg-amber-50/50 border-amber-200 text-amber-800'
      }`}>
        <div className="flex items-center gap-2.5">
          <ShieldAlert className={`w-4 h-4 shrink-0 ${isSetupValid ? 'text-emerald-600' : 'text-amber-600'}`} />
          <div>
            <span className="font-bold">转盘自适应约束提醒：</span>
            <span>
              当前命运盘已分配 <span className="font-mono font-bold">{totalGrid}</span>/100格
              {positiveGridTotal > 0 && ` (正向占有: ${positiveGridTotal}格)`}
              {negativeGridTotal > 0 && ` (负向占有: ${negativeGridTotal}格)`}。
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status ticks directly inline in text banner */}
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isTotal100 ? 'bg-emerald-100/60 text-emerald-800' : 'bg-amber-100/60 text-amber-800'}`}>
            {isTotal100 ? '✓ 总格为100' : '✗ 占格需为100'}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isPositiveValid ? 'bg-emerald-100/60 text-emerald-800' : 'bg-rose-100/60 text-rose-800'}`}>
            {isPositiveValid ? '✓ 正向≤80格' : '✗ 正向超80格'}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isNegativeValid ? 'bg-emerald-100/60 text-emerald-800' : 'bg-rose-100/60 text-rose-800'}`}>
            {isNegativeValid ? '✓ 负向≤80格' : '✗ 负向超80格'}
          </span>
        </div>
      </div>

      {/* 2. Side-By-Side Design columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COMPONENT: Registry event storage (常态习惯库存) */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5 gap-2">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">1. 习惯分值仓库 (事件库)</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">登记日常习惯因果。事件权重一般无需频繁更改</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBatchImportOpen(!isBatchImportOpen);
                      setBatchImportError('');
                      setBatchImportSuccess('');
                    }}
                    style={{ backgroundColor: isBatchImportOpen ? '#f1f5f9' : '#e0e7ff', color: isBatchImportOpen ? '#475569' : '#4f46e5' }}
                    className="px-2 py-1 hover:opacity-85 rounded-xl font-bold text-[9px] cursor-pointer transition-all border border-indigo-100 select-none shadow-3xs"
                  >
                    {isBatchImportOpen ? '返回单输' : '批量导入'}
                  </button>
                  <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full font-mono text-[9px] border border-slate-200">
                    {registryEvents.length} 项
                  </span>
                </div>
              </div>

              {/* Classification Tabs */}
              {!isBatchImportOpen && (
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1 mb-3.5 border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => setRegistryTab('all')}
                    className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      registryTab === 'all'
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-805 hover:bg-white/40'
                    }`}
                  >
                    🔍 全部
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegistryTab('positive')}
                    className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      registryTab === 'positive'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50'
                    }`}
                  >
                    🟢 正项事件
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegistryTab('negative')}
                    className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      registryTab === 'negative'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50/50'
                    }`}
                  >
                    🔴 负向行为
                  </button>
                </div>
              )}

              {/* Batch Import Panel */}
              {isBatchImportOpen ? (
                <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl mb-4 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-700">文本一键导入格式 (名称 权重)：</span>
                    <button
                      type="button"
                      onClick={() => setBatchInputText("早睡早起 5\nAI写作 5\n建模学习 5\nunity学习 3\n跑步 2\n涂药1\n冥想 1\n麻将2半庄 -1\n100元 -1\n游戏2小时 -1\n针线活-5\n430元-10")}
                      className="text-[10px] text-indigo-600 hover:underline font-bold cursor-pointer"
                    >
                      填入默认示例
                    </button>
                  </div>
                  
                  <textarea
                    rows={6}
                    placeholder="早睡早起 5&#10;游戏2小时 -1&#10;针线活-5"
                    value={batchInputText}
                    onChange={(e) => {
                      setBatchInputText(e.target.value);
                      setBatchImportError('');
                      setBatchImportSuccess('');
                    }}
                    className="w-full p-2.5 font-mono text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                  />

                  {batchImportError && (
                    <div className="mt-1.5 text-[10px] text-rose-600 font-bold">
                      ⚠️ {batchImportError}
                    </div>
                  )}
                  {batchImportSuccess && (
                     <div className="mt-1.5 text-[10px] text-emerald-600 font-bold">
                      ✓ {batchImportSuccess}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-3 font-sans">
                    <span className="text-[9px] text-slate-400 leading-normal max-w-[180px]">
                      支持识别任意空格或无空格下的数字，如「针线活-5」自动解析为负权重。
                    </span>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setBatchInputText('');
                          setBatchImportError('');
                          setBatchImportSuccess('');
                        }}
                        className="py-1 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        清空
                      </button>
                      <button
                        type="button"
                        onClick={handleBatchImportSubmit}
                        style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                        className="py-1 px-3.5 hover:opacity-90 text-white font-bold rounded-lg text-[10px] cursor-pointer shadow-3xs"
                      >
                        确认导入
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Drag/Click instruction helper banner */
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 mb-4 flex items-center gap-2">
                  <Hand className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>长按可<b>拖拽</b>到右边转盘，或点击「+入转盘」一键导入</span>
                </div>
              )}

              {/* List scroll zone */}
              {registryEvents.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <PlusCircle className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <span>事件库空空如也，请在下方快速添加注册项</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {(() => {
                    const filtered = registryEvents.filter((item) => {
                      if (registryTab === 'all') return true;
                      return item.type === registryTab;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-10 text-slate-400 text-xs font-sans">
                          <Info className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                          <span>当前标签分类下暂未登记任何项</span>
                        </div>
                      );
                    }

                    return filtered.map((item) => {
                      const isPositive = item.type === 'positive';
                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item.id)}
                          className="p-3 bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-between gap-2 shadow-2xs transition-all duration-200 cursor-grab active:cursor-grabbing text-xs"
                          title="按住此行拖到右方放开，或点击右侧添加"
                        >
                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                            {/* Colorful Emoji Badge */}
                            <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs shadow-3xs" style={{ backgroundColor: item.color + '15', border: `1.5px solid ${item.color}` }}>
                              <span className="text-xs">{item.emoji || '✨'}</span>
                            </div>

                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-700 truncate">{item.name}</span>
                              <span className={`text-[9px] font-bold w-max mt-0.5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isPositive ? '正项习惯' : '负向限令'}
                              </span>
                            </div>
                          </div>

                          {/* Event Core Weight quick-edit panel */}
                          <div className="flex items-center gap-2 shrink-0 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 scale-95 origin-right">
                            <span className="text-[9px] text-slate-400 font-bold shrink-0">权重:</span>
                            <div className="flex items-center gap-1 font-mono">
                              <button
                                  type="button"
                                  onClick={() => adjustRegistryWeightValue(item.id, -1)}
                                  className="w-5 h-5 bg-white hover:bg-slate-200 text-[10px] font-bold border border-slate-200 rounded flex items-center justify-center cursor-pointer select-none"
                                  title="下调权重"
                              >
                                -
                              </button>
                              <span className={`font-bold w-6 text-center text-[10px] ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isPositive ? `+${item.value}` : item.value}
                              </span>
                              <button
                                  type="button"
                                  onClick={() => adjustRegistryWeightValue(item.id, 1)}
                                  className="w-5 h-5 bg-white hover:bg-slate-200 text-[10px] font-bold border border-slate-200 rounded flex items-center justify-center cursor-pointer select-none"
                                  title="上调权重"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Quick action triggers */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Edit attribute trigger */}
                            <button
                              type="button"
                              onClick={() => triggerEditEvent(item)}
                              className="p-1 px-1.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded transition-all cursor-pointer font-bold text-[9px]"
                              title="编辑名称、颜色和Emoji"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => handleAddFromRegistryToWheel(item)}
                              className="px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[9px] transition-all cursor-pointer shadow-3xs flex items-center shrink-0"
                              title="把此项添入转盘配置"
                            >
                              +入转盘
                            </button>
                            
                            <button
                              onClick={() => handleDeleteFromRegistry(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer"
                              title="从库中彻底删除"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* In-Line Event Adder Form */}
            <form onSubmit={handleAddToRegistry} className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-xs font-bold text-gray-600">
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  <span>注册追加新习惯到库内：</span>
                </div>
                <span className="text-[9px] text-indigo-500 font-bold">可精选专属图标与颜色</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <div className="md:col-span-7">
                  <input
                    type="text"
                    placeholder="习惯名称 (如: 背30个单词)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div className="md:col-span-5 flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setNewType('positive')}
                    className={`flex-1 text-center py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${
                      newType === 'positive'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-gray-500'
                    }`}
                  >
                    正项习惯
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('negative')}
                    className={`flex-1 text-center py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${
                      newType === 'negative'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-gray-500'
                    }`}
                  >
                    负向限令
                  </button>
                </div>
              </div>

              {/* Icon & Color Selector inside the registry form */}
              <div className="bg-slate-50 p-2.5 border border-slate-200 rounded-xl space-y-2 text-[10px]">
                <div className="flex gap-2.5 items-stretch">
                  {/* Selected Icon and Color visual preview */}
                  <div className="flex flex-col items-center justify-center bg-white p-1.5 border border-slate-150 rounded-lg shrink-0 w-12">
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-3xs"
                      style={{ backgroundColor: newColor + '15', border: `1.5px solid ${newColor}` }}
                    >
                      {newEmoji || '✨'}
                    </div>
                    <span className="text-[7.5px] font-bold text-slate-400 mt-0.5">外观预览</span>
                  </div>

                  {/* Emojis selection row */}
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-slate-500">点击快速选用专属图标 / 或在右框自填：</span>
                      <input
                        type="text"
                        maxLength={3}
                        placeholder="✨"
                        value={newEmoji}
                        onChange={(e) => setNewEmoji(e.target.value)}
                        className="w-10 text-center py-0.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-xs"
                      />
                    </div>
                    <div className="flex gap-1 overflow-x-auto pb-1 bg-white border border-slate-100 rounded px-1 no-scrollbar select-none">
                      {['🌅', '✍️', '🏃', '🏋️', '📚', '🎯', '💡', '🔥', '🎮', '🧘', '💰', '🍀', '🍎', '💤', '💻', '🎨', '🎵', '🔋', '🧹', '💊', '🤝', '⏰', '💭', '🧼', '🌟', '🚀'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setNewEmoji(em)}
                          className={`p-0.5 hover:bg-slate-100 rounded text-xs transition-transform active:scale-95 cursor-pointer shrink-0 ${newEmoji === em ? 'bg-indigo-50 scale-105 font-bold' : ''}`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Colors selection row */}
                <div>
                  <div className="font-bold text-slate-500 mb-0.5">点击选择专属主颜色：</div>
                  <div className="flex gap-1 overflow-x-auto pb-1 bg-white border border-slate-100 rounded px-1 no-scrollbar select-none">
                    {PALETTE.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewColor(col)}
                        style={{ backgroundColor: col }}
                        className={`w-3.5 h-3.5 rounded-full border border-slate-200 cursor-pointer shrink-0 hover:scale-115 transition-transform relative ${newColor === col ? 'ring-2 ring-indigo-500 border-white ring-offset-0 scale-110 shadow-3xs' : ''}`}
                      >
                        {newColor === col && (
                          <div className="absolute inset-0 bg-black/10 rounded-full flex items-center justify-center">
                            <span className="text-[7px] text-white font-extrabold">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 flex-1 justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">习惯基础分值 (权重):</span>
                  <div className="flex items-center font-mono">
                    <button
                      type="button"
                      onClick={() => setNewWeightValue(Math.max(1, newWeightValue - 1))}
                      className="w-5 h-5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[10px] font-bold flex items-center justify-center cursor-pointer select-none"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={newWeightValue}
                      onChange={(e) => setNewWeightValue(Math.max(1, Number(e.target.value)))}
                      className="w-10 text-center font-bold bg-transparent border-0 focus:ring-0 p-0 text-slate-800 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setNewWeightValue(newWeightValue + 1)}
                      className="w-5 h-5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[10px] font-bold flex items-center justify-center cursor-pointer select-none"
                    >
                      +
                    </button>
                    <span className="text-[10px] text-slate-400 ml-1">分</span>
                  </div>
                </div>

                <button
                  type="submit"
                  style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                  className="py-1.5 px-4.5 hover:opacity-90 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm shrink-0 text-white font-sans"
                >
                  注册入库
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COMPONENT: Active Wheel items layout (当次命运转盘) */}
        <div className="lg:col-span-6 flex flex-col">
          <div
            className={`bg-white p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between flex-1 ${
              isDraggingOver 
                ? 'border-indigo-400 bg-indigo-50/10 ring-2 ring-indigo-50/50' 
                : 'border-slate-200 shadow-sm'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDropToWheel}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3.5">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">2. 当次命运转盘</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">调配每种行为发生占格，以分拨概率</p>
                </div>
                {isTotal100 ? (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-200 font-bold text-[9px]">
                    100格已分配
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded border border-amber-200 font-bold text-[9px]">
                    剩 {100 - totalGrid} 格
                  </span>
                )}
              </div>

              {/* Dynamic Expectation Display Panel inside 当次命运转盘 config */}
              <div className="mb-3.5 p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Compass className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">今日命运并轨期望</span>
                    <span className="text-[9px] text-slate-500 font-sans">100格占格结算的期望平均分</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">当前期望</span>
                  <strong className="text-base font-black text-indigo-600 font-mono tracking-tight">
                    {wheelItems.length === 0 ? '无项' : `${expectedValue.toFixed(2)} 分/轮`}
                  </strong>
                </div>
              </div>

              {/* Grid operation shortcuts */}
              {wheelItems.length > 0 && (
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl mb-3 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400">快捷分格：</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleAutoBalance}
                      className="px-2 py-1 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-600 rounded text-[9px] font-bold cursor-pointer"
                      title="按照当前各行为占格的比例配平，使其总和正好等于100格"
                    >
                      按照当前格数配平
                    </button>
                    <button
                      onClick={handleClearWheelLayout}
                      className="px-2 py-1 bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-500 rounded text-[9px] cursor-pointer font-bold"
                    >
                      全部清空
                    </button>
                  </div>
                </div>
              )}

              {/* Active list area */}
              {wheelItems.length === 0 ? (
                <div className="border border-dashed border-slate-200 bg-slate-50 rounded-2xl py-14 px-4 text-center text-slate-400 hover:bg-slate-100/50 transition-colors flex flex-col items-center justify-center gap-1.5">
                  <Sparkles className="w-6 h-6 text-slate-300 animate-pulse" />
                  <span className="text-xs font-bold text-slate-600">把左侧习惯拖进此框</span>
                  <p className="text-[9px] text-slate-400 max-w-[240px] leading-relaxed">
                    选择您经历过的或准备触发的行为丢入，调整因果占格的比例。
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[355px] overflow-y-auto pr-1">
                  {wheelItems.map((wi) => {
                    const isPositive = wi.type === 'positive';
                    return (
                      <div
                        key={wi.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {/* Colored Emoji Badge */}
                          <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs shadow-3xs" style={{ backgroundColor: wi.color + '15', border: `1.5px solid ${wi.color}` }}>
                            <span className="text-xs select-none">{wi.emoji || '✨'}</span>
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-700 truncate">{wi.name}</span>
                            <span className={`text-[9px] font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                              权重: {isPositive ? `+${wi.value}` : wi.value}
                            </span>
                          </div>
                        </div>

                        {/* Sliders to modify turn assignment (Grid units / 占格) */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right shrink-0 flex flex-col items-end">
                            <span className="font-mono text-xs text-slate-600 font-extrabold w-10 text-right">
                              {wi.weight}格
                            </span>
                            {/* LIVE CALCULATION REQ 5: 显示当前分数（权重 * 格数） */}
                            <span className={`text-[9px] font-bold font-mono px-1 py-0.5 rounded text-right mt-0.5 ${
                              wi.value * wi.weight > 0 ? 'bg-emerald-50 text-emerald-700' : wi.value * wi.weight < 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              数比: {wi.value * wi.weight > 0 ? `+${wi.value * wi.weight}` : wi.value * wi.weight}分
                            </span>
                          </div>

                          <div className="flex gap-1 justify-end">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemGrid(wi.id, wi.weight - 5)}
                              className="w-5.5 h-5.5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[9px] font-bold flex items-center justify-center cursor-pointer select-none"
                            >
                              -5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemGrid(wi.id, wi.weight - 1)}
                              className="w-5.5 h-5.5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[9px] font-bold flex items-center justify-center cursor-pointer select-none text-indigo-600"
                              title="占格-1"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemGrid(wi.id, wi.weight + 1)}
                              className="w-5.5 h-5.5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[9px] font-bold flex items-center justify-center cursor-pointer select-none text-indigo-600"
                              title="占格+1"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemGrid(wi.id, wi.weight + 5)}
                              className="w-5.5 h-5.5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[9px] font-bold flex items-center justify-center cursor-pointer select-none"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => handleRemoveFromWheel(wi.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer font-bold text-xs"
                              title="移出盘面"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Changed from original caption as requested in REQ 5 */}
            <div className="mt-4.5 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono text-right font-sans">
              当前配置将以各自占格占比作为概率*权重进行结算。
            </div>
          </div>
        </div>

      </div>

      {/* RENDER DYNAMIC CUSTOM EDIT MODAL FOR HABIT EVENTS */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="bg-white max-w-lg sm:max-w-xl w-full rounded-3xl p-6 md:p-8 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h5 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Edit2 className="w-5.5 h-5.5 text-indigo-650 shrink-0" />
                <span>🔧 编辑习惯库因果属性</span>
              </h5>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-xs font-black p-1.5 hover:bg-slate-50 rounded-full"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveEditEvent} className="space-y-5 font-sans text-xs">
              {/* 1. Modify Name Field */}
              <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-2xl">
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 font-mono uppercase tracking-wider">习惯名称：</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none shadow-3xs"
                  required
                />
              </div>

              {/* 2. Modify Emoji Indicator */}
              <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">专属图标 / Emoji：</label>
                  <span className="text-[9px] text-indigo-500 font-bold font-mono">点击下方网格快速选用</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <input
                      type="text"
                      maxLength={3}
                      value={editEmoji}
                      onChange={(e) => setEditEmoji(e.target.value)}
                      className="w-16 h-16 border border-slate-200 rounded-2xl text-center text-2xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white outline-none shadow-2xs"
                      placeholder="✨"
                      title="手动输入或直接粘贴任意 Emoji"
                    />
                    <span className="text-[9px] text-slate-400 mt-1">当前选择</span>
                  </div>
                  
                  <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-3 max-h-36 overflow-y-auto no-scrollbar shadow-3xs">
                    <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 text-xs select-none">
                      {[
                        '🌅', '✍️', '📐', '🎮', '🏃', '💊', '🧘', '🀄', '💵', '🪡', '💰', '🍀', '🔥', '📚', '☕', '🛌', '🎨', '🎵', '💻', '🎯', '💡',
                        '🌟', '🚀', '🔑', '🌈', '🍿', '⚡', '🍎', '🥦', '💧', '🚲', '🏋️', '🏊', '👣', '🧗', '🗣️', '🧹', '🛁', '⏰', '📅', '📝', '👔',
                        '💼', '🤝', '💭', '🧼', '🌱', '🐕', '🐈', '🍽️', '🚭', '🍺', '🥤', '🍩', '🥊', '🎭', '🎤', '🎬', '🧩', '🗺️', '🧠', '❤️', '💤',
                        '🔋', '🛡️', '⚠️', '🚨', '🗑️'
                      ].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setEditEmoji(em)}
                          className={`w-7 h-7 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-transform active:scale-95 text-sm inline-block cursor-pointer select-none ${
                            editEmoji === em ? 'bg-indigo-50 scale-110 ring-2 ring-indigo-500 ring-offset-0 font-bold' : ''
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-2">支持在左侧输入框内直接输入或粘贴来自您设备的任意自定义 Emoji 符号</p>
              </div>

              {/* 3. Modify Visual Colors */}
              <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">标志主颜色：</label>
                  <span className="text-[9px] text-indigo-500 font-bold font-mono">共支持 24 种格盘渐变色彩</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-3xs">
                  <div className="grid grid-cols-8 gap-2.5">
                    {PALETTE.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setEditColor(col)}
                        style={{ backgroundColor: col }}
                        className={`w-full aspect-square rounded-full border-2 hover:opacity-90 transition-all cursor-pointer relative ${
                          editColor === col ? 'border-amber-400 ring-2 ring-indigo-500 shadow-xs scale-105' : 'border-white'
                        }`}
                      >
                        {editColor === col && (
                          <div className="absolute inset-0 bg-black/10 rounded-full flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-xs transition-colors cursor-pointer font-sans"
                >
                  放弃修改
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                  className="flex-1 py-3 px-4 hover:opacity-95 text-white font-bold rounded-2xl text-xs transition-opacity cursor-pointer shadow-md font-sans"
                >
                  保存并同步因果项
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}