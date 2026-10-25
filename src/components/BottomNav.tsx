'use client';

import React from 'react';
import { Home, Dumbbell, Utensils, User } from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';

export type MemberTab = 'home' | 'workout' | 'nutrition' | 'profile';

interface BottomNavProps {
  activeTab: MemberTab;
  onTabChange: (tab: MemberTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home' as MemberTab, label: 'Home', icon: Home },
    { id: 'workout' as MemberTab, label: 'Workout', icon: Dumbbell },
    { id: 'nutrition' as MemberTab, label: 'Nutrition', icon: Utensils },
    { id: 'profile' as MemberTab, label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-canvas-base/95 backdrop-blur-xl border-t border-surface-border py-2 px-4">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                haptics.playTap();
                onTabChange(tab.id);
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-fitness-primary scale-105 font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className={`p-1.5 rounded-xl ${isActive ? 'bg-fitness-primary/15' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-fitness-primary' : 'text-gray-400'}`} />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
