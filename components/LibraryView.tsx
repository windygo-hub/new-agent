
"use client";

import React, { useState, useEffect } from 'react';
import { LibraryItem } from '../types';
import { storageService } from '../services/storageService';

interface LibraryViewProps {
  onBack: () => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ onBack }) => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  useEffect(() => {
    setItems(storageService.getItems());
  }, []);

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const copy = prompt("请输入此素材的描述或品牌调性文案：") || "品牌素材";
        const newItem = storageService.saveItem({
          type: 'manual',
          copy,
          imageUrl: reader.result as string,
          category: '手动上传'
        });
        setItems(prev => [newItem, ...prev]);
        setUploading(false);
        alert("素材上传并存入灵感库成功！");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      // 1. 阻止点击事件穿透
      e.preventDefault();
      e.stopPropagation();

      // ❌ 删除这行：if (window.confirm(...)) {
      // ✅ 改为直接执行删除逻辑：

      console.log("准备删除 ID:", id); // 调试用

      try {
        // 2. 调用服务层删除
        storageService.deleteItem(id);
        
        // 3. 更新界面 (立刻把删掉的项从列表中移除)
        setItems(prevItems => prevItems.filter(item => item.id !== id));
        
        // 4. 如果删的是当前打开的卡片，就关掉详情页
        if (selectedItem?.id === id) {
          setSelectedItem(null);
        }
        console.log("删除成功！");
      } catch (err) {
        console.error("删除出错:", err);
        alert("删除操作遇到错误，请刷新页面后再试。");
      }

      // } ❌ 记得删掉 if 的结束大括号
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("已成功复制文案到剪贴板！");
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-slate-500 hover:text-amber-600 font-bold flex items-center gap-2 transition-colors">
          <i className="fas fa-arrow-left"></i> 返回工作台
        </button>
        <div className="relative">
          <button className="bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-amber-100 hover:scale-105 transition-transform">
            <i className="fas fa-plus"></i> 添加品牌素材
          </button>
          <input type="file" onChange={handleManualUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-200">
          <i className="fas fa-folder-open text-slate-200 text-6xl mb-4"></i>
          <h3 className="text-xl font-bold text-slate-400">您的灵感库空空如也</h3>
          <p className="text-slate-400 mt-2">保存满意的 AI 成果或上传已有资产来喂养您的 Agent</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 group relative cursor-pointer hover:shadow-xl hover:border-amber-200 transition-all"
            >
              {item.imageUrl && (
                <div className="relative h-48 overflow-hidden pointer-events-none">
                  <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                    <i className="fas fa-eye text-white opacity-0 group-hover:opacity-100 text-2xl transition-opacity"></i>
                  </div>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                    item.type === 'manual' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {item.type === 'manual' ? '手动素材' : 'AI 成果'}
                  </span>
                  <span className="text-[10px] text-slate-300 font-bold">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic line-clamp-3">
                  “{item.copy}”
                </p>
              </div>
              
              <button 
                type="button"
                onClick={(e) => handleDelete(e, item.id)}
                style={{ zIndex: 9999, pointerEvents: 'auto' }}
                className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-red-500 w-9 h-9 rounded-full opacity-60 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-500 hover:text-white shadow-xl border border-slate-100 active:scale-90"
                title="永久删除"
              >
                <i className="fas fa-trash-can text-xs pointer-events-none"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[300] flex items-center justify-center p-6 animate-fade-in" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-scale-in" onClick={e => e.stopPropagation()}>
            {selectedItem.imageUrl && (
              <div className="md:w-1/2 bg-slate-50 flex items-center justify-center overflow-hidden border-r border-slate-100">
                <img src={selectedItem.imageUrl} className="w-full h-full object-contain" alt="Preview" />
              </div>
            )}
            <div className={`flex flex-col p-10 ${selectedItem.imageUrl ? 'md:w-1/2' : 'w-full'}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                      <i className="fas fa-quote-right"></i>
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-slate-800">灵感存档详情</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedItem.type === 'manual' ? 'Manual Asset' : 'AI Generated Result'}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedItem(null)} className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">朋友圈文案</span>
                    <button onClick={() => copyToClipboard(selectedItem.copy)} className="text-[10px] text-amber-600 font-black hover:underline flex items-center gap-1">
                      <i className="fas fa-copy"></i> 复制全文
                    </button>
                  </div>
                  <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                    <p className="text-slate-700 leading-relaxed font-serif italic text-lg">
                      {selectedItem.copy}
                    </p>
                  </div>
                </div>

                {selectedItem.commentScript && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">互动脚本</span>
                      <button onClick={() => copyToClipboard(selectedItem.commentScript!)} className="text-[10px] text-amber-600 font-black hover:underline flex items-center gap-1">
                        <i className="fas fa-copy"></i> 复制脚本
                      </button>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xs text-slate-500 leading-relaxed font-medium whitespace-pre-wrap">
                        {selectedItem.commentScript}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-300 font-bold">
                  <span>创建时间：{new Date(selectedItem.createdAt).toLocaleString()}</span>
                  <span>ID: {selectedItem.id}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                <button 
                   onClick={() => setSelectedItem(null)}
                   className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryView;
