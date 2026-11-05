'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  ClipboardList,
  Plus,
  Edit3,
  Copy,
  Trash2,
  Search,
  Filter,
  UserCheck,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Check
} from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from '@/components/Toast';
import { WEEK_DAYS, getWorkoutForDay, INITIAL_TRAINER_CLIENTS } from '@/lib/initial-data';
import { WeekDay, Exercise, CustomWorkoutPlan } from '@/types';
import { getInitialState, saveState, AppState } from '@/lib/store';
import { ExerciseDetailModal } from '@/components/ExerciseDetailModal';

export default function TrainerWorkoutsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'plans' | 'splits' | 'library'>('plans');
  const [selectedDay, setSelectedDay] = useState<WeekDay>('Monday');
  const [selectedExerciseModal, setSelectedExerciseModal] = useState<Exercise | null>(null);

  // Custom Workout Plans List State
  const [workoutPlans, setWorkoutPlans] = useState<CustomWorkoutPlan[]>([]);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Create / Edit Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Plan Form Fields (Section 5.3)
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [assignedMemberId, setAssignedMemberId] = useState<string>(INITIAL_TRAINER_CLIENTS[0]?.id || 'tc_aarav_01');
  const [selectedWorkoutDays, setSelectedWorkoutDays] = useState<WeekDay[]>(['Monday', 'Wednesday', 'Friday']);
  const [planStartDate, setPlanStartDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [planEndDate, setPlanEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA')
  );
  const [planTrainerNotes, setPlanTrainerNotes] = useState('');
  const [planExercises, setPlanExercises] = useState<CustomWorkoutPlan['exercises']>([]);

  // Add Exercise To Plan Draft State
  const [draftExName, setDraftExName] = useState('Barbell Bench Press');
  const [draftExMuscle, setDraftExMuscle] = useState('Chest');
  const [draftExEquipment, setDraftExEquipment] = useState('Barbell');
  const [draftExSets, setDraftExSets] = useState(4);
  const [draftExReps, setDraftExReps] = useState('8-10');
  const [draftExWeight, setDraftExWeight] = useState('75.0 kg');
  const [draftExRest, setDraftExRest] = useState(90);
  const [draftExInstructions, setDraftExInstructions] = useState('Touch chest gently and drive up explosive.');
  const [draftExNotes, setDraftExNotes] = useState('Spotter required on final set.');

  // Exercise Library Filters (Section 5.5)
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryMuscle, setLibraryMuscle] = useState('all');
  const [libraryEquipment, setLibraryEquipment] = useState('all');

  // Load plans from local store
  useEffect(() => {
    try {
      const state = getInitialState();
      const existing = state.customWorkoutPlans || [];
      if (existing.length === 0) {
        // Pre-populate with initial coach plans for Aarav and Priya
        const initialPlans: CustomWorkoutPlan[] = [
          {
            id: 'plan_hypertrophy_aarav',
            name: 'Aarav - Push/Pull Hypertrophy Cycle',
            description: 'Targeted progressive overload program focusing on upper chest, posterior chain, and delta hypertrophy.',
            assignedMemberId: 'tc_aarav_01',
            assignedMemberName: 'Aarav Shah',
            assignedMemberAvatar: '/assets/aarav.jpg',
            workoutDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
            startDate: '2026-11-01',
            endDate: '2026-12-15',
            status: 'Active',
            trainerNotes: 'Ensure 2 min rest between top barbell sets. Keep RPE at 8.5.',
            createdAt: '2026-11-01',
            exercises: [
              {
                id: 'pe_1',
                exerciseId: 'ex_bench',
                name: 'Incline Barbell Bench Press',
                muscle: 'Chest',
                equipment: 'Barbell',
                sets: 4,
                reps: '8-10',
                targetWeight: '72.5 kg',
                restSeconds: 90,
                instructions: 'Drive smoothly through concentric, keep shoulder blades retracted.',
                trainerNotes: 'Focus on clavicular head contraction.'
              },
              {
                id: 'pe_2',
                exerciseId: 'ex_row',
                name: 'Chest-Supported T-Bar Row',
                muscle: 'Back',
                equipment: 'Machine',
                sets: 4,
                reps: '10-12',
                targetWeight: '55.0 kg',
                restSeconds: 75,
                instructions: 'Pull elbows back past torso and pause for 1 second.',
                trainerNotes: 'Zero lower back involvement.'
              },
              {
                id: 'pe_3',
                exerciseId: 'ex_squat',
                name: 'Barbell Back Squat',
                muscle: 'Legs',
                equipment: 'Barbell',
                sets: 4,
                reps: '6-8',
                targetWeight: '105.0 kg',
                restSeconds: 120,
                instructions: 'Hit parallel depth with knees tracking toes.',
                trainerNotes: 'Check ankle mobility before heavy loads.'
              }
            ]
          },
          {
            id: 'plan_toning_priya',
            name: 'Priya - Strength & Conditioning Phase',
            description: 'Metabolic circuit paired with compound resistance movements for muscular endurance and postural strength.',
            assignedMemberId: 'tc_priya_02',
            assignedMemberName: 'Priya Patel',
            assignedMemberAvatar: '/assets/avatar_priya.jpg',
            workoutDays: ['Tuesday', 'Thursday', 'Saturday'],
            startDate: '2026-11-05',
            endDate: '2026-12-05',
            status: 'Active',
            trainerNotes: 'Maintain moderate pacing, monitor heart rate.',
            createdAt: '2026-11-05',
            exercises: [
              {
                id: 'pe_4',
                exerciseId: 'ex_goblet',
                name: 'Goblet Squat',
                muscle: 'Legs',
                equipment: 'Dumbbell',
                sets: 3,
                reps: '12-15',
                targetWeight: '16.0 kg',
                restSeconds: 60,
                instructions: 'Hold dumbbell vertically against sternum and descend into deep squat.',
                trainerNotes: 'Keep torso upright.'
              },
              {
                id: 'pe_5',
                exerciseId: 'ex_lat_pulldown',
                name: 'Wide-Grip Lat Pulldown',
                muscle: 'Back',
                equipment: 'Cable',
                sets: 3,
                reps: '12',
                targetWeight: '35.0 kg',
                restSeconds: 60,
                instructions: 'Pull bar to collarbone squeezing shoulder blades together.',
                trainerNotes: 'Avoid swinging torso backward.'
              }
            ]
          }
        ];
        setWorkoutPlans(initialPlans);
        // Persist
        state.customWorkoutPlans = initialPlans;
        saveState(state);
      } else {
        setWorkoutPlans(existing);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const persistPlans = (updated: CustomWorkoutPlan[]) => {
    setWorkoutPlans(updated);
    try {
      const state = getInitialState();
      state.customWorkoutPlans = updated;
      saveState(state);
    } catch (e) {
      console.error(e);
    }
  };

  // Section 5.3: Add exercise to current plan draft
  const handleAddExerciseToPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftExName.trim()) return;

    haptics.playTap();
    const newEx = {
      id: `pe_${Date.now()}`,
      exerciseId: `ex_${Date.now()}`,
      name: draftExName.trim(),
      muscle: draftExMuscle,
      equipment: draftExEquipment,
      sets: Number(draftExSets) || 3,
      reps: String(draftExReps),
      targetWeight: draftExWeight.trim() || '20.0 kg',
      restSeconds: Number(draftExRest) || 90,
      instructions: draftExInstructions.trim(),
      trainerNotes: draftExNotes.trim()
    };

    setPlanExercises(prev => [...prev, newEx]);
    setDraftExNotes('');
    showToast(`Added ${newEx.name} to plan!`, '🏋️');
  };

  const handleRemoveExerciseFromPlan = (id: string) => {
    haptics.playTap();
    setPlanExercises(prev => prev.filter(e => e.id !== id));
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    haptics.playTap();
    setEditingPlanId(null);
    setPlanName('');
    setPlanDescription('');
    setAssignedMemberId(INITIAL_TRAINER_CLIENTS[0]?.id || 'tc_aarav_01');
    setSelectedWorkoutDays(['Monday', 'Wednesday', 'Friday']);
    setPlanTrainerNotes('');
    setPlanExercises([
      {
        id: `pe_${Date.now()}_1`,
        exerciseId: 'ex_bench',
        name: 'Incline Barbell Bench Press',
        muscle: 'Chest',
        equipment: 'Barbell',
        sets: 4,
        reps: '8-10',
        targetWeight: '70.0 kg',
        restSeconds: 90,
        instructions: 'Control tempo down to chest and drive smoothly up.',
        trainerNotes: 'Retract scapula before lifting.'
      }
    ]);
    setIsPlanModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (plan: CustomWorkoutPlan) => {
    haptics.playTap();
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanDescription(plan.description);
    setAssignedMemberId(plan.assignedMemberId);
    setSelectedWorkoutDays(plan.workoutDays);
    setPlanStartDate(plan.startDate);
    setPlanEndDate(plan.endDate);
    setPlanTrainerNotes(plan.trainerNotes || '');
    setPlanExercises(plan.exercises);
    setIsPlanModalOpen(true);
  };

  // Section 5.3: Save / Update Plan
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) {
      showToast('Please enter a workout plan name.', '⚠️');
      return;
    }
    if (planExercises.length === 0) {
      showToast('Please add at least one exercise to the plan.', '⚠️');
      return;
    }

    const assignedClient = INITIAL_TRAINER_CLIENTS.find(c => c.id === assignedMemberId) || INITIAL_TRAINER_CLIENTS[0];

    haptics.playSuccess();

    if (editingPlanId) {
      // Update existing plan
      const updated = workoutPlans.map(p => {
        if (p.id === editingPlanId) {
          return {
            ...p,
            name: planName.trim(),
            description: planDescription.trim(),
            assignedMemberId: assignedClient.id,
            assignedMemberName: assignedClient.name,
            assignedMemberAvatar: assignedClient.avatar,
            workoutDays: selectedWorkoutDays,
            startDate: planStartDate,
            endDate: planEndDate,
            trainerNotes: planTrainerNotes.trim(),
            exercises: planExercises
          };
        }
        return p;
      });
      persistPlans(updated);
      showToast(`Updated workout plan: ${planName}!`, '✅');
    } else {
      // Create fresh plan
      const newPlan: CustomWorkoutPlan = {
        id: `plan_${Date.now()}`,
        name: planName.trim(),
        description: planDescription.trim() || 'Custom athletic split designed by Gym Strength Coach.',
        assignedMemberId: assignedClient.id,
        assignedMemberName: assignedClient.name,
        assignedMemberAvatar: assignedClient.avatar,
        workoutDays: selectedWorkoutDays,
        startDate: planStartDate,
        endDate: planEndDate,
        status: 'Active',
        trainerNotes: planTrainerNotes.trim(),
        exercises: planExercises,
        createdAt: new Date().toLocaleDateString('en-CA')
      };
      persistPlans([newPlan, ...workoutPlans]);
      showToast(`Created & assigned workout plan to ${assignedClient.name}! 🎉`, '✅');
    }

    setIsPlanModalOpen(false);
  };

  // Section 5.4: Duplicate Plan
  const handleDuplicatePlan = (plan: CustomWorkoutPlan) => {
    haptics.playTap();
    const duplicated: CustomWorkoutPlan = {
      ...plan,
      id: `plan_${Date.now()}`,
      name: `${plan.name} (Copy)`,
      createdAt: new Date().toLocaleDateString('en-CA'),
      status: 'Draft'
    };
    persistPlans([duplicated, ...workoutPlans]);
    showToast(`Duplicated plan: ${duplicated.name}! 📋`, '✅');
  };

  // Section 5.4: Delete Plan
  const handleDeletePlan = (planId: string) => {
    haptics.playTap();
    if (confirm('Are you sure you want to delete this workout plan?')) {
      const updated = workoutPlans.filter(p => p.id !== planId);
      persistPlans(updated);
      showToast('Workout plan deleted.', '🗑️');
    }
  };

  // Section 5.4: Toggle Plan Status
  const handleTogglePlanStatus = (planId: string) => {
    haptics.playTap();
    const updated = workoutPlans.map(p => {
      if (p.id === planId) {
        const nextStatus: CustomWorkoutPlan['status'] = 
          p.status === 'Active' ? 'Draft' : p.status === 'Draft' ? 'Completed' : 'Active';
        return { ...p, status: nextStatus };
      }
      return p;
    });
    persistPlans(updated);
    showToast('Plan status updated.', '🔄');
  };

  // Toggle Day Selection in form
  const toggleDaySelection = (day: WeekDay) => {
    haptics.playTap();
    setSelectedWorkoutDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Section 5.5: All exercises across all routines for Library
  const allExercises = useMemo(() => {
    const map = new Map<string, Exercise>();
    WEEK_DAYS.forEach(day => {
      const routine = getWorkoutForDay(day);
      routine.exercises.forEach(ex => {
        if (!map.has(ex.name)) {
          map.set(ex.name, ex);
        }
      });
    });
    return Array.from(map.values());
  }, []);

  const filteredLibraryExercises = useMemo(() => {
    return allExercises.filter(ex => {
      const q = librarySearch.toLowerCase();
      const matchesQ = !q || ex.name.toLowerCase().includes(q) || ex.muscle.toLowerCase().includes(q);
      const matchesM = libraryMuscle === 'all' || ex.muscle.toLowerCase().includes(libraryMuscle.toLowerCase());
      const matchesE = libraryEquipment === 'all' || ex.equipment.toLowerCase().includes(libraryEquipment.toLowerCase());
      return matchesQ && matchesM && matchesE;
    });
  }, [allExercises, librarySearch, libraryMuscle, libraryEquipment]);

  const activeRoutine = getWorkoutForDay(selectedDay);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fitness-primary/20 text-fitness-primary border border-fitness-primary/30 uppercase tracking-wider">
              Gym Strength Coach Portal
            </span>
            <span className="text-xs text-gray-400">Section 5.3 &amp; 5.4 Workout Programming</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-white">
            Workout Plans &amp; Exercise Library
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Design customized training plans, prescribe compound loads, assign routines to members, and manage the official gym exercise database.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Workout Plan</span>
          </button>
        </div>
      </div>

      {/* Primary Subtabs: Custom Plans (5.4) vs 7-Day Splits vs Exercise Library (5.5) */}
      <div className="p-1.5 rounded-2xl bg-surface-1 border border-surface-border flex items-center gap-1.5">
        <button
          onClick={() => {
            haptics.playTap();
            setActiveTab('plans');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'plans'
              ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Custom Workout Plans ({workoutPlans.length})</span>
        </button>

        <button
          onClick={() => {
            haptics.playTap();
            setActiveTab('splits');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'splits'
              ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>7-Day Standard Splits</span>
        </button>

        <button
          onClick={() => {
            haptics.playTap();
            setActiveTab('library');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'library'
              ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Exercise Database (5.5)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: CUSTOM WORKOUT PLANS MANAGEMENT (5.4)           */}
      {/* ======================================================== */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>Active &amp; Assigned Plans for Gym Members</span>
            <span className="font-mono">{workoutPlans.length} Total Plans Programmed</span>
          </div>

          {workoutPlans.length === 0 ? (
            <div className="p-12 rounded-3xl bg-surface-1 border border-surface-border text-center space-y-3">
              <ClipboardList className="w-10 h-10 text-fitness-primary mx-auto" />
              <div className="font-bold text-white text-base">No Custom Plans Yet</div>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Create tailored exercise prescriptions for your assigned athletes with custom sets, reps, target weight, and rest intervals.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-fitness-primary text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness"
              >
                + Create First Workout Plan
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {workoutPlans.map((plan) => {
                const isExpanded = expandedPlanId === plan.id;

                return (
                  <div
                    key={plan.id}
                    className="p-5 sm:p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4 hover:border-fitness-primary/40 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-headline font-bold text-lg text-white">{plan.name}</h3>
                          <button
                            onClick={() => handleTogglePlanStatus(plan.id)}
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase transition ${
                              plan.status === 'Active'
                                ? 'bg-fitness-primary/20 text-fitness-primary border border-fitness-primary/30'
                                : plan.status === 'Draft'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-surface-2 text-gray-400 border border-surface-border'
                            }`}
                            title="Click to toggle status"
                          >
                            {plan.status}
                          </button>
                          <span className="text-[11px] text-gray-500 font-mono">
                            {plan.startDate} → {plan.endDate}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 max-w-2xl">{plan.description}</p>
                      </div>

                      {/* Action Buttons (Section 5.4) */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          onClick={() => handleOpenEditModal(plan)}
                          className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs text-gray-300 hover:text-white border border-surface-border transition flex items-center gap-1.5"
                          title="Edit plan details"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-fitness-primary" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDuplicatePlan(plan)}
                          className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs text-gray-300 hover:text-white border border-surface-border transition flex items-center gap-1.5"
                          title="Duplicate plan"
                        >
                          <Copy className="w-3.5 h-3.5 text-healthcare-accent" />
                          <span>Duplicate</span>
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-2 rounded-xl bg-surface-2 hover:bg-red-500/15 text-gray-400 hover:text-red-400 border border-surface-border transition"
                          title="Delete plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Member & Schedule Meta Strip */}
                    <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl overflow-hidden relative border border-fitness-primary/50 flex-shrink-0">
                          <Image
                            src={plan.assignedMemberAvatar || '/assets/aarav.jpg'}
                            alt={plan.assignedMemberName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-[11px] text-gray-400">Assigned Member:</div>
                          <div className="font-bold text-white flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-fitness-primary" />
                            <span>{plan.assignedMemberName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Days Pill List */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-gray-400 mr-1">Workout Days:</span>
                        {plan.workoutDays.map(d => (
                          <span
                            key={d}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-surface-1 text-gray-200 border border-surface-border font-semibold"
                          >
                            {d.slice(0, 3)}
                          </span>
                        ))}
                      </div>

                      {/* Expand Toggle */}
                      <button
                        onClick={() => {
                          haptics.playTap();
                          setExpandedPlanId(isExpanded ? null : plan.id);
                        }}
                        className="text-xs text-fitness-primary font-bold hover:underline flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Hide' : 'View'} {plan.exercises.length} Exercises</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Expanded Exercises Table */}
                    {isExpanded && (
                      <div className="space-y-3 pt-2 animate-in fade-in duration-150">
                        {plan.trainerNotes && (
                          <div className="p-3 rounded-xl bg-fitness-primary/10 border border-fitness-primary/30 text-xs text-gray-300">
                            💡 <strong className="text-fitness-primary">Coach Directives:</strong> {plan.trainerNotes}
                          </div>
                        )}

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs min-w-[550px]">
                            <thead>
                              <tr className="border-b border-surface-border text-gray-400">
                                <th className="pb-2">#</th>
                                <th className="pb-2">Exercise Name</th>
                                <th className="pb-2">Muscle &amp; Equipment</th>
                                <th className="pb-2">Sets × Reps</th>
                                <th className="pb-2">Target Weight</th>
                                <th className="pb-2">Rest</th>
                                <th className="pb-2">Instructions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                              {plan.exercises.map((ex, idx) => (
                                <tr key={ex.id} className="hover:bg-white/[0.02]">
                                  <td className="py-2.5 font-mono text-gray-400">{idx + 1}</td>
                                  <td className="py-2.5 font-bold text-white">{ex.name}</td>
                                  <td className="py-2.5 text-gray-300">{ex.muscle} • {ex.equipment}</td>
                                  <td className="py-2.5 font-mono text-white font-semibold">{ex.sets} × {ex.reps}</td>
                                  <td className="py-2.5 font-mono text-fitness-primary font-bold">{ex.targetWeight}</td>
                                  <td className="py-2.5 font-mono text-healthcare-accent">{ex.restSeconds}s</td>
                                  <td className="py-2.5 text-gray-400 text-[11px] max-w-xs truncate">{ex.instructions || 'Standard form execution'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: 7-DAY STANDARD SPLITS                             */}
      {/* ======================================================== */}
      {activeTab === 'splits' && (
        <div className="space-y-6">
          {/* Day Selector */}
          <div className="p-4 rounded-3xl bg-surface-1 border border-surface-border space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-fitness-primary" /> Select Day Routine Split:
              </span>
              <span className="text-fitness-primary font-mono">{activeRoutine.title}</span>
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

          {/* Routine Header */}
          <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-2 text-fitness-primary uppercase font-mono">
                    {selectedDay} Split
                  </span>
                  <span className="text-xs text-gray-400">Duration: {activeRoutine.duration}</span>
                </div>
                <h2 className="font-headline font-black text-xl sm:text-2xl text-white mt-1">
                  {activeRoutine.title}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Target Focus: <strong className="text-white">{activeRoutine.focus}</strong> • Difficulty: <strong className="text-white">{activeRoutine.difficulty}</strong>
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
              {activeRoutine.exercises.map((exercise, index) => (
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
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: EXERCISE DATABASE MANAGEMENT (5.5)              */}
      {/* ======================================================== */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-headline font-bold text-white text-lg">Official Exercise Database</h3>
                <p className="text-xs text-gray-400">Filter gym exercises, biomechanical movement cues, and spotter techniques</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  placeholder="Search exercises by name..."
                  className="bg-surface-2 border border-surface-border rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-fitness-primary w-full sm:w-64"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-border">
              <span className="text-[11px] font-semibold text-gray-400">Muscle Group:</span>
              {['all', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'].map((m) => (
                <button
                  key={m}
                  onClick={() => setLibraryMuscle(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    libraryMuscle === m
                      ? 'bg-fitness-primary text-gray-950 font-bold'
                      : 'bg-surface-2 text-gray-300 hover:text-white'
                  }`}
                >
                  {m === 'all' ? 'All Muscles' : m}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-gray-400">Equipment:</span>
              {['all', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'].map((eq) => (
                <button
                  key={eq}
                  onClick={() => setLibraryEquipment(eq)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    libraryEquipment === eq
                      ? 'bg-healthcare-accent text-white font-bold'
                      : 'bg-surface-2 text-gray-300 hover:text-white'
                  }`}
                >
                  {eq === 'all' ? 'All Equipment' : eq}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLibraryExercises.map((ex) => (
              <div
                key={ex.name}
                className="p-5 rounded-3xl bg-surface-1 border border-surface-border hover:border-fitness-primary/50 transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden relative border border-white/10 flex-shrink-0">
                      <Image src={ex.thumbnail} alt={ex.name} fill className="object-cover" />
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-white text-sm">{ex.name}</h4>
                      <div className="text-[11px] text-gray-400">{ex.muscle} • {ex.equipment}</div>
                      <div className="text-[10px] text-fitness-primary font-mono mt-0.5">
                        Prescription: {ex.targetSets} sets × {ex.targetReps} reps
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2">
                    {ex.instructions?.[0] || 'Execute with controlled form and full range of motion.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-surface-border flex gap-2">
                  <button
                    onClick={() => setSelectedExerciseModal(ex)}
                    className="w-full py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-white text-xs font-semibold border border-surface-border transition flex items-center justify-center gap-1"
                  >
                    <Info className="w-3.5 h-3.5 text-fitness-primary" />
                    <span>View Demonstration &amp; Spotter Cues</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT WORKOUT PLAN (SECTION 5.3)           */}
      {/* ======================================================== */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-2 border border-surface-border w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-1">
              <div>
                <h3 className="font-headline font-bold text-white text-base">
                  {editingPlanId ? 'Edit Workout Plan' : 'Create New Workout Plan (Section 5.3)'}
                </h3>
                <p className="text-xs text-gray-400">Prescribe human-coach compound movements and load targets</p>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              <form id="planForm" onSubmit={handleSavePlan} className="space-y-4">
                
                {/* 1. Plan Name & Description */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold">Plan Name *</label>
                    <input
                      type="text"
                      required
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      placeholder="e.g. 4-Week Hypertrophy Strength Cycle"
                      className="w-full bg-surface-1 border border-surface-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-fitness-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold">Plan Description</label>
                    <textarea
                      rows={2}
                      value={planDescription}
                      onChange={(e) => setPlanDescription(e.target.value)}
                      placeholder="Outline the training goal, frequency, and conditioning objectives..."
                      className="w-full bg-surface-1 border border-surface-border rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-fitness-primary"
                    />
                  </div>
                </div>

                {/* 2. Assign to Member & Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold">Assign to Member *</label>
                    <select
                      value={assignedMemberId}
                      onChange={(e) => setAssignedMemberId(e.target.value)}
                      className="w-full bg-surface-1 border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fitness-primary"
                    >
                      {INITIAL_TRAINER_CLIENTS.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.goal})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold">Start Date</label>
                    <input
                      type="date"
                      value={planStartDate}
                      onChange={(e) => setPlanStartDate(e.target.value)}
                      className="w-full bg-surface-1 border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fitness-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold">End Date</label>
                    <input
                      type="date"
                      value={planEndDate}
                      onChange={(e) => setPlanEndDate(e.target.value)}
                      className="w-full bg-surface-1 border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fitness-primary"
                    />
                  </div>
                </div>

                {/* 3. Workout Days Selector */}
                <div className="space-y-1.5">
                  <label className="text-gray-300 font-semibold">Workout Days</label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEK_DAYS.map(day => {
                      const isSelected = selectedWorkoutDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDaySelection(day)}
                          className={`py-2 rounded-xl text-center border font-bold transition text-[11px] ${
                            isSelected
                              ? 'bg-fitness-primary text-gray-950 border-fitness-primary shadow-glow-fitness'
                              : 'bg-surface-1 border-surface-border text-gray-400 hover:text-white'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Coach Notes */}
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Coach Notes &amp; Spotter Guidance</label>
                  <textarea
                    rows={2}
                    value={planTrainerNotes}
                    onChange={(e) => setPlanTrainerNotes(e.target.value)}
                    placeholder="Specific cues for the member: e.g. RPE guidelines, warm-up routine..."
                    className="w-full bg-surface-1 border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fitness-primary"
                  />
                </div>
              </form>

              {/* 5. Exercises Builder Section */}
              <div className="space-y-3 pt-3 border-t border-surface-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-fitness-primary" /> Plan Exercises ({planExercises.length})
                  </label>
                </div>

                {/* Added exercises table */}
                {planExercises.length > 0 && (
                  <div className="space-y-2">
                    {planExercises.map((ex, idx) => (
                      <div
                        key={ex.id}
                        className="p-3 rounded-2xl bg-surface-1 border border-surface-border flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{idx + 1}. {ex.name}</span>
                            <span className="text-[10px] text-gray-400">({ex.muscle} • {ex.equipment})</span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                            <span className="text-white font-bold">{ex.sets} sets</span> × {ex.reps} reps @ <span className="text-fitness-primary font-bold">{ex.targetWeight}</span> (Rest: {ex.restSeconds}s)
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExerciseFromPlan(ex.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Remove exercise"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Exercise Mini-Form */}
                <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border space-y-3">
                  <div className="text-[11px] font-bold text-fitness-primary uppercase tracking-wider">
                    + Add Exercise to Plan
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Exercise Name</label>
                      <input
                        type="text"
                        value={draftExName}
                        onChange={(e) => setDraftExName(e.target.value)}
                        placeholder="e.g. Romanian Deadlift"
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Muscle Group</label>
                      <select
                        value={draftExMuscle}
                        onChange={(e) => setDraftExMuscle(e.target.value)}
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="Chest">Chest</option>
                        <option value="Back">Back</option>
                        <option value="Legs">Legs</option>
                        <option value="Shoulders">Shoulders</option>
                        <option value="Arms">Arms</option>
                        <option value="Core">Core</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Equipment</label>
                      <select
                        value={draftExEquipment}
                        onChange={(e) => setDraftExEquipment(e.target.value)}
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="Barbell">Barbell</option>
                        <option value="Dumbbell">Dumbbell</option>
                        <option value="Cable">Cable</option>
                        <option value="Machine">Machine</option>
                        <option value="Bodyweight">Bodyweight</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Sets</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={draftExSets}
                        onChange={(e) => setDraftExSets(parseInt(e.target.value) || 3)}
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Target Reps</label>
                      <input
                        type="text"
                        value={draftExReps}
                        onChange={(e) => setDraftExReps(e.target.value)}
                        placeholder="8-10"
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Target Weight</label>
                      <input
                        type="text"
                        value={draftExWeight}
                        onChange={(e) => setDraftExWeight(e.target.value)}
                        placeholder="70.0 kg"
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Rest (sec)</label>
                      <input
                        type="number"
                        min="15"
                        max="300"
                        value={draftExRest}
                        onChange={(e) => setDraftExRest(parseInt(e.target.value) || 90)}
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddExerciseToPlan}
                    className="w-full py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-white border border-surface-border font-bold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-fitness-primary" />
                    <span>Append Exercise to Routine</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-surface-border bg-surface-1 flex gap-3">
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-gray-300 font-semibold text-xs border border-surface-border transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="planForm"
                className="flex-1 py-2.5 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition"
              >
                {editingPlanId ? 'Save Plan Updates' : 'Save & Assign Plan'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        exercise={selectedExerciseModal}
        onClose={() => setSelectedExerciseModal(null)}
      />

    </div>
  );
}
