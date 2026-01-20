
import React, { useState } from 'react';
import { storageService } from '../services/storageService';

interface FinalOutputProps {
  imageUrl?: string | null;
  copy: string;
  commentScript: string;
  persona: string;
  onReset: () => void;
  onBack: () => void;
}

const FinalOutput: React.FC<FinalOutputProps> = ({ imageUrl, copy, commentScript, persona, onReset, onBack }) => {
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveToLibrary = () => {
    storageService.saveItem({
      type: 'generated',
      copy,
      imageUrl: imageUrl || undefined,
      commentScript,
      category: persona
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 max-w-xl mx-auto">
        {imageUrl ? (
          <div className="relative">
            <img src={imageUrl} alt="Generated Visual" className="w-full h-auto object-cover" />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center">
             <i className="fas fa-feather text-white text-3xl opacity-50"></i>
          </div>
        )}
        
        <div className="p-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
              <i className="fas fa-wine-bottle"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black text-slate-800">黄酒生活美学推荐官</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Authentic Sharing · Now</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <i className="fas fa-quote-left absolute -top-4 -left-4 text-amber-100 text-3xl"></i>
              <p className="text-xl text-slate-700 leading-relaxed font-serif italic relative z-10">
                {copy}
              </p>
            </div>
            <div className="text-[10px] text-slate-300 font-bold flex items-center gap-2">
              <span className="w-10 h-px bg-slate-100"></span>
              {copy.length} 字文案
            </div>
          </div>

          <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100/50 space-y-3">
             <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                <i className="fas fa-comment-dots"></i> 互动脚本
             </div>
             <p className="text-xs text-amber-900 leading-relaxed font-medium whitespace-pre-wrap">
                {commentScript}
             </p>
          </div>

          <div className="pt-6 border-t border-slate-50 flex items-center justify-end">
            <button 
              onClick={handleSaveToLibrary}
              disabled={isSaved}
              className={`text-xs font-black px-8 py-3 rounded-2xl transition-all flex items-center gap-2 ${
                isSaved ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-amber-600'
              }`}
            >
              <i className={`fas ${isSaved ? 'fa-check' : 'fa-bookmark'}`}></i>
              {isSaved ? '已归档' : '存入灵感库'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button onClick={onBack} className="px-8 py-5 text-slate-400 font-black hover:bg-slate-100 rounded-3xl transition-all">
          返回修改
        </button>
        <button onClick={onReset} className="px-10 py-5 bg-amber-600 text-white rounded-3xl font-black hover:bg-amber-700 transition-all shadow-2xl shadow-amber-100">
          开启新的灵感
        </button>
      </div>
    </div>
  );
};

export default FinalOutput;
