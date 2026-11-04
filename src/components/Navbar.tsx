'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { haptics } from '@/lib/audio-haptics';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  LogOut, 
  Search, 
  Building2, 
  Dumbbell,
  ShieldCheck 
} from 'lucide-react';
import { UserProfile, Trainer } from '@/types';
import { TrainerSearchModal } from './TrainerSearchModal';
import { GymAdminModal } from './GymAdminModal';

interface NavbarProps {
  userProfile: UserProfile;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onLogout: () => void;
  onSelectTrainer?: (trainer: Trainer) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  unreadNotificationsCount,
  onOpenNotifications,
  onLogout,
  onSelectTrainer
}) => {
  const [soundOn, setSoundOn] = useState(true);
  const [isTrainerSearchOpen, setIsTrainerSearchOpen] = useState(false);
  const [isGymAdminOpen, setIsGymAdminOpen] = useState(false);

  const toggleSound = () => {
    haptics.soundEnabled = !soundOn;
    setSoundOn(!soundOn);
    haptics.playTap();
  };

  const isTrainer = userProfile?.role === 'trainer';

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-canvas-base/85 backdrop-blur-xl border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Badge */}
          <div className="flex items-center gap-3">
            <Link 
              href={isTrainer ? '/trainer/dashboard' : '/'} 
              className="flex items-center gap-3 group"
              onClick={() => haptics.playTap()}
            >
              <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-fitness-primary/50 shadow-glow-fitness">
                <Image 
                  src="/assets/logo.jpg" 
                  alt="FitSync AI Logo" 
                  fill 
                  className="object-cover" 
                  priority
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-headline font-extrabold text-lg tracking-tight text-white">
                    FitSync <span className="bg-ai-gradient bg-clip-text text-transparent">AI</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-fitness-primary/15 text-fitness-primary border border-fitness-primary/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-fitness-primary animate-pulse" />
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 hidden sm:block">Your Fitness. Your Health. Your Intelligence.</p>
              </div>
            </Link>
          </div>

          {/* User Status & Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Global Search Button */}
            <button
              onClick={() => {
                haptics.playTap();
                setIsTrainerSearchOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs text-gray-300 hover:text-white transition border border-surface-border"
              title="Global Trainer Search"
            >
              <Search className="w-3.5 h-3.5 text-fitness-primary" />
              <span className="hidden md:inline">Find Coaches</span>
            </button>

            {/* Gym Admin Portal Modal Trigger — ONLY for Gym Admins */}
            {userProfile?.role === 'gym_admin' && (
              <button
                onClick={() => {
                  haptics.playTap();
                  setIsGymAdminOpen(true);
                }}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs text-gray-300 hover:text-white transition border border-surface-border"
                title="Gym Admin Section"
              >
                <Building2 className="w-3.5 h-3.5 text-healthcare-accent" />
                <span>Gym Admin</span>
              </button>
            )}

            {/* Quick Switch to Trainer Portal — ONLY for Trainers */}
            {isTrainer && (
              <Link
                href="/trainer/dashboard"
                onClick={() => haptics.playTap()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 text-xs font-bold shadow-glow-fitness transition"
                title="Open Coach Workspace"
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Coach Portal</span>
              </Link>
            )}

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg bg-surface-2 text-gray-300 hover:text-white hover:bg-white/10 transition border border-surface-border"
              title={soundOn ? 'Sound On' : 'Sound Off'}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-fitness-primary" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
            </button>

            {/* Notifications Button */}
            <button
              onClick={() => {
                haptics.playTap();
                onOpenNotifications();
              }}
              className="relative p-2 rounded-lg bg-surface-2 text-gray-300 hover:text-white hover:bg-white/10 transition border border-surface-border"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-healthcare-accent" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-status-danger text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Current User Pill */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-surface-border">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-fitness-primary/40 relative flex items-center justify-center bg-surface-2">
                {userProfile.avatarUrl ? (
                  <Image 
                    src={userProfile.avatarUrl} 
                    alt={userProfile.fullName} 
                    fill 
                    className="object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-fitness-primary to-healthcare-accent flex items-center justify-center text-gray-950 font-bold text-[11px] font-headline select-none">
                    {userProfile.fullName ? userProfile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              <div className="text-left text-xs hidden sm:block">
                <div className="font-semibold text-white leading-tight">
                  {userProfile.fullName}
                </div>
                <div className="text-[10px] text-gray-400 capitalize">
                  {userProfile.membershipTier || (isTrainer ? 'Gym Coach' : 'Member')}
                </div>
              </div>
            </div>

            {/* Clean Sign Out Button */}
            <button
              onClick={() => {
                haptics.playTap();
                onLogout();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-status-danger/10 hover:bg-status-danger/25 text-red-400 hover:text-red-300 border border-status-danger/30 text-xs font-bold transition ml-1"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>

          </div>

        </div>
      </header>

      {/* Global Trainer Search Modal */}
      <TrainerSearchModal
        isOpen={isTrainerSearchOpen}
        onClose={() => setIsTrainerSearchOpen(false)}
        onSelectTrainer={onSelectTrainer}
      />

      {/* Gym Admin Portal Modal */}
      <GymAdminModal
        isOpen={isGymAdminOpen}
        onClose={() => setIsGymAdminOpen(false)}
      />
    </>
  );
};
