'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  MessageSquareText, 
  Send, 
  Search, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  User, 
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from '@/components/Toast';
import { TrainerService } from '@/lib/supabase/trainer-service';
import { TrainerMessage, DetailedMemberProfile } from '@/types';

export default function TrainerMessagesPage() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<TrainerMessage[]>([]);
  const [members, setMembers] = useState<DetailedMemberProfile[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('ath_01');
  const [inputText, setInputText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'form_check' | 'nutrition' | 'schedule'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load messages and members
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [msgs, mems] = await Promise.all([
          TrainerService.getMessages(),
          TrainerService.getAssignedMembers()
        ]);
        setMessages(msgs);
        setMembers(mems);
      } catch (e) {
        console.error('Failed to load messages:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    haptics.playSuccess();
    const sent = await TrainerService.sendMessage(
      'trainer',
      'Coach Raj Patel',
      inputText.trim(),
      categoryFilter !== 'all' ? categoryFilter : 'general'
    );

    setMessages((prev) => [...prev, sent]);
    setInputText('');
    showToast('Coaching cue dispatched to athlete!', '💬');
  };

  const handleSendPresetCue = (preset: string) => {
    setInputText(preset);
  };

  const filteredMessages = messages.filter((m) => {
    if (categoryFilter === 'all') return true;
    return m.category === categoryFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fitness-primary/20 text-fitness-primary border border-fitness-primary/30 uppercase tracking-wider">
              Athlete Communication Stream
            </span>
            <span className="text-xs text-gray-400">Gym Floor Direct Messages</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-white">
            Trainer &amp; Athlete Direct Inbox
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Exchange spotter cues, form assessment reviews, and training feedback with your assigned athletes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-surface-2 border border-surface-border text-xs text-emerald-400 font-mono font-bold">
            Live Stream Connected
          </span>
        </div>
      </div>

      {/* Main Messaging Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[640px]">
        
        {/* Left Column: Assigned Athletes List */}
        <div className="p-4 rounded-3xl bg-surface-1 border border-surface-border flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="font-headline font-bold text-white text-sm">Assigned Athletes</h3>
              <span className="text-xs font-mono text-gray-400">{members.length}</span>
            </div>

            <div className="space-y-2 mt-3 overflow-y-auto max-h-[500px]">
              {members.map((mem) => {
                const isSelected = selectedMemberId === mem.id;
                return (
                  <div
                    key={mem.id}
                    onClick={() => {
                      haptics.playTap();
                      setSelectedMemberId(mem.id);
                    }}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-fitness-primary/15 border-fitness-primary shadow-glow-fitness'
                        : 'bg-surface-2 border-surface-border hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-surface-border flex-shrink-0">
                        <Image src={mem.avatar} alt={mem.name} fill className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">{mem.name}</div>
                        <div className="text-[10px] text-gray-400 truncate">{mem.goal.split(' ')[0]}</div>
                      </div>
                    </div>

                    <span className={`w-2 h-2 rounded-full ${
                      mem.status === 'Active on Floor' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                    }`} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-surface-2 border border-surface-border text-[11px] text-gray-400">
            Coach Status: <strong className="text-white">Coach Raj Patel</strong> (FitZone Alkapuri)
          </div>
        </div>

        {/* Right 2 Columns: Live Chat Thread */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-surface-1 border border-surface-border flex flex-col justify-between h-full">
          
          {/* Thread Header */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            {selectedMember ? (
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-fitness-primary/40 flex-shrink-0">
                  <Image src={selectedMember.avatar} alt={selectedMember.name} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-white">
                    {selectedMember.name}
                  </h3>
                  <div className="text-xs text-gray-400">
                    Goal: <span className="text-white">{selectedMember.goal}</span> • Routine: <span className="text-fitness-primary">{selectedMember.activeRoutineTitle}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-white font-bold text-sm">Select an athlete</div>
            )}

            {/* Category Filter Pills */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
              {(['all', 'form_check', 'nutrition', 'schedule'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    haptics.playTap();
                    setCategoryFilter(cat);
                  }}
                  className={`px-2.5 py-1 rounded-lg capitalize transition ${
                    categoryFilter === cat
                      ? 'bg-fitness-primary text-gray-950 font-bold'
                      : 'bg-surface-2 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1 text-xs">
            {filteredMessages.map((msg) => {
              const isCoach = msg.sender === 'trainer';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCoach ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-gray-500 font-mono mb-1 px-1">
                    {msg.senderName} • {msg.time}
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl max-w-lg leading-relaxed ${
                      isCoach
                        ? 'bg-fitness-primary text-gray-950 font-semibold shadow-glow-fitness rounded-br-sm'
                        : 'bg-surface-2 border border-surface-border text-gray-200 rounded-bl-sm'
                    }`}
                  >
                    <p>{msg.text}</p>
                    {msg.category && msg.category !== 'general' && (
                      <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                        isCoach ? 'bg-gray-950/20 text-gray-900' : 'bg-surface-1 text-gray-400'
                      }`}>
                        {msg.category.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Preset Technique Cues */}
          <div className="py-2 flex items-center gap-2 overflow-x-auto border-t border-surface-border/50 text-[11px]">
            <span className="text-gray-500 flex-shrink-0">Quick Cues:</span>
            {[
              'Remember to tuck your elbows 45 degrees on the bench press.',
              'Great workout today! Maintain that brace on the descent.',
              'Catch me on the gym floor at 5 PM for your squat spot check.',
              'Please make sure to log your post-workout protein intake today.'
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendPresetCue(preset)}
                className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-gray-300 hover:text-white whitespace-nowrap text-[11px] border border-surface-border transition"
              >
                {preset.slice(0, 36)}...
              </button>
            ))}
          </div>

          {/* Send Input Bar */}
          <form onSubmit={handleSendMessage} className="pt-2 border-t border-surface-border flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Send coaching cue to ${selectedMember?.name.split(' ')[0] || 'athlete'}...`}
              className="flex-1 bg-surface-2 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-fitness-primary"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-5 py-2.5 bg-fitness-primary hover:bg-fitness-light disabled:opacity-50 text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness transition flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}

