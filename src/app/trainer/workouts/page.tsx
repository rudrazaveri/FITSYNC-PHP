'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Dumbbell, 
  Calendar, 
  Clock, 
  Activity, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Flame, 
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from '@/components/Toast';
import { WEEK_DAYS, getWorkoutForDay } from '@/lib/initial-data';
import { WeekDay, Exercise } from '@/types';
import { ExerciseDetailModal } from '@/components/ExerciseDetailModal';

export default function TrainerWorkoutsPage() {
  const { showToast } = useToast();
  const [selectedDay, setSelectedDay] = useState<WeekDay>('Monday');
  const [selectedExerciseModal, setSelectedExerciseModal] = useState<Exercise | null>(null);

  const routine = getWorkoutForDay(selectedDay);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fitness-primary/20 text-fitness-primary border border-fitness-primary/30 uppercase tracking-wider">
              Gym Workout Programming
            </span>
            <span className="text-xs text-gray-400">Human Strength Coach Prescriptions</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-white">
            Daily Workout Splits &amp; Exercise Library
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Review programmed compound movements, loading parameters, demonstration cues, and spotter technique notes for your assigned athletes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-surface-2 border border-surface-border text-xs text-healthcare-accent font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Strict Human Coach Design (No AI Plans)</span>
          </span>
        </div>
      </div>

      {/* 7-Day Split Selector Bar */}
      <div className="p-4 rounded-3xl bg-surface-1 border border-surface-border space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-fitness-primary" /> Select Day Routine Split:
          </span>
          <span className="text-fitness-primary font-mono">{routine.title}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {WEEK_DAYS.map((day) => {
            const isSelected = selectedDay === day;
            const dayRoutine = getWorkoutForDay(day);
            return (
              <button
                key={day}
                onClick={() => {
                  haptics.playTap();
                  setSelectedDay(day);
                }}
                className={`p-3 rounded-2xl border text-left transition ${
                  isSelected
                    ? 'bg-fitness-primary text-gray-950 font-black border-fitness-primary shadow-glow-fitness scale-[1.02]'
                    : 'bg-surface-2 border-surface-border text-gray-300 hover:text-white'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider">{day.slice(0, 3)}</div>
                <div className="text-xs font-bold truncate mt-0.5">{dayRoutine.title.split(' ')[0]}</div>
                <div className="text-[10px] opacity-80 truncate">{dayRoutine.focus}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Routine Overview Card */}
      <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-2 text-fitness-primary uppercase font-mono">
                {selectedDay} Split
              </span>
              <span className="text-xs text-gray-400">Duration: {routine.duration}</span>
            </div>
            <h2 className="font-headline font-black text-xl sm:text-2xl text-white mt-1">
              {routine.title}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Target Focus: <strong className="text-white">{routine.focus}</strong> • Difficulty: <strong className="text-white">{routine.difficulty}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/trainer/members"
              onClick={() => haptics.playTap()}
              className="px-4 py-2 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition flex items-center gap-1.5"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Assign This Split to Athletes</span>
            </Link>
          </div>
        </div>

        {/* Exercises Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {routine.exercises.map((exercise, index) => (
            <div
              key={exercise.id}
              onClick={() => {
                haptics.playTap();
                setSelectedExerciseModal(exercise);
              }}
              className="p-5 rounded-3xl bg-surface-2 border border-surface-border hover:border-fitness-primary/60 transition cursor-pointer space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-surface-border flex-shrink-0 bg-surface-3">
                      <Image 
                        src={exercise.thumbnail} 
                        alt={exercise.name} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                    <div>
                      <div className="text-[10px] text-fitness-primary font-bold uppercase tracking-wider font-mono">
                        Exercise {index + 1}
                      </div>
                      <h3 className="font-headline font-bold text-base text-white">
                        {exercise.name}
                      </h3>
                      <div className="text-[11px] text-gray-400">
                        Equipment: {exercise.equipment}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loading Specs */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-surface-1 border border-surface-border text-center text-xs">
                  <div>
                    <div className="text-[10px] text-gray-400">Sets</div>
                    <div className="font-bold text-white font-mono mt-0.5">{exercise.targetSets}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Target Reps</div>
                    <div className="font-bold text-fitness-primary font-mono mt-0.5">{exercise.targetReps}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Rest Timer</div>
                    <div className="font-bold text-healthcare-accent font-mono mt-0.5">{exercise.restSeconds}s</div>
                  </div>
                </div>

                {/* Target Muscle & Coach Tip */}
                <div className="text-xs space-y-1">
                  <div className="text-gray-400 text-[11px]">
                    Primary Muscle: <strong className="text-gray-200">{exercise.muscle}</strong>
                  </div>
                  {exercise.trainerTip && (
                    <div className="p-2 rounded-xl bg-surface-1 border border-surface-border/60 text-[11px] text-gray-300">
                      💡 <strong className="text-fitness-primary">Coach Cue:</strong> {exercise.trainerTip}
                    </div>
                  )}
                </div>
              </div>

              {/* View Full Form Instructions Button */}
              <div className="pt-2 border-t border-surface-border flex items-center justify-between text-xs">
                <span className="text-[11px] text-gray-400">Form instructions, mistakes &amp; cues</span>
                <span className="text-fitness-primary font-bold flex items-center gap-1">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        exercise={selectedExerciseModal}
        onClose={() => setSelectedExerciseModal(null)}
      />

    </div>
  );
}

