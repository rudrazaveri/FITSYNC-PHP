'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  Calendar, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  Activity, 
  Dumbbell, 
  Utensils,
  Filter,
  ArrowRight
} from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from '@/components/Toast';
import { TrainerService } from '@/lib/supabase/trainer-service';
import { TrainerInterventionInsight } from '@/types';

export default function TrainerInsightsPage() {
  const { showToast } = useToast();
  const [interventions, setInterventions] = useState<TrainerInterventionInsight[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'rule_based' | 'ai_insight'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInterventions() {
      setIsLoading(true);
      try {
        const data = await TrainerService.getInterventions(statusFilter);
        setInterventions(data);
      } catch (e) {
        console.error('Failed to load insights:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadInterventions();
  }, [statusFilter]);

  const handleResolve = async (id: string, memberName: string) => {
    haptics.playSuccess();
    await TrainerService.updateInterventionStatus(id, 'Resolved');
    setInterventions(prev => prev.map(i => i.id === id ? { ...i, status: 'Resolved' } : i));
    showToast(`Marked intervention for ${memberName} as resolved!`, '✅');
  };

  const filteredInterventions = interventions.filter(i => {
    if (sourceFilter === 'all') return true;
    return i.sourceType === sourceFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              Intervention Intelligence
            </span>
            <span className="text-xs text-gray-400">Gym Floor Telemetry &amp; Compliance</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-white">
            Members Needing Attention
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Automated rule-based compliance alerts &amp; fatigue analytics to help you deliver targeted coach interventions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-surface-2 text-xs font-mono text-amber-300 font-bold border border-surface-border">
            {filteredInterventions.filter(i => i.status === 'Open').length} Open Alerts
          </span>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="p-4 rounded-3xl bg-surface-1 border border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Source Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-semibold">Source:</span>
          {(['all', 'rule_based', 'ai_insight'] as const).map((source) => (
            <button
              key={source}
              onClick={() => {
                haptics.playTap();
                setSourceFilter(source);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize transition ${
                sourceFilter === source
                  ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
                  : 'bg-surface-2 text-gray-400 hover:text-white'
              }`}
            >
              {source === 'all' ? 'All Alerts' : source === 'rule_based' ? 'Rule-Based Only' : 'AI Insights Only'}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-semibold">Status:</span>
          {(['all', 'open', 'resolved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                haptics.playTap();
                setStatusFilter(st);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize transition ${
                statusFilter === st
                  ? 'bg-surface-3 text-white border border-gray-400'
                  : 'bg-surface-2 text-gray-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

      </div>

      {/* Interventions List */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-gray-400 animate-pulse">
          Analyzing gym attendance, workout cadence, and nutrition logs...
        </div>
      ) : filteredInterventions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface-1 border border-surface-border space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-white text-base">All Assigned Athletes Are On Track</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            No compliance alerts or fatigue anomalies detected in your assigned roster.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterventions.map((item) => (
            <div
              key={item.id}
              className={`p-6 rounded-3xl bg-surface-1 border transition space-y-4 ${
                item.status === 'Resolved' 
                  ? 'border-surface-border opacity-70' 
                  : item.attentionStatus === 'High'
                  ? 'border-rose-500/50 shadow-glow-rose'
                  : 'border-surface-border hover:border-gray-500'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-fitness-primary/30 flex-shrink-0">
                    <Image src={item.memberAvatar} alt={item.memberName} fill className="object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-headline font-bold text-base text-white">{item.memberName}</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        item.sourceType === 'ai_insight'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {item.sourceType === 'ai_insight' ? '🤖 AI Insight' : '⚡ Rule-Based Alert'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Detected on: <span className="text-gray-300 font-mono">{item.dateDetected}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-3 py-1 rounded-xl font-bold uppercase ${
                    item.attentionStatus === 'High'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : item.attentionStatus === 'Moderate'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {item.attentionStatus} Priority
                  </span>
                  <span className={`text-[10px] px-2.5 py-1 rounded-xl font-bold ${
                    item.status === 'Resolved' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-surface-2 text-gray-300'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Description & Technical Reason */}
              <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border space-y-2 text-xs">
                <div className="font-semibold text-white text-sm">
                  {item.title}
                </div>
                <p className="text-gray-300 leading-relaxed">
                  {item.description}
                </p>
                <div className="text-[11px] text-gray-400 bg-surface-1 p-2.5 rounded-xl border border-surface-border font-mono">
                  Trigger Reason: <span className="text-fitness-primary">{item.reason}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-border">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/trainer/members/${item.memberId}`}
                    onClick={() => haptics.playTap()}
                    className="px-4 py-2 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition flex items-center gap-1.5"
                  >
                    <span>View Member Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/trainer/messages"
                    onClick={() => haptics.playTap()}
                    className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-white font-bold text-xs border border-surface-border transition"
                  >
                    Send Direct Message
                  </Link>
                </div>

                {item.status !== 'Resolved' && (
                  <button
                    onClick={() => handleResolve(item.id, item.memberName)}
                    className="px-4 py-2 rounded-xl bg-surface-3 hover:bg-emerald-500/20 hover:text-emerald-400 text-xs text-gray-300 font-semibold border border-surface-border transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Resolved</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

