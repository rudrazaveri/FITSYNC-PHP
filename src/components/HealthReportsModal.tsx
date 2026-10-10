'use client';

import React, { useState } from 'react';
import { HealthReport } from '@/types';
import { X, FileText, Lock, ShieldCheck, Upload, Check, AlertCircle } from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from './Toast';

interface HealthReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: HealthReport[];
  onUpdateReport: (updatedReport: HealthReport) => void;
  onAddReport: (newReport: HealthReport) => void;
}

export const HealthReportsModal: React.FC<HealthReportsModalProps> = ({
  isOpen,
  onClose,
  reports,
  onUpdateReport,
  onAddReport
}) => {
  const { showToast } = useToast();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Biomarkers & Blood Panel');
  const [newHighlights, setNewHighlights] = useState('');

  if (!isOpen) return null;

  const toggleConsent = (report: HealthReport, target: 'doctor' | 'physio' | 'trainer') => {
    haptics.playTap();
    const updated: HealthReport = { ...report };
    if (target === 'doctor') updated.sharedWithDoctor = !report.sharedWithDoctor;
    if (target === 'physio') updated.sharedWithPhysio = !report.sharedWithPhysio;
    if (target === 'trainer') updated.sharedWithTrainer = !report.sharedWithTrainer;

    onUpdateReport(updated);
    showToast('Patient consent access updated', '🔒');
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    haptics.playSuccess();
    const newDoc: HealthReport = {
      id: `rep_${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      uploadDate: 'Just now',
      fileType: 'PDF',
      fileSize: '1.8 MB',
      lab: 'FitSync Clinical Diagnostic Lab',
      sharedWithDoctor: true,
      sharedWithPhysio: false,
      sharedWithTrainer: false,
      highlights: newHighlights.trim() || 'Biomarker panel verified by accredited laboratory.',
      notes: 'Encrypted storage verified.'
    };

    onAddReport(newDoc);
    showToast('Health document encrypted and saved to sovereign vault!', '📄');
    setNewTitle('');
    setNewHighlights('');
    setShowUploadForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-2 border border-surface-border w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-healthcare-primary/15 border border-healthcare-primary/30 text-healthcare-primary">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-white text-lg">Sovereign Medical Vault</h3>
              <p className="text-xs text-gray-400">Encrypted Clinical Records & Explicit Patient Consent Matrix</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Privacy Seal Notice */}
          <div className="p-4 rounded-2xl bg-surface-1 border border-healthcare-primary/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-healthcare-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-300 leading-relaxed">
              <strong className="text-white">HIPAA & Sovereign Consent Compliant:</strong> Your health records and diagnostic panels remain strictly private. Neither trainers nor physicians can access your files unless you explicitly toggle consent permissions below.
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Stored Health Documents ({reports.length})
            </h4>
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="px-3.5 py-1.5 rounded-xl bg-healthcare-primary/20 text-healthcare-accent hover:bg-healthcare-primary/30 border border-healthcare-primary/40 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              {showUploadForm ? 'Cancel Upload' : 'Upload Lab Panel / MRI'}
            </button>
          </div>

          {/* Upload Form */}
          {showUploadForm && (
            <form onSubmit={handleUpload} className="p-4 rounded-2xl bg-surface-1 border border-surface-border space-y-3 animate-in slide-in-from-top-2">
              <h5 className="text-xs font-bold text-white">Upload New Medical Record</h5>
              <input
                type="text"
                placeholder="Document Title (e.g., Lipid & Hormone Panel)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-healthcare-primary"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-healthcare-primary"
                >
                  <option value="Biomarkers & Blood Panel">Biomarkers & Blood Panel</option>
                  <option value="Imaging & Radiology (MRI/USG)">Imaging & Radiology (MRI/USG)</option>
                  <option value="Metabolic & Ergometry Report">Metabolic & Ergometry Report</option>
                </select>
                <input
                  type="text"
                  placeholder="Key Biomarkers / Lab Highlights"
                  value={newHighlights}
                  onChange={(e) => setNewHighlights(e.target.value)}
                  className="bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-healthcare-primary"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-healthcare-primary text-gray-950 font-bold rounded-xl text-xs shadow-glow-healthcare transition"
              >
                Confirm & Securely Encrypt File
              </button>
            </form>
          )}

          {/* Reports List */}
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl bg-surface-1 border border-surface-border space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-2 border border-white/10 flex items-center justify-center text-healthcare-accent">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-headline font-bold text-white text-sm">{r.title}</div>
                      <div className="text-[11px] text-gray-400">{r.type} • {r.uploadDate} • {r.lab}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded">
                    {r.fileSize}
                  </span>
                </div>

                <div className="text-xs text-gray-300 bg-surface-2/60 p-2.5 rounded-xl border border-white/5">
                  <span className="text-healthcare-accent font-semibold">Highlights: </span>
                  {r.highlights}
                </div>

                {/* Explicit Consent Matrix Toggles */}
                <div className="pt-2 border-t border-surface-border flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-400 font-medium">Explicit Access Permissions:</span>
                  <div className="flex items-center gap-2">
                    
                    {/* Doctor Consent Toggle */}
                    <button
                      onClick={() => toggleConsent(r, 'doctor')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                        r.sharedWithDoctor
                          ? 'bg-healthcare-primary/20 text-healthcare-accent border-healthcare-primary/50'
                          : 'bg-surface-2 text-gray-500 border-surface-border'
                      }`}
                    >
                      {r.sharedWithDoctor ? <Check className="w-3 h-3 text-healthcare-primary" /> : <Lock className="w-3 h-3" />}
                      Dr. Ananya Iyer (MD)
                    </button>

                    {/* Physio Consent Toggle */}
                    <button
                      onClick={() => toggleConsent(r, 'physio')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                        r.sharedWithPhysio
                          ? 'bg-healthcare-primary/20 text-healthcare-accent border-healthcare-primary/50'
                          : 'bg-surface-2 text-gray-500 border-surface-border'
                      }`}
                    >
                      {r.sharedWithPhysio ? <Check className="w-3 h-3 text-healthcare-primary" /> : <Lock className="w-3 h-3" />}
                      Dr. Ramesh Sharma (PT)
                    </button>

                    {/* Trainer Consent Toggle */}
                    <button
                      onClick={() => toggleConsent(r, 'trainer')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                        r.sharedWithTrainer
                          ? 'bg-fitness-primary/20 text-fitness-primary border-fitness-primary/50'
                          : 'bg-surface-2 text-gray-500 border-surface-border'
                      }`}
                    >
                      {r.sharedWithTrainer ? <Check className="w-3 h-3 text-fitness-primary" /> : <Lock className="w-3 h-3" />}
                      Coach Raj Patel
                    </button>

                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
