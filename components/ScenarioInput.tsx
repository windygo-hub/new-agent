
import React, { useState, useEffect } from 'react';
import { PersonaCategory, LibraryItem, ContentCategory, UserPersona, SellingPoint, ProductPhoto, StyleReference } from '../types';
import { storageService } from '../services/storageService';

interface ScenarioInputProps {
  initialData: {
    scenario: string;
    refImage: string | null;
    selectedCategory: ContentCategory;
    userPersona: UserPersona;
    selectedUSPIds: Set<string>;
    selectedProductIds: Set<string>;
    selectedStyleRefIds: Set<string>;
    selectedContextIds: Set<string>;
  };
  onGenerate: (scenario: string, refImage: string | null, category: ContentCategory, userPersona: UserPersona, selectedContext: LibraryItem[], selectedUSP: SellingPoint[], selectedProducts: ProductPhoto[], selectedStyleRefs: StyleReference[]) => void;
  onUpdateData: (data: any) => void;
  isLoading: boolean;
  onOpenLibrary: () => void;
}

const BRAND_CATEGORIES: PersonaCategory[] = [
  { id: 'PRO', name: '专业价值', description: '专业科普与鉴别知识', icon: 'fa-feather', group: 'BRAND' },
  { id: 'TESTIMONIAL', name: '信任见证', description: '真实口碑与好评分享', icon: 'fa-comments', group: 'BRAND' },
  { id: 'PROMO', name: '品牌促销', description: '新品动态与限时福利', icon: 'fa-gift', group: 'BRAND' },
];

const PERSONAL_CATEGORIES: PersonaCategory[] = [
  { id: 'LIFE_AESTHETIC', name: '格调生活', description: '生活审美与艺术日常', icon: 'fa-leaf', group: 'PERSONAL' },
  { id: 'LIFE_THOUGHT', name: '真诚随笔', description: '对生活与事业的思考', icon: 'fa-pen-nib', group: 'PERSONAL' },
  { id: 'LIFE_DAILY', name: '烟火日常', description: '温暖接地气的碎片记录', icon: 'fa-mug-hot', group: 'PERSONAL' },
];

const SYSTEM_PERSONAS: (UserPersona & { icon: string })[] = [
  { 
    name: '企业菁英', 
    icon: 'fa-briefcase', 
    identity: '女性，追求品质生活的企业中高层管理者', 
    traits: ['干练', '品质', '细腻'], 
    background: '身处高压职场，更懂得在一杯黄酒中寻找片刻的宁静与生活质感。', 
    isSystem: true 
  },
  { 
    name: '文化儒商', 
    icon: 'fa-landmark-dome', 
    identity: '男性，热爱传统文化的跨领域经营管理者', 
    traits: ['睿智', '稳重', '有温度'], 
    background: '对中国传统礼仪有深厚研究，认为每一瓶好酒都是一种文化的承载与流动。', 
    isSystem: true 
  },
  { 
    name: '生活家', 
    icon: 'fa-couch', 
    identity: '不限性别，热爱慢生活、有品质格调的社会人士', 
    traits: ['亲和', '随性', '有逻辑'], 
    background: '相信好物必须有灵魂，通过分享真实的饮用体验，让高品质黄酒触手及。', 
    isSystem: true 
  },
];

const ScenarioInput: React.FC<ScenarioInputProps> = ({ initialData, onGenerate, onUpdateData, isLoading, onOpenLibrary }) => {
  const [activeTab, setActiveTab] = useState<'persona' | 'foundation' | 'visual' | 'scenario'>('persona');
  
  const [scenario, setScenario] = useState(initialData.scenario);
  const [refImage, setRefImage] = useState<string | null>(initialData.refImage); 
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory>(initialData.selectedCategory);
  const [userPersona, setUserPersona] = useState<UserPersona>(initialData.userPersona);
  const [isCustomPersona, setIsCustomPersona] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [savedPersonas, setSavedPersonas] = useState<UserPersona[]>([]);

  const [sellingPoints, setSellingPoints] = useState<SellingPoint[]>([]);
  const [selectedUSPIds, setSelectedUSPIds] = useState<Set<string>>(initialData.selectedUSPIds);
  const [isAddingUSP, setIsAddingUSP] = useState(false);
  const [newUSPText, setNewUSPText] = useState('');

  const [productPhotos, setProductPhotos] = useState<ProductPhoto[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(initialData.selectedProductIds);

  const [styleRefs, setStyleRefs] = useState<StyleReference[]>([]);
  const [selectedStyleRefIds, setSelectedStyleRefIds] = useState<Set<string>>(initialData.selectedStyleRefIds);

  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [selectedContextIds, setSelectedContextIds] = useState<Set<string>>(initialData.selectedContextIds);

  useEffect(() => {
    setSellingPoints(storageService.getSellingPoints());
    setProductPhotos(storageService.getProductPhotos());
    setStyleRefs(storageService.getStyleReferences());
    setLibraryItems(storageService.getItems());
    setSavedPersonas(storageService.getSavedPersonas());
  }, []);

  useEffect(() => {
    onUpdateData({
      scenario,
      refImage,
      selectedCategory,
      userPersona,
      selectedUSPIds,
      selectedProductIds,
      selectedStyleRefIds,
      selectedContextIds
    });
  }, [scenario, refImage, selectedCategory, userPersona, selectedUSPIds, selectedProductIds, selectedStyleRefIds, selectedContextIds]);

  const compressForStorage = (base64: string, maxWidth = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium';
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  };

  // 逻辑层优化：处理“定制新角色”逻辑，增加数量限制
  const handleStartNewCustom = () => {
    if (!isCustomPersona) {
      if (savedPersonas.length >= 3) {
        alert("自定义人设已达上限（3个），请编辑现有的人设。");
        return;
      }
      setUserPersona({
        name: '',
        identity: '',
        traits: [],
        background: '',
        isSystem: false
      });
    }
    setIsCustomPersona(!isCustomPersona);
  };

  // 逻辑层优化：载入现有角色进入编辑模式
  const handleEditSavedPersona = (persona: UserPersona, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserPersona(persona);
    setIsCustomPersona(true);
  };

  const handleSavePersona = () => {
    if (!userPersona.name || !userPersona.identity || !userPersona.background) {
      alert("请完整填写人设信息。");
      return;
    }
    setSaveStatus('saving');
    const saved = storageService.savePersona(userPersona);
    setSavedPersonas(storageService.getSavedPersonas());
    setSaveStatus('saved');
    setTimeout(() => {
      setSaveStatus('idle');
      setIsCustomPersona(false);
      setUserPersona(saved);
    }, 1000);
  };

  // 逻辑层：物理删除逻辑保留但在 UI 中移除调用
  const handleDeleteSavedPersona = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("确定要永久删除这个人设档案吗？此操作无法撤销。")) {
      storageService.deletePersona(id);
      setSavedPersonas(prev => prev.filter(p => p.id !== id));
      if (userPersona.id === id) {
        setUserPersona(SYSTEM_PERSONAS[0]);
        if (isCustomPersona) setIsCustomPersona(false);
      }
    }
  };

  const toggleUSP = (id: string) => {
    const next = new Set(selectedUSPIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUSPIds(next);
  };

  const handleDeleteUSP = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("确定要删除这个卖点吗？")) {
      storageService.deleteSellingPoint(id);
      setSellingPoints(storageService.getSellingPoints());
      const next = new Set(selectedUSPIds);
      next.delete(id);
      setSelectedUSPIds(next);
    }
  };

  const handleSaveNewUSP = () => {
    if (!newUSPText.trim()) return;
    storageService.addSellingPoint(newUSPText.trim());
    setSellingPoints(storageService.getSellingPoints());
    setNewUSPText('');
    setIsAddingUSP(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'style') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("图片太大（超过10MB），请选择较小的图片。");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressForStorage(reader.result as string);
        if (type === 'product') {
          storageService.saveProductPhoto(compressed);
          setProductPhotos(storageService.getProductPhotos());
        } else {
          storageService.saveStyleReference(compressed);
          setStyleRefs(storageService.getStyleReferences());
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProduct = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    storageService.deleteProductPhoto(id);
    setProductPhotos(prev => prev.filter(p => p.id !== id));
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleDeleteStyle = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    storageService.deleteStyleReference(id);
    setStyleRefs(prev => prev.filter(s => s.id !== id));
    setSelectedStyleRefIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleStyleSelect = (id: string) => {
    setSelectedStyleRefIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleProductSelect = (id: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleGenerateClick = () => {
    const context = libraryItems.filter(i => selectedContextIds.has(i.id));
    const usp = sellingPoints.filter(s => selectedUSPIds.has(s.id));
    const products = productPhotos.filter(p => selectedProductIds.has(p.id));
    const styles = styleRefs.filter(r => selectedStyleRefIds.has(r.id));
    onGenerate(scenario, refImage, selectedCategory, userPersona, context, usp, products, styles);
  };

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
        {[
          { id: 'persona', label: '1.身份设定', icon: 'fa-id-card-clip' },
          { id: 'foundation', label: '2.核心依据', icon: 'fa-database' },
          { id: 'visual', label: '3.视觉素材', icon: 'fa-images' },
          { id: 'scenario', label: '4.内容灵感', icon: 'fa-feather-pointed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${
              activeTab === tab.id ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-amber-600'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[500px] relative">
        {activeTab === 'persona' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <i className="fas fa-id-badge text-amber-500"></i>
                  超级终端人设档案
               </h3>
               <div className="flex gap-2">
                 <button 
                   onClick={handleStartNewCustom} 
                   className={`text-[10px] px-4 py-2 rounded-xl font-black transition-all ${
                     isCustomPersona ? 'bg-slate-800 text-white' : 'bg-amber-50 text-amber-600 border border-amber-200'
                   }`}
                 >
                   {isCustomPersona ? '取消编辑' : '定制新角色'}
                 </button>
               </div>
            </div>

            {!isCustomPersona ? (
              <div className="space-y-8 animate-fade-in">
                <div className="space-y-4">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">系统预设人设</div>
                  <div className="grid grid-cols-3 gap-4">
                    {SYSTEM_PERSONAS.map((p, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setUserPersona(p)} 
                        className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${
                          userPersona.name === p.name 
                          ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-100' 
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-amber-200 hover:bg-white'
                        }`}
                      >
                        <i className={`fas ${p.icon} text-2xl ${userPersona.name === p.name ? 'text-amber-600' : 'text-slate-300'}`}></i>
                        <span className={`text-xs font-black ${userPersona.name === p.name ? 'text-amber-900' : 'text-slate-500'}`}>{p.name}</span>
                        <span className={`text-[9px] font-medium opacity-60 line-clamp-2 text-center leading-tight ${userPersona.name === p.name ? 'text-amber-700' : 'text-slate-400'}`}>
                           {p.identity}
                        </span>
                      </button>
                    ))}
                  </div>

                  {savedPersonas.length > 0 && (
                    <>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4">我收藏的角色 (上限3个)</div>
                      <div className="grid grid-cols-3 gap-4">
                        {savedPersonas.map((p) => (
                          <div key={p.id} className="relative group">
                            <button 
                              onClick={() => setUserPersona(p)} 
                              className={`w-full p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${
                                userPersona.id === p.id 
                                ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-100' 
                                : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-amber-200 hover:bg-white'
                              }`}
                            >
                              <i className={`fas fa-user-pen text-2xl ${userPersona.id === p.id ? 'text-amber-600' : 'text-slate-300'}`}></i>
                              <span className={`text-xs font-black ${userPersona.id === p.id ? 'text-amber-900' : 'text-slate-500'}`}>{p.name}</span>
                              <span className={`text-[9px] font-medium opacity-60 text-center ${userPersona.id === p.id ? 'text-amber-700' : 'text-slate-400'}`}>
                                 自定义人设
                              </span>
                            </button>
                            <div className="absolute -top-1 -right-1 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button 
                                onClick={(e) => handleEditSavedPersona(p, e)}
                                className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg"
                                title="编辑人设"
                              >
                                <i className="fas fa-pen text-[9px]"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                    <i className="fas fa-id-card text-8xl"></i>
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-white border-2 border-amber-100 rounded-2xl flex items-center justify-center shadow-sm">
                        <i className={`fas ${(userPersona as any).icon || 'fa-user-check'} text-2xl text-amber-600`}></i>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-slate-800 tracking-tight">{userPersona.name || '未设定角色'}</div>
                        <div className="text-xs font-bold text-amber-600 mt-1">{userPersona.identity || '请从上方选择或定制角色'}</div>
                      </div>
                      {!userPersona.isSystem && userPersona.id && (
                        <button 
                          onClick={(e) => handleEditSavedPersona(userPersona, e)}
                          className="ml-auto text-[10px] bg-amber-600 text-white px-3 py-1.5 rounded-lg font-black"
                        >
                          编辑此角色
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-200">
                      <div className="space-y-3">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">性格特质</span>
                         <div className="flex flex-wrap gap-2">
                            {(userPersona.traits || []).map((t, i) => (
                              <span key={i} className="px-3 py-1 bg-amber-100/50 text-amber-900 rounded-lg text-[10px] font-bold border border-amber-200/50">{t}</span>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-3">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">核心背景</span>
                         <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            {userPersona.background || '点击“定制新角色”来赋予您的 Agent 灵魂...'}
                         </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">角色代号</label>
                    <input 
                      placeholder="例如：汉中酿造大师" 
                      value={userPersona.name || ''} 
                      onChange={e => setUserPersona({...userPersona, name: e.target.value})} 
                      className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-amber-500" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">性格关键词</label>
                    <input 
                      placeholder="温婉, 睿智, 真实" 
                      value={(userPersona.traits || []).join(',')} 
                      onChange={e => setUserPersona({...userPersona, traits: e.target.value.split(',').map(t => t.trim())})} 
                      className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-amber-500" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">身份核心定位</label>
                  <textarea 
                    placeholder="描述推荐官的核心使命与身份..." 
                    value={userPersona.identity || ''} 
                    onChange={e => setUserPersona({...userPersona, identity: e.target.value})} 
                    className="w-full h-24 bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-amber-500 resize-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">成长背景故事</label>
                  <textarea 
                    placeholder="描述该角色的生活阅历与专业积淀..." 
                    value={userPersona.background || ''} 
                    onChange={e => setUserPersona({...userPersona, background: e.target.value})} 
                    className="w-full h-24 bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-amber-500 resize-none" 
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <button onClick={handleSavePersona} className="bg-amber-600 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-amber-100 flex items-center gap-2">
                    {saveStatus === 'saving' ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-check"></i>}
                    {saveStatus === 'saved' ? '保存成功' : (userPersona.id ? '更新人设档案' : '保存为人设档案')}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button onClick={() => setActiveTab('foundation')} className="flex items-center gap-2 px-8 py-4 bg-amber-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-amber-100">
                下一步：核心依据 <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'foundation' && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-6">
              <label className="block text-base font-black text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2"><i className="fas fa-certificate text-amber-500"></i> 产品核心卖点</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {sellingPoints.map(usp => (
                  <div key={usp.id} className="relative group">
                    <button onClick={() => toggleUSP(usp.id)} className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all pr-8 ${selectedUSPIds.has(usp.id) ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                      {usp.text}
                    </button>
                    <button onClick={(e) => handleDeleteUSP(usp.id, e)} className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fas fa-times text-[8px]"></i>
                    </button>
                  </div>
                ))}
                {isAddingUSP ? (
                  <div className="flex items-center gap-2">
                    <input autoFocus placeholder="输入新卖点..." value={newUSPText} onChange={e => setNewUSPText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveNewUSP()} className="bg-slate-50 border border-amber-200 rounded-xl px-4 py-2 text-xs text-slate-700 outline-none" />
                    <button onClick={handleSaveNewUSP} className="bg-amber-600 text-white px-3 py-2 rounded-xl text-xs font-black">添加</button>
                  </div>
                ) : (
                  <button onClick={() => setIsAddingUSP(true)} className="px-4 py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs font-bold hover:border-amber-400 flex items-center gap-1">
                    <i className="fas fa-plus"></i> 自定义卖点
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between pt-6 border-t border-slate-50">
              <button onClick={() => setActiveTab('persona')} className="text-slate-400 font-bold text-sm">上一步</button>
              <button onClick={() => setActiveTab('visual')} className="flex items-center gap-2 px-8 py-4 bg-amber-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-amber-100">
                下一步：视觉素材 <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'visual' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-black text-slate-800 flex flex-col gap-1 uppercase tracking-tighter">
                  <span className="flex items-center gap-2"><i className="fas fa-camera text-amber-500"></i> 视觉捕捉 (场景)</span>
                  <span className="text-[10px] text-slate-400 normal-case font-bold">拍摄真实环境图</span>
                </label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-3xl h-44 flex items-center justify-center bg-slate-50 group overflow-hidden">
                  {refImage ? (
                    <div className="w-full h-full relative">
                      <img src={refImage} className="w-full h-full object-cover" />
                      <button onClick={() => setRefImage(null)} className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center z-20"><i className="fas fa-times text-[10px]"></i></button>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <i className="fas fa-camera-retro text-slate-300 text-2xl mb-2"></i>
                      <input type="file" onChange={e => {
                        const file = e.target.files?.[0];
                        if(file) {
                          const r = new FileReader();
                          r.onloadend = () => setRefImage(r.result as string);
                          r.readAsDataURL(file);
                        }
                      }} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-black text-slate-800 flex flex-col gap-1 uppercase tracking-tighter">
                  <span className="flex items-center gap-2"><i className="fas fa-wand-magic-sparkles text-amber-500"></i> 创意参考 (风格)</span>
                  <span className="text-[10px] text-slate-400 normal-case font-bold">支持最大 10MB 文件</span>
                </label>
                <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100 h-44 overflow-y-auto scrollbar-hide">
                  <div className="grid grid-cols-3 gap-2">
                    {styleRefs.map(ref => (
                      <div key={ref.id} className="relative group">
                        <div 
                          onClick={() => toggleStyleSelect(ref.id)} 
                          className={`relative aspect-square w-full rounded-xl border-2 overflow-hidden transition-all cursor-pointer ${selectedStyleRefIds.has(ref.id) ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-transparent hover:border-amber-200'}`}
                        >
                          <img src={ref.url} className="w-full h-full object-cover pointer-events-none" />
                        </div>
                        <button 
                          onClick={(e) => handleDeleteStyle(e, ref.id)} 
                          type="button"
                          className="absolute -top-1 -right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center z-20 shadow-md transition-all cursor-pointer hover:scale-110 active:scale-95 border-2 border-white"
                        >
                          <i className="fas fa-trash-can text-[10px] pointer-events-none"></i>
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center hover:border-amber-400 cursor-pointer text-slate-300">
                      <i className="fas fa-plus"></i>
                      <input type="file" onChange={e => handlePhotoUpload(e, 'style')} className="hidden" accept="image/*" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-black text-slate-800 flex flex-col gap-1 uppercase tracking-tighter">
                  <span className="flex items-center gap-2"><i className="fas fa-wine-bottle text-amber-500"></i> 品牌图库 (产品)</span>
                  <span className="text-[10px] text-slate-400 normal-case font-bold">支持最大 10MB 文件</span>
                </label>
                <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100 h-44 overflow-y-auto scrollbar-hide">
                  <div className="grid grid-cols-3 gap-2">
                    {productPhotos.map(photo => (
                      <div key={photo.id} className="relative group">
                        <div 
                          onClick={() => toggleProductSelect(photo.id)} 
                          className={`aspect-square w-full rounded-xl border-2 overflow-hidden relative transition-all cursor-pointer ${selectedProductIds.has(photo.id) ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-transparent hover:border-amber-200'}`}
                        >
                          <img src={photo.url} className="w-full h-full object-cover pointer-events-none" />
                        </div>
                        <button 
                          onClick={(e) => handleDeleteProduct(e, photo.id)} 
                          type="button"
                          className="absolute -top-1 -right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center z-20 shadow-md transition-all cursor-pointer hover:scale-110 active:scale-95 border-2 border-white"
                        >
                          <i className="fas fa-trash-can text-[10px] pointer-events-none"></i>
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center hover:border-amber-400 cursor-pointer text-slate-300">
                      <i className="fas fa-plus"></i>
                      <input type="file" onChange={e => handlePhotoUpload(e, 'product')} className="hidden" accept="image/*" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-6 border-t border-slate-50">
              <button onClick={() => setActiveTab('foundation')} className="text-slate-400 font-bold text-sm">上一步</button>
              <button onClick={() => setActiveTab('scenario')} className="flex items-center gap-2 px-8 py-4 bg-amber-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-amber-100">
                下一步：内容灵感 <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'scenario' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><i className="fas fa-layer-group text-amber-500"></i> 维度 A：推荐官视野</span>
                  <div className="grid grid-cols-3 gap-2">
                    {BRAND_CATEGORIES.map(c => (
                      <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${selectedCategory === c.id ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-slate-100'}`}>
                        <i className={`fas ${c.icon} text-sm mb-1`}></i>
                        <span className="text-[10px] font-black">{c.name}</span>
                        <span className={`text-[8px] opacity-70 text-center leading-tight ${selectedCategory === c.id ? 'text-amber-50' : 'text-slate-400'}`}>{c.description}</span>
                      </button>
                    ))}
                  </div>
               </div>
               <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><i className="fas fa-mug-hot text-orange-500"></i> 维度 B：推荐官日常</span>
                  <div className="grid grid-cols-3 gap-2">
                    {PERSONAL_CATEGORIES.map(c => (
                      <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${selectedCategory === c.id ? 'bg-orange-600 text-white border-orange-600' : 'bg-white border-slate-100'}`}>
                        <i className={`fas ${c.icon} text-sm mb-1`}></i>
                        <span className="text-[10px] font-black">{c.name}</span>
                        <span className={`text-[8px] opacity-70 text-center leading-tight ${selectedCategory === c.id ? 'text-orange-50' : 'text-slate-400'}`}>{c.description}</span>
                      </button>
                    ))}
                  </div>
               </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-slate-50">
              <label className="block text-base font-black text-slate-800 flex items-center gap-2"><i className="fas fa-pen-nib text-amber-500"></i>记录此刻的黄关灵感...</label>
              <textarea value={scenario} onChange={e => setScenario(e.target.value)} placeholder="描述此时此刻的场景或心情..." className="w-full h-32 p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-2 focus:ring-amber-500 outline-none text-slate-700 text-sm leading-relaxed resize-none" />
            </div>
            <div className="flex justify-between items-center pt-6">
              <button onClick={() => setActiveTab('visual')} className="text-slate-400 font-bold text-sm">上一步</button>
              <button onClick={handleGenerateClick} disabled={!scenario.trim() || isLoading} className="px-12 py-5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-[2rem] font-black shadow-xl shadow-amber-100 transition-all flex items-center justify-center gap-3 text-lg">
                {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}开启超级定制
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioInput;
