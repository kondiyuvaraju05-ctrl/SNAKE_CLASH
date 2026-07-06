import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Volume2, Sparkles } from 'lucide-react';

interface SplashLoaderProps {
  onComplete: () => void;
}

const LOADING_PHRASES = [
  'LAUNCHING COBRA CORE v2.6.4...',
  'WAKING UP THE GREEN SNAKE...',
  'HEATING THERMAL COORDINATES...',
  'SPAWNING DELICIOUS ORGANIC EGGS...',
  'CLEANING MATRIX WALL BOUNDARIES...',
  'SYNCHRONIZING HAPTIC OSCILLATORS...',
  'PREPARING RETRO CHIP AUDIO LAYERS...',
  'GET READY FOR THE CLASH!'
];

export default function SplashLoader({ onComplete }: SplashLoaderProps) {
  const [progress, setProgress] = useState<number>(0);
  const [phraseIndex, setPhraseIndex] = useState<number>(0);
  const [isDoneLoading, setIsDoneLoading] = useState<boolean>(false);

  // Progressive Loading Simulation
  useEffect(() => {
    const totalDuration = 2800; // 2.8 seconds of beautiful buildup
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      
      setProgress(pct);

      // Rotate phrases based on progress threshold
      const phase = Math.min(
        Math.floor((pct / 100) * LOADING_PHRASES.length),
        LOADING_PHRASES.length - 1
      );
      setPhraseIndex(phase);

      if (pct >= 100) {
        clearInterval(interval);
        setIsDoneLoading(true);
      }
    }, 45);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#070504] bg-[radial-gradient(ellipse_at_center,rgba(43,21,11,0.85)_0%,rgba(6,4,3,1)_100%)] z-[9999] flex flex-col items-center justify-center overflow-hidden p-6 select-none border-4 border-[#1c120c]">
      
      {/* Decorative Forest/Mystique Vines Shadow Overlay in Background */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-screen pointer-events-none select-none">
        {/* Soft simulated tree branch silhouettes using SVG vectors */}
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path d="M0,0 Q150,200 400,100 T800,400 T1000,0 M1000,1000 Q850,700 600,800 T200,600 T0,1000" fill="none" stroke="#f97316" strokeWidth="8" />
          <path d="M200,0 Q350,400 100,600 T600,1000" fill="none" stroke="#ea580c" strokeWidth="4" />
          <path d="M800,0 Q900,300 700,600 T400,1000" fill="none" stroke="#ca8a04" strokeWidth="6" />
        </svg>
      </div>

      {/* Retro scanlines and grid overlay with subtle warm tint */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(24,18,16,0)_50%,rgba(0,0,0,0.22)_50%),linear-gradient(90deg,rgba(234,88,12,0.015),rgba(202,138,4,0.01),rgba(124,45,18,0.015))] bg-[size:100%_4px,6px_100%] pointer-events-none" />

      {/* Ambient background organic floating leaves/dust */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 1000 - 500, 
              y: 800, 
              opacity: 0, 
              scale: Math.random() * 0.5 + 0.4,
              rotate: Math.random() * 360 
            }}
            animate={{ 
              y: -200, 
              opacity: [0, 0.4, 0.4, 0],
              rotate: Math.random() * 360 + 180 
            }}
            transition={{ 
              duration: Math.random() * 8 + 6, 
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: 'linear'
            }}
            className="absolute left-1/2 bottom-0 w-8 h-8 rounded-full bg-orange-500/10 blur-[1px] border border-orange-500/5 flex items-center justify-center text-xs text-orange-400/30"
          >
            🍂
          </motion.div>
        ))}
      </div>

      {/* Snake Clash Logo Container */}
      <motion.div 
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="relative flex flex-col items-center justify-center max-w-lg w-full mb-12 text-center"
      >
        
        {/* Cartoon snake tail/coiling glow in the background */}
        <div className="absolute -bottom-24 w-[360px] h-[360px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none animate-pulse-slow" />

        {/* ----------------- MASCOT & LOGO GROUP ----------------- */}
        <div className="relative pt-12 pb-6 px-10">
          
          {/* Animated 3D Cartoon Snake Head Mascot peeking from top-left */}
          <motion.div 
            initial={{ y: 20, rotate: -20 }}
            animate={{ 
              y: [0, -8, 0],
              rotate: [-12, -7, -12]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute -top-10 left-4 z-35 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
          >
            {/* Elegant SVG of the Cute green snake cartoon */}
            <svg width="128" height="128" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform hover:scale-105 transition-transform duration-300">
              
              {/* Outer white outline to mimic stickers */}
              <path d="M50 82C72 82 82 72 82 50C82 28 66 12 50 12C34 12 14 24 14 50C14 74 28 82 50 82Z" fill="white" stroke="white" strokeWidth="6" strokeLinejoin="round" />
              
              {/* Coiled background tail portion */}
              <path d="M78 52C84 62 80 74 70 78C60 82 45 74 45 74" fill="none" stroke="#7c2d12" strokeWidth="12" strokeLinecap="round" />
              <path d="M78 52C84 62 80 74 70 78C60 82 45 74 45 74" fill="none" stroke="#f97316" strokeWidth="8" strokeLinecap="round" />

              {/* Head Base (Main Blob) */}
              <path d="M22 54C22 36 34 22 50 22C66 22 76 34 76 50C76 66 64 74 50 74C34 74 22 66 22 54Z" fill="url(#snake_grad_body)" stroke="#7c2d12" strokeWidth="3" />

              {/* Light Cream-Yellow Underbelly details */}
              <path d="M24 58C28 66 38 72 50 72C62 72 70 66 74 58" fill="none" stroke="#fede6a" strokeWidth="5.5" strokeLinecap="round" />

              {/* Cheek flush */}
              <circle cx="28" cy="54" r="5" fill="#f87171" opacity="0.6" />
              <circle cx="70" cy="50" r="5" fill="#f87171" opacity="0.6" />

              {/* Big Cuddly Iris Blue Eyes */}
              {/* Left Eye */}
              <circle cx="37" cy="42" r="11" fill="white" stroke="#7c2d12" strokeWidth="2.5" />
              <circle cx="37" cy="42" r="7.2" fill="#2563eb" />
              <circle cx="37" cy="42" r="4" fill="#111827" />
              <circle cx="35" cy="39" r="2" fill="white" /> {/* Shiny glint */}

              {/* Right Eye */}
              <circle cx="61" cy="38" r="11" fill="white" stroke="#7c2d12" strokeWidth="2.5" />
              <circle cx="61" cy="38" r="7.2" fill="#2563eb" />
              <circle cx="61" cy="38" r="4" fill="#111827" />
              <circle cx="59" cy="35" r="2" fill="white" /> {/* Shiny glint */}

              {/* Smiley Mouth */}
              <path d="M38 58Q48 64 58 56" fill="none" stroke="#7c2d12" strokeWidth="3.5" strokeLinecap="round" />

              {/* Pink Cute Tongue sticking out! */}
              <motion.path 
                d="M48 59V67Q48 70 46 72M48 59V67Q49 70 51 72" 
                fill="none" 
                stroke="#fb7185" 
                strokeWidth="3.5" 
                strokeLinecap="round"
                animate={{
                  scaleY: [1, 1.2, 1],
                  rotate: [-3, 3, -3]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />

              {/* Body stripes and scales */}
              <circle cx="30" cy="32" r="2.5" fill="#111827" />
              <circle cx="68" cy="28" r="3" fill="#fcdc2a" />
              <circle cx="23" cy="45" r="2" fill="#111827" />

              {/* Gradients */}
              <defs>
                <linearGradient id="snake_grad_body" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fa6212" />
                  <stop offset="60%" stopColor="#ea580c" />
                  <stop offset="100%" stopColor="#9a3412" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          {/* 3D "SNAKE" Bubble Comic Text */}
          <div className="relative inline-block select-none py-1 filter drop-shadow-[0_12px_15px_rgba(0,0,0,0.8)] leading-none text-center">
            
            {/* White outline backdrop of "SNAKE" for stickery flat look */}
            <h1 className="text-7xl xs:text-8xl font-[Outfit] text-white tracking-wide uppercase stroke-white select-none relative font-black leading-none drop-shadow-[0_1px_0_white]">
              
              {/* Actual 3D layered texts to make high-impact 3D extrusion */}
              <span className="absolute left-0 top-0 text-[#0f3a18] select-none translate-y-[10px] translate-x-[2px] tracking-wide">
                SNAKE
              </span>
              <span className="absolute left-0 top-0 text-[#145322] select-none translate-y-[8px] translate-x-[1.5px] tracking-wide">
                SNAKE
              </span>
              <span className="absolute left-0 top-0 text-[#166534] select-none translate-y-[6px] translate-x-[1px] tracking-wide">
                SNAKE
              </span>
              <span className="absolute left-0 top-0 text-[#15803d] select-none translate-y-[4px] translate-x-[0.5px] tracking-wide">
                SNAKE
              </span>
              <span className="absolute left-0 top-0 text-white select-none translate-y-[2px] tracking-wide">
                SNAKE
              </span>
              
              {/* Front Gradient filled Face */}
              <span className="relative block text-transparent bg-clip-text bg-gradient-to-b from-[#8eff37] via-[#22c55e] to-[#15803d] tracking-wide py-1 px-1">
                SNAKE
              </span>
            </h1>
          </div>

          {/* Jagged / Dynamic Red Ribbon for "CLASH" */}
          <motion.div 
            initial={{ scale: 0.9, rotate: -2 }}
            animate={{ rotate: [1, -2, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative mt-2 -rotate-3 filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.7)]"
          >
            {/* Red Jagged Plate Overlay */}
            <div className="relative mx-auto bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#b91c1c] text-white font-extrabold uppercase font-[Outfit] text-2xl xs:text-3.5xl py-2 px-14 rounded-md tracking-wider border-2 border-white/90 inline-block skew-x-12 relative overflow-hidden">
              
              {/* Internal diagonal glint highlight */}
              <div className="absolute top-0 bottom-0 left-0 w-8 bg-white/20 -skew-x-12 animate-shine-fast" />

              {/* Bold clean text */}
              <span className="block -skew-x-12 tracking-[0.25em] font-black text-white text-shadow-md">
                CLASH
              </span>
            </div>

            {/* Jagged Arrow corner cuts left & right behind using raw styling */}
            <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-6 bg-red-800 rounded-l-md -rotate-12 z-[-1]" />
            <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-6 bg-red-800 rounded-r-md rotate-12 z-[-1]" />
          </motion.div>

        </div>

      </motion.div>

      {/* ----------------- METERS & LOADER ----------------- */}
      <div className="w-full max-w-sm flex flex-col items-center justify-center gap-5 mt-6 z-40 relative">
        
        <AnimatePresence mode="wait">
          {!isDoneLoading ? (
            <motion.div
              key="loader-active"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full space-y-4"
            >
              {/* Rotating funny status text */}
              <div className="h-5 text-center">
                <motion.p 
                  key={phraseIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-[10px] font-mono tracking-widest text-[#a7f3d0] font-black uppercase"
                >
                  {LOADING_PHRASES[phraseIndex]}
                </motion.p>
              </div>

              {/* Arcade Styled Neon Progress Bar */}
              <div className="w-full bg-[#081229] border-2 border-[#1e293b] p-1 rounded-2xl relative shadow-inner overflow-hidden">
                {/* Micro led markers behind */}
                <div className="absolute inset-0 flex justify-between px-3 pointer-events-none opacity-20">
                  {[...Array(10)].map((_, idx) => (
                    <div key={idx} className="w-0.5 h-full bg-slate-400" />
                  ))}
                </div>

                {/* Progress Filler */}
                <motion.div 
                  className="h-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-405 to-emerald-300 relative shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut' }}
                />
              </div>

              {/* Progress Percentage */}
              <p className="text-[11px] text-slate-500 font-mono text-center font-bold tracking-widest">
                SYSTEM CALIBRATION: <span className="text-emerald-400 font-bold">{Math.round(progress)}%</span>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="loader-loaded"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-full text-center space-y-4"
            >
              {/* Interactive Start Game Button */}
              <button
                id="btn-splash-enter"
                onClick={onComplete}
                className="group relative w-full overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black font-display text-base py-4 px-8 rounded-2xl tracking-widest uppercase transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)]"
              >
                {/* Diagonal sliding lens glare */}
                <span className="absolute inset-x-0 top-0 h-[2px] bg-white/40 skew-x-12" />
                <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none" />

                <span className="relative flex items-center justify-center gap-2">
                  <Gamepad2 className="w-5 h-5 animate-pulse" />
                  TAP TO CLASH
                </span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono">
                <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>SOUND EFF_READY • HIGH SCORE LOADED</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Decorative branding info at the bottom screen */}
      <div className="absolute bottom-6 font-mono text-[9px] text-slate-600 text-center tracking-widest uppercase">
        COBRA FIRMWARE v2.6.4 • READY FOR MOBILE & DESKTOP
      </div>

    </div>
  );
}
