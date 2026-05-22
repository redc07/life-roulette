/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HabitEvent, ActiveWheelItem, SpinLog, ProtagonistRecord } from './types';
import { DEFAULT_LIBRARY } from './data';
import SpinnerWheel from './components/SpinnerWheel';
import EventList from './components/EventList';
import ScoreBoard from './components/ScoreBoard';
import { Compass, Clock, Calendar, Sparkles, HelpCircle, LogOut, User as UserIcon } from 'lucide-react';

// Firebase Authentication & Custom Cloud Logging Integrations
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, addSpinRecord, isFirebaseConfigured, getUserState, saveUserState } from './firebase';
import AuthScreen from './components/AuthScreen';
import CloudHistory from './components/CloudHistory';

export default function App() {
  // Authentication state trackers
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('habit_wheel_guest_mode') === 'true';
  });
  const [isLoadedFromCloud, setIsLoadedFromCloud] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsGuest(false);
        localStorage.removeItem('habit_wheel_guest_mode');
        
        try {
          const cloudState = await getUserState(user.uid);
          if (cloudState) {
            console.log("Restoring system configurations from Firestore:", cloudState);
            if (Array.isArray(cloudState.registryEvents)) {
              setRegistryEvents(cloudState.registryEvents);
            }
            if (Array.isArray(cloudState.wheelItems)) {
              setWheelItems(cloudState.wheelItems);
            }
            if (typeof cloudState.currentPoints === 'number') {
              setCurrentPoints(cloudState.currentPoints);
            }
            if (Array.isArray(cloudState.logs)) {
              setLogs(cloudState.logs);
            }
            if (Array.isArray(cloudState.protagonistRecords)) {
              setProtagonistRecords(cloudState.protagonistRecords);
            }
          }
          setIsLoadedFromCloud(true);
        } catch (error) {
          console.error("Failed to restore cloud user state:", error);
          setIsLoadedFromCloud(true); // Fallback to local on error
        }
      } else {
        setIsLoadedFromCloud(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 1. Habit Registry list
  const [registryEvents, setRegistryEvents] = useState<HabitEvent[]>(() => {
    try {
      const saved = localStorage.getItem('habit_wheel_registry_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved registry events:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_LIBRARY));
  });

  // 2. Active wheel grid setup
  const [wheelItems, setWheelItems] = useState<ActiveWheelItem[]>(() => {
    try {
      const saved = localStorage.getItem('habit_wheel_active_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved active wheel items:', e);
    }
    // Fallback: put default library elements in wheel items adjusted to satisfy constraints (total = 100)
    const fallbackList = JSON.parse(JSON.stringify(DEFAULT_LIBRARY));
    const defaultWeights: Record<string, number> = {
      'ex-1': 10, // 早睡早起
      'ex-2': 10, // AI写作
      'ex-3': 10, // 建模学习
      'ex-4': 10, // unity学习
      'ex-5': 10, // 跑步
      'ex-6': 10, // 涂药
      'ex-7': 10, // 冥想
      'ex-8': 10, // 麻将2半庄
      'ex-9': 10, // 100元
      'ex-10': 5,  // 游戏2小时
      'ex-11': 3,  // 针线活
      'ex-12': 2   // 430元
    };
    return fallbackList.map((reg: HabitEvent) => ({
      id: 'wheel-' + Math.random().toString(36).substr(2, 9),
      eventId: reg.id,
      name: reg.name,
      type: reg.type,
      value: reg.value,
      weight: defaultWeights[reg.id] || 5,
      color: reg.color
    }));
  });

  // 3. User points
  const [currentPoints, setCurrentPoints] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('habit_wheel_points_v3');
      if (saved) return Number(saved);
    } catch (e) {
      console.warn('Failed to parse points:', e);
    }
    return 0; // start points
  });

  // 4. Mathematical logs (folded accordion list)
  const [logs, setLogs] = useState<SpinLog[]>(() => {
    try {
      const saved = localStorage.getItem('habit_wheel_logs_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse logs:', e);
    }
    return [];
  });

  // 5. Recorded Spun Protagonist Events (checked/unchecked Checklist)
  const [protagonistRecords, setProtagonistRecords] = useState<ProtagonistRecord[]>(() => {
    try {
      const saved = localStorage.getItem('habit_wheel_protagonist_records_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse protagonist records:', e);
    }
    return [];
  });

  // Spinning and notification structures
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelNotification, setWheelNotification] = useState<{
    show: boolean;
    winningEvent: ActiveWheelItem | null;
    randomNumber: number;
    pointsDelta: number;
  }>({
    show: false,
    winningEvent: null,
    randomNumber: 0,
    pointsDelta: 0
  });

  // Persists states in background
  useEffect(() => {
    localStorage.setItem('habit_wheel_registry_v3', JSON.stringify(registryEvents));
  }, [registryEvents]);

  useEffect(() => {
    localStorage.setItem('habit_wheel_active_v3', JSON.stringify(wheelItems));
  }, [wheelItems]);

  useEffect(() => {
    localStorage.setItem('habit_wheel_points_v3', currentPoints.toString());
  }, [currentPoints]);

  useEffect(() => {
    localStorage.setItem('habit_wheel_logs_v3', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('habit_wheel_protagonist_records_v3', JSON.stringify(protagonistRecords));
  }, [protagonistRecords]);

  // Cloud automatic serialization on modifications (Debounced 800ms)
  useEffect(() => {
    if (currentUser?.uid && isLoadedFromCloud) {
      const timer = setTimeout(() => {
        saveUserState(currentUser.uid, {
          registryEvents,
          wheelItems,
          currentPoints,
          logs,
          protagonistRecords
        }).catch(err => console.error("Cloud automatic backup failed:", err));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentUser, isLoadedFromCloud, registryEvents, wheelItems, currentPoints, logs, protagonistRecords]);

  // Calculations for wheel state validity
  const totalWeight = wheelItems.reduce((sum, e) => sum + e.weight, 0); // Total grids
  const positiveEvents = wheelItems.filter((e) => e.type === 'positive');
  const negativeEvents = wheelItems.filter((e) => e.type === 'negative');

  const positiveWeightTotal = positiveEvents.reduce((sum, e) => sum + e.weight, 0);
  const negativeWeightTotal = negativeEvents.reduce((sum, e) => sum + e.weight, 0);

  const isTotal100 = totalWeight === 100;
  const isPositiveValid = positiveWeightTotal <= 80;
  const isNegativeValid = negativeWeightTotal <= 80;
  const isSetupValid = isTotal100 && isPositiveValid && isNegativeValid;

  // Expected value allocation calculated per roll math
  const expectedValue = wheelItems.reduce((sum, e) => sum + e.value * e.weight, 0);

  // Settle spin action
  const handleSpinEnd = (winningEvent: ActiveWheelItem, randomNumber: number) => {
    setIsSpinning(false);

    // Compute detailed contribution
    const eventBreakdown = wheelItems.map((item) => ({
      name: item.name,
      weight: item.weight,
      value: item.value,
      contribution: item.value * item.weight
    }));

    const pointsDelta = eventBreakdown.reduce((sum, eb) => sum + eb.contribution, 0);
    const prevPoints = currentPoints;
    const nextPoints = prevPoints + pointsDelta;

    setCurrentPoints(nextPoints);

    // Cloud record synchronization
    if (currentUser?.uid) {
      addSpinRecord(currentUser.uid, winningEvent.name, pointsDelta, nextPoints)
        .catch(err => console.error("Cloud storage sync aborted:", err));
    }

    // Append history ledger record
    const newLog: SpinLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      protagonistEventId: winningEvent.id,
      protagonistEventName: winningEvent.name,
      protagonistEventValue: winningEvent.value,
      randomNumber,
      expectedValue,
      totalChange: pointsDelta,
      previousPoints: prevPoints,
      newPoints: nextPoints,
      eventBreakdown
    };

    setLogs((prev) => [newLog, ...prev]);

    // Record the drawn protagonist item to checklist (default: completed = false)
    const newProtagonist: ProtagonistRecord = {
      id: 'rec-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      eventName: winningEvent.name,
      type: winningEvent.type,
      value: winningEvent.value,
      completed: false
    };

    setProtagonistRecords((prev) => [newProtagonist, ...prev]);

    // Set interactive visual pop-up notice
    setWheelNotification({
      show: true,
      winningEvent,
      randomNumber,
      pointsDelta
    });

    // Timeout alert toast
    setTimeout(() => {
      setWheelNotification((prev) => {
        if (prev.winningEvent?.id === winningEvent.id) {
          return { ...prev, show: false };
        }
        return prev;
      });
    }, 12000);
  };

  // Checklist actions
  const handleToggleRecord = (id: string) => {
    setProtagonistRecords((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, completed: !rec.completed } : rec))
    );
  };

  const handleClearRecords = () => {
    setProtagonistRecords([]);
  };

  const handleWeeklyReset = () => {
    setCurrentPoints(0);
  };

  const handleClearHistory = () => {
    setLogs([]);
  };

  const isSyncLoading = authLoading || (currentUser !== null && !isLoadedFromCloud);

  if (isSyncLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans antialiased">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400 font-bold mt-3 animate-pulse">正在对齐云端配置序列中...</span>
      </div>
    );
  }

  if (!currentUser && !isGuest) {
    return <AuthScreen onGuestLogin={() => { setIsGuest(true); localStorage.setItem('habit_wheel_guest_mode', 'true'); }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      
      {/* Visual Elegant Screen-Centered Modal Confirmation Dialog */}
      {wheelNotification.show && wheelNotification.winningEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center flex flex-col items-center">
            {/* Celebration icon */}
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shadow-inner mb-4 animate-bounce">
              <Sparkles className="w-8 h-8 fill-indigo-100" />
            </div>
            
            <h3 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">
              🎯 抽取习惯已经选定
            </h3>
            
            <div className="my-4 px-5 py-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl w-full">
              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wide block mb-1">本轮抽中习惯</span>
              <strong className="text-lg sm:text-xl font-black text-indigo-900 block truncate">
                {wheelNotification.winningEvent.name}
              </strong>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              该习惯已被确立为<b>本轮执行项目</b>，并已同步载入右下方的执行清单。当前习惯积分已按照各占格之权重比例完成结算。
            </p>

            <div className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between mb-6 font-mono text-xs">
              <div className="flex flex-col items-start gap-0.5 text-left">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">本次占格概率计算</span>
                <span className="text-slate-500">习惯积分流水</span>
              </div>
              <strong className={`text-sm sm:text-base font-extrabold ${wheelNotification.pointsDelta >= 0 ? 'text-emerald-600' : 'text-rose-605 text-rose-600'}`}>
                {wheelNotification.pointsDelta >= 0 ? `+${wheelNotification.pointsDelta}` : wheelNotification.pointsDelta} 分
              </strong>
            </div>

            <button
              onClick={() => setWheelNotification((prev) => ({ ...prev, show: false }))}
              style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
              className="w-full py-3 hover:opacity-90 font-bold rounded-2xl text-xs sm:text-sm transition-colors cursor-pointer shadow-md select-none text-white"
            >
              收到，即刻执行！
            </button>
          </div>
        </div>
      )}

      {/* Primary Workspace container */}
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Simplified professional head title layout */}
        <header className="pb-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[10px] font-bold font-mono text-indigo-600 uppercase">
                Hybrid Decision Matrix
              </span>
              <span className="text-[11px] text-slate-400">• 习惯概率自适应设定</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">转盘习惯游戏</h1>
            <p className="text-xs text-slate-500 mt-1">
              生活是各习惯概率发生期望的总和。<b>习惯仓库</b>负责日常权重分值绑定；而<b>概率转盘</b>则可以自由拽入习惯，增减<b>占格数</b>调整发生比例，即可一键完成概率均值结算。
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-white border border-slate-200 p-2.5 px-3.5 rounded-2xl shrink-0 self-start md:self-center shadow-3xs select-none">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <UserIcon className="w-4 h-4 text-indigo-550" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase font-mono tracking-wider">CURRENT SESSION</span>
              <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]" title={isGuest ? "本地离线游客" : (currentUser?.email || "")}>
                {isGuest ? "本地游客 (离线体验)" : currentUser?.email}
              </span>
            </div>
            <button
              onClick={() => {
                if (isGuest) {
                  setIsGuest(false);
                  localStorage.removeItem('habit_wheel_guest_mode');
                } else {
                  signOut(auth);
                }
              }}
              className="ml-2 hover:bg-rose-50 hover:text-rose-600 group p-2 text-slate-400 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              title={isGuest ? "安全退出游客模式" : "安全退出账户登录"}
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
            </button>
          </div>
        </header>

        {/* Full-width "今日转盘" (Today's Wheel Board) */}
        <div className="w-full">
          <SpinnerWheel
            events={wheelItems}
            isSpinning={isSpinning}
            onSpinEnd={handleSpinEnd}
            isValid={isSetupValid}
            currentPoints={currentPoints}
            expectedValue={expectedValue}
          />
        </div>

        {/* Symmetrical Dual configuration grid panel */}
        <EventList
          registryEvents={registryEvents}
          onRegistryChange={setRegistryEvents}
          wheelItems={wheelItems}
          onWheelItemsChange={setWheelItems}
          expectedValue={expectedValue}
        />

        {/* ScoreBoard and Execution Checklist */}
        <ScoreBoard
          currentPoints={currentPoints}
          logs={logs}
          protagonistRecords={protagonistRecords}
          onToggleRecord={handleToggleRecord}
          onClearRecords={handleClearRecords}
          onPointsChange={setCurrentPoints}
          onWeeklyReset={handleWeeklyReset}
          onClearHistory={handleClearHistory}
        />

        {/* Real-time Cloud History Records Tracking */}
        <CloudHistory />

      </div>
    </div>
  );
}
