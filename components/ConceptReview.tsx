
import React, { useState } from 'react';
import { GeneratedConcept, AspectRatio, ImageSize, Draft, ProductPhoto, StyleReference } from '../types';

interface ConceptReviewProps {
  concept: GeneratedConcept;
  onGenerateImage: (prompt: string, copy: string, refImage: string | null, styleRef: string | null, productImages: string[], isHighQuality: boolean, aspectRatio: AspectRatio, imageSize: ImageSize) => void;
  onSkipImage: (copy: string, commentScript: string) => void;
  isLoading: boolean;
  onBack: () => void;
}

const ConceptReview: React.FC<ConceptReviewProps> = ({ concept, onGenerateImage, onSkipImage, isLoading, onBack }) => {
  const [selectedDraftIndex, setSelectedDraftIndex] = useState(0);
  const currentDraft = concept.drafts[selectedDraftIndex];
  
  const [editedCopy, setEditedCopy] = useState(currentDraft.copy);
  const [editedPrompt, setEditedPrompt] = useState(currentDraft.visualSuggestion);
  
  const [isHighQuality, setIsHighQuality] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("3:4");
  const [imageSize, setImageSize] = useState<ImageSize>("1K");

  const handleDraftSelect = (index: number) => {
    setSelectedDraftIndex(index);
    setEditedCopy(concept.drafts[index].copy);
    setEditedPrompt(concept.drafts[index].visualSuggestion);
  };

  const ratios: {id: AspectRatio, label: string}[] = [
    {id: "1:1", label: "正方形"},
    {id: "3:4", label: "人像 (推荐)"},
    {id: "4:3", label: "经典 (4:3)"},
    {id: "16:9", label: "横屏"},
    {id: "9:16", label: "全屏"}
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-file-signature text-amber-500 text-xl"></i>
            方案确认与定制
          </h2>
          <div className="flex gap-2">
            {concept.drafts.map((d, idx) => (
              <button
                key={idx}
                onClick={() => handleDraftSelect(idx)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedDraftIndex === idx 
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-100' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                方案 {idx + 1}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-3 tracking-wider">朋友圈文案 (立体人设版)</label>
              <textarea
                value={editedCopy}
                onChange={(e) => setEditedCopy(e.target.value)}
                className="w-full h-48 p-5 bg-amber-50/30 border border-amber-100 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none text-slate-700 leading-relaxed font-medium"
              />
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <label className="block text-xs font-black text-slate-400 uppercase mb-3 tracking-wider flex items-center gap-2">
                <i className="fas fa-comment-dots text-amber-500"></i> 配套互动脚本 (确认后可存入)
              </label>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed italic">
                {currentDraft.commentScript}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-amber-50/30 p-6 rounded-3xl border border-amber-100 border-dashed">
              <label className="block text-xs font-black text-slate-400 uppercase mb-3 tracking-wider">配图提示词定制 (供AI参考)</label>
              <textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="w-full h-32 p-4 bg-white/50 border border-amber-100 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none text-slate-500 font-mono text-xs mb-4"
              />
              
              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">构图比例</label>
                <div className="flex flex-wrap gap-2">
                  {ratios.map((r) => (
                    <button key={r.id} onClick={() => setAspectRatio(r.id)} className={`py-2 px-3 text-[10px] font-bold rounded-xl border transition-all ${aspectRatio === r.id ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-amber-900 block">高级摄影模式</span>
                <span className="text-[10px] text-amber-700">启用专业级光影渲染 (消耗更多资源)</span>
              </div>
              <button onClick={() => setIsHighQuality(!isHighQuality)} className={`w-12 h-6 rounded-full transition-colors relative ${isHighQuality ? 'bg-amber-600' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isHighQuality ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 pt-8 mt-8 border-t border-slate-100">
          <button onClick={onBack} className="py-4 px-8 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-colors">上一步</button>
          
          <button
            onClick={() => onSkipImage(editedCopy, currentDraft.commentScript)}
            disabled={isLoading}
            className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-file-lines"></i>
            直接发布 (仅文案与脚本)
          </button>

          <button
            onClick={() => onGenerateImage(
              editedPrompt, 
              editedCopy, 
              concept.referenceImage || null, 
              (concept.styleReferences?.[0]?.url) || null,
              (concept.selectedProducts?.map(p => p.url) || []),
              isHighQuality, 
              aspectRatio, 
              imageSize
            )}
            disabled={isLoading}
            className="flex-1 py-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-2xl font-bold shadow-xl shadow-amber-100 transition-all flex items-center justify-center gap-2 group"
          >
            {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-camera group-hover:scale-110 transition-transform"></i>}
            生成配图成果
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConceptReview;
