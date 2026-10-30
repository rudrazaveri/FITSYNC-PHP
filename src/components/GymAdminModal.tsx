'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Building2, 
  Users, 
  Dumbbell, 
  Calendar, 
  CheckCircle2, 
  X, 
  Plus, 
  Star, 
  Edit3, 
  ShieldCheck, 
  Save, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from '@/components/Toast';
import { INITIAL_GYMS, INITIAL_TRAINERS } from '@/lib/initial-data';
import { Gym, Trainer } from '@/types';

interface GymAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GymAdminModal: React.FC<GymAdminModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'trainers' | 'attendance' | 'memberships' | 'gym_profile'>('trainers');
  const [gym, setGym] = useState<Gym>(INITIAL_GYMS[0]);
  const [trainers, setTrainers] = useState<Trainer[]>(INITIAL_TRAINERS);
  
  // New Trainer Invite Form State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Strength & Conditioning Coach');
  const [inviteSpecialization, setInviteSpecialization] = useState('Powerlifting, Hypertrophy');

  if (!isOpen) return null;

  const handleInviteTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    haptics.playSuccess();
    const newTrainer: Trainer = {
      id: `tr_${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim().toLowerCase(),
      gymId: gym.id,
      gymName: gym.name,
      role: inviteRole,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
      experience: '4 Years',
      rating: 4.8,
      reviewsCount: 42,
      specializations: inviteSpecialization.split(',').map(s => s.trim()),
      certifications: ['ACE-CPT'],
      bio: `Dedicated strength coach assigned to ${gym.name} floor.`,
      assignedMembersCount: 0,
      availabilityStatus: 'Available Floor Duty',
      weeklySchedule: 'Mon - Fri: 8:00 AM – 4:00 PM'
    };

    setTrainers([newTrainer, ...trainers]);
    setIsInviteOpen(false);
    setInviteName('');
    setInviteEmail('');
    showToast(`Invitation sent to ${newTrainer.name}! Added to ${gym.name} roster. 🏋️`, '✅');
  };

  const handleSaveGymProfile = (e: React.FormEvent) => {
    e.preventDefault();
    haptics.playSuccess();
    showToast(`${gym.name} branch profile updated!`, '🏢');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-2 border border-surface-border w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-fitness-primary to-healthcare-accent flex items-center justify-center text-gray-950 font-black">
              <Building2 className="w-5 h-5 text-gray-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline font-black text-white text-base">
                  Gym Admin Portal — {gym.name}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-fitness-primary/20 text-fitness-primary font-bold">
                  Branch Admin
                </span>
              </div>
              <p className="text-xs text-gray-400">Manage trainers, member allocations, attendance records &amp; membership tiers</p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-surface-border bg-surface-1/50 overflow-x-auto">
          {[
            { id: 'trainers', label: 'Gym Trainers & Staff', icon: Dumbbell },
            { id: 'attendance', label: 'Turnstile Attendance', icon: Calendar },
            { id: 'memberships', label: 'Membership Plans', icon: Users },
            { id: 'gym_profile', label: 'Gym Branch Profile', icon: Building2 },
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
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

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* TAB 1: TRAINERS MANAGEMENT */}
          {activeTab === 'trainers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-headline font-bold text-white text-base">Assigned Gym Trainers</h4>
                  <p className="text-gray-400">All registered coaches associated with {gym.name} ({gym.location})</p>
                </div>
                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Invite New Trainer</span>
                </button>
              </div>

              {/* Trainer Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trainers.map((tr) => (
                  <div key={tr.id} className="p-4 rounded-2xl bg-surface-1 border border-surface-border space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-fitness-primary/30 flex-shrink-0">
                          <Image src={tr.avatar} alt={tr.name} fill className="object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{tr.name}</div>
                          <div className="text-[11px] text-fitness-primary">{tr.role}</div>
                          <div className="text-[10px] text-gray-400">{tr.experience} • ⭐ {tr.rating}</div>
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                        Active
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-surface-2 border border-surface-border flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Assigned Members:</span>
                      <span className="font-mono font-bold text-white">{tr.assignedMembersCount} Athletes</span>
                    </div>

                    <div className="text-[11px] text-gray-400">
                      Schedule: <span className="text-gray-200">{tr.weeklySchedule}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Invite Trainer Modal Overlay */}
              {isInviteOpen && (
                <div className="p-4 rounded-2xl bg-surface-1 border border-fitness-primary/60 shadow-glow-fitness space-y-3">
                  <div className="font-bold text-white text-sm">Send Coach Invitation</div>
                  <form onSubmit={handleInviteTrainer} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-gray-400 block mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={inviteName}
                          onChange={(e) => setInviteName(e.target.value)}
                          placeholder="e.g. Coach Anjali Sharma"
                          className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="e.g. anjali@fitsync.health"
                          className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-gray-400 block mb-1">Role / Designation</label>
                        <input
                          type="text"
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">Specializations (Comma separated)</label>
                        <input
                          type="text"
                          value={inviteSpecialization}
                          onChange={(e) => setInviteSpecialization(e.target.value)}
                          className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsInviteOpen(false)}
                        className="px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-fitness-primary text-gray-950 font-bold text-xs"
                      >
                        Send Staff Invite
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TURNSTILE ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border">
                  <div className="text-gray-400 text-[11px]">Total Members</div>
                  <div className="font-headline font-black text-2xl text-white mt-1">{gym.totalMembers}</div>
                </div>
                <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border">
                  <div className="text-gray-400 text-[11px]">Active Today</div>
                  <div className="font-headline font-black text-2xl text-emerald-400 mt-1">{gym.activeToday}</div>
                </div>
                <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border">
                  <div className="text-gray-400 text-[11px]">Attendance Rate</div>
                  <div className="font-headline font-black text-2xl text-fitness-primary mt-1">{gym.attendanceRate}</div>
                </div>
                <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border">
                  <div className="text-gray-400 text-[11px]">Turnstiles Active</div>
                  <div className="font-headline font-black text-2xl text-healthcare-accent mt-1">4 Units</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border space-y-2">
                <div className="font-bold text-white text-xs">Live Turnstile Check-in Log</div>
                <div className="space-y-2">
                  {[
                    { name: 'Aarav Shah', time: '07:30 AM', gate: 'Turnstile A (Main Entrance)', status: 'Success' },
                    { name: 'Priya Nair', time: '09:00 AM', gate: 'Turnstile B (Studio Access)', status: 'Success' },
                    { name: 'Dev Patel', time: 'Yesterday 06:00 PM', gate: 'Turnstile A (Main Entrance)', status: 'Success' }
                  ].map((log, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-surface-2 border border-surface-border flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{log.name}</div>
                        <div className="text-[10px] text-gray-400">{log.gate}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-emerald-400 font-bold">{log.status}</div>
                        <div className="text-gray-400 text-[10px]">{log.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEMBERSHIP PLANS */}
          {activeTab === 'memberships' && (
            <div className="space-y-4">
              <div className="font-bold text-white text-base">Membership Tiers &amp; Pricing</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {gym.membershipTiers?.map((tier, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-surface-1 border border-surface-border space-y-2">
                    <div className="font-bold text-white text-sm">{tier.name}</div>
                    <div className="font-headline font-black text-xl text-fitness-primary">{tier.price}</div>
                    <p className="text-gray-400 text-[11px] leading-relaxed">{tier.access}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GYM PROFILE */}
          {activeTab === 'gym_profile' && (
            <form onSubmit={handleSaveGymProfile} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">Gym Name</label>
                  <input
                    type="text"
                    value={gym.name}
                    onChange={(e) => setGym({ ...gym, name: e.target.value })}
                    className="w-full bg-surface-1 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Branch Location</label>
                  <input
                    type="text"
                    value={gym.location}
                    onChange={(e) => setGym({ ...gym, location: e.target.value })}
                    className="w-full bg-surface-1 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Amenities (Comma separated)</label>
                <input
                  type="text"
                  value={gym.features?.join(', ')}
                  onChange={(e) => setGym({ ...gym, features: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full bg-surface-1 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-fitness-primary text-gray-950 font-bold text-xs shadow-glow-fitness"
                >
                  Save Branch Profile
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

