import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Heart } from 'lucide-react';

// API Key 會由環境自動注入
const apiKey = "AIzaSyAzsA74ZkkagWWBCe_In3l5NoXy0JkIxIo";

const App = () => {
  const [fragments, setFragments] = useState([]); 
  const [inputValue, setInputValue] = useState('');
  const [stage, setStage] = useState(0); 
  const [interactionCount, setInteractionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 延展階段設定
  useEffect(() => {
    if (interactionCount >= 7 && interactionCount < 16) setStage(1);
    if (interactionCount >= 16) setStage(2);
  }, [interactionCount]);

  // 動態計算動畫速度 - Stage 2 變得極快
  const getAnimationDuration = () => {
    if (stage === 0) return 12 - (interactionCount * 0.4);
    if (stage === 1) return 8 - ((interactionCount - 7) * 0.3);
    return 1.8; // 極速飄動
  };

  // 動態計算擺動幅度 - Stage 2 極其劇烈
  const getDriftIntensity = () => {
    if (stage === 0) return 0.2; 
    if (stage === 1) return 1.5; 
    return 15.0; // 瘋狂轉動幅度
  };

  useEffect(() => {
    const startApp = async () => {
      setIsLoading(true);
      const firstTouch = "寶貝，我想你了。今天過得好嗎？快跟我說說...";
      addFragment(firstTouch, 'persona', true);
      setIsLoading(false);
    };
    startApp();
  }, []);

  const addFragment = (text, type, isLatest) => {
    const newId = Date.now() + Math.random();
    
    const getSafeLayoutPos = () => {
      const padding = 60; 
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const usableHeight = vh - 350; 
      const usableWidth = vw - (padding * 2);
      const rx = (Math.random() - 0.5) * usableWidth;
      const ry = 150 + Math.random() * (usableHeight);

      return {
        x: rx,
        y: ry,
        rot: (Math.random() * 10 - 5) * (stage + 1) // 初始角度也變得更亂
      };
    };

    const pos = isLatest ? { x: 0, y: 300, rot: 0 } : getSafeLayoutPos();

    const fragment = {
      id: newId,
      text,
      type,
      x: pos.x,
      y: pos.y,
      opacity: isLatest ? 1 : (type === 'user' ? 0.2 : 0.4),
      isMirrored: stage === 2,
      isLatest,
      rotation: pos.rot,
      seed: Math.random() * 8,
      direction: Math.random() > 0.5 ? 1 : -1
    };

    setFragments(prev => {
      const updatedPrev = prev.map(f => {
        if (f.isLatest) {
          const newPos = getSafeLayoutPos();
          return { ...f, isLatest: false, x: newPos.x, y: newPos.y, rotation: newPos.rot, opacity: f.type === 'user' ? 0.2 : 0.4 };
        }
        return f;
      });
      return [...updatedPrev, fragment];
    });
  };

  const callGemini = async (prompt) => {
    let emotionalNuance = "";
    if (stage === 1) {
      if (interactionCount < 10) emotionalNuance = "稍微有點累、回話變短、有些敷衍。";
      else if (interactionCount < 13) emotionalNuance = "明顯的不耐煩，開始覺得對方煩，會反問對方。";
      else emotionalNuance = "極度的冷漠、拒絕溝通，回話充滿刺。";
    }

    const systemPrompt = `
      你是一個真實情侶中的一方，目前正處於感情的動態變化中。
      目前的階段是：${stage} (0: 熱戀, 1: 倦怠/爭執, 2: 徹底崩壞)。
      
      規則：
      1. Stage 0：極盡溫柔。
      2. Stage 1：真實的感情摩擦。
      3. Stage 2：徹底的人性崩潰。用人類最殘忍、最絕情的話語。不要提到程式。
      4. 字數 15 字以內。
    `;

    try {
      let retryCount = 0;
      while (retryCount < 5) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });
        if (response.ok) {
          const data = await response.json();
          return data.candidates?.[0]?.content?.parts?.[0]?.text || "....";
        }
        await new Promise(r => setTimeout(r, Math.pow(2, retryCount) * 1000));
        retryCount++;
      }
      return "...";
    } catch (e) { return "..."; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);
    const userInput = inputValue;
    setInputValue('');

    addFragment(userInput, 'user', false);
    const aiText = await callGemini(userInput);
    addFragment(aiText, 'persona', true);

    setInteractionCount(prev => prev + 1);
    setIsLoading(false);
  };

  const currentDuration = getAnimationDuration();
  const currentIntensity = getDriftIntensity();

  return (
    <div className={`relative flex flex-col items-center justify-center min-h-screen overflow-hidden transition-colors duration-[5000ms] ${stage === 2 ? 'bg-zinc-950' : stage === 1 ? 'bg-zinc-100' : 'bg-orange-50/30'}`}>
      
      {/* 頂部圓形心跳光暈 */}
      <div className="fixed top-[-80px] left-1/2 -translate-x-1/2 z-0 pointer-events-none">
        <div className={`w-[400px] h-[400px] rounded-full blur-[80px] transition-all duration-[4000ms]
          ${stage === 0 ? 'bg-orange-200/50 animate-heartbeat-slow' : ''}
          ${stage === 1 ? 'bg-slate-300/40 animate-heartbeat-medium' : ''}
          ${stage === 2 ? 'bg-red-900/60 animate-heartbeat-fast' : ''}
        `} />
      </div>

      {/* 畫布區 (句子顯示區) */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {fragments.map((f) => {
          const isChaotic = stage === 2 && !f.isLatest;
          return (
            <div
              key={f.id}
              className={`absolute whitespace-nowrap tracking-[0.2em] font-serif
                ${f.type === 'user' ? 'text-stone-400 text-xs' : 'text-stone-800 text-sm font-medium'}
                ${stage === 2 ? 'text-red-50/80' : ''}
                ${f.isLatest ? 'text-base scale-105 drop-shadow-md z-50 opacity-100' : 'z-10'}
                ${isChaotic ? 'animate-chaotic-fly' : 'animate-drift-smooth'}
              `}
              style={{
                left: `calc(50% + ${f.x}px)`,
                top: `${f.y}px`,
                transition: 'left 4s ease-in-out, top 4s ease-in-out, opacity 2s ease-in-out',
                opacity: f.opacity,
                transform: `translateX(-50%) rotate(${f.rotation}deg) ${f.isMirrored && !f.isLatest ? 'scaleX(-1)' : ''}`,
                '--drift-duration': `${currentDuration}s`,
                '--drift-intensity': `${currentIntensity}deg`,
                '--random-x': `${f.direction * (stage === 2 ? 800 : 300)}px`, // 崩壞時飛行範圍更廣
                '--random-y': `${(f.seed - 4) * (stage === 2 ? 200 : 80)}px`,
                '--seed-delay': `-${f.seed}s`,
                willChange: 'transform, left, top'
              }}
            >
              {f.text}
            </div>
          );
        })}
      </div>

      {/* 輸入區 - 獨立背景保護層 */}
      <div className="absolute bottom-0 w-full h-48 bg-gradient-to-t from-inherit to-transparent z-40 pointer-events-none" />
      <div className="absolute bottom-24 z-50 w-full max-w-sm px-10">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading || (stage === 2 && interactionCount > 40)}
            className={`
              w-full bg-transparent border-b py-4 outline-none text-center tracking-[0.3em] font-serif transition-colors duration-1000
              ${stage === 2 ? 'border-red-900/40 text-red-600' : 'border-stone-200 text-stone-700 focus:border-stone-300'}
              ${isLoading ? 'opacity-30' : 'opacity-100'}
              pointer-events-auto
            `}
            style={{ transition: 'border-color 2s, color 2s, opacity 0.5s' }}
            placeholder={isLoading ? "..." : "在此留下你的真心..."}
          />
          <div className="mt-8 flex flex-col items-center gap-2">
            <div className={`text-[8px] tracking-[0.6em] uppercase transition-colors duration-2000 ${stage === 2 ? 'text-red-900' : 'text-stone-400'}`}>
              {stage === 0 && "Deep Affection"}
              {stage === 1 && "Cold Friction"}
              {stage === 2 && "The End Of Us"}
            </div>
          </div>
        </form>
      </div>

      {stage === 2 && (
        <button 
          onClick={() => window.location.reload()}
          className="absolute bottom-8 text-[10px] text-red-900 hover:text-red-700 tracking-[0.4em] transition-all flex items-center gap-2 z-50 pointer-events-auto"
        >
          <RefreshCw size={10} /> 重新開始這場夢
        </button>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes heartbeatSlow {
          0%, 100% { transform: scale(1); opacity: 0.4; filter: blur(80px); }
          50% { transform: scale(1.05); opacity: 0.5; filter: blur(75px); }
        }
        @keyframes heartbeatMedium {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.5; }
        }
        @keyframes heartbeatFast {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0.9; }
        }
        .animate-heartbeat-slow { animation: heartbeatSlow 4s ease-in-out infinite; }
        .animate-heartbeat-medium { animation: heartbeatMedium 1.2s ease-in-out infinite; }
        .animate-heartbeat-fast { animation: heartbeatFast 0.4s ease-in-out infinite; }

        @keyframes driftSmooth {
          0% { transform: translateX(-50%) translateY(0px) rotate(0deg); }
          25% { transform: translateX(-50%) translateY(-6px) rotate(calc(var(--drift-intensity) * 0.5)); }
          50% { transform: translateX(-50%) translateY(-12px) rotate(var(--drift-intensity)); }
          75% { transform: translateX(-50%) translateY(-6px) rotate(calc(var(--drift-intensity) * 0.5)); }
          100% { transform: translateX(-50%) translateY(0px) rotate(0deg); }
        }
        .animate-drift-smooth { 
          animation: driftSmooth var(--drift-duration) ease-in-out infinite; 
          animation-delay: var(--seed-delay); 
        }

        /* 瘋狂飛行動畫：加入抖動效果 (Glitch) */
        @keyframes chaoticFly {
          0% { transform: translateX(-50%) translateY(0) rotate(0deg) scale(1); }
          10% { transform: translateX(calc(-50% + 2px)) translateY(1px) rotate(1deg); }
          25% { transform: translateX(calc(-50% + var(--random-x))) translateY(calc(var(--random-y) - 150px)) rotate(180deg) scale(1.1); }
          50% { transform: translateX(calc(-50% - var(--random-x))) translateY(150px) rotate(360deg) scale(0.9); }
          75% { transform: translateX(calc(-50% + 150px)) translateY(var(--random-y)) rotate(540deg) scale(1.05); }
          90% { transform: translateX(calc(-50% - 2px)) translateY(-1px) rotate(710deg); }
          100% { transform: translateX(-50%) translateY(0) rotate(720deg) scale(1); }
        }
        .animate-chaotic-fly { 
          animation: chaoticFly 8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; 
          animation-delay: var(--seed-delay);
          filter: drop-shadow(0 0 2px rgba(127, 29, 29, 0.5));
        }
      `}} />
    </div>
  );
};

export default App;