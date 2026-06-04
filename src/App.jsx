import React, { useState, useEffect, useRef } from 'react';

const COUNTDOWN_SECONDS = 10;
const TOTAL_SMOKE_PARTICLES = 60; // دخان أكثر كثافة للسيكارة

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [phase, setPhase] = useState('IDLE');
  const [smokeParticles, setSmokeParticles] = useState([]);
  
  const bgMusicRef = useRef(null);
  const laughAudioRef = useRef(null);
  const playedLaugh = useRef(false); // لمنع تكرار الصوت

  const initAudio = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = 1.0; 
      bgMusicRef.current.play().catch(e => console.log(e));
    }
    // تجهيز صوت الضحكة
    if (laughAudioRef.current) {
      laughAudioRef.current.volume = 0.01;
      laughAudioRef.current.play().then(() => {
        laughAudioRef.current.pause();
        laughAudioRef.current.currentTime = 0;
        laughAudioRef.current.volume = 1.0;
      }).catch(e => console.log(e));
    }
  };

  useEffect(() => {
    if (phase === 'GROWING') {
      // توليد دخان كثيف (خيوط سيكارة)
      const smokes = Array.from({ length: TOTAL_SMOKE_PARTICLES }).map((_, i) => ({
        id: i,
        x: 40 + Math.random() * 20, // تركيز الكثافة في منتصف الشاشة (ع الوردة)
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
        drift: (Math.random() - 0.5) * 50
      }));
      setSmokeParticles(smokes);
      
      const t2 = setTimeout(() => setPhase('FINISHED'), 15000);
      return () => clearTimeout(t2);
    }
    
    if (phase === 'FINISHED' && !playedLaugh.current) {
      if (laughAudioRef.current) {
        laughAudioRef.current.play().catch(e => console.log(e));
        playedLaugh.current = true;
      }
    }
  }, [phase]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      <audio ref={bgMusicRef} src="https://ia903204.us.archive.org/16/items/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3" loop preload="auto" />
      <audio ref={laughAudioRef} src="https://actions.google.com/sounds/v1/human_voices/comedy_laugh.ogg" preload="auto" />

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Aref+Ruqaa:wght@700&display=swap');
        
        @keyframes smoke-wisp {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
          20% { opacity: 0.8; transform: translateY(-50px) scale(1.5) rotate(5deg); }
          100% { transform: translateY(-400px) scale(3) rotate(-5deg); opacity: 0; }
        }
        
        .image-reveal {
          transition: clip-path 15s linear;
          clip-path: inset(100% 0 0 0);
        }
        .revealed { clip-path: inset(0 0 0 0); }
        
        .gold-text {
          background: linear-gradient(to bottom, #fcf4ba, #d4af37);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        @keyframes emoji-jump {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
      `}} />

      {!hasStarted && (
        <button onClick={() => { initAudio(); setHasStarted(true); setPhase('GROWING'); }} className="z-50 px-8 py-4 border-2 border-[#d4af37] text-[#d4af37] font-arabic-royal text-2xl animate-pulse">
          اِضْغَطْ يَا حُلْوُ
        </button>
      )}

      {/* الوردة */}
      <img src="/rose.png" className={`w-80 z-10 image-reveal ${phase !== 'IDLE' ? 'revealed' : ''}`} alt="Rose" />

      {/* مؤثر الدخان (خيوط دخان سيكارة) */}
      {phase === 'GROWING' && (
        <div className="absolute inset-0 z-20 flex justify-center items-end">
          {smokeParticles.map(s => (
            <div key={s.id} className="absolute bg-white/20 rounded-full blur-[20px]" style={{
              left: `${s.x}%`,
              width: '40px',
              height: '80px',
              animation: `smoke-wisp ${s.duration}s linear infinite`,
              animationDelay: `${s.delay}s`,
              '--mdrift': `${s.drift}px`
            }} />
          ))}
        </div>
      )}

      {/* الضحكة والإيموجي بعد انتهاء النمو */}
      {phase === 'FINISHED' && (
        <>
          <div className="absolute top-0 left-0 w-full h-full flex flex-wrap justify-center items-center z-40 pointer-events-none">
            {Array.from({length: 20}).map((_, i) => (
              <span key={i} className="text-5xl m-4" style={{ animation: `emoji-jump 0.5s infinite`, animationDelay: `${i*0.1}s` }}>🤣🤣🤣</span>
            ))}
          </div>
          
          <h1 className="absolute bottom-[10%] text-6xl font-gold-serif gold-text z-30">
            {"Shahd".split('').map((char, i) => (
              <span key={i} className="inline-block animate-pulse">{char}</span>
            ))}
          </h1>
        </>
      )}
    </div>
  );
}