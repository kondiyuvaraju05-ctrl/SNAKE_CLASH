import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Volume2, VolumeX, Sparkles, Gamepad2, ArrowLeft, Settings, HelpCircle, FileText, X, Skull, Zap, Eye, RotateCcw, Target, Shield, Compass } from 'lucide-react';
import { Difficulty, GameMode } from './types';
import GameBoard from './components/GameBoard';
import SplashLoader from './components/SplashLoader';
import MenuSnakePreview from './components/MenuSnakePreview';
import { isSoundEnabled, setSoundEnabled, playStartSound } from './utils/audio';

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode | null>(null);
  const [menuTab, setMenuTab] = useState<'MAIN' | 'BOMB_SUB_MENU'>('MAIN');
  const [highScore, setHighScore] = useState<number>(0);
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);

  // High score beat state celebrations
  const [justBeatRecord, setJustBeatRecord] = useState<boolean>(false);
  const [recordTimeoutId, setRecordTimeoutId] = useState<NodeJS.Timeout | null>(null);


  useEffect(() => {
    return () => {
      if (recordTimeoutId) {
        clearTimeout(recordTimeoutId);
      }
    };
  }, [recordTimeoutId]);

  // Load the absolute overall highest score from local storage
  useEffect(() => {
    try {
      const savedScore = localStorage.getItem('snake_highest_score');
      if (savedScore) {
        setHighScore(parseInt(savedScore, 10));
      }
    } catch (err) {
      console.warn('Error reading high score from localStorage', err);
    }
  }, []);

  const updateHighScore = (newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      setJustBeatRecord(true);

      if (recordTimeoutId) {
        clearTimeout(recordTimeoutId);
      }

      const nextTimeout = setTimeout(() => {
        setJustBeatRecord(false);
      }, 3500);
      setRecordTimeoutId(nextTimeout);

      try {
        localStorage.setItem('snake_highest_score', newScore.toString());
      } catch (err) {
        console.warn('Error archiving high score to localStorage', err);
      }
    }
  };

  const toggleSound = () => {
    const nextVal = !soundOn;
    setSoundOn(nextVal);
    setSoundEnabled(nextVal);
  };

  const handleSelectDifficulty = (diff: Difficulty) => {
    setSelectedDifficulty(diff);
    playStartSound();
  };

  const resetAllHighScore = () => {
    if (window.confirm('Reset the highest score record?')) {
      setHighScore(0);
      try {
        localStorage.setItem('snake_highest_score', '0');
      } catch (err) {
        console.warn(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0807] text-slate-100 font-sans selection:bg-orange-500 selection:text-slate-950 flex flex-col relative overflow-x-hidden pb-12">
      
      {/* Absolute High Contrast Neon Ambient Backdrops in warm snake brand colors */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-slate-900/10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(234,88,12,0.09)_0%,rgba(245,158,11,0.04)_50%,rgba(255,255,255,0)_100%)] pointer-events-none animate-pulse-slow" />

      {/* Simplified, extremely high-contrast top navbar with High Score on TOP LEFT */}
      <header className="w-full border-b border-slate-900 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          
          {/* TOP LEFT SIDE: HIGH SCORE (Highly visible yellow badge, requested: "The highest score is displayed on the top left side.") */}
          <div className="flex items-center gap-2" id="header-highest-score">
            <div 
              className={`relative overflow-hidden bg-amber-500/10 border-2 font-black font-mono px-4 py-2 rounded-2xl flex items-center gap-2 text-sm sm:text-base cursor-pointer hover:bg-amber-500/15 transition-all duration-300 ${
                justBeatRecord 
                  ? 'animate-record-glow scale-105 border-amber-400 text-amber-200' 
                  : 'border-amber-500/30 text-amber-400'
              }`} 
              onClick={resetAllHighScore} 
              title="Click to reset high score"
            >
              {/* Shine Sweep Overlay */}
              {justBeatRecord && (
                <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shine pointer-events-none" />
              )}
              
              <Trophy className={`w-4 h-4 text-amber-400 ${justBeatRecord ? 'animate-bounce text-amber-300' : 'animate-pulse'}`} />
              <span>HIGHEST SCORE: {highScore}</span>
              
              {justBeatRecord && (
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              )}
            </div>
          </div>

          {/* Simple header logo item, sound toggle, and settings button */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800">
              <Gamepad2 className="w-4 h-4 text-[#ff007f]" />
              <span className="text-xs font-mono tracking-widest text-slate-400 font-bold uppercase">SNAKE CLASH</span>
            </div>

            {/* Always-available Sound Toggle */}
            <button
              id="btn-app-mute"
              onClick={toggleSound}
              className="text-slate-400 hover:text-white p-2.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
              title={soundOn ? 'Mute sound' : 'Unmute sound'}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Elegant Settings Button */}
            <button
              id="btn-app-settings"
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-400 hover:text-white p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all flex items-center gap-2.5 cursor-pointer shadow-sm active:scale-95"
              title="Open Settings Menu"
            >
              <Settings className="w-4 h-4 text-emerald-400 animate-[spin_8s_linear_infinite]" />
              <span className="text-xs font-mono font-bold tracking-wider xs:inline hidden">SETTINGS</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container screen area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 flex flex-col justify-center items-center">
        
        <AnimatePresence mode="wait">
          {!selectedDifficulty ? (
            /* Premium Retro Arcade Two-Column Layout matching layout request perfectly */
            <motion.div
              key={menuTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center py-6 md:py-10"
            >
              {/* Left Column: Bold Glowing Titles and Menu Slots */}
              <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-7 w-full">
                
                <div className="select-none relative space-y-0.5">
                  <h1 className="text-6xl sm:text-7xl font-sans font-black tracking-widest text-[#f3f4f6] drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)] uppercase leading-none">
                    SNAKE
                  </h1>
                  <h1 className="text-7xl sm:text-8xl font-sans font-black tracking-[0.06em] text-[#ff007f] drop-shadow-[0_0_22px_#ff007f] uppercase leading-none">
                    CLASH
                  </h1>
                  
                  {/* Flashing Retro insert coin indicator */}
                  <p className="text-xs sm:text-sm font-mono tracking-[0.24em] text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] animate-pulse uppercase pt-4">
                    {menuTab === 'MAIN' ? 'INSERT COIN TO START' : 'SELECT CHALLENGE ARENA'}
                  </p>
                </div>

                {/* TAB 1: MAIN MENU PAGE (3 PRIMARY BUTTONS) */}
                {menuTab === 'MAIN' ? (
                  <div className="w-full flex flex-col gap-4 max-w-md">
                    
                    {/* 1. PLAY CLASSIC BUTTON (Glowing Pink) */}
                    <button
                      id="btn-select-easy"
                      onClick={() => {
                        setSelectedGameMode('CLASSIC');
                        setSelectedDifficulty('MEDIUM');
                        playStartSound();
                      }}
                      className="group border-2 border-[#ff007f]/50 bg-[#ff007f]/5 hover:bg-[#ff007f]/15 text-white rounded-2xl p-5 text-left transition-all active:scale-98 flex items-center justify-between cursor-pointer shadow-[0_0_15px_rgba(255,0,127,0.15)] hover:shadow-[0_0_28px_rgba(255,0,127,0.55)] hover:border-[#ff007f] duration-300 transform"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#ff007f]/15 flex items-center justify-center text-[#ff007f] border border-[#ff007f]/30">
                          <Gamepad2 className="w-5 h-5 text-[#ff007f]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-mono tracking-widest text-[#ff007f] uppercase font-black">
                            PLAY CLASSIC
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono mt-0.5 max-w-[240px]">
                            Original slither mode with normal food coordinates.
                          </span>
                        </div>
                      </div>
                      <div className="w-9 h-9 bg-[#ff007f]/15 group-hover:bg-[#ff007f] text-[#ff007f] group-hover:text-slate-950 font-mono font-black rounded-lg flex items-center justify-center transition-colors border border-[#ff007f]/30">
                        ▶
                      </div>
                    </button>

                    {/* 2. BOMB MODE BUTTON (Glowing Orange) */}
                    <button
                      id="btn-select-medium"
                      onClick={() => {
                        setMenuTab('BOMB_SUB_MENU');
                        playStartSound();
                      }}
                      className="group border-2 border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/15 text-white rounded-2xl p-5 text-left transition-all active:scale-98 flex items-center justify-between cursor-pointer shadow-[0_0_15px_rgba(249,115,22,0.15)] hover:shadow-[0_0_28px_rgba(249,115,22,0.55)] hover:border-orange-500 duration-300 transform"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400 border border-orange-500/30">
                          <Zap className="w-5 h-5 text-orange-450" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-mono tracking-widest text-orange-400 uppercase font-black">
                            BOMB MODE
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono mt-0.5 max-w-[240px]">
                            Unlock 5 special extreme arenas & custom game mechanics!
                          </span>
                        </div>
                      </div>
                      <div className="w-9 h-9 bg-orange-500/15 group-hover:bg-orange-500 text-orange-400 group-hover:text-slate-950 font-mono font-black rounded-lg flex items-center justify-center transition-colors border border-orange-500/30">
                        5
                      </div>
                    </button>

                    {/* 3. HIGH SCORE BUTTON (Glowing Purple) */}
                    <button
                      id="btn-select-hard"
                      onClick={() => {
                        setIsSettingsOpen(true);
                        playStartSound();
                      }}
                      className="group border-2 border-violet-500/50 bg-violet-500/5 hover:bg-violet-500/15 text-white rounded-2xl p-5 text-left transition-all active:scale-98 flex items-center justify-between cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.15)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55)] hover:border-violet-500 duration-300 transform"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400 border border-violet-500/30">
                          <Trophy className="w-5 h-5 text-violet-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-mono tracking-widest text-violet-400 uppercase font-black">
                            HIGH SCORE
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono mt-0.5 max-w-[240px]">
                            Inspect your personal records, reset stats, and tweak audio config.
                          </span>
                        </div>
                      </div>
                      <div className="w-9 h-9 bg-violet-500/15 group-hover:bg-violet-500 text-violet-400 group-hover:text-slate-950 font-mono font-black rounded-lg flex items-center justify-center transition-colors border border-violet-500/30">
                        ★
                      </div>
                    </button>

                  </div>
                ) : (
                  /* TAB 2: BOMB MODE CHALLENGES list (5 SPECIAL CHALLENGES) */
                  <div className="w-full flex flex-col gap-3 max-w-md">
                    
                    {/* Retro header indicator with back option */}
                    <button 
                      id="btn-back-menu"
                      onClick={() => {
                        setMenuTab('MAIN');
                        playStartSound();
                      }}
                      className="self-start flex items-center gap-2 text-xs font-mono font-black tracking-widest text-slate-400 hover:text-orange-400 mb-2 transition-colors cursor-pointer bg-slate-900/60 p-2.5 rounded-xl border border-slate-800"
                    >
                      <ArrowLeft className="w-4 h-4 text-orange-400" />
                      BACK TO MAIN MENU
                    </button>

                    {/* 1. MAZE ESCAPE */}
                    <button
                      id="bomb-mode-maze"
                      onClick={() => {
                        setSelectedGameMode('MAZE_ESCAPE');
                        setSelectedDifficulty('MEDIUM');
                        playStartSound();
                      }}
                      className="group border border-emerald-500/30 bg-emerald-950/10 hover:bg-emerald-950/20 text-white rounded-xl p-3 text-left transition-all active:scale-[0.99] flex items-center justify-between cursor-pointer hover:border-emerald-500 duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-955 transition-all">
                          <Compass className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-xs font-mono uppercase font-black text-emerald-400 tracking-wider block">1. Maze Escape</span>
                          <span className="text-[10px] text-slate-400 leading-tight block">Reach the green exit portal without touching any walls</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-500/15 px-2 py-0.5 rounded text-emerald-400 font-mono uppercase tracking-tighter">PLAY</span>
                    </button>

                    {/* 2. SHRINKING ARENA */}
                    <button
                      id="bomb-mode-shrink"
                      onClick={() => {
                        setSelectedGameMode('SHRINKING_ARENA');
                        setSelectedDifficulty('MEDIUM');
                        playStartSound();
                      }}
                      className="group border border-amber-500/30 bg-amber-950/10 hover:bg-amber-950/20 text-white rounded-xl p-3 text-left transition-all active:scale-[0.99] flex items-center justify-between cursor-pointer hover:border-amber-500 duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-955 transition-all">
                          <ArrowLeft className="w-4.5 h-4.5 translate-x-0.5 hover:scale-105" />
                        </div>
                        <div>
                          <span className="text-xs font-mono uppercase font-black text-amber-400 tracking-wider block">2. Shrinking Arena</span>
                          <span className="text-[10px] text-slate-400 leading-tight block">Outer walls constraint shrinks inward over time. Survive!</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-amber-500/15 px-2 py-0.5 rounded text-amber-400 font-mono uppercase tracking-tighter">PLAY</span>
                    </button>

                    {/* 3. SNAKE SURVIVAL */}
                    <button
                      id="bomb-mode-survival"
                      onClick={() => {
                        setSelectedGameMode('SNAKE_SURVIVAL');
                        setSelectedDifficulty('MEDIUM');
                        playStartSound();
                      }}
                      className="group border border-rose-500/30 bg-rose-950/10 hover:bg-rose-950/20 text-white rounded-xl p-3 text-left transition-all active:scale-[0.99] flex items-center justify-between cursor-pointer hover:border-rose-500 duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-slate-955 transition-all">
                          <Shield className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-xs font-mono uppercase font-black text-rose-400 tracking-wider block">3. Snake Survival</span>
                          <span className="text-[10px] text-slate-400 leading-tight block">Wall wrapping is disabled: touching the outer borders kills you</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-rose-500/15 px-2 py-0.5 rounded text-rose-450 font-mono uppercase tracking-tighter">PLAY</span>
                    </button>

                    {/* 4. LASER WALLS */}
                    <button
                      id="bomb-mode-laser"
                      onClick={() => {
                        setSelectedGameMode('LASER_WALLS');
                        setSelectedDifficulty('MEDIUM');
                        playStartSound();
                      }}
                      className="group border border-cyan-500/30 bg-cyan-950/10 hover:bg-cyan-950/20 text-white rounded-xl p-3 text-left transition-all active:scale-[0.99] flex items-center justify-between cursor-pointer hover:border-cyan-500 duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-slate-955 transition-all">
                          <Eye className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-xs font-mono uppercase font-black text-cyan-400 tracking-wider block">4. Laser Walls</span>
                          <span className="text-[10px] text-slate-400 leading-tight block">Dotted pre-warning lasers light up into solid deadly beams</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-cyan-500/15 px-2 py-0.5 rounded text-cyan-400 font-mono uppercase tracking-tighter">PLAY</span>
                    </button>

                    {/* 5. OBSTACLE RUSH */}
                    <button
                      id="bomb-mode-rush"
                      onClick={() => {
                        setSelectedGameMode('OBSTACLE_RUSH');
                        setSelectedDifficulty('MEDIUM');
                        playStartSound();
                      }}
                      className="group border border-violet-500/30 bg-violet-950/10 hover:bg-violet-950/20 text-white rounded-xl p-3 text-left transition-all active:scale-[0.99] flex items-center justify-between cursor-pointer hover:border-violet-500 duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20 group-hover:bg-violet-500 group-hover:text-slate-955 transition-all">
                          <Skull className="w-4.5 h-4.5 animate-bounce-slow" />
                        </div>
                        <div>
                          <span className="text-xs font-mono uppercase font-black text-violet-455 tracking-wider block">5. Obstacle Rush</span>
                          <span className="text-[10px] text-slate-400 leading-tight block">New brick barriers materialize to continuously block your path</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-violet-500/15 px-2 py-0.5 rounded text-violet-400 font-mono uppercase tracking-tighter">PLAY</span>
                    </button>

                  </div>
                )}
              </div>

              {/* Right Column: Dynamic decorative arcade board canvas simulation */}
              <div className="lg:col-span-5 flex items-center justify-center w-full">
                <MenuSnakePreview />
              </div>

            </motion.div>
          ) : (
            /* Screen 2: Active Progressive Snake Grid Canvas Stage */
            <motion.div
              key="active-board"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="w-full flex justify-center"
            >
              <GameBoard
                difficulty={selectedDifficulty}
                gameMode={selectedGameMode || 'CLASSIC'}
                onBackToMenu={() => {
                  setSelectedDifficulty(null);
                  setSelectedGameMode(null);
                  setMenuTab('MAIN');
                }}
                highScore={highScore}
                onUpdateHighScore={updateHighScore}
                soundOn={soundOn}
                onToggleSound={toggleSound}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Styled minimalistic high-contrast bottom bar */}
      <footer className="w-full border-t border-slate-900 mt-auto pt-6 text-center text-xs font-mono text-slate-600">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 justify-center">
            © 2026 Snake Game Arcade
          </span>
          <span>Highest Score Active: <strong className="text-amber-400 font-bold">{highScore}</strong></span>
        </div>
      </footer>

      {/* Settings Panel Sliding Box on the Right Side */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 pointer-events-auto"
            />

            {/* Sidebar drawer container */}
            <motion.div
              initial={{ x: '100%', opacity: 0.95 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-slate-950 border-l border-slate-800 z-50 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col pointer-events-auto h-screen"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-900 bg-slate-900/60">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Settings className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold font-display uppercase tracking-wider text-white">ARCADE SETTINGS</h2>
                    <p className="text-[10px] text-slate-500 font-mono">Personalize & inspect gameplay</p>
                  </div>
                </div>
                <button
                  id="btn-close-settings"
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close Settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* Section 1: Sound Control Panel */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono font-black uppercase tracking-widest text-slate-500 block">AUDIO SYSTEM</span>
                  <button
                    id="btn-settings-sound-toggle"
                    onClick={toggleSound}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      soundOn 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:bg-emerald-500/15' 
                        : 'bg-slate-900/60 border-slate-850 text-slate-450 hover:bg-slate-900 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {soundOn ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                      <span className="font-mono text-xs uppercase tracking-wide">SYSTEM SOUNDS</span>
                    </div>
                    <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                      soundOn ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/10' : 'bg-slate-950 text-slate-500 border-slate-850'
                    }`}>
                      {soundOn ? 'ACTIVE ON' : 'MUTED OFF'}
                    </span>
                  </button>
                </div>

                {/* Section 2: Help Guide Panel */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono font-black uppercase tracking-widest text-slate-500 block">GAMEWAY INSTRUCTIONS</span>
                  <div className="border border-slate-900 rounded-2xl overflow-hidden bg-slate-900/10">
                    <button
                      id="btn-settings-help-toggle"
                      onClick={() => setIsHelpOpen(!isHelpOpen)}
                      className={`w-full flex items-center justify-between p-4 text-left transition-all cursor-pointer ${
                        isHelpOpen ? 'bg-indigo-500/10 text-indigo-300 border-b border-indigo-500/10' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-indigo-400" />
                        <span className="font-mono text-xs uppercase tracking-wide">HOW WE HELP THE USER?</span>
                      </div>
                      <span className="text-xs transition-transform duration-200">{isHelpOpen ? '▲' : '▼'}</span>
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isHelpOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-slate-950/70 border-t border-slate-900 text-xs text-slate-300 space-y-3 leading-relaxed">
                            <p className="font-bold text-indigo-300 font-mono border-b border-slate-900 pb-1.5 uppercase tracking-wide text-[10px]">Your Success Guide:</p>
                            <div className="space-y-3">
                              <div className="flex gap-2.5 items-start">
                                <span className="text-indigo-400 font-bold mt-0.5">•</span>
                                <div>
                                  <strong className="text-slate-100 font-mono text-[11px] block">THE MAIN MISSION</strong>
                                  <p className="text-slate-400 text-[11px]">Steer your continuous organic reptile to consume high-charge <span className="text-teal-400 font-bold">Electric Small Eggs (+1 Score)</span> spawned at random coordinates.</p>
                                </div>
                              </div>
                              <div className="flex gap-2.5 items-start">
                                <span className="text-indigo-400 font-bold mt-0.5">•</span>
                                <div>
                                  <strong className="text-slate-100 font-mono text-[11px] block">BONUS GOLDEN SPAWNS</strong>
                                  <p className="text-slate-400 text-[11px]">After eating exactly <span className="text-indigo-400 font-bold font-mono">5 Small Eggs</span>, a high-value <span className="text-amber-400 font-bold">Big Gold Egg (+5 Score)</span> spawns. Harvest it quickly before it disappears!</p>
                                </div>
                              </div>
                              <div className="flex gap-2.5 items-start">
                                <span className="text-indigo-400 font-bold mt-0.5">•</span>
                                <div>
                                  <strong className="text-slate-100 font-mono text-[11px] block">SHAKE-FREE SLITHERING</strong>
                                  <p className="text-slate-400 text-[11px]">The snake has been hardened with advanced stabilizer controls: it moves cleanly without any coordinate shaking during active gameplay runs.</p>
                                </div>
                              </div>
                              <div className="flex gap-2.5 items-start">
                                <span className="text-indigo-400 font-bold mt-0.5">•</span>
                                <div>
                                  <strong className="text-slate-100 font-mono text-[11px] block">SPEED LEVELS</strong>
                                  <p className="text-slate-400 text-[11px]">Your level increments by eating foods (up to Level 10), speeding the snake up in increments. Stay focused as the grid accelerates!</p>
                                </div>
                              </div>
                              <div className="flex gap-2.5 items-start">
                                <span className="text-indigo-400 font-bold mt-0.5">•</span>
                                <div>
                                  <strong className="text-slate-100 font-mono text-[11px] block">WALL WRAP SAFELY</strong>
                                  <p className="text-slate-400 text-[11px]">Borders are wrapping ready! Passing through any outer boundary will safely teleport the snake to the opposite side immediately.</p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl text-[10px] text-slate-400 italic font-mono text-center mt-2">
                              Desktop Keys: Arrow Keys / WASD • Mobile Keys: Bottom Round Directional D-Pad
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Section 3: Terms & Conditions Panel */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono font-black uppercase tracking-widest text-slate-500 block">ARCADE AGREEMENTS</span>
                  <div className="border border-slate-900 rounded-2xl overflow-hidden bg-slate-900/10">
                    <button
                      id="btn-settings-terms-toggle"
                      onClick={() => setIsTermsOpen(!isTermsOpen)}
                      className={`w-full flex items-center justify-between p-4 text-left transition-all cursor-pointer ${
                        isTermsOpen ? 'bg-amber-500/10 text-amber-300 border-b border-amber-500/10' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-amber-400" />
                        <span className="font-mono text-xs uppercase tracking-wide">TERMS & CONDITIONS</span>
                      </div>
                      <span className="text-xs transition-transform duration-200">{isTermsOpen ? '▲' : '▼'}</span>
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isTermsOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-slate-950/70 border-t border-slate-900 text-[11px] text-slate-400 space-y-3 leading-relaxed font-mono">
                            <p className="font-bold text-amber-300 text-[10px] border-b border-slate-800/40 pb-1 uppercase tracking-wide">SNAKE GAME LICENSE AGREEMENT</p>
                            
                            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1 text-[10px] text-slate-400">
                              <p><strong>1. Fellowship Acceptance:</strong> By pressing "Start Game" and taking command of the electronic neon reptile, you confirm your absolute commitment to the local high score climb.</p>
                              <p><strong>2. Tail Collisions Clause:</strong> Biting your own tail leads to instant physical collapse. The operator accepts zero accountability for self-inflicted tail collision crashes.</p>
                              <p><strong>3. Reflex Acceleration:</strong> User acknowledges that game speed builds continuously with progress. Real-time dopamine rushes, heavy concentration, and extreme focus are expected side effects.</p>
                              <p><strong>4. Localized Integration:</strong> Highest Scores are committed strictly to the browser's Local Storage context. Clearing private data will erase records permanently.</p>
                              <p><strong>5. Fairplay wrapping:</strong> Screen border warping is a feature of this coordinate firmware. Wall tunneling is approved and fully compliant with arcade standards.</p>
                            </div>
                            <p className="text-[9px] text-amber-500/50 italic text-center pt-2 border-t border-slate-900">
                              © 2026 Snake Arcade. All coordinates reserved.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-900 bg-slate-900/40 text-center text-[10px] font-mono text-slate-500">
                <span>Active Firmware Version: v2.6.4</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAppLoading && (
          <SplashLoader onComplete={() => setIsAppLoading(false)} />
        )}
      </AnimatePresence>

    </div>
  );
}
export { App };
