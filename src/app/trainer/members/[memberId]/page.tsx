'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Users, 
  Dumbbell, 
  Calendar, 
  Clock, 
  Activity, 
  Utensils, 
  Flame, 
  ShieldCheck, 
  ShieldAlert, 
  MessageSquareText, 
  Video, 
  ClipboardList, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  ChevronRight,
  Phone
} from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from '@/components/Toast';
import { TrainerService } from '@/lib/supabase/trainer-service';
import { DetailedMemberProfile, WeekDay } from '@/types';
import { WEEK_DAYS, getWorkoutForDay } from '@/lib/initial-data';

export default function TrainerMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const memberId = params?.memberId as string;

  const [member, setMember] = useState<DetailedMemberProfile | null>(null);
  const [selectedSplitDay, setSelectedSplitDay] = useState<WeekDay>('Monday');
  const [isPushing, setIsPushing] = useState(false);
  const [coachNote, setCoachNote] = useState('');
  const [activeTab, setActiveTab] = useState<'progress' | 'nutrition' | 'attendance' | 'workout_split'>('progress');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMember() {
      if (!memberId) return;
      setIsLoading(true);
      try {
        const data = await TrainerService.getMemberById(memberId);
        setMember(data);
      } catch (e) {
        console.error('Failed to load member profile:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMember();
  }, [memberId]);

  const handlePushSplit = async () => {
    if (!member) return;
    haptics.playSuccess();
    setIsPushing(true);
    const routine = getWorkoutForDay(selectedSplitDay);
    await TrainerService.pushWorkoutSplitToMember(member.id, selectedSplitDay, routine.title);
    
    setMember({
      ...member,
      activeRoutineTitle: routine.title
    });
    setIsPushing(false);
    showToast(`Assigned ${selectedSplitDay}'s split (${routine.title}) to ${member.name}! 🏋️`, '✅');
  };

  const handleSendCoachCue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachNote.trim() || !member) return;
    haptics.playSuccess();
    await TrainerService.sendMessage('trainer', 'Coach Raj Patel', `[Coach Note for ${member.name}]: ${coachNote.trim()}`, 'form_check');
    setCoachNote('');
    showToast(`Direct coaching cue sent to ${member.name}!`, '💬');
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-xs text-gray-400 animate-pulse">
        Loading athlete profile &amp; telemetry...
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-12 text-center rounded-3xl bg-surface-1 border border-surface-border space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-white font-bold text-lg">Athlete Record Not Found</h2>
        <p className="text-xs text-gray-400">The requested member ID is not assigned to your coaching roster in this gym.</p>
        <Link 
          href="/trainer/members" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 text-xs text-white hover:bg-surface-3 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Member Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/trainer/members"
          onClick={() => haptics.playTap()}
          className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assigned Athletes</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/trainer/messages"
            onClick={() => haptics.playTap()}
            className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs text-white font-bold border border-surface-border transition flex items-center gap-1.5"
          >
            <MessageSquareText className="w-3.5 h-3.5 text-fitness-primary" />
            <span>Message {member.name.split(' ')[0]}</span>
          </Link>

          <Link
            href="/trainer/sessions"
            onClick={() => haptics.playTap()}
            className="px-3 py-1.5 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 text-xs font-bold shadow-glow-fitness transition flex items-center gap-1.5"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Book Session</span>
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. MEMBER PERSONAL INFO & IDENTITY CARD                   */}
      {/* ======================================================== */}
      <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-fitness-primary shadow-glow-fitness flex-shrink-0">
              <Image src={member.avatar} alt={member.name} fill className="object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-headline font-black text-2xl text-white">
                  {member.name}
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  member.statusLevel === 'On Track'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : member.statusLevel === 'Needs Attention'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {member.statusLevel}
                </span>
              </div>
              <div className="text-xs text-gray-400 flex flex-wrap items-center gap-2">
                <span>{member.email}</span>
                <span>•</span>
                <span>{member.phone}</span>
                <span>•</span>
                <span className="text-healthcare-accent font-semibold">{member.membershipTier}</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                Member Since: <strong className="text-white">{member.joinDate}</strong> • Assigned Coach: <strong className="text-fitness-primary">Coach Raj Patel</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-surface-2 border border-surface-border text-center">
              <div className="text-[10px] text-gray-400">Current Weight</div>
              <div className="font-black text-base text-white mt-0.5">{member.currentWeight}</div>
            </div>
            <div className="p-3 rounded-2xl bg-surface-2 border border-surface-border text-center">
              <div className="text-[10px] text-gray-400">Height / Age</div>
              <div className="font-black text-base text-white mt-0.5">{member.heightCm}cm / {member.age}y</div>
            </div>
            <div className="p-3 rounded-2xl bg-surface-2 border border-surface-border text-center">
              <div className="text-[10px] text-gray-400">Attendance Rate</div>
              <div className="font-black text-base text-emerald-400 mt-0.5">{member.attendance.monthlyRate}</div>
            </div>
            <div className="p-3 rounded-2xl bg-surface-2 border border-surface-border text-center">
              <div className="text-[10px] text-gray-400">Streak</div>
              <div className="font-black text-base text-purple-300 mt-0.5">{member.attendance.streakDays} Days</div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SUBTABS: PROGRESS, NUTRITION, ATTENDANCE, SPLIT PUSHER */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-3 overflow-x-auto">
        {[
          { id: 'progress', label: 'Fitness & Workout Progress', icon: Activity },
          { id: 'nutrition', label: 'Nutrition Overview', icon: Utensils },
          { id: 'attendance', label: 'Attendance Records', icon: Calendar },
          { id: 'workout_split', label: 'Assign Workout Split', icon: ClipboardList },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                haptics.playTap();
                setActiveTab(tab.id as any);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                isActive 
                  ? 'bg-fitness-primary text-gray-950 font-black shadow-glow-fitness' 
                  : 'bg-surface-2 text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB CONTENT 1: FITNESS & WORKOUT PROGRESS                */}
      {/* ======================================================== */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Weight History Timeline */}
            <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline font-bold text-white text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-fitness-primary" /> Biometric Weight Trend (Last 30 Days)
                  </h3>
                  <p className="text-xs text-gray-400">Regular turnstile scale syncs</p>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {member.weightHistory.length} Check-ins
                </span>
              </div>

              <div className="space-y-2">
                {member.weightHistory.map((wh, idx) => {
                  const prev = idx > 0 ? member.weightHistory[idx - 1].weightKg : wh.weightKg;
                  const diff = wh.weightKg - prev;
                  return (
                    <div key={wh.date} className="p-3 rounded-2xl bg-surface-2 border border-surface-border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 font-mono text-[11px]">{wh.date}</span>
                        <span className="font-bold text-white font-mono">{wh.weightKg} kg</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        {diff > 0 ? (
                          <span className="text-amber-400 font-bold">+{diff.toFixed(1)} kg</span>
                        ) : diff < 0 ? (
                          <span className="text-emerald-400 font-bold">{diff.toFixed(1)} kg</span>
                        ) : (
                          <span className="text-gray-400">Baseline</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workout Performance & Volume History */}
            <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
              <div>
                <h3 className="font-headline font-bold text-white text-base flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-healthcare-accent" /> Workout Log &amp; Performance
                </h3>
                <p className="text-xs text-gray-400">Recent completed sessions with volume &amp; RPE exertion</p>
              </div>

              <div className="space-y-2.5">
                {member.workoutHistory.map((wh) => (
                  <div key={wh.id} className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{wh.routineTitle}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        wh.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {wh.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-gray-400 text-[11px]">
                      <span>{wh.date} • {wh.durationMins} mins</span>
                      {wh.volumeKg > 0 && (
                        <span className="font-mono text-fitness-primary font-bold">
                          {wh.volumeKg.toLocaleString()} kg moved
                        </span>
                      )}
                    </div>

                    {wh.rpeAvg && (
                      <div className="text-[10px] text-gray-400 mt-1 flex items-center justify-between">
                        <span>Average Perceived Exertion:</span>
                        <span className="font-mono font-bold text-amber-300">RPE {wh.rpeAvg} / 10</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Quick Coach Cue Sender */}
          <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-3">
            <h3 className="font-headline font-bold text-white text-base flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-fitness-primary" /> Send Technique Feedback / Coach Note
            </h3>
            <p className="text-xs text-gray-400">This note will appear immediately in {member.name}&apos;s notification drawer and chat thread.</p>
            <form onSubmit={handleSendCoachCue} className="flex gap-2">
              <input
                type="text"
                value={coachNote}
                onChange={(e) => setCoachNote(e.target.value)}
                placeholder={`e.g. Great progress on the squat depth! Remember to keep your thoracic spine braced.`}
                className="flex-1 bg-surface-2 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-fitness-primary"
              />
              <button
                type="submit"
                disabled={!coachNote.trim()}
                className="px-5 py-2.5 bg-fitness-primary hover:bg-fitness-light disabled:opacity-50 text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness transition"
              >
                Send Cue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT 2: NUTRITION OVERVIEW                        */}
      {/* ======================================================== */}
      {activeTab === 'nutrition' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-headline font-bold text-white text-lg flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-fitness-primary" /> Nutrition Target vs. Actual Intake
                </h3>
                <p className="text-xs text-gray-400">Daily average macro consumption logged by athlete</p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">Last Meal Logged:</span>
                <span className="font-bold text-white font-mono">{member.nutritionOverview.lastLoggedDate}</span>
              </div>
            </div>

            {/* Macro Comparison Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border text-center">
                <div className="text-xs text-gray-400">Calories</div>
                <div className="font-black text-xl text-white mt-1">
                  {member.nutritionOverview.avgCalories} <span className="text-xs font-normal text-gray-400">/ {member.nutritionOverview.targetCalories}</span>
                </div>
                <div className="text-[10px] text-emerald-400 mt-1 font-semibold">
                  {Math.round((member.nutritionOverview.avgCalories / member.nutritionOverview.targetCalories) * 100)}% of goal
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border text-center">
                <div className="text-xs text-gray-400">Protein</div>
                <div className="font-black text-xl text-fitness-primary mt-1">
                  {member.nutritionOverview.avgProteinG}g <span className="text-xs font-normal text-gray-400">/ {member.nutritionOverview.targetProteinG}g</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1">Target: Muscle Synthesis</div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border text-center">
                <div className="text-xs text-gray-400">Carbohydrates</div>
                <div className="font-black text-xl text-healthcare-accent mt-1">
                  {member.nutritionOverview.avgCarbsG}g <span className="text-xs font-normal text-gray-400">/ {member.nutritionOverview.targetCarbsG}g</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1">Target: Glycogen Fuel</div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border text-center">
                <div className="text-xs text-gray-400">Healthy Fats</div>
                <div className="font-black text-xl text-amber-300 mt-1">
                  {member.nutritionOverview.avgFatG}g <span className="text-xs font-normal text-gray-400">/ {member.nutritionOverview.targetFatG}g</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1">Target: Hormonal Balance</div>
              </div>
            </div>

            {/* Recent Logged Meals */}
            <div>
              <h4 className="font-headline font-bold text-white text-sm mb-3">Recent Logged Meals</h4>
              {member.nutritionOverview.recentMeals.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-surface-2/60 text-xs text-gray-400 border border-dashed border-surface-border">
                  No meals logged recently by this athlete. Consider sending a nutrition tracking reminder.
                </div>
              ) : (
                <div className="space-y-2">
                  {member.nutritionOverview.recentMeals.map((m, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{m.title}</div>
                        <div className="text-[11px] text-gray-400">{m.type} • {m.time}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-white">{m.calories} kcal</div>
                        <div className="text-fitness-primary text-[10px]">{m.protein}g protein</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT 3: ATTENDANCE RECORDS                        */}
      {/* ======================================================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline font-bold text-white text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" /> Attendance Records &amp; Consistency
                </h3>
                <p className="text-xs text-gray-400">Turnstile check-in logs for FitZone Vadodara</p>
              </div>

              <div className="text-right text-xs">
                <span className="text-gray-400">Total Visits:</span>
                <span className="font-bold text-white font-mono ml-1.5">{member.attendance.totalVisits}</span>
              </div>
            </div>

            <div className="space-y-2">
              {member.attendance.recentLogs.map((log, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-surface-2 border border-surface-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-white">{log.gymName}</div>
                      <div className="text-[11px] text-gray-400">QR Turnstile Scanner #2</div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <div className="text-white font-bold">{log.date}</div>
                    <div className="text-gray-400">{log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT 4: ASSIGN WORKOUT SPLIT (NO AI)             */}
      {/* ======================================================== */}
      {activeTab === 'workout_split' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
            <div>
              <h3 className="font-headline font-bold text-white text-base flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-healthcare-accent" /> Assign Gym Workout Split (Human Coach Programming)
              </h3>
              <p className="text-xs text-gray-400">
                Select which structured workout routine split to push directly to {member.name}&apos;s athlete dashboard.
              </p>
            </div>

            {/* Current Active Routine Pill */}
            <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border flex items-center justify-between text-xs">
              <span className="text-gray-400">Currently Active Routine:</span>
              <span className="font-bold text-fitness-primary font-mono">{member.activeRoutineTitle}</span>
            </div>

            {/* Split Day Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {WEEK_DAYS.map((day) => {
                const isSelected = selectedSplitDay === day;
                const routine = getWorkoutForDay(day);
                return (
                  <button
                    key={day}
                    onClick={() => {
                      haptics.playTap();
                      setSelectedSplitDay(day);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'bg-fitness-primary text-gray-950 font-bold border-fitness-primary shadow-glow-fitness'
                        : 'bg-surface-2 border-surface-border text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase">{day}</div>
                    <div className="text-xs truncate font-semibold mt-0.5">{routine.title}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{routine.focus}</div>
                  </button>
                );
              })}
            </div>

            {/* Routine Exercises Preview */}
            {(() => {
              const preview = getWorkoutForDay(selectedSplitDay);
              return (
                <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Exercises in {preview.title}:</span>
                    <span className="text-gray-400 font-mono">{preview.exercises.length} Exercises • {preview.duration}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {preview.exercises.map((ex, idx) => (
                      <div key={ex.id} className="p-2.5 rounded-xl bg-surface-1 border border-surface-border flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-fitness-primary/20 text-fitness-primary font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{ex.name}</div>
                          <div className="text-[10px] text-gray-400">{ex.targetSets} sets × {ex.targetReps} reps</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Confirm Push Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handlePushSplit}
                disabled={isPushing}
                className="px-6 py-3 rounded-2xl bg-fitness-primary hover:bg-fitness-light disabled:opacity-50 text-gray-950 font-black text-xs shadow-glow-fitness transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm &amp; Push Routine to {member.name}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

