'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Sparkles, 
  Dumbbell, 
  Video, 
  MessageSquareText, 
  User, 
  Bell, 
  LogOut, 
  ShieldCheck, 
  ShieldAlert,
  Info,
  Clock,
  Trash2
} from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from '@/components/Toast';
import { TrainerService } from '@/lib/supabase/trainer-service';
import { getInitialState, saveState, resetAllLocalData } from '@/lib/store';
import type { Trainer } from '@/types';

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [unreadNotifCount] = useState(3);

  const [authState, setAuthState] = useState<{
    isLoading: boolean;
    isAuthenticated: boolean;
    isTrainer: boolean;
    userName?: string;
  }>({
    isLoading: true,
    isAuthenticated: false,
    isTrainer: false
  });

  useEffect(() => {
    const state = getInitialState();
    if (!state.isAuthenticated) {
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        isTrainer: false
      });
      router.replace('/');
      return;
    }

    const isTrainerRole = state.userProfile?.role === 'trainer';
    setAuthState({
      isLoading: false,
      isAuthenticated: true,
      isTrainer: isTrainerRole,
      userName: state.userProfile?.fullName
    });

    if (isTrainerRole) {
      TrainerService.getTrainerProfile().then((t) => setTrainer(t));
    }
  }, [router]);

  const handleTrainerSignOut = () => {
    haptics.playTap();
    const cur = getInitialState();
    saveState({ ...cur, isAuthenticated: false });
    showToast('Signed out of Coach Portal', '👋');
    router.replace('/');
  };

  const handleResetCleanSlate = () => {
    haptics.playTap();
    resetAllLocalData();
    showToast('Clean Slate Active. All data wiped.', '🧹');
    router.replace('/');
  };

  const navItems = [
    { href: '/trainer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/trainer/members', label: 'Members', icon: Users },
    { href: '/trainer/insights', label: 'Interventions', icon: Sparkles, badge: '4' },
    { href: '/trainer/workouts', label: 'Workouts', icon: Dumbbell },
    { href: '/trainer/sessions', label: 'Sessions', icon: Video },
    { href: '/trainer/messages', label: 'Messages', icon: MessageSquareText },
    { href: '/trainer/profile', label: 'Profile', icon: User },
    { href: '/trainer/notifications', label: 'Alerts', icon: Bell, badge: unreadNotifCount > 0 ? `${unreadNotifCount}` : undefined },
  ];

  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-canvas-base flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 rounded-full border-2 border-fitness-primary border-t-transparent animate-spin" />
        <span className="text-xs text-gray-400 font-mono tracking-wider">Verifying Coach Credentials...</span>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return null;
  }

  // ATHLETE ROLE ACCESS RESTRICTION: Athletes cannot view coach management tools or assigned rosters!
  if (!authState.isTrainer) {
    return (
      <div className="min-h-screen bg-canvas-base flex items-center justify-center p-4 selection:bg-amber-500 selection:text-gray-950">
        <div className="max-w-md w-full p-8 rounded-3xl bg-surface-1 border border-surface-border text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-glow-fitness">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Access Restricted
            </span>
            <h2 className="font-headline font-black text-2xl text-white mt-3">
              Trainer Authorization Required
            </h2>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              You are currently signed in as an Athlete (<strong className="text-white">{authState.userName || 'Member'}</strong>). 
              Athlete accounts are not permitted to access Gym Trainer management tools, assigned member rosters, or coach intervention intelligence.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-2 border border-surface-border text-left flex items-start gap-3">
            <Info className="w-4 h-4 text-healthcare-accent flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-gray-300">
              To review assigned athletes and manage workout splits, please sign out and sign in with an authorized Gym Trainer ID.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                haptics.playTap();
                router.push('/');
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition"
            >
              Return to Athlete Dashboard
            </button>
            <button
              onClick={handleTrainerSignOut}
              className="px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-gray-300 hover:text-white text-xs border border-surface-border transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-base text-gray-100 flex flex-col md:flex-row antialiased selection:bg-fitness-primary selection:text-gray-950">
      
      {/* ======================================================== */}
      {/* DESKTOP SIDEBAR NAVIGATION                                */}
      {/* ======================================================== */}
      <aside className="hidden md:flex flex-col w-64 bg-surface-1 border-r border-surface-border p-4 flex-shrink-0 justify-between sticky top-0 h-screen z-30">
        <div className="space-y-6">
          
          {/* Logo & Gym Branding */}
          <div className="px-2">
            <Link 
              href="/trainer/dashboard" 
              className="flex items-center gap-3 group"
              onClick={() => haptics.playTap()}
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-fitness-primary to-healthcare-accent flex items-center justify-center text-gray-950 font-black shadow-glow-fitness">
                <Dumbbell className="w-5 h-5 text-gray-950 transform group-hover:rotate-12 transition" />
              </div>
              <div>
                <span className="font-headline font-black text-lg tracking-tight text-white block">
                  FITSYNC <span className="text-fitness-primary font-mono text-xs px-1.5 py-0.5 rounded bg-fitness-primary/20 ml-1">COACH</span>
                </span>
                <span className="text-[11px] text-gray-400 block -mt-0.5 font-medium">FitZone Vadodara Portal</span>
              </div>
            </Link>
          </div>

          {/* Coach Identity Card */}
          <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-fitness-primary shadow-glow-fitness flex-shrink-0">
                <Image 
                  src={trainer?.avatar || '/assets/trainer_raj.jpg'} 
                  alt={trainer?.name || 'Coach Raj'} 
                  fill 
                  className="object-cover" 
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                  <span>{trainer?.name || 'Coach Raj Patel'}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-fitness-primary flex-shrink-0" />
                </div>
                <div className="text-[10px] text-gray-400 truncate">Head Strength Coach</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-semibold">On Gym Floor</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/trainer/dashboard' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => haptics.playTap()}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-fitness-primary text-gray-950 font-black shadow-glow-fitness'
                      : 'text-gray-400 hover:text-white hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-gray-950' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      isActive ? 'bg-gray-950 text-fitness-primary' : 'bg-fitness-primary/20 text-fitness-primary'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions: Clean Trainer Sign Out */}
        <div className="space-y-1.5 pt-4 border-t border-surface-border">
          <button
            onClick={handleTrainerSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
          <button
            onClick={handleResetCleanSlate}
            className="flex items-center gap-2 w-full px-3 py-1.5 rounded-xl text-[11px] text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition font-medium"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400/80" />
            <span>🧹 Reset Database</span>
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE TOP BAR                                           */}
      {/* ======================================================== */}
      <header className="md:hidden sticky top-0 z-30 bg-surface-1/95 backdrop-blur-md border-b border-surface-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/trainer/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-fitness-primary to-healthcare-accent flex items-center justify-center text-gray-950 font-black">
              <Dumbbell className="w-4 h-4 text-gray-950" />
            </div>
            <span className="font-headline font-black text-sm text-white">FITSYNC COACH</span>
          </Link>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-fitness-primary/20 text-fitness-primary font-bold">
            FitZone
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link 
            href="/trainer/notifications" 
            className="relative p-2 rounded-xl bg-surface-2 text-gray-400 hover:text-white"
            onClick={() => haptics.playTap()}
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-fitness-primary" />
            )}
          </Link>
          <button 
            onClick={handleTrainerSignOut}
            className="px-2.5 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-[11px] font-bold text-rose-400 border border-rose-500/30 flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN CONTENT AREA                                        */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        
        {/* Global Coach Strip Banner */}
        <div className="hidden md:flex items-center justify-between px-6 py-2.5 bg-surface-1/60 border-b border-surface-border text-xs">
          <div className="flex items-center gap-4 text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <strong className="text-white">FitZone Vadodara Branch</strong>: Alkapuri, Vadodara
            </span>
            <span className="text-gray-600">•</span>
            <span>24 Assigned Athletes</span>
            <span className="text-gray-600">•</span>
            <span>Floor Turnstile Checked-in: <strong className="text-emerald-400">18 Active</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/trainer/sessions"
              onClick={() => haptics.playTap()}
              className="px-3 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-[11px] text-healthcare-accent border border-healthcare-accent/30 transition flex items-center gap-1"
            >
              <Clock className="w-3 h-3" />
              <span>Next Session: 05:30 PM (Aarav Shah)</span>
            </Link>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR                              */}
      {/* ======================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-1/95 backdrop-blur-xl border-t border-surface-border py-2 px-3">
        <div className="flex items-center justify-around">
          {[
            { href: '/trainer/dashboard', label: 'Overview', icon: LayoutDashboard },
            { href: '/trainer/members', label: 'Members', icon: Users },
            { href: '/trainer/insights', label: 'Alerts', icon: Sparkles },
            { href: '/trainer/workouts', label: 'Workouts', icon: Dumbbell },
            { href: '/trainer/messages', label: 'Messages', icon: MessageSquareText },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/trainer/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => haptics.playTap()}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                  isActive ? 'text-fitness-primary font-bold scale-105' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-fitness-primary/20' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}

