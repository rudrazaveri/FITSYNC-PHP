'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, 
  Search, 
  Filter, 
  ArrowRight, 
  Dumbbell, 
  Calendar, 
  Activity, 
  ShieldAlert, 
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';
import { TrainerService } from '@/lib/supabase/trainer-service';
import { DetailedMemberProfile } from '@/types';

export default function TrainerMembersPage() {
  const [members, setMembers] = useState<DetailedMemberProfile[]>([]);
  const [search, setSearch] = useState('');
  const [goalFilter, setGoalFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      setIsLoading(true);
      try {
        const data = await TrainerService.getAssignedMembers({
          search: search.trim(),
          goal: goalFilter,
          statusLevel: statusFilter
        });
        setMembers(data);
      } catch (e) {
        console.error('Failed to load members:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadMembers();
  }, [search, goalFilter, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fitness-primary/20 text-fitness-primary border border-fitness-primary/30 uppercase tracking-wider">
              Member Directory
            </span>
            <span className="text-xs text-gray-400">FitZone Vadodara Branch</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-white">
            Assigned Athletes Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Search, filter, and monitor all gym members assigned to your coaching roster.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-xl bg-surface-2 border border-surface-border text-xs font-mono text-fitness-primary font-bold">
            {members.length} Athletes Loaded
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-3xl bg-surface-1 border border-surface-border space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search athlete by name or email..."
              className="w-full bg-surface-2 border border-surface-border rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-fitness-primary"
            />
          </div>

          {/* Fitness Goal Filter */}
          <div className="flex items-center gap-2 bg-surface-2 border border-surface-border rounded-xl px-3 py-1">
            <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-[11px] text-gray-400">Goal:</span>
            <select
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value)}
              className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-surface-2 text-white">All Fitness Goals</option>
              <option value="muscle" className="bg-surface-2 text-white">Muscle Gain (Hypertrophy)</option>
              <option value="lose" className="bg-surface-2 text-white">Fat Loss</option>
              <option value="strength" className="bg-surface-2 text-white">Increase Strength</option>
              <option value="fitness" className="bg-surface-2 text-white">General Fitness</option>
            </select>
          </div>

          {/* Attention Status Filter */}
          <div className="flex items-center gap-2 bg-surface-2 border border-surface-border rounded-xl px-3 py-1">
            <ShieldAlert className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-[11px] text-gray-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-surface-2 text-white">All Attention Levels</option>
              <option value="On Track" className="bg-surface-2 text-white">On Track</option>
              <option value="Needs Attention" className="bg-surface-2 text-white">Needs Attention</option>
              <option value="High Attention" className="bg-surface-2 text-white">High Attention</option>
            </select>
          </div>

        </div>
      </div>

      {/* Member Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-gray-400 animate-pulse">
          Loading assigned athletes from database...
        </div>
      ) : members.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface-1 border border-surface-border space-y-2">
          <Users className="w-8 h-8 text-gray-500 mx-auto" />
          <div className="text-white font-bold text-sm">No assigned members matched your filters</div>
          <p className="text-xs text-gray-400">Try clearing the search query or adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-5 rounded-3xl bg-surface-1 border border-surface-border hover:border-fitness-primary/50 transition space-y-4 flex flex-col justify-between"
            >
              <div>
                {/* Header: Photo, Name, Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-fitness-primary/40 shadow-glow-fitness flex-shrink-0">
                      <Image src={member.avatar} alt={member.name} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-base text-white">
                        {member.name}
                      </h3>
                      <div className="text-xs text-gray-400">
                        {member.age} yrs • {member.heightCm} cm • <strong className="text-white font-mono">{member.currentWeight}</strong>
                      </div>
                      <div className="text-[11px] text-healthcare-accent font-semibold mt-0.5">
                        {member.membershipTier}
                      </div>
                    </div>
                  </div>

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

                {/* Core Attributes Telemetry */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-2xl bg-surface-2 border border-surface-border text-center text-xs">
                  <div>
                    <div className="text-[10px] text-gray-400">Fitness Goal</div>
                    <div className="font-bold text-white truncate mt-0.5">{member.goal.split(' ')[0]}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Attendance</div>
                    <div className="font-bold text-emerald-400 mt-0.5">{member.attendance.monthlyRate}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Streak</div>
                    <div className="font-bold text-purple-300 mt-0.5">{member.attendance.streakDays} Days</div>
                  </div>
                </div>

                {/* Current Active Routine */}
                <div className="mt-3 text-xs flex items-center justify-between text-gray-300">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Dumbbell className="w-3.5 h-3.5 text-fitness-primary" /> Active Routine:
                  </span>
                  <span className="font-semibold text-white">{member.activeRoutineTitle}</span>
                </div>

                {/* Last Workout & Nutrition Log */}
                <div className="mt-2 text-xs flex items-center justify-between text-gray-300">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Clock className="w-3.5 h-3.5 text-healthcare-accent" /> Last Active:
                  </span>
                  <span className="text-[11px] text-gray-300 font-mono">{member.lastActive}</span>
                </div>
              </div>

              {/* Action Link to Detailed Member View */}
              <div className="pt-3 border-t border-surface-border flex items-center justify-between">
                <span className={`text-[11px] font-semibold ${
                  member.status === 'Active on Floor' ? 'text-emerald-400' : 'text-gray-400'
                }`}>
                  • {member.status}
                </span>

                <Link
                  href={`/trainer/members/${member.id}`}
                  onClick={() => haptics.playTap()}
                  className="px-4 py-2 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition flex items-center gap-1.5"
                >
                  <span>Detailed View</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

