'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';

interface RestTimerWidgetProps {
  initialSeconds?: number;
}

export const RestTimerWidget: React.FC<RestTimerWidgetProps> = ({ initialSeconds = 90 }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      haptics.playSuccess();
      setIsActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft]);

  const toggleTimer = () => {
    haptics.playTap();
    setIsActive(!isActive);
  };

  const resetTimer = (sec: number) => {
    haptics.playTap();
    setIsActive(false);
    setSecondsLeft(sec);
  };

  const format = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="p-3 bg-surface-2 rounded-2xl border border-surface-border flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-xl ${isActive ? 'bg-fitness-primary text-gray-950 animate-pulse' : 'bg-surface-3 text-gray-300'}`}>
          <Timer className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-gray-400">Rest Timer</div>
          <div className="font-mono font-bold text-sm text-white">{format(secondsLeft)}</div>
        </div>
      </div>

      {/* Preset intervals */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => resetTimer(60)}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono border ${
            secondsLeft === 60 ? 'bg-fitness-primary/20 text-fitness-primary border-fitness-primary/50' : 'bg-surface-3 text-gray-400 border-white/5'
          }`}
        >
          60s
        </button>
        <button
          onClick={() => resetTimer(90)}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono border ${
            secondsLeft === 90 ? 'bg-fitness-primary/20 text-fitness-primary border-fitness-primary/50' : 'bg-surface-3 text-gray-400 border-white/5'
          }`}
        >
          90s
        </button>
        <button
          onClick={() => resetTimer(120)}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono border ${
            secondsLeft === 120 ? 'bg-fitness-primary/20 text-fitness-primary border-fitness-primary/50' : 'bg-surface-3 text-gray-400 border-white/5'
          }`}
        >
          120s
        </button>

        {/* Start / Pause */}
        <button
          onClick={toggleTimer}
          className="p-1.5 rounded-lg bg-fitness-primary text-gray-950 font-bold ml-1 hover:bg-fitness-light transition"
          title={isActive ? 'Pause' : 'Start'}
        >
          {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => resetTimer(initialSeconds)}
          className="p-1.5 rounded-lg bg-surface-3 text-gray-300 hover:text-white transition"
          title="Reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
