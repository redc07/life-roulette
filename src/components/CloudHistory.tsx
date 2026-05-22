import React, { useEffect, useState } from 'react';
import { db, auth, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Clock, Calendar, CheckSquare, Sparkles, TrendingUp, TrendingDown, ArrowRight, RefreshCw, Layers } from 'lucide-react';

interface FirestoreSpinRecord {
  id: string;
  timestamp: any;
  hitEvent: string;
  change: number;
  dailyTotal: number;
}

export default function CloudHistory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [records, setRecords] = useState<FirestoreSpinRecord[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth.currentUser) {
      setLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;
    const spinsPath = `users/${uid}/spins`;
    
    // Set up a real-time Firestore listener ordered by timestamp descending
    const q = query(
      collection(db, 'users', uid, 'spins'),
      orderBy('timestamp', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parsed: FirestoreSpinRecord[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        parsed.push({
          id: doc.id,
          timestamp: data.timestamp,
          hitEvent: data.hitEvent || '未知事件',
          change: Number(data.change) || 0,
          dailyTotal: Number(data.dailyTotal) || 0
        });
      });
      setRecords(parsed);
      setLoading(false);
    }, (err) => {
      console.error("Firestore onSnapshot subscription failed:", err);
      setError("从云端加载轨迹账本时被拦截，请确认您的 Firestore 安全规则是否已成功部署。");
      setLoading(false);
      // Fallback invocation complying with critical constraints of firestore integration skill
      try {
        handleFirestoreError(err, OperationType.LIST, spinsPath);
      } catch (logErr) {
        // caught to avoid breaking React lifecycle
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const isGuestModeActive = localStorage.getItem('habit_wheel_guest_mode') === 'true';

  if (!isFirebaseConfigured) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center text-xs text-slate-500 max-w-4xl mx-auto space-y-3">
        <Layers className="w-8 h-8 text-indigo-500 mx-auto animate-pulse" />
        <h4 className="text-sm font-bold text-slate-800">🌐 离线模式提示 / 云端结算轨迹未挂载</h4>
        <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
          您当前正在使用 <b>本地免登录游客状态</b>。由于未检测到宿主的 Firebase 相关环境变量，程序会自动采用本地存储形式运作。
        </p>
        <p className="text-[11px] text-slate-400">
          如需启用真实的多端实时云账户对齐、每日历史足迹追查等高级特性，请在 <b>AI Studio Settings</b> 里配置配置相应的 VITE_FIREBASE_* 变量。
        </p>
      </div>
    );
  }

  if (isGuestModeActive && !auth.currentUser) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center text-xs text-slate-500 max-w-4xl mx-auto space-y-3">
        <Layers className="w-8 h-8 text-indigo-600 mx-auto" />
        <h4 className="text-sm font-bold text-slate-800">💡 正在使用游客离线模式</h4>
        <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
          本地免登录游客状态下将不会同步到云端数据库。可在顶部点击 <b>退出游客模式</b> 并使用您的邮箱注册/登录帐户，即可开启 Firestore 实时追踪轨迹与近7天报表结算面板。
        </p>
      </div>
    );
  }

  // 1. Group records and filter
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getRecordJSDate = (rec: FirestoreSpinRecord) => {
    if (!rec.timestamp) return new Date();
    if (rec.timestamp instanceof Timestamp) {
      return rec.timestamp.toDate();
    }
    if (rec.timestamp.seconds !== undefined) {
      return new Timestamp(rec.timestamp.seconds, rec.timestamp.nanoseconds).toDate();
    }
    return new Date(rec.timestamp);
  };

  // Today's spins
  const todayRecords = records.filter(rec => {
    const d = getRecordJSDate(rec);
    d.setHours(0,0,0,0);
    return d.getTime() === today.getTime();
  });

  // Calculate Last 7 Days Daily Summaries
  // We want to generate the date strings for the last 7 days (including today)
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0,0,0,0);
    return d;
  });

  const dailySummaries = last7DaysData.map(dateObj => {
    const dateStr = dateObj.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    const fullDateKey = dateObj.toDateString();

    const daySpins = records.filter(rec => {
      const recDate = getRecordJSDate(rec);
      return recDate.toDateString() === fullDateKey;
    });

    const sumChange = daySpins.reduce((sum, r) => sum + r.change, 0);
    // The final daily score corresponds to the dailyTotal at the *latest* spin of that day
    const finalDailyTotal = daySpins.length > 0 ? daySpins[0].dailyTotal : null;

    return {
      dateStr,
      spinsCount: daySpins.length,
      sumChange,
      finalDailyTotal
    };
  });

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-150">
        <div className="flex items-center gap-2">
          <RefreshCw className={`w-5 h-5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          <div>
            <h4 className="text-sm font-extrabold text-slate-800">☁️ 云存储历史轨迹</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Firebase Firestore 实时追踪同步</p>
          </div>
        </div>
        <div className="text-[10px] text-emerald-600 font-mono font-bold bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>云端数据库已就绪</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-xs text-slate-400 flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
          <span>正在与 Firestore 建立实时同步握手...</span>
        </div>
      ) : error ? (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs text-center">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Column A: Today's Spins Log */}
          <div className="space-y-3">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>今日云端转盘记录 ({todayRecords.length} 次)</span>
            </h5>

            {todayRecords.length === 0 ? (
              <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                今日您还没有启动任何转盘转动。点击上方开始转动转盘，抽取出来的习惯和对应的结算积分将瞬间写入。
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {todayRecords.map((rec) => {
                  const d = getRecordJSDate(rec);
                  const timeString = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  return (
                    <div 
                      key={rec.id} 
                      className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex flex-col min-w-0">
                        <strong className="font-extrabold text-slate-800 truncate">🎯 {rec.hitEvent}</strong>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5">{timeString} 记</span>
                      </div>
                      
                      <div className="flex items-center gap-2 font-mono shrink-0">
                        <div className="text-right">
                          <span className={`font-black ${rec.change >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {rec.change >= 0 ? `+${rec.change}` : rec.change}
                          </span>
                          <span className="text-[8px] text-slate-400 block font-normal">当日余额: {rec.dailyTotal}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column B: Last 7 Days Summaries */}
          <div className="space-y-3">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>近 7 天每日结算足迹统计</span>
            </h5>

            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              {dailySummaries.map((day, idx) => {
                const isTodayStr = idx === 0 ? ' (今日)' : '';
                return (
                  <div 
                    key={idx}
                    className={`p-3 border rounded-xl flex items-center justify-between text-xs ${
                      idx === 0 
                        ? 'bg-indigo-50/20 border-indigo-100 shadow-3xs' 
                        : 'bg-white border-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-600">{day.dateStr}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{isTodayStr || `共 ${day.spinsCount} 次转动`}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className={`text-[10px] font-bold ${day.sumChange >= 0 ? 'text-emerald-600/80 bg-emerald-50 px-1 py-0.2 rounded' : 'text-rose-500/80 bg-rose-50 px-1 py-0.2 rounded'}`}>
                        变动 {day.sumChange >= 0 ? `+${day.sumChange}` : day.sumChange}
                      </span>
                      {day.finalDailyTotal !== null ? (
                        <div className="text-right shrink-0 min-w-16">
                          <span className="font-extrabold text-slate-800">{day.finalDailyTotal}</span>
                          <span className="text-[8px] text-slate-400"> 分</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-350 shrink-0 min-w-16 text-right">暂无数据</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
