'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Search, 
  X, 
  Star, 
  Dumbbell, 
  Building2, 
  ShieldCheck, 
  MessageSquareText, 
  Video, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from '@/components/Toast';
import { INITIAL_TRAINERS } from '@/lib/initial-data';
import { Trainer } from '@/types';

interface TrainerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrainer?: (trainer: Trainer) => void;
}

export const TrainerSearchModal: React.FC<TrainerSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTrainer
}) => {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  if (!isOpen) return null;

  const filteredTrainers = INITIAL_TRAINERS.filter((t) => {
    const q = query.toLowerCase();
    const matchesQuery = 
      t.name.toLowerCase().includes(q) ||
      t.gymName.toLowerCase().includes(q) ||
      t.role.toLowerCase().includes(q) ||
      t.specializations.some(s => s.toLowerCase().includes(q));

    if (selectedSpecialty === 'all') return matchesQuery;
    return matchesQuery && t.specializations.some(s => s.toLowerCase().includes(selectedSpecialty.toLowerCase()));
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-2 border border-surface-border w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header with Search Input */}
        <div className="p-4 sm:p-5 border-b border-surface-border bg-surface-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-fitness-primary" />
              <h3 className="font-headline font-bold text-white text-base">Global Trainer Search</h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-1 rounded-xl text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search gym strength coaches by name, gym branch, or specialization..."
              className="w-full bg-surface-2 border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-fitness-primary"
            />
          </div>

          {/* Quick Specialty Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-1">
            <span className="text-gray-400 text-[10px] flex-shrink-0">Filter:</span>
            {['all', 'Powerlifting', 'Hypertrophy', 'Mobility', 'Conditioning'].map((spec) => (
              <button
                key={spec}
                onClick={() => {
                  haptics.playTap();
                  setSelectedSpecialty(spec);
                }}
                className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition ${
                  selectedSpecialty === spec
                    ? 'bg-fitness-primary text-gray-950 font-bold'
                    : 'bg-surface-2 text-gray-400 hover:text-white'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 text-xs">
          {filteredTrainers.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-surface-1 border border-surface-border space-y-2">
              <Dumbbell className="w-8 h-8 text-gray-500 mx-auto" />
              <div className="text-white font-bold text-sm">No trainers found</div>
              <p className="text-xs text-gray-400">Try searching with a different keyword or removing specialty filters.</p>
            </div>
          ) : (
            filteredTrainers.map((tr) => (
              <div
                key={tr.id}
                className="p-4 rounded-2xl bg-surface-1 border border-surface-border hover:border-fitness-primary/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-fitness-primary/40 shadow-glow-fitness flex-shrink-0">
                    <Image src={tr.avatar} alt={tr.name} fill className="object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-headline font-bold text-sm text-white">{tr.name}</h4>
                      <ShieldCheck className="w-3.5 h-3.5 text-fitness-primary flex-shrink-0" />
                      <div className="flex items-center gap-1 text-amber-400 text-[10px] font-bold">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{tr.rating}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3 h-3 text-healthcare-accent" />
                      <span>{tr.gymName}</span>
                      <span>•</span>
                      <span>{tr.experience} Exp</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {tr.specializations.map((spec, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-surface-2 text-gray-300 font-medium">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                  <button
                    onClick={() => {
                      haptics.playSuccess();
                      if (onSelectTrainer) onSelectTrainer(tr);
                      showToast(`Connected with ${tr.name}!`, '🏋️');
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition"
                  >
                    Connect
                  </button>
                  <Link
                    href="/trainer/profile"
                    onClick={() => {
                      haptics.playTap();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs text-white font-semibold border border-surface-border transition"
                  >
                    Profile
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

