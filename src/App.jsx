import React, { useState, useEffect, useRef } from 'react';

const COUNTDOWN_SECONDS = 10;
const TOTAL_MAGICAL_PARTICLES = 35;

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [phase, setPhase] = useState('IDLE');
  const [particles, setParticles] = useState([]);
  const [sparks, setSparks] = useState([]);
  const [smokeParticles, setSmokeParticles] = useState([]);
  
  const audioCtxRef = useRef(null);
  const bgMusicRef = useRef(null);
  const laughAudioRef = useRef(null);
  const playedLaugh = useRef(false); // لمنع تكرار الصوت

  const initAudio = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = 1.0; 
      bgMusicRef.current.play().catch(e => console.log("Audio play blocked:", e));
    }
    
    if (laughAudioRef.current) {
      laughAudioRef.current.volume = 0.01;
      const playPromise = laughAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          laughAudioRef.current.pause();
          laughAudioRef.current.currentTime = 0;
          laughAudioRef.current.volume = 1.0;
        }).catch(e => console.log("Laugh unlock blocked:", e));
      }
    }

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    audioCtxRef.current = ctx;
  };

  const playTick = (tensionLevel) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const baseFreq = 400 + (tensionLevel * 100);
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2 + (tensionLevel * 0.05), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const swellMusic = (peak) => {
    if (bgMusicRef.current) {
      const targetVolume = 1.0; 
      const step = 0.01;
      const fadeInterval = setInterval(() => {
        let newVol = bgMusicRef.current.volume + step;
        if (newVol >= targetVolume) {
          bgMusicRef.current.volume = 1.0;
          clearInterval(fadeInterval);
        } else {
          bgMusicRef.current.volume = Math.max(0, Math.min(1, newVol));
        }
      }, 100);
    }
  };

  const handleBegin = () => {
    initAudio();
    setHasStarted(true);
    setPhase('COUNTDOWN');
  };

  const triggerSparks = () => {
    const burst = Array.from({ length: 15 }).map(() => ({
      id: Math.random().toString(36),
      tx: (Math.random() - 0.5) * 180, 
      ty: 100 + Math.random() * 180,   
      delay: Math.random() * 0.2,
      duration: 1.5 + Math.random() * 1.5,
      size: 1 + Math.random() * 2.5
    }));
    setSparks(prev => [...prev.slice(-40), ...burst]); 
  };

  useEffect(() => {
    if (phase === 'COUNTDOWN') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setPhase('TRANSITION');
            return 0;
          }
          const nextTime = prev - 1;
          const tension = nextTime <= 3 ? (4 - nextTime) : 0; 
          playTick(tension);
          triggerSparks();
          return nextTime;
        });
      }, 1000);
      playTick(0);
      triggerSparks();
      return () => clearInterval(timer);
    }
    
    if (phase === 'TRANSITION') {
      const t1 = setTimeout(() => setPhase('GROWING'), 2500);
      return () => clearTimeout(t1);
    }
    
    if (phase === 'GROWING') {
      swellMusic(true);
      
      const newParticles = Array.from({ length: TOTAL_MAGICAL_PARTICLES }).map((_, i) => ({
        id: i,
        x: 30 + Math.random() * 40,
        y: 20 + Math.random() * 60,
        delay: Math.random() * 3,
        duration: 8 + Math.random() * 6, 
        size: 1.5 + Math.random() * 3
      }));
      setParticles(newParticles);

      // إنشاء خيوط دخان سيكارة احترافية (رفيعة وطويلة وتتلوى)
      const smokes = Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        x: 20 + Math.random() * 60, // تغطي العرض مع تركيز في المنتصف
        y: 80 + Math.random() * 20, 
        width: 15 + Math.random() * 25, // جزيئات رفيعة
        height: 100 + Math.random() * 200, // طويلة
        delay: Math.random() * 3,
        duration: 3 + Math.random() * 3,
        drift: (Math.random() - 0.5) * 150 // التواء لليمين واليسار
      }));
      setSmokeParticles(smokes);
      
      const t2 = setTimeout(() => setPhase('FINISHED'), 15000);
      return () => clearTimeout(t2);
    }
    
    if (phase === 'FINISHED') {
      swellMusic(false); 
      // إطلاق الضحكة فوراً ولمرة واحدة فقط عند الاكتمال
      if (laughAudioRef.current && !playedLaugh.current) {
        playedLaugh.current = true;
        laughAudioRef.current.volume = 1.0;
        laughAudioRef.current.play().catch(e => console.log(e));
      }
    }
  }, [phase]);

  const isAnticipation = phase === 'COUNTDOWN' && timeLeft <= 3;

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex flex-col items-center justify-center selection:bg-transparent">
      
      <audio 
        ref={bgMusicRef} 
        src="https://ia903204.us.archive.org/16/items/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3" 
        loop 
        preload="auto"
      />
      
      <audio 
        ref={laughAudioRef} 
        src="https://actions.google.com/sounds/v1/human_voices/comedy_laugh.ogg" 
        preload="auto" 
      />

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Montserrat:wght@300;400;500&family=Aref+Ruqaa:wght@400;700&family=Great+Vibes&display=swap');
        .font-gold-serif { font-family: 'Cinzel', serif; }
        .font-gold-sans { font-family: 'Montserrat', sans-serif; }
        .font-arabic-royal { font-family: 'Aref Ruqaa', serif; }
        .font-signature { font-family: 'Great Vibes', cursive; }

        @keyframes float-up {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-250px) scale(0.5) rotate(45deg); opacity: 0; }
        }

        @keyframes golden-spark {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }

        /* حركة خيوط دخان السيكارة المتلوية */
        @keyframes smoke-wisp {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0; }
          20% { opacity: 0.7; }
          50% { transform: translate(calc(var(--mdrift) / 2), -20vh) scale(1.5) rotate(5deg); opacity: 0.8; }
          100% { transform: translate(var(--mdrift), -60vh) scale(3) rotate(-10deg); opacity: 0; }
        }

        .image-reveal {
          clip-path: inset(100% 0 0 0);
          filter: brightness(0.2) contrast(1.2);
          transform: scale(0.95);
          transition: filter 3s ease-in, transform 3s ease-out, clip-path 15s linear;
        }
        .image-reveal.revealed {
          clip-path: inset(0 0 0 0);
          filter: brightness(1) contrast(1.1);
          transform: scale(1.02);
        }

        @keyframes image-breathe {
          0%, 100% { transform: scale(1.02); }
          50% { transform: scale(1.04); }
        }
        .image-breathe-anim { animation: image-breathe 8s ease-in-out infinite; }

        .gold-text-gradient {
          background: linear-gradient(to bottom, #fcf4ba 0%, #d4af37 40%, #9e7a17 80%, #614605 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0px 4px 15px rgba(0,0,0,0.9));
        }

        .gold-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, #d4af37, transparent);
        }

        @keyframes letter-appear {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-simple { 0% { opacity: 0; } 100% { opacity: 1; } }
        
        @keyframes gentle-pulse {
          0%, 100% { transform: scale(1); text-shadow: 0 0 10px rgba(212,175,55,0.5); }
          50% { transform: scale(1.05); text-shadow: 0 0 20px rgba(212,175,55,1); }
        }
        .animate-gentle-pulse { animation: gentle-pulse 2.5s ease-in-out infinite; }

        /* حركة قفز الإيموجي الكوميدية */
        @keyframes emoji-pop {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(10deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes emoji-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}} />

      {!hasStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm transition-opacity duration-1000">
          <button 
            onClick={handleBegin}
            className="relative px-12 py-6 overflow-hidden group bg-gradient-to-b from-[#1a1505] to-[#0a0802] border-2 border-[#d4af37]/60 hover:border-[#d4af37] transition-all duration-700 shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] rounded-lg cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent -translate-x-full group-hover:translate-x-full duration-[1500ms] ease-in-out"></div>
            <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#fcf4ba] via-[#d4af37] to-[#9e7a17] font-arabic-royal text-3xl md:text-5xl font-bold animate-gentle-pulse inline-block px-4 pt-2">
              اِضْغَطْ يَا حُلْوُ
            </span>
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#d4af37] opacity-50 group-hover:opacity-100 transition-opacity duration-700 rounded-tl-lg"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#d4af37] opacity-50 group-hover:opacity-100 transition-opacity duration-700 rounded-br-lg"></div>
          </button>
        </div>
      )}

      <div className={`absolute z-20 flex flex-col items-center justify-center transition-all duration-[3000ms] ease-out ${phase === 'COUNTDOWN' ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}`}>
        <div className="relative flex items-center justify-center">
          {sparks.map(spark => (
            <div
              key={spark.id}
              className="absolute top-1/2 left-1/2 rounded-full bg-[#ffe885] blur-[1px] pointer-events-none"
              style={{
                width: `${spark.size}px`, height: `${spark.size}px`,
                '--tx': `${spark.tx}px`, '--ty': `${spark.ty}px`,
                animation: `golden-spark ${spark.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                animationDelay: `${spark.delay}s`,
                boxShadow: '0 0 15px 3px rgba(255, 210, 80, 0.6)'
              }}
            />
          ))}
          <div className={`text-[12rem] md:text-[22rem] leading-none font-gold-serif font-light gold-text-gradient tabular-nums tracking-tighter transition-all duration-1000 ${isAnticipation ? 'scale-105 drop-shadow-[0_0_40px_rgba(212,175,55,0.4)]' : ''}`}>
            {timeLeft}
          </div>
        </div>
      </div>

      <div className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-[2500ms] ${phase === 'COUNTDOWN' || phase === 'TRANSITION' || phase === 'IDLE' ? 'opacity-0' : 'opacity-100'}`}>
        <div className="relative w-full max-w-[600px] h-full flex flex-col items-center justify-center mt-[-10vh]">
          
          <div className="relative flex justify-center w-full h-full items-center">
            <img 
              src="/rose.png" 
              alt="Rose" 
              className={`w-full h-auto max-h-[75vh] object-contain image-reveal ${phase === 'GROWING' || phase === 'FINISHED' ? 'revealed' : ''} ${phase === 'FINISHED' ? 'image-breathe-anim' : ''}`}
            />
            
            {/* مؤثر دخان السيكارة الرفيع والمكثف على الصورة */}
            {phase === 'GROWING' && (
              <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden flex justify-center items-center">
                {smokeParticles.map((smk) => (
                  <div
                    key={smk.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${smk.x}%`,
                      bottom: `${100 - smk.y}%`,
                      width: `${smk.width}px`,
                      height: `${smk.height}px`,
                      background: 'radial-gradient(ellipse at center, rgba(180,180,180,0.5) 0%, transparent 70%)',
                      filter: 'blur(8px)',
                      '--mdrift': `${smk.drift}px`,
                      animation: `smoke-wisp ${smk.duration}s ease-in-out infinite`,
                      animationDelay: `${smk.delay}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {phase === 'FINISHED' && (
        <>
          {/* انفجار الإيموجي الكوميدي ليملأ الشاشة */}
          <div className="absolute inset-0 z-[60] pointer-events-none overflow-hidden">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-4xl md:text-5xl"
                style={{
                  left: `${(i * 27) % 85 + 5}%`, // توزيع عشوائي منتظم على الشاشة
                  top: `${(i * 13) % 85 + 5}%`,
                  animation: `emoji-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards ${i * 0.15}s, emoji-float 3s ease-in-out infinite ${0.6 + i * 0.15}s`,
                  opacity: 0
                }}
              >
                🤣🤣🤣
              </div>
            ))}
          </div>

          <div className="absolute bottom-[10%] w-full z-30 flex justify-center pointer-events-none">
            <div className="flex flex-col items-center justify-center gap-3">
              
              <div className="flex items-center gap-4">
                <div className="w-8 md:w-12 gold-line opacity-0" style={{ animation: 'fade-in-simple 1s forwards 0.5s' }}></div>
                <span className="font-gold-sans font-light text-[0.6rem] md:text-xs tracking-[0.8em] text-[#d4af37] uppercase ml-[0.8em] flex">
                  {"For You".split('').map((char, i) => (
                    <span key={i} className="inline-block opacity-0" style={{ animation: `letter-appear 0.4s ease-out ${0.5 + i * 0.15}s forwards` }}>
                      {char === " " ? "\u00A0" : char}
                    </span>
                  ))}
                </span>
                <div className="w-8 md:w-12 gold-line opacity-0" style={{ animation: 'fade-in-simple 1s forwards 0.5s' }}></div>
              </div>
              
              <h1 className="font-gold-serif font-medium text-6xl md:text-[6rem] uppercase tracking-[0.2em] md:tracking-[0.25em] ml-[0.2em] md:ml-[0.25em] flex mt-2 justify-center">
                {"Shahd".split('').map((char, i) => (
                  <span 
                    key={i} 
                    className="inline-block opacity-0" 
                    style={{ animation: `letter-appear 0.5s ease-out ${2.0 + i * 0.2}s forwards` }}
                  >
                    <span className="gold-text-gradient inline-block">{char === " " ? "\u00A0" : char}</span>
                  </span>
                ))}
              </h1>
              
              <div className="flex items-center justify-center gap-2 mt-2 opacity-0" style={{ animation: 'fade-in-simple 1s forwards 3.5s' }}>
                <div className="w-16 md:w-24 gold-line"></div>
                <span className="text-[#d4af37] text-xs">❖</span>
                <div className="w-16 md:w-24 gold-line"></div>
              </div>

            </div>
          </div>

          <div 
            className="absolute bottom-6 left-6 md:bottom-8 md:left-8 z-40 text-white/80 font-signature text-3xl md:text-4xl opacity-0 pointer-events-none drop-shadow-md"
            style={{ 
              animation: 'fade-in-simple 2s ease-in forwards 4.5s', 
              transform: 'rotate(-5deg)' 
            }}
          >
            from samir
          </div>
        </>
      )}

    </div>
  );
}