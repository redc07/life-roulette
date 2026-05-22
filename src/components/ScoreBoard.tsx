import React, { useState } from 'react';
import { SpinLog, ProtagonistRecord } from '../types';
import {
  Calendar,
  Layers,
  Clock,
  RotateCcw,
  Sparkles,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle2,
  Circle
} from 'lucide-react';

interface ScoreBoardProps {
  currentPoints: number;
  logs: SpinLog[];
  protagonistRecords: ProtagonistRecord[];
  onToggleRecord: (id: string) => void;
  onClearRecords: () => void;
  onPointsChange: (points: number) => void;
  onWeeklyReset: () => void;
  onClearHistory: () => void;
}

export default function ScoreBoard({
  currentPoints,
  logs,
  protagonistRecords,
  onToggleRecord,
  onClearRecords,
  onPointsChange,
  onWeeklyReset,
  onClearHistory
}: ScoreBoardProps) {
  // Toggle states for the logs sub-menu accordion
  const [isLogsExpanded, setIsLogsExpanded] = useState(false);

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'weekly' | 'history' | 'records';
    title: string;
    message: string;
  } | null>(null);

  // Manual point adjusting state
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);
  const [adjustPointsValue, setAdjustPointsValue] = useState(String(currentPoints));

  // Stats for checklist
  const totalRecords = protagonistRecords.length;
  const completedRecords = protagonistRecords.filter(r => r.completed).length;

  const triggerAdjustPoints = () => {
    setAdjustPointsValue(String(currentPoints));
    setIsAdjustingPoints(true);
  };

  const triggerWeekly = () => {
    setConfirmDialog({
      type: 'weekly',
      title: '📅 确认进行周清归零结算吗？',
      message: '本操作将把您的实时习惯积分彻底归零重置。'
    });
  };

  const triggerHistory = () => {
    setConfirmDialog({
      type: 'history',
      title: '📜 确认清空转盘结算明细账本吗？',
      message: '本操作将永久抹除「转盘结算明细账本」中记录的全部转轮旋转与积分结算明细记录。此项清除操作不可撤销。'
    });
  };

  const triggerRecords = () => {
    setConfirmDialog({
      type: 'records',
      title: '🎯 确认清空执行清单吗？',
      message: '本操作将彻底清空列表中已抽取并记录的中签习惯执行待办。'
    });
  };

  const handleConfirmAction = () => {
    if (!confirmDialog) return;
    if (confirmDialog.type === 'weekly') onWeeklyReset();
    else if (confirmDialog.type === 'history') onClearHistory();
    else if (confirmDialog.type === 'records') onClearRecords();
    setConfirmDialog(null);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Visual Elegant Custom Alert Confirm Modal dialog inside React layer */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h5 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-indigo-505 text-indigo-500 shrink-0" />
              <span>{confirmDialog.title}</span>
            </h5>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAction}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
              >
                确认操作
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Score Point Editing Modal Dialog */}
      {isAdjustingPoints && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-indigo-505 text-indigo-500 shrink-0" />
              <span>🔧 手动修正习惯积分</span>
            </h5>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              手动调整当前的实时习惯积分。输入一个您期望的目标分值（支持任意大于0的整数，系统将继承账目继续运算）：
            </p>
            
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5 font-mono">目标积分值：</label>
              <input
                type="number"
                value={adjustPointsValue}
                onChange={(e) => setAdjustPointsValue(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                placeholder="例如: 100"
                min="1"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setIsAdjustingPoints(false)}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const val = parseInt(adjustPointsValue, 10);
                  if (!isNaN(val)) {
                    onPointsChange(val);
                    setIsAdjustingPoints(false);
                  }
                }}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
              >
                确认修正
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 1. Score Display & Quick Actions */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-50 blur-3xl opacity-60 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 text-[10px] font-mono font-bold text-indigo-600 border border-slate-200">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>当前累计积分账本</span>
            </div>
            <h4 className="text-sm font-semibold text-gray-400 mt-2">实时习惯积分</h4>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-5xl font-extrabold font-mono tracking-tight ${
                currentPoints > 0 ? 'text-emerald-600' : currentPoints < 0 ? 'text-rose-500' : 'text-slate-800'
              }`}>
                {currentPoints}
              </span>
              <span className="text-xs text-gray-400 font-bold">分</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-md">
              初始动能为 0 分。指针指向的对象标志本轮“中签习惯”，但无论中签哪项，本轮账目全员按转盘概率整体加权结算。
            </p>
          </div>

          {/* Quick Clear & Reset Buttons */}
          <div className="flex flex-col gap-2.5 sm:self-end">
            <div className="grid grid-cols-2 gap-2 w-full sm:w-60">
              <button
                onClick={triggerAdjustPoints}
                className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200 cursor-pointer flex flex-col items-center justify-center gap-1 font-sans"
                title="手动输入当前生存分数进行修正"
              >
                <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>手动分数修正</span>
                </div>
                <span className="text-xs font-semibold">手动修正分数</span>
              </button>

              <button
                onClick={triggerWeekly}
                className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200 cursor-pointer flex flex-col items-center justify-center gap-1 font-sans"
                title="清零积分"
              >
                <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>周清重置 (0)</span>
                </div>
                <span className="text-xs font-semibold">归零结算</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Protagonist Event Todolist Checklist (需要记录所有抽到的事件，可勾选已完成) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <div>
              <h4 className="text-sm font-bold text-gray-800">🎯 执行清单</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">记录转盘抽中的执行事件，监督并落实执行情况</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalRecords > 0 && (
              <>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-bold text-[9px] border border-indigo-100">
                  已落子 {completedRecords} / {totalRecords} 项
                </span>
                <button
                  onClick={triggerRecords}
                  className="p-1 px-2 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded transition-all text-[10px] font-bold cursor-pointer flex items-center gap-0.5"
                  title="清空待办列表"
                >
                  <Trash2 className="w-3 h-3" />
                  清空列表
                </button>
              </>
            )}
          </div>
        </div>

        {totalRecords === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <Sparkles className="w-8 h-8 text-indigo-300 mx-auto mb-2 animate-pulse" />
            <span className="block font-semibold text-slate-500">尚无待执行习惯任务</span>
            <p className="text-[10px] text-slate-400 max-w-sm mx-auto mt-1 leading-normal">
              开始旋转转盘！转盘最终指中的“中签习惯”，会自动作为当期执行的习惯载入本区。默认“未完成”，完成后可直接勾选完成。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
            {[...protagonistRecords]
              .sort((a, b) => {
                if (a.completed && !b.completed) return 1;
                if (!a.completed && b.completed) return -1;
                return 0;
              })
              .map((rec) => {
                const isPositive = rec.type === 'positive';
              return (
                <div
                  key={rec.id}
                  onClick={() => onToggleRecord(rec.id)}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3 select-none ${
                    rec.completed
                      ? 'bg-slate-50/70 border-slate-200 text-slate-400'
                      : 'bg-white hover:bg-indigo-50/10 border-slate-200 hover:border-indigo-200 text-slate-800 shadow-3xs'
                  }`}
                >
                  {/* Status checkbox indicator */}
                  <div className="mt-0.5 shrink-0 transition-transform active:scale-95 leading-none">
                    {rec.completed ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-slate-400 hover:text-indigo-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className={`text-xs font-bold leading-snug break-all ${rec.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-800'}`}>
                      {rec.eventName}
                    </span>
                    
                    <div className="flex items-center gap-2 mt-1 font-mono text-[9px] text-slate-400">
                      <span>{rec.timestamp}</span>
                      <span>•</span>
                      <span className={`font-bold ${isPositive ? 'text-emerald-600/70' : 'text-rose-600/70'}`}>
                        权重 {isPositive ? `+${rec.value}` : rec.value}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Detailed Math Logs (命运轨迹 Ledger Logs - Accordion fold) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border-b border-slate-100 gap-4">
          <button
            onClick={() => setIsLogsExpanded(!isLogsExpanded)}
            className="flex items-center gap-2 text-left focus:outline-none hover:opacity-85 transition-opacity"
          >
            <BookOpen className="w-4.5 h-4.5 text-slate-500" />
            <div>
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <span>📜 转盘结算明细账本</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isLogsExpanded ? 'rotate-180' : ''}`} />
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">查看历次转盘转动、账本期望加权计算的详细流水账目</p>
            </div>
          </button>
          
          <div className="flex items-center gap-2.5 sm:self-center">
            {logs.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHistory();
                }}
                className="py-1 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-100 font-bold text-[10px] text-rose-600 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                title="清空整本明细账单"
              >
                <Trash2 className="w-3 h-3" />
                <span>清空转盘结算明细账本</span>
              </button>
            )}
          </div>
        </div>

        {isLogsExpanded && (
          <div className="p-5 pt-4 bg-slate-50/30">
            {logs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-sans">
                <Info className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <span>暂无任何结算账目记录</span>
              </div>
            ) : (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 pt-4">
                {logs.map((log) => {
                  const isGain = log.totalChange > 0;
                  const isLoss = log.totalChange < 0;
                  const isSpecial = log.protagonistEventId === 'manual_adjust' || log.protagonistEventId === 'reset_zero';

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col gap-2.5 shadow-2xs"
                    >
                      {/* Top status bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] text-slate-400">{log.timestamp}</span>
                          {!isSpecial && (
                            <span className="px-1.5 py-0.5 bg-slate-50 text-[9px] text-slate-500 font-mono border border-slate-200 rounded">
                              随机数区间: #{log.randomNumber}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-slate-500">
                            积分演变: <strong className="font-mono">{log.previousPoints} → {log.newPoints}</strong>
                          </span>
                          <span
                            className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                              isGain
                                ? 'bg-emerald-50 text-emerald-600'
                                : isLoss
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {log.totalChange > 0 ? `+${log.totalChange}` : log.totalChange}
                          </span>
                        </div>
                      </div>

                      {isSpecial ? (
                        <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 flex justify-between gap-1 font-sans">
                          <span className="flex items-center gap-1.5">
                            {log.protagonistEventId === 'manual_adjust' ? (
                              <>
                                <span className="text-indigo-500 text-sm">🔧</span>
                                <span>手动积分修正：原分位 <strong className="font-mono">{log.previousPoints}</strong> 修正为 <strong className="font-mono text-indigo-600">{log.newPoints}</strong></span>
                              </>
                            ) : (
                              <>
                                <span className="text-rose-500 text-sm">📅</span>
                                <span>今日归零结算：原分位 <strong className="font-mono">{log.previousPoints}</strong> 清空重置为 <strong className="font-mono text-rose-600">0</strong></span>
                              </>
                            )}
                          </span>
                        </div>
                      ) : (
                        <>
                          {/* Main protagonist notice */}
                          <div className="p-2 rounded bg-orange-50/50 border border-orange-100 text-[10px] text-orange-950 flex justify-between gap-1">
                            <span>
                              👑 本轮中签习惯：<strong className="text-orange-900">「{log.protagonistEventName}」</strong>
                            </span>
                            <span className="font-mono text-slate-400">占比 {log.eventBreakdown?.find((eb) => eb.name === log.protagonistEventName)?.weight || 0}%</span>
                          </div>

                          {/* Mathematical list */}
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 uppercase tracking-tight block font-bold">算式组成（各自 权重 × 今日占格）：</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px]">
                              {log.eventBreakdown?.map((eb, idx) => {
                                const positiveContrib = eb.contribution > 0;
                                const negativeContrib = eb.contribution < 0;
                                return (
                                  <div
                                    key={idx}
                                    className="bg-slate-50 px-2 py-1.5 rounded border border-slate-200 flex items-center justify-between"
                                  >
                                    <span className="font-semibold text-slate-600 truncate">{eb.name}</span>
                                    <div className="font-mono text-[9px] text-slate-400 flex items-center gap-1 shrink-0">
                                      <span>{eb.value > 0 ? `+${eb.value}` : eb.value}×{eb.weight}格 =</span>
                                      <strong className={positiveContrib ? 'text-emerald-600 font-bold' : negativeContrib ? 'text-rose-500 font-bold' : 'text-slate-400 font-bold'}>
                                        {eb.contribution > 0 ? `+${eb.contribution}` : eb.contribution}
                                      </strong>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
