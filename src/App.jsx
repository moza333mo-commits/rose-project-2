import React, { useState, useEffect, useRef } from 'react';

const COUNTDOWN_SECONDS = 10;
const TOTAL_MAGICAL_PARTICLES = 35;

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [phase, setPhase] = useState('IDLE');
  const [particles, setParticles] = useState([]);
  const [sparks, setSparks] = useState([]);
  
  const audioCtxRef = useRef(null);
  const bgMusicRef = useRef(null);

  const initAudio = () => {
    if (bgMusicRef.current) {
      // رفع صوت الموسيقى الأساسي ليكون عالياً بأقصى درجة (100%)
      bgMusicRef.current.volume = 1.0; 
      bgMusicRef.current.play().catch(e => console.log("Audio play blocked:", e));
    }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    audioCtxRef.current = ctx;
  };

  // صوت النبضات الفاخرة فقط أثناء العداد
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
      // تثبيت الصوت على أعلى درجة 1.0 في كل الحالات لضمان علو الموسيقى
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
        duration: 10 + Math.random() * 10, // إبطاء الجزيئات لتتناسب مع الوقت الجديد
        size: 1.5 + Math.random() * 3
      }));
      setParticles(newParticles);
      
      // زيادة وقت النمو ليكون أبطأ بكثير (20 ثانية كاملة)
      const t2 = setTimeout(() => setPhase('FINISHED'), 20000);
      return () => clearTimeout(t2);
    }
    
    if (phase === 'FINISHED') {
      swellMusic(false); 
    }
  }, [phase]);

  const isAnticipation = phase === 'COUNTDOWN' && timeLeft <= 3;

  return (
    // تم تغيير لون الخلفية إلى bg-black ليتطابق مع خلفية الوردة تماماً دون أي حواف
    <div className="relative w-screen h-screen bg-black overflow-hidden flex flex-col items-center justify-center selection:bg-transparent">
      
      <audio 
        ref={bgMusicRef} 
        src="https://ia903204.us.archive.org/16/items/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3" 
        loop 
        preload="auto"
      />

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Montserrat:wght@300;400;500&display=swap');

        .font-gold-serif { font-family: 'Cinzel', serif; }
        .font-gold-sans { font-family: 'Montserrat', sans-serif; }

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

        .image-reveal {
          clip-path: inset(100% 0 0 0);
          filter: brightness(0.2) contrast(1.2);
          transform: scale(0.95);
          /* زيادة فترة حركة الوردة بشكل كبير (20 ثانية) لتتناسب مع التوقيت الجديد للنمو البطيء جداً */
          transition: all 20s cubic-bezier(0.25, 1, 0.5, 1);
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

        @keyframes cinematic-reveal-text {
          0% { opacity: 0; filter: blur(10px); transform: translateY(20px); }
          100% { opacity: 1; filter: blur(0px); transform: translateY(0); }
        }
        .reveal-wrapper { animation: cinematic-reveal-text 4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />

      {/* شاشة البداية مع الزر الفاخر */}
      {!hasStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm transition-opacity duration-1000">
          <button 
            onClick={handleBegin}
            className="relative px-16 py-5 overflow-hidden group bg-gradient-to-b from-[#1a1505] to-[#0a0802] border border-[#d4af37]/40 hover:border-[#d4af37] transition-all duration-700 shadow-[0_0_20px_rgba(0,0,0,0.8)] hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] rounded-sm cursor-pointer"
          >
            {/* تأثير اللمعان المتحرك */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent -translate-x-full group-hover:translate-x-full duration-[1500ms] ease-in-out"></div>
            
            {/* النص الذهبي الفاخر */}
            <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#fcf4ba] via-[#d4af37] to-[#9e7a17] font-gold-sans tracking-[0.3em] md:tracking-[0.5em] font-medium text-sm md:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              اضغط ياحلو
            </span>
            
            {/* زخارف الزوايا الفاخرة */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37] opacity-30 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37] opacity-30 group-hover:opacity-100 transition-opacity duration-700"></div>
          </button>
        </div>
      )}

      {/* العداد التنازلي الساحر */}
      <div 
        className={`absolute z-20 flex flex-col items-center justify-center transition-all duration-[3000ms] ease-out
          ${phase === 'COUNTDOWN' ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}
        `}
      >
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
          <div 
            className={`text-[12rem] md:text-[22rem] leading-none font-gold-serif font-light gold-text-gradient tabular-nums tracking-tighter
              transition-all duration-1000 ${isAnticipation ? 'scale-105 drop-shadow-[0_0_40px_rgba(212,175,55,0.4)]' : ''}
            `}
          >
            {timeLeft}
          </div>
        </div>
      </div>

      {/* الصورة الواقعية (الوردة) */}
      <div 
        className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-[2500ms]
          ${phase === 'COUNTDOWN' || phase === 'TRANSITION' || phase === 'IDLE' ? 'opacity-0' : 'opacity-100'}
        `}
      >
        <div className="relative w-full max-w-[600px] h-full flex flex-col items-center justify-center mt-[-10vh]">
          <img 
            src="/rose.png" 
            alt="Rose" 
            className={`w-full h-auto max-h-[75vh] object-contain image-reveal drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]
              ${phase === 'GROWING' || phase === 'FINISHED' ? 'revealed' : ''}
              ${phase === 'FINISHED' ? 'image-breathe-anim' : ''}
            `}
          />

          {phase === 'GROWING' && particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-[#d4af37] blur-[1px] pointer-events-none"
              style={{
                left: `${p.x}%`, top: `${p.y}%`,
                width: `${p.size}px`, height: `${p.size}px`,
                animation: `float-up ${p.duration}s ease-out forwards`,
                animationDelay: `${p.delay}s`,
                boxShadow: '0 0 15px 4px rgba(212, 175, 55, 0.4)'
              }}
            />
          ))}
        </div>
      </div>

      {/* النص الذهبي الفاخر المطابق للصورة */}
      <div className="absolute bottom-[10%] w-full z-30 flex justify-center pointer-events-none">
        {phase === 'FINISHED' && (
          <div className="flex flex-col items-center justify-center gap-3 reveal-wrapper">
            
            <div className="flex items-center gap-4">
              <div className="w-8 md:w-12 gold-line"></div>
              <span className="font-gold-sans font-light text-[0.6rem] md:text-xs tracking-[0.8em] text-[#d4af37] uppercase ml-[0.8em]">
                For You
              </span>
              <div className="w-8 md:w-12 gold-line"></div>
            </div>
            
            <h1 className="font-gold-serif font-medium text-6xl md:text-[6rem] uppercase tracking-[0.2em] md:tracking-[0.25em] ml-[0.2em] md:ml-[0.25em] gold-text-gradient">
              Sabah
            </h1>
            
            <div className="flex items-center justify-center gap-2 mt-2 opacity-80">
              <div className="w-16 md:w-24 gold-line"></div>
              <span className="text-[#d4af37] text-xs">❖</span>
              <div className="w-16 md:w-24 gold-line"></div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}