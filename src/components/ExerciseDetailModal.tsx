'use client';

import React from 'react';
import Image from 'next/image';
import { Exercise } from '@/types';
import { X, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  onClose: () => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exercise, onClose }) => {
  if (!exercise) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-2 border border-surface-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header with image */}
        <div className="relative h-48 w-full bg-surface-1">
          <Image
            src={exercise.thumbnail}
            alt={exercise.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-2 via-surface-2/40 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-xl backdrop-blur-md hover:bg-black/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-fitness-primary text-gray-950">
              {exercise.type || 'Exercise Guide'}
            </span>
            <h3 className="font-headline font-bold text-white text-xl mt-1">{exercise.name}</h3>
            <div className="text-xs text-gray-300">{exercise.muscle} • {exercise.equipment}</div>
          </div>
        </div>

        {/* Instructions & Coaching Cues */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-fitness-primary" />
              Step-by-Step Execution
            </h4>
            <ol className="space-y-2 list-decimal list-inside text-gray-300 leading-relaxed">
              {exercise.instructions.map((step, idx) => (
                <li key={idx} className="pl-1">{step}</li>
              ))}
            </ol>
          </div>

          <div className="p-3.5 rounded-2xl bg-status-danger/10 border border-status-danger/30 text-gray-300">
            <h5 className="font-bold text-red-300 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-status-danger" />
              Common Execution Mistakes
            </h5>
            <p className="text-[11px] leading-relaxed text-red-200/90">{exercise.commonMistakes}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-fitness-primary/10 border border-fitness-primary/30 text-gray-300">
            <h5 className="font-bold text-fitness-primary uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-fitness-primary" />
              Coach Raj Technique Tip
            </h5>
            <p className="text-[11px] leading-relaxed text-emerald-200/90">{exercise.trainerTip}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border bg-surface-1 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-fitness-primary text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness transition"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
