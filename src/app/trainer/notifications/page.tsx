'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  CheckCircle2, 
  MessageSquareText, 
  Sparkles, 
  Video, 
  Dumbbell, 
  Clock, 
  Users,
  ChevronRight,
  Filter
} from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from '@/components/Toast';

interface TrainerNotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'member_connect' | 'message' | 'alert' | 'session' | 'workout';
  actionUrl: string;
  isRead: boolean;
}

const INITIAL_TRAINER_NOTIFS: TrainerNotificationItem[] = [
  {
    id: 'tnotif_1',
    title: 'New Member Connected: Priya Nair',
    description: 'Priya Nair connected with you as her dedicated strength coach at FitZone Vadodara.',
    time: '15 mins ago',
    type: 'member_connect',
    actionUrl: '/trainer/members/ath_03',
    isRead: false
  },
  {
    id: 'tnotif_2',
    title: 'New Athlete Message from Aarav Shah',
    description: '"The bench press felt solid, hit 82.5 kg on top sets. Just felt a tiny pinch in front deltoid..."',
    time: '45 mins ago',
    type: 'message',
    actionUrl: '/trainer/messages',
    isRead: false
  },
  {
    id: 'tnotif_3',
    title: 'Intervention Alert: Rahul Verma Missed 3 Workouts',
    description: 'Rule-based alert: Rahul has missed 3 consecutive scheduled workouts in the past 10 days.',
    time: '2 hours ago',
    type: 'alert',
    actionUrl: '/trainer/insights',
    isRead: false
  },
  {
    id: 'tnotif_4',
    title: 'Upcoming Video Session: Dev Patel',
    description: 'Scheduled for tomorrow at 06:30 PM: Periodization Strategy & Weekly Volume Planning.',
    time: 'Today 09:30 AM',
    type: 'session',
    actionUrl: '/trainer/sessions',
    isRead: true
  },
  {
    id: 'tnotif_5',
    title: 'Workout Logged: Aarav Shah',
    description: 'Aarav logged Chest & Triceps Hypertrophy with 3,450 kg moved.',
    time: 'Yesterday',
    type: 'workout',
    actionUrl: '/trainer/members/ath_01',
    isRead: true
  }
];

export default function TrainerNotificationsPage() {
  const { showToast } = useToast();
  const [notifs, setNotifs] = useState<TrainerNotificationItem[]>(INITIAL_TRAINER_NOTIFS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const handleMarkAllRead = () => {
    haptics.playSuccess();
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    showToast('All notifications marked as read', '✅');
  };

  const handleMarkSingleRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const filtered = notifs.filter(n => filter === 'all' ? true : !n.isRead);

  const getIcon = (type: TrainerNotificationItem['type']) => {
    switch (type) {
      case 'member_connect': return <Users className="w-4 h-4 text-fitness-primary" />;
      case 'message': return <MessageSquareText className="w-4 h-4 text-healthcare-accent" />;
      case 'alert': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'session': return <Video className="w-4 h-4 text-blue-400" />;
      case 'workout': return <Dumbbell className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fitness-primary/20 text-fitness-primary border border-fitness-primary/30 uppercase tracking-wider">
              Alerts &amp; Activity Feed
            </span>
            <span className="text-xs text-gray-400">Coach Raj Patel Activity</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-white">
            Trainer Notifications
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time notifications for athlete inquiries, new gym floor connections, intervention cues, and sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notifs.some(n => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs text-gray-300 font-semibold border border-surface-border transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-fitness-primary" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-3">
        <button
          onClick={() => {
            haptics.playTap();
            setFilter('all');
          }}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'all'
              ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
              : 'bg-surface-2 text-gray-400 hover:text-white'
          }`}
        >
          All Activity ({notifs.length})
        </button>

        <button
          onClick={() => {
            haptics.playTap();
            setFilter('unread');
          }}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
              : 'bg-surface-2 text-gray-400 hover:text-white'
          }`}
        >
          <span>Unread Only</span>
          {notifs.filter(n => !n.isRead).length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>
      </div>

      {/* Notification Items List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-surface-1 border border-surface-border space-y-2">
            <Bell className="w-8 h-8 text-gray-500 mx-auto" />
            <h3 className="font-bold text-white text-sm">No notifications</h3>
            <p className="text-xs text-gray-400">You are all caught up on athlete alerts.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMarkSingleRead(item.id)}
              className={`p-4 rounded-3xl border transition flex items-start justify-between gap-4 cursor-pointer ${
                item.isRead
                  ? 'bg-surface-1 border-surface-border opacity-75 hover:opacity-100'
                  : 'bg-surface-2 border-fitness-primary/50 shadow-glow-fitness'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-surface-3 border border-surface-border mt-0.5 flex-shrink-0">
                  {getIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline font-bold text-sm text-white">{item.title}</h3>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-fitness-primary" />
                    )}
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="text-[10px] text-gray-500 font-mono mt-1">
                    {item.time}
                  </div>
                </div>
              </div>

              <Link
                href={item.actionUrl}
                onClick={(e) => {
                  e.stopPropagation();
                  haptics.playTap();
                  handleMarkSingleRead(item.id);
                }}
                className="px-3 py-1.5 rounded-xl bg-surface-3 hover:bg-fitness-primary hover:text-gray-950 text-xs text-gray-200 font-bold transition flex items-center gap-1 flex-shrink-0 self-center"
              >
                <span>View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

