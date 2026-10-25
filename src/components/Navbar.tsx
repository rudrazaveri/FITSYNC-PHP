'use client';

import React from 'react';
import Image from 'next/image';
import { haptics } from '@/lib/audio-haptics';
import { Bell, Volume2, VolumeX, LogOut } from 'lucide-react';
import { UserProfile } from '@/types';

interface NavbarProps {
  userProfile: UserProfile;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  unreadNotificationsCount,
  onOpenNotifications,
  onLogout
}) => {
  const [soundOn, setSoundOn] = React.useState(true);

  const toggleSound = () => {
    haptics.soundEnabled = !soundOn;
    setSoundOn(!soundOn);
    haptics.playTap();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-canvas-base/85 backdrop-blur-xl border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Badge */}
        <div className="flex items-center gap-3">
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
        </div>

        {/* User Status & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
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
            <div className="w-8 h-8 rounded-full overflow-hidden border border-fitness-primary/40 relative">
              <Image 
                src={userProfile.avatarUrl || '/assets/aarav.jpg'} 
                alt={userProfile.fullName} 
                fill 
                className="object-cover" 
              />
            </div>
            <div className="text-left text-xs hidden sm:block">
              <div className="font-semibold text-white leading-tight">
                {userProfile.fullName}
              </div>
              <div className="text-[10px] text-gray-400 capitalize">
                {userProfile.membershipTier || 'Member'}
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
  );
};
