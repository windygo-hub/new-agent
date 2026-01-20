
import React, { useState, useEffect, useRef } from 'react';
import { WorkflowStep, GeneratedConcept, AspectRatio, ImageSize, LibraryItem, ContentCategory, UserPersona, SellingPoint, ProductPhoto, StyleReference, User } from './types';
import { generateCreativeConcept, generateVisual } from './services/geminiService';
import { storageService } from './services/storageService';
import StepProgressBar from './components/StepProgressBar';
import ScenarioInput from './components/ScenarioInput';
import ConceptReview from './components/ConceptReview';
import FinalOutput from './components/FinalOutput';
import LibraryView from './components/LibraryView';
import Login from './components/Login';

const COPY_MESSAGES = [
  '正在调取您的专属品牌灵感库...',
  '正在分析历史文案调性...',
  '正在根据推荐官身份优化遣词造句...',
  '正在研磨生活美学词汇...',
  '正在构建黄关品牌的真诚感上下文...'
];

const VISUAL_MESSAGES = [
  '正在模拟胶片质感光影...',
  '正在分析产品瓶身材质反射...',
  '正在匹配构图美学比例...',
  '正在渲染高精度的视觉细节...',
  '正在确保品牌视觉资产的真实还原...'
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(WorkflowStep.SCENARIO_INPUT);
  const [concept, setConcept] = useState<GeneratedConcept | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [finalCopy, setFinalCopy] = useState<string>('');
  const [finalScript, setFinalScript] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('日常');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  
  const loadingIntervalRef = useRef<number | null>(null);
  const messageIntervalRef = useRef<number | null>(null);

  const [scenarioData, setScenarioData] = useState({
    scenario: '',
    refImage: null as string | null,
    selectedCategory: 'PRO' as ContentCategory,
    userPersona: { 
      name: '企业菁英', 
      identity: '女性，追求品质生活的企业中高层管理者', 
      traits: ['干练', '品质', '细腻'], 
      background: '身处高压职场，更懂得在一杯黄酒中寻找片刻的宁静与生活质感。' 
    } as UserPersona,
    selectedUSPIds: new Set<string>(),
    selectedProductIds: new Set<string>(),
    selectedStyleRefIds: new Set<string>(),
    selectedContextIds: new Set<string>()
  });

  useEffect(() => {
    const user = storageService.getCurrentUser();
    if (user) setCurrentUser(user);
  }, []);

  // 综合加载动画与进度管理
  useEffect(() => {
    if (isLoading && estimatedTime) {
      const totalTime = estimatedTime * 1000;
      const startTime = Date.now();
      
      loadingIntervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / totalTime) * 100, 98); // 最多停在98%
        setLoadingProgress(progress);
      }, 100);

      // 消息滚动
      const msgs = currentStep === WorkflowStep.SCENARIO_INPUT ? COPY_MESSAGES : VISUAL_MESSAGES;
      let msgIdx = 0;
      setLoadingMsg(msgs[0]);
      messageIntervalRef.current = window.setInterval(() => {
        msgIdx = (msgIdx + 1) % msgs.length;
        setLoadingMsg(msgs[msgIdx]);
      }, 3000);
    } else {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      setLoadingProgress(0);
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    };
  }, [isLoading, estimatedTime, currentStep]);

  const handleLogin = (username: string) => {
    const user = storageService.login(username);
    setCurrentUser(user);
    setCurrentStep(WorkflowStep.SCENARIO_INPUT);
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
  };

  const handleScenarioSubmit = async (
    text: string, 
    refImage: string | null, 
    category: ContentCategory, 
    userPersona: UserPersona, 
    contextItems: LibraryItem[], 
    sellingPoints: SellingPoint[],
    selectedProducts: ProductPhoto[],
    selectedStyleRefs: StyleReference[]
  ) => {
    setIsLoading(true);
    setEstimatedTime(12); // 文案生成约12秒
    const startTime = Date.now();
    
    try {
      const result = await generateCreativeConcept(text, category, userPersona, refImage, contextItems, sellingPoints, selectedProducts);
      
      // 保证最少显示3秒加载动画以维持心理预期和UI流畅
      const minWait = 3000;
      const elapsed = Date.now() - startTime;
      if (elapsed < minWait) await new Promise(r => setTimeout(r, minWait - elapsed));

      setConcept({ 
        ...result, 
        referenceImage: refImage, 
        selectedCategory: category, 
        userPersona,
        selectedProducts,
        styleReferences: selectedStyleRefs
      });
      setSelectedCategory(category);
      setCurrentStep(WorkflowStep.CONCEPT_REVIEW);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisualGeneration = async (
    prompt: string, 
    copy: string,
    refImage: string | null, 
    styleRef: string | null,
    productImages: string[],
    isHighQuality: boolean,
    aspectRatio: AspectRatio,
    imageSize: ImageSize
  ) => {
    setIsLoading(true);
    setEstimatedTime(isHighQuality ? 40 : 25);
    const startTime = Date.now();

    try {
      const imageUrl = await generateVisual(prompt, copy, refImage || undefined, styleRef || undefined, productImages, isHighQuality, aspectRatio, imageSize);
      
      const minWait = 4000;
      const elapsed = Date.now() - startTime;
      if (elapsed < minWait) await new Promise(r => setTimeout(r, minWait - elapsed));

      setFinalImage(imageUrl);
      setFinalCopy(copy);
      const draft = concept?.drafts.find(d => d.copy === copy);
      setFinalScript(draft?.commentScript || '');
      setCurrentStep(WorkflowStep.FINAL_GENERATION);
    } catch (err: any) {
      alert(err.message || "生成失败");
    } finally {
      setIsLoading(false);
    }
  };

  // Fix: Added missing handleSkipImage function to transition to final output without generating an image
  const handleSkipImage = (copy: string, commentScript: string) => {
    setFinalImage(null);
    setFinalCopy(copy);
    setFinalScript(commentScript);
    setCurrentStep(WorkflowStep.FINAL_GENERATION);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-amber-50 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentStep(WorkflowStep.SCENARIO_INPUT)}>
            <div className="w-10 h-10 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <i className="fas fa-wine-glass"></i>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">黄关 <span className="text-amber-600">超级终端</span></h1>
              <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">AI AGENT BY {currentUser.username}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setCurrentStep(WorkflowStep.LIBRARY)}
               className="text-[10px] text-slate-500 hover:text-amber-600 px-3 py-1.5 font-black transition-colors border border-slate-100 rounded-lg bg-slate-50 flex items-center gap-2"
             >
               <i className="fas fa-folder-open"></i> 灵感库
             </button>
             <button 
               onClick={handleLogout}
               className="text-[10px] bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg font-black hover:bg-red-50 hover:text-red-500 transition-all"
               title="退出登录"
             >
               <i className="fas fa-power-off"></i>
             </button>
          </div>
        </div>
      </header>

      <main key={currentUser.id} className="flex-1 max-w-4xl w-full mx-auto px-6 pt-8">
        {currentStep !== WorkflowStep.LIBRARY && <StepProgressBar currentStep={currentStep} />}
        
        <div className="relative pb-20">
          {currentStep === WorkflowStep.SCENARIO_INPUT && (
            <ScenarioInput 
              initialData={scenarioData}
              onUpdateData={(data) => setScenarioData(prev => ({ ...prev, ...data }))}
              onGenerate={handleScenarioSubmit} 
              isLoading={isLoading} 
              onOpenLibrary={() => setCurrentStep(WorkflowStep.LIBRARY)}
            />
          )}

          {currentStep === WorkflowStep.LIBRARY && (
            <LibraryView onBack={() => setCurrentStep(WorkflowStep.SCENARIO_INPUT)} />
          )}

          {currentStep === WorkflowStep.CONCEPT_REVIEW && concept && (
            <ConceptReview 
              concept={concept} 
              onGenerateImage={handleVisualGeneration}
              onSkipImage={handleSkipImage}
              isLoading={isLoading}
              onBack={() => setCurrentStep(WorkflowStep.SCENARIO_INPUT)}
            />
          )}

          {currentStep === WorkflowStep.FINAL_GENERATION && (
            <FinalOutput 
              imageUrl={finalImage} 
              copy={finalCopy} 
              commentScript={finalScript}
              persona={selectedCategory}
              onReset={() => {
                setScenarioData(prev => ({ ...prev, scenario: '' }));
                setCurrentStep(WorkflowStep.SCENARIO_INPUT);
              }} 
              onBack={() => setCurrentStep(WorkflowStep.CONCEPT_REVIEW)}
            />
          )}
        </div>
      </main>

      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[250] flex flex-col items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[4rem] shadow-2xl flex flex-col items-center max-w-sm w-full animate-scale-in text-center border border-amber-50">
            <div className="relative w-24 h-24 mb-10">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="48" cy="48" r="44"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={276}
                  strokeDashoffset={276 - (276 * loadingProgress) / 100}
                  className="text-amber-600 transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className={`fas ${currentStep === WorkflowStep.SCENARIO_INPUT ? 'fa-pen-fancy' : 'fa-wand-magic-sparkles'} text-amber-600 text-2xl animate-pulse`}></i>
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-800 tracking-tight transition-all duration-500 min-h-[1.5em]">
              {loadingMsg}
            </h3>
            
            <div className="w-full bg-slate-50 h-1.5 rounded-full mt-8 overflow-hidden">
               <div 
                 className="h-full bg-amber-600 transition-all duration-500 ease-out" 
                 style={{ width: `${loadingProgress}%` }}
               ></div>
            </div>
            
            <p className="mt-6 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed">
               您的账号专属 AI Agent 正在运行中...
            </p>
          </div>
        </div>
      )}

      <footer className="py-8 text-center border-t border-slate-100 bg-white">
        <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.4em]">Personalized AI Workflow v3.7</p>
      </footer>
    </div>
  );
};

export default App;
