'use client';

import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, AlertTriangle, ShieldCheck } from 'lucide-react';
import { haptics } from '@/lib/audio-haptics';

interface FloatingAiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  isDisclaimer?: boolean;
}

export const FloatingAiAssistant: React.FC<FloatingAiAssistantProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_init',
      sender: 'ai',
      text: 'Hello! I am your FitSync AI Assistant. I can help answer general questions about exercise mechanics, recovery protocols, hydration, and gym etiquette. Note: As per FitSync platform policy, I do not generate custom workout or diet plans; you can explore the certified Predefined Diet Plans or follow workouts assigned by your trainer!'
    }
  ]);
  const [inputText, setInputText] = useState('');

  const quickPrompts = [
    'How do I maintain tight scapula during bench press?',
    'What are optimal recovery techniques for DOMS?',
    'Can you generate a custom meal plan for me?',
    'I have sharp shoulder pain when pressing overhead.'
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    haptics.playTap();

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // Process Guardrails
    setTimeout(() => {
      haptics.playAiPulse();
      const lower = text.toLowerCase();

      // Guardrail 1: Medical Triage for Acute Pain
      if (lower.includes('pain') || lower.includes('torn') || lower.includes('sharp') || lower.includes('chest pain') || lower.includes('dizzy')) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: 'ai',
            text: '⚠️ URGENT MEDICAL TRIAGE NOTICE: FitSync AI cannot provide clinical medical diagnostics or acute injury triage. If you are experiencing sharp or persistent joint/chest pain, stop exercising immediately. Please consult Dr. Ananya Iyer or Dr. Ramesh Sharma via the Health Hub tab or visit an emergency medical center.',
            isDisclaimer: true
          }
        ]);
        return;
      }

      // Guardrail 2: Refuse Custom Workout Plan Generation
      if (lower.includes('custom workout') || lower.includes('generate workout') || lower.includes('create a workout routine')) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: 'ai',
            text: 'FitSync AI does not generate autonomous workout plans. To ensure safe and biomechanically sound progression, please choose an approved program from the Workout Library or request a custom routine from your assigned trainer (Coach Raj Patel) in the Trainer tab!'
          }
        ]);
        return;
      }

      // Guardrail 3: Refuse Custom Diet / Meal Suggestions
      if (lower.includes('diet plan') || lower.includes('meal plan') || lower.includes('suggest a meal') || lower.includes('generate diet')) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: 'ai',
            text: 'FitSync AI does not generate generative diet plans or ad-hoc meal recommendations. All nutrition programming on FitSync is anchored in our validated Predefined Diet Plans (mapped to Muscle Gain, Fat Loss, Strength, or General Fitness across Veg, Non-Veg, and Vegan variants). Please visit the Nutrition tab to view your assigned plan!'
          }
        ]);
        return;
      }

      // Helpful general guidance for general fitness questions
      let reply = 'Great question! In compound strength movements like the bench press, maintaining thoracic extension, driving your feet into the floor, and pinning your shoulder blades (scapular retraction) protects your rotator cuffs and provides a stable pressing base.';
      if (lower.includes('doms') || lower.includes('recovery')) {
        reply = 'For delayed onset muscle soreness (DOMS), the most effective evidence-backed interventions are: 7–9 hours of sleep, light active recovery (e.g., 20 mins easy stationary cycling), adequate hydration (3.2–3.5L/day), and hitting your daily protein target (2.1g/kg).';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: reply
        }
      ]);
    }, 450);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-canvas-base/95 backdrop-blur-2xl border-l border-surface-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-2/60">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-ai-gradient text-white shadow-glow-nebula">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-white text-base">Ask FitSync AI</h3>
            <div className="flex items-center gap-1.5 text-[11px] text-fitness-primary font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-fitness-primary animate-pulse" />
              General Fitness Assistant & Guidance
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-surface-2 px-4 py-2 border-b border-surface-border flex items-center gap-2 text-[11px] text-gray-300">
        <ShieldCheck className="w-4 h-4 text-healthcare-primary flex-shrink-0" />
        <span>Non-diagnostic guidance engine. Workout & diet plans are predefined or trainer-assigned.</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-fitness-primary text-gray-950 font-medium rounded-tr-none'
                  : m.isDisclaimer
                  ? 'bg-status-danger/15 text-red-200 border border-status-danger/40 rounded-tl-none font-medium'
                  : 'bg-surface-2 text-gray-100 border border-surface-border rounded-tl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Prompt Chips */}
      <div className="p-3 bg-surface-2/40 border-t border-surface-border flex flex-wrap gap-1.5">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="text-[11px] bg-surface-2 hover:bg-surface-3 text-gray-300 px-2.5 py-1 rounded-full border border-surface-border hover:border-fitness-primary/50 transition text-left"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="p-3 bg-canvas-base border-t border-surface-border flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about form, recovery, hydration..."
          className="flex-1 bg-surface-2 text-sm text-white placeholder-gray-500 rounded-xl px-4 py-2.5 border border-surface-border focus:outline-none focus:border-fitness-primary"
        />
        <button
          onClick={() => handleSend()}
          className="p-2.5 bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold rounded-xl shadow-glow-fitness transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
