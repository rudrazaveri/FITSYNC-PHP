'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { HealthcareProvider, Appointment } from '@/types';
import { X, Calendar, Clock, Video, Building, AlertCircle, CheckCircle } from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from './Toast';

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: HealthcareProvider[];
  existingAppointments: Appointment[];
  onBookAppointment: (newApt: Appointment) => void;
}

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  providers,
  existingAppointments,
  onBookAppointment
}) => {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<HealthcareProvider>(providers[0]);
  const [selectedDate, setSelectedDate] = useState('Today, Oct 10');
  const [selectedTime, setSelectedTime] = useState('05:30 PM');
  const [selectedType, setSelectedType] = useState<'Online Video Consultation' | 'In-Person Clinical Visit'>('Online Video Consultation');
  const [agenda, setAgenda] = useState('Right shoulder impingement screen & overhead bench press check');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const dates = ['Today, Oct 10', 'Tomorrow, Oct 11', 'Monday, Oct 13', 'Wednesday, Oct 15'];
  const times = ['10:00 AM', '11:30 AM', '02:00 PM', '04:00 PM', '05:30 PM', '06:30 PM'];

  const handleConfirm = () => {
    // Validate double-booking against existing records
    const isConflict = existingAppointments.some(
      (a) =>
        a.providerId === selectedProvider.id &&
        a.date === selectedDate &&
        a.time === selectedTime &&
        a.status !== 'Cancelled'
    );

    if (isConflict) {
      haptics.playTap();
      setErrorMessage(`Conflict: ${selectedProvider.name} is already booked on ${selectedDate} at ${selectedTime}. Please select an alternate slot.`);
      return;
    }

    const newApt: Appointment = {
      id: `apt_${Date.now()}`,
      providerId: selectedProvider.id,
      providerName: selectedProvider.name,
      providerRole: selectedProvider.role,
      providerAvatar: selectedProvider.avatar,
      clinic: selectedProvider.clinic,
      date: selectedDate,
      time: selectedTime,
      type: selectedType,
      status: 'Confirmed',
      meetingLink: selectedType === 'Online Video Consultation' ? `https://fitsync.health/telehealth/session-${Date.now()}` : null,
      agenda: agenda.trim() || 'General Clinical Consultation'
    };

    onBookAppointment(newApt);
    showToast(`Appointment confirmed with ${selectedProvider.name}!`, '🩺');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-2 border border-surface-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-1">
          <div>
            <h3 className="font-headline font-bold text-white text-lg">Book Clinical Consultation</h3>
            <p className="text-xs text-healthcare-accent">Sports Medicine Physicians & Physiotherapists</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-status-danger/15 border border-status-danger/40 flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-status-danger mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Select Provider */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              1. Select Specialist
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {providers.map((p) => {
                const isSelected = selectedProvider.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      haptics.playTap();
                      setSelectedProvider(p);
                      setErrorMessage('');
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                      isSelected
                        ? 'bg-healthcare-primary/10 border-healthcare-primary shadow-glow-healthcare'
                        : 'bg-surface-1 border-surface-border hover:border-white/20'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-white/10 flex-shrink-0">
                      <Image src={p.avatar} alt={p.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{p.name}</div>
                      <div className="text-[11px] text-healthcare-accent truncate">{p.specialty}</div>
                      <div className="text-[10px] text-gray-400 font-semibold">{p.consultationFee}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Date & Slot */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              2. Select Date & Slot
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dates.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    haptics.playTap();
                    setSelectedDate(d);
                    setErrorMessage('');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap border transition ${
                    selectedDate === d
                      ? 'bg-fitness-primary text-gray-950 font-bold border-fitness-primary'
                      : 'bg-surface-1 text-gray-300 border-surface-border hover:bg-white/5'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2">
              {times.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    haptics.playTap();
                    setSelectedTime(t);
                    setErrorMessage('');
                  }}
                  className={`py-2 px-1 text-xs rounded-xl border text-center transition ${
                    selectedTime === t
                      ? 'bg-healthcare-primary text-gray-950 font-bold border-healthcare-primary'
                      : 'bg-surface-1 text-gray-300 border-surface-border hover:bg-white/5'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              3. Consultation Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedType('Online Video Consultation')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 text-left transition ${
                  selectedType === 'Online Video Consultation'
                    ? 'bg-healthcare-primary/15 border-healthcare-primary text-white font-semibold'
                    : 'bg-surface-1 border-surface-border text-gray-400'
                }`}
              >
                <Video className="w-4 h-4 text-healthcare-primary" />
                <div className="text-xs">Online Video</div>
              </button>
              <button
                onClick={() => setSelectedType('In-Person Clinical Visit')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 text-left transition ${
                  selectedType === 'In-Person Clinical Visit'
                    ? 'bg-healthcare-primary/15 border-healthcare-primary text-white font-semibold'
                    : 'bg-surface-1 border-surface-border text-gray-400'
                }`}
              >
                <Building className="w-4 h-4 text-fitness-primary" />
                <div className="text-xs">In-Person Visit</div>
              </button>
            </div>
          </div>

          {/* Step 4: Agenda */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              4. Consultation Agenda / Symptoms
            </label>
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="e.g. Shoulder impingement screening, bloodwork biomarker review..."
              className="w-full bg-surface-1 border border-surface-border rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-healthcare-primary"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border bg-surface-1 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-gray-400">Total Fee: </span>
            <span className="font-bold text-white text-sm">{selectedProvider.consultationFee}</span>
          </div>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 bg-healthcare-primary hover:bg-cyan-400 text-gray-950 font-bold text-xs rounded-xl shadow-glow-healthcare transition flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Confirm Booking
          </button>
        </div>

      </div>
    </div>
  );
};
