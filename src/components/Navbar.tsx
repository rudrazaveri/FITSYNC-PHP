'use client';

import React from 'react';
import Image from 'next/image';
import { UserRole } from '@/types';
import { haptics } from '@/lib/audio-haptics';
import { Bell, Volume2, VolumeX, Shield, Activity } from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  unreadNotificationsCount,
  onOpenNotifications
}) => {
  const [soundOn, setSoundOn] = React.useState(true);

  const toggleSound = () => {
    haptics.soundEnabled = !soundOn;
    setSoundOn(!soundOn);
    haptics.playTap();
  };

  const roles: { id: UserRole; label: string; icon: string }[] = [
    { id: 'member', label: 'Member', icon: '📱' },
    { id: 'trainer', label: 'Trainer', icon: '🏋️' },
    { id: 'doctor', label: 'Doctor', icon: '🩺' },
    { id: 'physiotherapist', label: 'Physio', icon: '🏃' },
    { id: 'gym_admin', label: 'Gym Admin', icon: '🏢' },
    { id: 'platform_admin', label: 'Platform Admin', icon: '🌐' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-canvas-base/85 backdrop-blur-xl border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Badge */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectRole('member')}>
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
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-fitness-primary/15 text-fitness-primary border border-fitness-primary/30">
                Live App
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">Your Fitness. Your Health. Your Intelligence.</p>
          </div>
        </div>

        {/* Role Switcher Nav */}
        <nav className="hidden lg:flex items-center bg-surface-2/80 p-1 rounded-xl border border-surface-border overflow-x-auto">
          {roles.map((r) => {
            const isActive = currentRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => {
                  haptics.playTap();
                  onSelectRole(r.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-fitness-primary text-gray-950 font-semibold shadow-glow-fitness'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{r.icon}</span>
                <span>{r.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Tools & Indicators */}
        <div className="flex items-center gap-2">
          {/* Mobile Role Dropdown */}
          <div className="lg:hidden">
            <select
              value={currentRole}
              onChange={(e) => {
                haptics.playTap();
                onSelectRole(e.target.value as UserRole);
              }}
              className="bg-surface-2 text-xs text-white border border-surface-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-fitness-primary"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.icon} {r.label}
                </option>
              ))}
            </select>
          </div>

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
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-surface-border">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-fitness-primary/40 relative">
              <Image 
                src={
                  currentRole === 'trainer' ? '/assets/trainer_raj.jpg' :
                  currentRole === 'doctor' ? '/assets/doctor_iyer.jpg' :
                  currentRole === 'physiotherapist' ? '/assets/physio_sharma.jpg' :
                  '/assets/aarav.jpg'
                } 
                alt="User" 
                fill 
                className="object-cover" 
              />
            </div>
            <div className="text-left text-xs">
              <div className="font-semibold text-white leading-tight">
                {currentRole === 'trainer' ? 'Coach Raj' :
                 currentRole === 'doctor' ? 'Dr. Ananya Iyer' :
                 currentRole === 'physiotherapist' ? 'Dr. Ramesh Sharma' :
                 currentRole === 'gym_admin' ? 'FitZone Admin' :
                 currentRole === 'platform_admin' ? 'Network Admin' :
                 'Aarav Shah'}
              </div>
              <div className="text-[10px] text-gray-400 capitalize">{currentRole.replace('_', ' ')}</div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
