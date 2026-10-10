'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertOctagon } from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';

interface FoodSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAllergies: string[];
}

export const FoodSafetyModal: React.FC<FoodSafetyModalProps> = ({
  isOpen,
  onClose,
  userAllergies
}) => {
  const [searchTerm, setSearchTerm] = useState('Peanut Butter');

  if (!isOpen) return null;

  const checkAllergen = () => {
    const term = searchTerm.toLowerCase();
    const matched = userAllergies.filter((a) => term.includes(a.toLowerCase()) || (a.toLowerCase() === 'peanuts' && term.includes('peanut')));
    return matched;
  };

  const matchedAllergens = checkAllergen();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-2 border border-surface-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-status-danger/15 border border-status-danger/30 text-status-danger">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-white text-lg">Dietary Safety & Allergen Scanner</h3>
              <p className="text-xs text-gray-400">Pre-Consumption Biological Conflict Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Your Documented Allergies:
            </label>
            <div className="flex gap-2">
              {userAllergies.map((a, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-bold bg-status-danger/20 text-red-300 border border-status-danger/40 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-danger" />
                  {a}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Scan Food Item or Ingredient:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. Peanut Butter Toast, Whey Isolate, Soy Milk..."
              className="w-full bg-surface-1 border border-surface-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-fitness-primary"
            />
          </div>

          {/* Realtime Conflict Result */}
          {matchedAllergens.length > 0 ? (
            <div className="p-4 rounded-2xl bg-status-danger/15 border-2 border-status-danger flex items-start gap-3 text-red-200 animate-in zoom-in-95 duration-200">
              <AlertOctagon className="w-6 h-6 text-status-danger flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-white mb-1">
                  🔴 Potential Allergen Conflict Detected: {matchedAllergens.join(', ')}
                </h4>
                <p className="text-xs leading-relaxed text-red-200/90">
                  You have logged an active allergy to <strong>{matchedAllergens.join(', ')}</strong>. Consuming &ldquo;{searchTerm}&rdquo; carries significant risk of adverse reaction.
                </p>
                <div className="mt-3 text-xs bg-black/40 p-2.5 rounded-xl border border-white/10 text-gray-300">
                  <strong className="text-fitness-primary">Safe FitSync Alternative:</strong> Swap for Almond Butter or Sunflower Seed Butter (Non-allergic seeds).
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-fitness-primary/10 border border-fitness-primary/40 flex items-start gap-3 text-emerald-200">
              <CheckCircle2 className="w-6 h-6 text-fitness-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-white mb-1">
                  🟢 Clear: No Known Allergen Conflict
                </h4>
                <p className="text-xs text-emerald-200/90">
                  &ldquo;{searchTerm}&rdquo; does not trigger any conflict with your profile allergies ({userAllergies.join(', ')}).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border bg-surface-1 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-surface-3 hover:bg-surface-border text-white text-xs font-bold rounded-xl transition"
          >
            Close Scanner
          </button>
        </div>

      </div>
    </div>
  );
};
