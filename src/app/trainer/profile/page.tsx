'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  User, 
  Award, 
  ShieldCheck, 
  Star, 
  Clock, 
  Calendar, 
  Dumbbell, 
  CheckCircle2, 
  Edit3, 
  MessageSquareText, 
  Video, 
  Building2,
  ExternalLink,
  Save
} from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from '@/components/Toast';
import { TrainerService } from '@/lib/supabase/trainer-service';
import { Trainer } from '@/types';

export default function TrainerProfilePage() {
  const { showToast } = useToast();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [specializationsInput, setSpecializationsInput] = useState('');
  const [certificationsInput, setCertificationsInput] = useState('');
  const [scheduleInput, setScheduleInput] = useState('');

  useEffect(() => {
    async function fetchTrainer() {
      const data = await TrainerService.getTrainerProfile();
      setTrainer(data);
      setBioInput(data.bio || '');
      setSpecializationsInput(data.specializations?.join(', ') || '');
      setCertificationsInput(data.certifications?.join(', ') || '');
      setScheduleInput(data.weeklySchedule || '');
    }
    fetchTrainer();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainer) return;

    haptics.playSuccess();
    const specs = specializationsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const certs = certificationsInput.split(',').map((c) => c.trim()).filter(Boolean);

    const updated = await TrainerService.updateTrainerProfile({
      bio: bioInput.trim(),
      specializations: specs,
      certifications: certs,
      weeklySchedule: scheduleInput.trim()
    });

    setTrainer(updated);
    setIsEditing(false);
    showToast('Coach profile updated successfully! 🏋️', '✅');
  };

  if (!trainer) {
    return (
      <div className="p-16 text-center text-xs text-gray-400 animate-pulse">
        Loading coach profile...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Toggle Preview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fitness-primary/20 text-fitness-primary border border-fitness-primary/30 uppercase tracking-wider">
              Profile Management
            </span>
            <span className="text-xs text-gray-400">Gym Strength Coach Profile</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-white">
            Coach Profile &amp; Member Showcase
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage your public coaching credentials, certifications, availability hours, and review how gym members see your profile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              haptics.playTap();
              setIsPreviewMode(!isPreviewMode);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isPreviewMode
                ? 'bg-healthcare-primary text-white shadow-glow-healthcare'
                : 'bg-surface-2 text-gray-300 hover:text-white border border-surface-border'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{isPreviewMode ? 'Editing Mode' : 'Preview Member View'}</span>
          </button>
        </div>
      </div>

      {/* Main Profile Showcase Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface-1 border border-surface-border relative overflow-hidden space-y-6">
        
        {/* Top Identity Block */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-fitness-primary shadow-glow-fitness flex-shrink-0">
              <Image 
                src={trainer.avatar} 
                alt={trainer.name} 
                fill 
                className="object-cover" 
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="font-headline font-black text-2xl text-white">
                  {trainer.name}
                </h2>
                <ShieldCheck className="w-5 h-5 text-fitness-primary" />
              </div>
              <div className="text-sm font-semibold text-fitness-primary">
                {trainer.role} • {trainer.experience}
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-healthcare-accent" />
                <span>{trainer.gymName} (Alkapuri Branch)</span>
              </div>
              <div className="flex items-center gap-2 pt-1 text-xs">
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{trainer.rating}</span>
                </div>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 font-mono">({trainer.reviewsCount} Member Reviews)</span>
              </div>
            </div>
          </div>

          {/* Member Actions (Shown on Member Preview) */}
          {isPreviewMode ? (
            <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border space-y-2 w-full md:w-64">
              <div className="text-[10px] text-healthcare-accent font-bold uppercase tracking-wider">
                Member-Facing Actions
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => showToast('Connected with Coach Raj Patel!', '🤝')}
                  className="w-full py-2 bg-fitness-primary text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness"
                >
                  Connect as Gym Coach
                </button>
                <Link
                  href="/trainer/messages"
                  className="block text-center w-full py-2 bg-surface-3 text-white font-bold text-xs rounded-xl hover:bg-surface-border transition"
                >
                  Send Message
                </Link>
                <Link
                  href="/trainer/sessions"
                  className="block text-center w-full py-2 bg-healthcare-primary text-white font-bold text-xs rounded-xl shadow-glow-healthcare transition"
                >
                  Book 1-on-1 Consultation
                </Link>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                haptics.playTap();
                setIsEditing(!isEditing);
              }}
              className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-white font-bold text-xs border border-surface-border transition flex items-center gap-1.5 self-start"
            >
              <Edit3 className="w-3.5 h-3.5 text-fitness-primary" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Credentials'}</span>
            </button>
          )}
        </div>

        {/* Edit Form or Read-Only Display */}
        {isEditing && !isPreviewMode ? (
          <form onSubmit={handleSaveProfile} className="pt-4 border-t border-surface-border space-y-4 text-xs">
            <div>
              <label className="text-gray-300 font-semibold block mb-1">About &amp; Coaching Philosophy</label>
              <textarea
                rows={3}
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                className="w-full bg-surface-2 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Specializations (Comma separated)</label>
                <input
                  type="text"
                  value={specializationsInput}
                  onChange={(e) => setSpecializationsInput(e.target.value)}
                  className="w-full bg-surface-2 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Certifications (Comma separated)</label>
                <input
                  type="text"
                  value={certificationsInput}
                  onChange={(e) => setCertificationsInput(e.target.value)}
                  className="w-full bg-surface-2 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-300 font-semibold block mb-1">Weekly Floor &amp; Consultation Schedule</label>
              <input
                type="text"
                value={scheduleInput}
                onChange={(e) => setScheduleInput(e.target.value)}
                className="w-full bg-surface-2 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-black text-xs shadow-glow-fitness transition flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 pt-4 border-t border-surface-border text-xs">
            {/* About / Bio */}
            <div>
              <h3 className="font-headline font-bold text-white text-sm mb-1.5">About &amp; Coaching Background</h3>
              <p className="text-gray-300 leading-relaxed max-w-3xl">
                {trainer.bio}
              </p>
            </div>

            {/* Specializations & Certifications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border space-y-2">
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-fitness-primary" /> Specializations &amp; Focus Areas
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {trainer.specializations?.map((spec, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-surface-1 text-gray-200 text-[11px] font-semibold border border-surface-border">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border space-y-2">
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <Award className="w-4 h-4 text-healthcare-accent" /> Professional Certifications
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {trainer.certifications?.map((cert, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-healthcare-primary/10 text-healthcare-accent text-[11px] font-bold border border-healthcare-primary/30">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Availability Schedule */}
            <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" /> Weekly Gym Floor &amp; Consultation Availability
                </div>
                <div className="text-gray-400 text-[11px] mt-0.5">
                  {trainer.weeklySchedule}
                </div>
              </div>

              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold self-start sm:self-auto">
                {trainer.availabilityStatus}
              </span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

