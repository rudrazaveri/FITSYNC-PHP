'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Mic, MicOff, Video, VideoOff, Volume2, PhoneOff, FileText, CheckCircle2 } from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from './Toast';

interface TelehealthVideoRoomProps {
  providerName: string;
  providerRole: string;
  providerAvatar: string;
  agenda: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TelehealthVideoRoom: React.FC<TelehealthVideoRoomProps> = ({
  providerName,
  providerRole,
  providerAvatar,
  agenda,
  isOpen,
  onClose
}) => {
  const { showToast } = useToast();
  const [seconds, setSeconds] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notes, setNotes] = useState('Patient notes: Reported mild tightness at the top of the bench press motion. External rotation assessment completed with 85° mobility.');

  useEffect(() => {
    if (!isOpen) {
      setSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    haptics.playTap();
    showToast('Consultation session concluded successfully.', '🩺');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-300">
      
      {/* Top Telehealth Header Bar */}
      <div className="flex items-center justify-between bg-surface-2/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden relative border border-healthcare-primary">
            <Image src={providerAvatar} alt={providerName} fill className="object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-headline font-bold text-white text-sm sm:text-base">{providerName}</span>
              <span className="text-[10px] bg-healthcare-primary/20 text-healthcare-accent px-2 py-0.5 rounded font-medium border border-healthcare-primary/40">
                Encrypted Session
              </span>
            </div>
            <div className="text-xs text-gray-400">{providerRole} • {agenda}</div>
          </div>
        </div>

        {/* Live Call Duration */}
        <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full border border-surface-border text-white text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-status-danger animate-pulse" />
          <span>{formatTimer(seconds)}</span>
        </div>
      </div>

      {/* Main Video Stage */}
      <div className="flex-1 my-4 relative rounded-3xl overflow-hidden border border-surface-border bg-surface-1 flex items-center justify-center">
        
        {/* Remote Provider Feed (Simulated high-res feed) */}
        <div className="absolute inset-0">
          <Image
            src={providerAvatar}
            alt={providerName}
            fill
            className="object-cover opacity-80 filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        </div>

        {/* Self Camera Pip (Picture-in-Picture) */}
        <div className="absolute bottom-4 right-4 w-32 h-44 sm:w-40 sm:h-52 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-surface-2 z-10">
          {isCamOn ? (
            <Image src="/assets/aarav.jpg" alt="Aarav Shah" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs">
              <VideoOff className="w-6 h-6 mb-1" />
              Camera Off
            </div>
          )}
          <div className="absolute bottom-2 left-2 text-[10px] bg-black/70 px-2 py-0.5 rounded text-white font-medium">
            You (Aarav)
          </div>
        </div>

        {/* Live Kinematic / Telehealth Telemetry Overlay */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-xs text-white max-w-xs space-y-1">
          <div className="text-healthcare-accent font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-healthcare-primary" />
            Active Clinical Examination
          </div>
          <div className="text-[11px] text-gray-300">Agenda: {agenda}</div>
          <div className="text-[10px] text-gray-400 pt-1 border-t border-white/10">
            WebRTC WebRTC/Daily Integration Endpoint Ready
          </div>
        </div>

        {/* Clinical Notes Drawer Overlay if open */}
        {isNotesOpen && (
          <div className="absolute inset-y-4 left-4 w-80 bg-surface-2/95 backdrop-blur-xl border border-surface-border rounded-2xl p-4 flex flex-col z-20 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border mb-3">
              <span className="font-bold text-white text-sm">Consultation Notes</span>
              <button onClick={() => setIsNotesOpen(false)} className="text-gray-400 hover:text-white text-xs">Close</button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 bg-black/40 text-xs text-white p-3 rounded-xl border border-surface-border focus:outline-none focus:border-healthcare-primary resize-none"
            />
          </div>
        )}
      </div>

      {/* Bottom Floating Controls */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 bg-surface-2/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-surface-border max-w-lg mx-auto w-full">
        <button
          onClick={() => {
            haptics.playTap();
            setIsMicOn(!isMicOn);
          }}
          className={`p-3.5 rounded-2xl transition border ${
            isMicOn ? 'bg-surface-3 text-white border-white/10' : 'bg-status-danger/20 text-status-danger border-status-danger'
          }`}
          title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          onClick={() => {
            haptics.playTap();
            setIsCamOn(!isCamOn);
          }}
          className={`p-3.5 rounded-2xl transition border ${
            isCamOn ? 'bg-surface-3 text-white border-white/10' : 'bg-status-danger/20 text-status-danger border-status-danger'
          }`}
          title={isCamOn ? 'Turn Camera Off' : 'Turn Camera On'}
        >
          {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          onClick={() => {
            haptics.playTap();
            setIsNotesOpen(!isNotesOpen);
          }}
          className={`p-3.5 rounded-2xl transition border ${
            isNotesOpen ? 'bg-healthcare-primary text-gray-950 font-bold' : 'bg-surface-3 text-white border-white/10'
          }`}
          title="Clinical Notes"
        >
          <FileText className="w-5 h-5" />
        </button>

        <button
          onClick={handleEndCall}
          className="px-6 py-3.5 bg-status-danger hover:bg-red-600 text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg transition"
        >
          <PhoneOff className="w-5 h-5" />
          <span>End Session</span>
        </button>
      </div>

    </div>
  );
};
