
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* 装饰性背景 */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-900/40 blur-[120px] rounded-full"></div>

      <div className="bg-white/10 backdrop-blur-2xl p-12 rounded-[3rem] shadow-2xl border border-white/10 max-w-md w-full relative z-10 animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-amber-600 rounded-[2rem] flex items-center justify-center text-white text-3xl shadow-2xl shadow-amber-600/30 mb-6">
            <i className="fas fa-wine-glass"></i>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight text-center">
            黄关 <span className="text-amber-500">超级终端</span>
          </h1>
          <p className="text-amber-200/50 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">
            Aesthetic AI Workflow Agent
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-200/40 uppercase tracking-widest ml-4">
              推荐官账号 / 姓名
            </label>
            <input
              type="text"
              placeholder="请输入您的姓名开启定制"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-500 text-white py-5 rounded-2xl font-black shadow-2xl shadow-amber-600/20 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            开启您的专属工坊
            <i className="fas fa-arrow-right"></i>
          </button>
        </form>

        <div className="mt-12 pt-12 border-t border-white/5 text-center">
          <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest leading-relaxed">
            数据将存储在本地，并根据账号生成专属记忆。<br/>
            隐私与美学，我们同样在乎。
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
