'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Video, 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  CheckCircle2, 
  X, 
  Mic, 
  MicOff, 
  VideoOff, 
  Volume2, 
  VolumeX, 
  PhoneOff, 
  MessageSquare, 
  Send, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from '@/components/Toast';
import { TrainerService } from '@/lib/supabase/trainer-service';
import { TrainerSessionItem, DetailedMemberProfile } from '@/types';

export default function TrainerSessionsPage() {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<TrainerSessionItem[]>([]);
  const [members, setMembers] = useState<DetailedMemberProfile[]>([]);
  const [statusTab, setStatusTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [isLoading, setIsLoading] = useState(true);

  // New Booking Modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [newDate, setNewDate] = useState('2026-10-31');
  const [newTime, setNewTime] = useState('06:00 PM');
  const [newType, setNewType] = useState<'floor_1on1' | 'online_video'>('floor_1on1');
  const [newFocus, setNewFocus] = useState('Squat Depth & Form Check');
  const [newNotes, setNewNotes] = useState('Bring lifting shoes and review warm-up drill.');

  // Live Online Video Room State
  const [activeVideoSession, setActiveVideoSession] = useState<TrainerSessionItem | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [sessionTimerSeconds, setSessionTimerSeconds] = useState(0);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'Aarav Shah', text: 'Hi Coach! Ready on my end, can you hear me clearly?', time: '05:30 PM' },
    { sender: 'Coach Raj Patel', text: 'Loud and clear Aarav. Let us review your bench arch and grip width first.', time: '05:31 PM' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Load Sessions
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [sess, mems] = await Promise.all([
          TrainerService.getSessions(),
          TrainerService.getAssignedMembers()
        ]);
        setSessions(sess);
        setMembers(mems);
        if (mems.length > 0) {
          setNewMemberId(mems[0].id);
        }
      } catch (e) {
        console.error('Failed to load sessions:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Timer loop for active video session
  useEffect(() => {
    let interval: any;
    if (activeVideoSession) {
      interval = setInterval(() => {
        setSessionTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSessionTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeVideoSession]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const selMember = members.find((m) => m.id === newMemberId) || members[0];
    if (!selMember) return;

    haptics.playSuccess();
    const created = await TrainerService.createSession({
      trainerId: 'tr_raj_patel',
      trainerName: 'Coach Raj Patel',
      memberId: selMember.id,
      memberName: selMember.name,
      memberAvatar: selMember.avatar,
      date: newDate,
      timeSlot: newTime,
      durationMinutes: 45,
      sessionType: newType,
      status: 'Confirmed',
      meetingLink: newType === 'online_video' ? `https://fitsync.health/telehealth/tr_raj_${selMember.id}` : undefined,
      telehealthRoomId: `room_${Date.now()}`,
      focusArea: newFocus.trim(),
      notes: newNotes.trim()
    });

    setSessions((prev) => [created, ...prev]);
    setIsBookModalOpen(false);
    showToast(`Session booked with ${selMember.name} for ${newDate} at ${newTime}! 📅`, '✅');
  };

  const handleSendVideoChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    haptics.playTap();
    const now = new Date();
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'Coach Raj Patel',
        text: chatInput.trim(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setChatInput('');
  };

  const filteredSessions = sessions.filter((s) => {
    if (statusTab === 'upcoming') {
      return s.status === 'Scheduled' || s.status === 'Confirmed' || s.status === 'In Progress';
    }
    return s.status === 'Completed' || s.status === 'Cancelled';
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-healthcare-primary/20 text-healthcare-accent border border-healthcare-primary/30 uppercase tracking-wider">
              Coaching Appointments
            </span>
            <span className="text-xs text-gray-400">Gym Floor &amp; Online Telehealth</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-white">
            Floor &amp; Online Video Sessions
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Schedule 1-on-1 floor spotter reviews or launch integrated online video consultations with assigned athletes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              haptics.playTap();
              setIsBookModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-black text-xs shadow-glow-fitness transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Session</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-3">
        <button
          onClick={() => {
            haptics.playTap();
            setStatusTab('upcoming');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            statusTab === 'upcoming'
              ? 'bg-fitness-primary text-gray-950 font-black shadow-glow-fitness'
              : 'bg-surface-2 text-gray-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Upcoming Sessions ({sessions.filter(s => s.status !== 'Completed' && s.status !== 'Cancelled').length})</span>
        </button>

        <button
          onClick={() => {
            haptics.playTap();
            setStatusTab('completed');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            statusTab === 'completed'
              ? 'bg-fitness-primary text-gray-950 font-black shadow-glow-fitness'
              : 'bg-surface-2 text-gray-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed History ({sessions.filter(s => s.status === 'Completed').length})</span>
        </button>
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-gray-400 animate-pulse">
          Loading scheduled sessions...
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface-1 border border-surface-border space-y-2">
          <Calendar className="w-8 h-8 text-gray-500 mx-auto" />
          <h3 className="font-bold text-white text-sm">No {statusTab} sessions found</h3>
          <p className="text-xs text-gray-400">Schedule a new session using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="p-5 rounded-3xl bg-surface-1 border border-surface-border hover:border-fitness-primary/50 transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-fitness-primary/30 flex-shrink-0">
                      <Image src={session.memberAvatar} alt={session.memberName} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-base text-white">
                        {session.memberName}
                      </h3>
                      <div className="text-[11px] text-gray-400 flex items-center gap-2">
                        <span>{session.date}</span>
                        <span>•</span>
                        <span className="font-mono font-bold text-fitness-primary">{session.timeSlot}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    session.sessionType === 'online_video'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {session.sessionType === 'online_video' ? 'Online Video' : 'Gym Floor 1-on-1'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-surface-2 border border-surface-border space-y-1 text-xs">
                  <div className="font-bold text-white">
                    Focus: {session.focusArea}
                  </div>
                  {session.notes && (
                    <div className="text-[11px] text-gray-400 italic">
                      Note: {session.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-surface-border flex items-center justify-between">
                <span className="text-[11px] text-gray-400 font-mono">
                  Duration: {session.durationMinutes} mins
                </span>

                <div className="flex items-center gap-2">
                  {session.sessionType === 'online_video' && session.status !== 'Completed' && (
                    <button
                      onClick={() => {
                        haptics.playTap();
                        setActiveVideoSession(session);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-healthcare-primary hover:bg-healthcare-accent text-white font-bold text-xs shadow-glow-healthcare transition flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Launch Video Call</span>
                    </button>
                  )}

                  {session.status !== 'Completed' && (
                    <button
                      onClick={async () => {
                        haptics.playSuccess();
                        await TrainerService.updateSessionStatus(session.id, 'Completed');
                        setSessions((prev) => prev.map((s) => s.id === session.id ? { ...s, status: 'Completed' } : s));
                        showToast(`Session with ${session.memberName} marked completed!`, '✅');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-emerald-500/20 hover:text-emerald-400 text-xs text-gray-300 font-semibold border border-surface-border transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SCHEDULE NEW SESSION MODAL                            */}
      {/* ======================================================== */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-2 border border-surface-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-1">
              <div>
                <h3 className="font-headline font-bold text-white text-base">Schedule Coaching Session</h3>
                <p className="text-xs text-gray-400">Gym Floor Technique or Online Video Consultation</p>
              </div>
              <button 
                onClick={() => setIsBookModalOpen(false)} 
                className="p-1.5 rounded-xl text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Select Athlete</label>
                <select
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  className="w-full bg-surface-1 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id} className="bg-surface-1 text-white">
                      {m.name} ({m.goal})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Session Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-surface-1 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary"
                  >
                    <option value="floor_1on1" className="bg-surface-1 text-white">Gym Floor 1-on-1</option>
                    <option value="online_video" className="bg-surface-1 text-white">Online Video Consultation</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Time Slot</label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-surface-1 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary"
                  >
                    <option value="07:00 AM">07:00 AM</option>
                    <option value="08:30 AM">08:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="05:30 PM">05:30 PM</option>
                    <option value="06:30 PM">06:30 PM</option>
                    <option value="07:30 PM">07:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-surface-1 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Focus Area</label>
                <input
                  type="text"
                  value={newFocus}
                  onChange={(e) => setNewFocus(e.target.value)}
                  placeholder="e.g. Scapular retraction & arch setup on bench"
                  className="w-full bg-surface-1 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Session Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Additional cues or warm-up notes for the athlete..."
                  className="w-full bg-surface-1 border border-surface-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary resize-none"
                />
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. INTERACTIVE LIVE ONLINE VIDEO ROOM INTERFACE          */}
      {/* ======================================================== */}
      {activeVideoSession && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col animate-in fade-in duration-200">
          
          {/* Video Room Header */}
          <div className="p-4 bg-surface-1 border-b border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <div>
                <h3 className="font-headline font-bold text-white text-sm">
                  Online Video Consultation: {activeVideoSession.memberName}
                </h3>
                <span className="text-[11px] text-gray-400">
                  Focus: {activeVideoSession.focusArea}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-3 py-1 rounded-xl bg-surface-2 border border-surface-border font-mono font-bold text-xs text-emerald-400">
                ⏱️ {formatTimer(sessionTimerSeconds)}
              </div>
              <button
                onClick={() => {
                  haptics.playTap();
                  setActiveVideoSession(null);
                  showToast('Ended video consultation', '📞');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition flex items-center gap-1.5"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            </div>
          </div>

          {/* Video Room Main Stage & Chat Panel */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 min-h-0">
            
            {/* Main Video Viewport (3 Columns) */}
            <div className="lg:col-span-3 p-6 flex flex-col justify-between relative bg-black/40">
              
              {/* Member Remote Video Feed (Mock Live Camera) */}
              <div className="relative w-full h-[460px] rounded-3xl overflow-hidden border border-surface-border bg-gradient-to-tr from-gray-950 to-surface-2 flex items-center justify-center">
                <Image 
                  src={activeVideoSession.memberAvatar} 
                  alt={activeVideoSession.memberName} 
                  fill 
                  className="object-cover opacity-80" 
                />
                
                {/* Overlay Badge */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{activeVideoSession.memberName} (Connected)</span>
                </div>

                {/* Self PIP View (Coach Camera) */}
                <div className="absolute bottom-4 right-4 w-36 h-28 rounded-2xl overflow-hidden border-2 border-fitness-primary shadow-2xl bg-surface-1">
                  {isCameraOn ? (
                    <Image 
                      src="/assets/trainer_raj.jpg" 
                      alt="Coach Raj" 
                      fill 
                      className="object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500 text-xs">
                      Camera Off
                    </div>
                  )}
                  <span className="absolute bottom-1 left-2 text-[9px] font-bold text-white bg-black/60 px-1.5 rounded">
                    You (Coach)
                  </span>
                </div>
              </div>

              {/* Bottom Call Controls Toolbar */}
              <div className="mt-4 p-3 rounded-2xl bg-surface-1 border border-surface-border flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    haptics.playTap();
                    setIsCameraOn(!isCameraOn);
                  }}
                  className={`p-3 rounded-2xl font-bold text-xs transition ${
                    isCameraOn ? 'bg-surface-2 text-white hover:bg-surface-3' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                  title="Toggle Camera"
                >
                  {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => {
                    haptics.playTap();
                    setIsMicOn(!isMicOn);
                  }}
                  className={`p-3 rounded-2xl font-bold text-xs transition ${
                    isMicOn ? 'bg-surface-2 text-white hover:bg-surface-3' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                  title="Toggle Microphone"
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => {
                    haptics.playTap();
                    setIsSpeakerOn(!isSpeakerOn);
                  }}
                  className={`p-3 rounded-2xl font-bold text-xs transition ${
                    isSpeakerOn ? 'bg-surface-2 text-white hover:bg-surface-3' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                  title="Toggle Audio"
                >
                  {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => {
                    haptics.playTap();
                    setActiveVideoSession(null);
                    showToast('Ended video call', '📞');
                  }}
                  className="px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-glow-rose transition flex items-center gap-2"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Consultation</span>
                </button>
              </div>

            </div>

            {/* Video Consultation In-Call Chat (1 Column) */}
            <div className="bg-surface-1 border-l border-surface-border p-4 flex flex-col justify-between h-full">
              <div>
                <h4 className="font-headline font-bold text-white text-xs pb-3 border-b border-surface-border flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-fitness-primary" /> Session Chat &amp; Cues
                </h4>

                <div className="space-y-2.5 mt-3 max-h-[380px] overflow-y-auto pr-1">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-surface-2 border border-surface-border text-xs">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                        <span className="font-bold text-white">{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="text-gray-300 leading-relaxed text-[11px]">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendVideoChat} className="pt-3 border-t border-surface-border flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type cue or note..."
                  className="flex-1 bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-fitness-primary"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-3 py-2 bg-fitness-primary hover:bg-fitness-light disabled:opacity-50 text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
