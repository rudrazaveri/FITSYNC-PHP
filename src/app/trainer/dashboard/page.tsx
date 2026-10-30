'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, 
  Dumbbell, 
  Sparkles, 
  Clock, 
  Calendar, 
  Activity, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Utensils, 
  Video, 
  ChevronRight,
  ShieldAlert,
  Flame,
  Award
} from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from '@/components/Toast';
import { TrainerService } from '@/lib/supabase/trainer-service';
import { 
  DetailedMemberProfile, 
  TrainerInterventionInsight, 
  TrainerSessionItem, 
  Trainer 
} from '@/types';

export default function TrainerDashboardPage() {
  const { showToast } = useToast();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [metrics, setMetrics] = useState({
    assignedMembers: 24,
    activeMembers: 18,
    membersNeedingAttention: 3,
    todaySessions: 3,
    weeklyAttendance: '88.4%'
  });
  const [members, setMembers] = useState<DetailedMemberProfile[]>([]);
  const [interventions, setInterventions] = useState<TrainerInterventionInsight[]>([]);
  const [sessions, setSessions] = useState<TrainerSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [tr, met, mems, ints, sess] = await Promise.all([
          TrainerService.getTrainerProfile(),
          TrainerService.getDashboardMetrics(),
          TrainerService.getAssignedMembers(),
          TrainerService.getInterventions('open'),
          TrainerService.getSessions()
        ]);
        setTrainer(tr);
        setMetrics(met);
        setMembers(mems);
        setInterventions(ints);
        setSessions(sess);
      } catch (err) {
        console.error('Failed to load trainer dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* ======================================================== */}
      {/* 1. GREETING & HERO HEADER                                */}
      {/* ======================================================== */}
      <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-fitness-primary shadow-glow-fitness flex-shrink-0">
              <Image 
                src={trainer?.avatar || '/assets/trainer_raj.jpg'} 
                alt={trainer?.name || 'Coach Raj'} 
                fill 
                className="object-cover" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fitness-primary/20 text-fitness-primary border border-fitness-primary/30 uppercase tracking-wider">
                  Gym Trainer Portal
                </span>
                <span className="text-xs text-gray-400">FitZone Vadodara</span>
              </div>
              <h1 className="font-headline font-extrabold text-2xl sm:text-3xl text-white">
                {getGreeting()}, {trainer?.name || 'Coach Raj Patel'}
              </h1>
              <p className="text-xs text-gray-400 mt-1 max-w-xl">
                Ready for today&apos;s strength floor duty. 18 athletes checked-in at turnstile, 3 upcoming floor &amp; video sessions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/trainer/members"
              onClick={() => haptics.playTap()}
              className="px-4 py-2 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>Manage Roster</span>
            </Link>
            <Link
              href="/trainer/sessions"
              onClick={() => haptics.playTap()}
              className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-white font-bold text-xs border border-surface-border transition flex items-center gap-1.5"
            >
              <Video className="w-4 h-4 text-healthcare-accent" />
              <span>Floor Sessions</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. FIVE CORE METRICS TELEMETRY                           */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* Metric 1: Assigned Members */}
        <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Assigned Members</span>
            <Users className="w-4 h-4 text-fitness-primary" />
          </div>
          <div className="font-headline font-black text-2xl sm:text-3xl text-white mt-1">
            {metrics.assignedMembers}
          </div>
          <div className="text-[11px] text-fitness-primary font-medium mt-1">
            FitZone Member Roster
          </div>
        </div>

        {/* Metric 2: Active Members */}
        <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Active Members</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-headline font-black text-2xl sm:text-3xl text-emerald-400 mt-1">
            {metrics.activeMembers}
          </div>
          <div className="text-[11px] text-gray-400 font-medium mt-1">
            On floor &amp; active this week
          </div>
        </div>

        {/* Metric 3: Members Needing Attention */}
        <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Needing Attention</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-headline font-black text-2xl sm:text-3xl text-amber-300 mt-1">
            {metrics.membersNeedingAttention}
          </div>
          <div className="text-[11px] text-amber-400 font-medium mt-1">
            Missed lifts or nutrition gaps
          </div>
        </div>

        {/* Metric 4: Today's Sessions */}
        <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Today&apos;s Sessions</span>
            <Clock className="w-4 h-4 text-healthcare-accent" />
          </div>
          <div className="font-headline font-black text-2xl sm:text-3xl text-healthcare-accent mt-1">
            {metrics.todaySessions}
          </div>
          <div className="text-[11px] text-gray-400 font-medium mt-1">
            1-on-1 floor consultations
          </div>
        </div>

        {/* Metric 5: Weekly Attendance */}
        <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Weekly Attendance</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-headline font-black text-2xl sm:text-3xl text-purple-300 mt-1">
            {metrics.weeklyAttendance}
          </div>
          <div className="text-[11px] text-purple-400 font-medium mt-1">
            Gym turnstile consistency
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 3. TODAY'S OVERVIEW & MEMBERS NEEDING ATTENTION          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Today's Scheduled Sessions & Members Overview */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Scheduled Sessions */}
          <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline font-bold text-white text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-healthcare-accent" /> Today&apos;s Overview &amp; Sessions
                </h3>
                <p className="text-xs text-gray-400">Floor technique reviews, spotter consultations, and video syncs</p>
              </div>
              <Link 
                href="/trainer/sessions" 
                className="text-xs text-fitness-primary hover:underline font-bold flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {sessions.map((sess) => (
                <div 
                  key={sess.id}
                  className="p-4 rounded-2xl bg-surface-2 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-500 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-fitness-primary/30 flex-shrink-0">
                      <Image src={sess.memberAvatar} alt={sess.memberName} fill className="object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{sess.memberName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          sess.sessionType === 'online_video' 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {sess.sessionType === 'online_video' ? 'Online Video' : 'Gym Floor 1-on-1'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300 font-semibold mt-0.5">
                        {sess.focusArea}
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                        <span className="text-healthcare-accent font-mono font-bold">{sess.timeSlot}</span>
                        <span>•</span>
                        <span>{sess.durationMinutes} mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Link
                      href={`/trainer/members/${sess.memberId}`}
                      onClick={() => haptics.playTap()}
                      className="px-3 py-1.5 rounded-xl bg-surface-3 hover:bg-surface-border text-gray-200 text-xs font-semibold transition"
                    >
                      Member Profile
                    </Link>
                    {sess.sessionType === 'online_video' ? (
                      <Link
                        href="/trainer/sessions"
                        onClick={() => haptics.playTap()}
                        className="px-3.5 py-1.5 rounded-xl bg-healthcare-primary hover:bg-healthcare-accent text-white font-bold text-xs shadow-glow-healthcare transition flex items-center gap-1"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Room</span>
                      </Link>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-fitness-primary/20 text-fitness-primary font-bold text-xs">
                        Floor Reserved
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Members Quick Glance */}
          <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline font-bold text-white text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-fitness-primary" /> Assigned Members Quick Glance
                </h3>
                <p className="text-xs text-gray-400">Click any athlete to view their biometrics, workouts, and nutrition</p>
              </div>
              <Link 
                href="/trainer/members" 
                className="text-xs text-fitness-primary hover:underline font-bold flex items-center gap-1"
              >
                <span>Full Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map((mem) => (
                <Link
                  key={mem.id}
                  href={`/trainer/members/${mem.id}`}
                  onClick={() => haptics.playTap()}
                  className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border hover:border-fitness-primary/60 transition group flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-surface-border flex-shrink-0">
                      <Image src={mem.avatar} alt={mem.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate group-hover:text-fitness-primary transition">
                        {mem.name} ({mem.age}y)
                      </div>
                      <div className="text-[11px] text-gray-400 truncate mt-0.5">
                        {mem.goal}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                        {mem.attendance.monthlyRate} consistency
                      </div>
                    </div>
                  </div>

                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase flex-shrink-0 ${
                    mem.statusLevel === 'On Track'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : mem.statusLevel === 'Needs Attention'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {mem.statusLevel}
                  </span>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Members Needing Attention & Recent Activity */}
        <div className="space-y-6">
          
          {/* Members Needing Attention */}
          <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline font-bold text-white text-base flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" /> Members Needing Attention
                </h3>
                <p className="text-xs text-gray-400">Rule-based alerts &amp; intervention cues</p>
              </div>
              <Link 
                href="/trainer/insights" 
                className="text-xs text-amber-400 hover:underline font-bold"
              >
                All Alerts ({interventions.length})
              </Link>
            </div>

            <div className="space-y-3">
              {interventions.map((item) => (
                <div 
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{item.memberName}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      item.sourceType === 'ai_insight' 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {item.sourceType === 'ai_insight' ? 'AI Insight' : 'Rule Alert'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    {item.title}
                  </p>

                  <div className="text-[10px] text-gray-400 italic">
                    {item.reason}
                  </div>

                  <div className="pt-1 flex items-center justify-between border-t border-surface-border/60">
                    <span className="text-[10px] text-gray-500 font-mono">{item.dateDetected}</span>
                    <Link
                      href={`/trainer/members/${item.memberId}`}
                      onClick={() => haptics.playTap()}
                      className="text-[11px] text-fitness-primary font-bold hover:underline flex items-center gap-1"
                    >
                      <span>View Member</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Member Activity */}
          <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
            <h3 className="font-headline font-bold text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-fitness-primary" /> Recent Gym Activity
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-surface-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-white">Aarav Shah completed Chest Hypertrophy</div>
                  <div className="text-gray-400 text-[11px] mt-0.5">4 sets bench press logged • 3,450 kg moved</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-1">45 mins ago</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-surface-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-white">Priya Nair checked in at turnstile</div>
                  <div className="text-gray-400 text-[11px] mt-0.5">FitZone Alkapuri Main Entry QR Scanner</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-1">2 hours ago</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-surface-2">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-white">Dev Patel booked technique consultation</div>
                  <div className="text-gray-400 text-[11px] mt-0.5">Online Video Session: Tomorrow at 06:30 PM</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-1">Today 09:30 AM</div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

