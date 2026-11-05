'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Building2, 
  Search, 
  MapPin, 
  Star, 
  Users, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  X, 
  Dumbbell, 
  ChevronRight, 
  Sparkles, 
  Award,
  Send,
  History
} from 'lucide-react';
import { Gym, MembershipRequestItem } from '@/types';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from '@/components/Toast';

interface GymDiscoveryModalProps {
  gyms: Gym[];
  selectedGym: Gym;
  currentTier?: string;
  membershipRequests: MembershipRequestItem[];
  onSelectGym: (gym: Gym) => void;
  onRequestMembership: (gym: Gym, planName: string, price: string) => void;
  onClose: () => void;
}

export const GymDiscoveryModal: React.FC<GymDiscoveryModalProps> = ({
  gyms,
  selectedGym,
  currentTier,
  membershipRequests,
  onSelectGym,
  onRequestMembership,
  onClose,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'requests' | 'active'>('browse');
  const [inspectingGym, setInspectingGym] = useState<Gym>(selectedGym || gyms[0]);
  const [selectedPlanTier, setSelectedPlanTier] = useState<string>('Gold All-Access');

  const filteredGyms = gyms.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendRequest = (planName: string, price: string) => {
    haptics.playSuccess();
    onRequestMembership(inspectingGym, planName, price);
    showToast(`Membership request submitted for ${inspectingGym.name} (${planName})! 🏋️`, '🎉');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-base/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface-1 border border-surface-border rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-border bg-surface-2/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-healthcare-accent/15 text-healthcare-accent border border-healthcare-accent/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline font-bold text-lg text-white">Gym Discovery &amp; Membership</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fitness-primary/20 text-fitness-primary border border-fitness-primary/30 uppercase">
                  {gyms.length} Authorized Centers
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Discover affiliated fitness branches, inspect equipment, and manage your active membership tier.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              haptics.playTap();
              onClose();
            }}
            className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-gray-400 hover:text-white transition border border-surface-border"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-surface-border bg-surface-1">
          <button
            onClick={() => setActiveTab('browse')}
            className={`pb-2.5 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'browse'
                ? 'text-fitness-primary border-fitness-primary'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Explore Gyms</span>
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-2.5 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'text-fitness-primary border-fitness-primary'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>My Active Membership</span>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-2.5 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'text-fitness-primary border-fitness-primary'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Membership Requests ({membershipRequests.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: BROWSE GYMS */}
          {activeTab === 'browse' && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search gym by name, city, or neighborhood (e.g., Alkapuri, SG Highway)..."
                  className="w-full bg-surface-2 border border-surface-border rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-fitness-primary"
                />
              </div>

              {/* Gyms Grid & Inspector */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Gyms List */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Available Branches ({filteredGyms.length})
                  </div>
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {filteredGyms.map((gym) => {
                      const isSelected = inspectingGym.id === gym.id;
                      const isHome = selectedGym?.id === gym.id;
                      return (
                        <div
                          key={gym.id}
                          onClick={() => {
                            haptics.playTap();
                            setInspectingGym(gym);
                          }}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'bg-surface-3 border-fitness-primary/70 shadow-glow-fitness'
                              : 'bg-surface-2/60 border-surface-border hover:border-surface-border/80'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{gym.name}</span>
                              {isHome && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-fitness-primary/20 text-fitness-primary font-bold">
                                  Home Branch
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-fitness-primary" />
                              <span>{gym.location}</span>
                            </div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-2 pt-0.5">
                              <span className="flex items-center gap-0.5 text-status-warning font-semibold">
                                <Star className="w-3 h-3 fill-status-warning" /> {gym.rating}
                              </span>
                              <span>•</span>
                              <span>{gym.availableTrainers} Coaches</span>
                              <span>•</span>
                              <span>{gym.attendanceRate} Att.</span>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-gray-400 mt-2 flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Inspecting Gym Detail Panel */}
                <div className="lg:col-span-7 bg-surface-2/50 border border-surface-border rounded-3xl p-5 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline font-bold text-lg text-white">{inspectingGym.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          Turnstiles Active
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-fitness-primary" /> {inspectingGym.location} ({inspectingGym.distance} from you)
                      </p>
                    </div>

                    {selectedGym?.id === inspectingGym.id ? (
                      <span className="px-3 py-1.5 rounded-xl bg-fitness-primary/15 text-fitness-primary border border-fitness-primary/30 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selected Home Gym
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          haptics.playSuccess();
                          onSelectGym(inspectingGym);
                          showToast(`Set ${inspectingGym.name} as your primary gym! 📍`, '✅');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-surface-3 hover:bg-surface-border text-white text-xs font-bold border border-surface-border transition"
                      >
                        Set as Home Gym
                      </button>
                    )}
                  </div>

                  {/* Highlights / Features */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Facility Highlights &amp; Equipment
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectingGym.features.map((feat, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl bg-surface-1 border border-surface-border text-xs text-gray-300 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-fitness-primary" /> {feat}
                        </span>
                      ))}
                      <span className="px-2.5 py-1 rounded-xl bg-surface-1 border border-surface-border text-xs text-gray-300 flex items-center gap-1">
                        <Dumbbell className="w-3 h-3 text-healthcare-accent" /> Rogue Power Cages &amp; Dumbbells (2.5 - 50 kg)
                      </span>
                    </div>
                  </div>

                  {/* Membership Plans & Request Action */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Membership Tiers &amp; Plans
                      </span>
                      <span className="text-[11px] text-fitness-primary">Instant enrollment request</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {inspectingGym.membershipTiers.map((tier) => (
                        <div
                          key={tier.name}
                          onClick={() => setSelectedPlanTier(tier.name)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                            selectedPlanTier === tier.name
                              ? 'bg-fitness-primary/10 border-fitness-primary text-white shadow-glow-fitness'
                              : 'bg-surface-1 border-surface-border text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs">{tier.name}</div>
                            <div className="text-base font-headline font-extrabold text-fitness-primary mt-1">
                              {tier.price}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1 leading-snug">
                              {tier.access}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendRequest(tier.name, tier.price);
                            }}
                            className="w-full mt-3 py-1.5 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 text-[11px] font-bold transition flex items-center justify-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Request Access</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE MEMBERSHIP */}
          {activeTab === 'active' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-surface-2 to-surface-3 border border-fitness-primary/40 shadow-glow-fitness space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-fitness-primary" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Active Digital Pass</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                    Active Membership
                  </span>
                </div>

                <div>
                  <h3 className="font-headline font-extrabold text-2xl text-white">{selectedGym.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedGym.location}</p>
                  <div className="text-xs text-fitness-primary font-bold mt-2">
                    Tier: {currentTier || 'Gold All-Access'} • Full Turnstile Floor Access
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-surface-border text-xs">
                  <div>
                    <span className="text-gray-400 text-[10px]">Turnstile Access Status</span>
                    <div className="text-white font-bold mt-0.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Verified Active</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px]">Coaching Floor Access</span>
                    <div className="text-white font-bold mt-0.5">Assigned Coach Connected</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border text-xs text-gray-300 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-healthcare-accent" /> Membership Rules &amp; Verification
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Your membership is automatically synchronized with your gym&apos;s turnstile telemetry. You can check in daily under the Attendance tab to update your visit streak.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: MEMBERSHIP REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-surface-border">
                <span className="font-bold text-white">Membership Request History</span>
                <span>{membershipRequests.length} Submissions</span>
              </div>

              {membershipRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No membership requests submitted yet. Use the &quot;Explore Gyms&quot; tab to browse and request membership at an affiliated center.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {membershipRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl bg-surface-2 border border-surface-border flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{req.gymName}</span>
                          <span className="text-[10px] text-fitness-primary font-mono">{req.planName}</span>
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {req.gymLocation} • {req.price}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Submitted on: {req.requestedAt}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                          req.status === 'Active' || req.status === 'Approved'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : req.status === 'Pending Approval'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {req.status === 'Pending Approval' && <Clock className="w-3 h-3 animate-pulse" />}
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

