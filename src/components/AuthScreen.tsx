import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
import { LogIn, UserPlus, Key, Mail, Lock, ShieldAlert, CheckCircle, Info } from 'lucide-react';

interface AuthScreenProps {
  onGuestLogin?: () => void;
}

export default function AuthScreen({ onGuestLogin }: AuthScreenProps = {}) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign in or raw Register action
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      setErrorMsg("检测到 Firebase 环境变量尚未配置。请先在 AI Studio Settings 中设置配置密钥。");
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMsg("登录成功！");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMsg("账户注册成功！");
      }
    } catch (err: any) {
      console.error(err);
      let localizedError = "操作失败，请核对输入格式。";
      if (err.code === 'auth/email-already-in-use') {
        localizedError = "该邮箱已被注册，请直接登录或使用其他邮箱。";
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        localizedError = "用户名/邮箱或密码不正确，请重新输入。";
      } else if (err.code === 'auth/weak-password') {
        localizedError = "密码太脆弱，建议大于 6 位字符以上。";
      } else if (err.code === 'auth/invalid-email') {
        localizedError = "邮箱格式不符合规范。";
      } else {
        localizedError = err.message || "未知的安全策略限制";
      }
      setErrorMsg(localizedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans select-none antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Core System visual badge */}
        <div className="flex justify-center mb-4">
          <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-bold font-mono text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            <span>CLOUD SYNCHRONIZATION SYSTEM</span>
          </div>
        </div>

        <h1 className="text-center text-2xl font-black text-slate-805 text-slate-900 tracking-tight">
          转盘习惯自主结算系统
        </h1>
        <p className="mt-1.5 text-center text-xs text-slate-500 max-w-sm mx-auto">
          一款科学调控概率比例的习惯管理应用，登录您的账户以开始同步多端记录
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 border border-slate-200/80 shadow-xl rounded-3xl space-y-6">
          
          {/* Environment warning notice if env values are missing */}
          {!isFirebaseConfigured && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-2.5 items-start">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-850 text-amber-805 text-amber-800 leading-relaxed w-full">
                <strong className="block font-bold mb-1">⚠️ 暂未配置 Firebase 密钥</strong>
                由于未检测到 Firebase 环境变量，此程序当前无法执行正常登录与云端存储操作。请登入 AI Studio 的 <b>Settings</b> 面板，依其次配置并配置以下变量：
                <ul className="list-disc pl-4 mt-1.5 font-mono text-[10px] space-y-0.5 text-amber-700 select-all">
                  <li>VITE_FIREBASE_API_KEY</li>
                  <li>VITE_FIREBASE_AUTH_DOMAIN</li>
                  <li>VITE_FIREBASE_PROJECT_ID</li>
                  <li>VITE_FIREBASE_APP_ID</li>
                </ul>
                {onGuestLogin && (
                  <button
                    type="button"
                    onClick={onGuestLogin}
                    className="mt-3.5 w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center block shadow-sm"
                  >
                    🚀 以本地游客模式试用 (免配置、免注册直接体验)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Log/Reg Segmented Switch tab */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                isLogin ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-400 hover:text-slate-650'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>登录账户</span>
            </button>
            <button
              onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                !isLogin ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-400 hover:text-slate-650'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>注册新账号</span>
            </button>
          </div>

          {/* Interactive forms feedback */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-650" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 font-mono tracking-wider uppercase mb-1.5">
                注册邮箱 / Email 地址
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 font-mono tracking-wider uppercase mb-1.5">
                登录密码 / Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  disabled={loading}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
              className="w-full py-3 mt-2 hover:opacity-95 font-bold rounded-2xl text-xs transition-opacity cursor-pointer shadow-md select-none flex items-center justify-center gap-1.5 disabled:opacity-50 text-white"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : isLogin ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>立即安全登录</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>创建我的账户并登录</span>
                </>
              )}
            </button>
          </form>

          {onGuestLogin && (
            <>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-150"></div>
                <span className="flex-shrink mx-4 text-slate-350 text-[9px] font-extrabold uppercase font-mono tracking-wider">或者 / OR</span>
                <div className="flex-grow border-t border-slate-150"></div>
              </div>

              <button
                type="button"
                onClick={onGuestLogin}
                className="w-full py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-2xl text-xs transition-all cursor-pointer select-none flex items-center justify-center gap-1 shadow-3xs"
              >
                <span>✨ 游客模式免登录试用 (本地数据版)</span>
              </button>
            </>
          )}

          {/* Quick Sandbox test tips with simulated values */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl flex gap-2 items-start text-[10px] text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              如果没有可用帐号，可自由选择 <b>注册新账号</b>。系统采用 Firebase Auth 严格的安全验证逻辑，不存储明文密码。
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
