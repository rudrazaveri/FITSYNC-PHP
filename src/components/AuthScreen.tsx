'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserRole, Gym } from '@/types';
import { haptics } from '@/lib/audio-haptics';
import {
  NewUserRegistrationParams,
  findRegisteredUser,
  getRegisteredUsers,
  resetAllLocalData,
  isCleanSlateActive,
  setCleanSlateActive
} from '@/lib/store';
import {
  Dumbbell,
  ShieldCheck,
  ArrowRight,
  Building2,
  UserCheck,
  CheckCircle2,
  Lock,
  Mail,
  KeyRound,
  Phone,
  Scale,
  Award,
  Briefcase,
  GraduationCap,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Check,
  X,
  Trash2,
  Database,
  ExternalLink
} from 'lucide-react';

export interface AuthUserCredentials {
  email: string;
  role: UserRole;
  name?: string;
  password?: string;
  gym?: Gym;
  isDemo?: boolean;
  isNewRegistration?: boolean;
  registrationParams?: NewUserRegistrationParams;
}

interface AuthScreenProps {
  gyms: Gym[];
  onAuthenticate: (credentials: AuthUserCredentials) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ gyms, onAuthenticate }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'demo'>('signin');

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [registeredAccounts, setRegisteredAccounts] = useState<{ email: string; name: string; role?: UserRole }[]>([]);

  // Forgot Password Modal State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Registration Form State
  const [regRole, setRegRole] = useState<UserRole>('member');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAvatarUrl, setRegAvatarUrl] = useState('');
  const [regError, setRegError] = useState<string | null>(null);

  // Selected Gym
  const [selectedGymId, setSelectedGymId] = useState<string>(gyms[0]?.id || 'gym_fitzone_vadodara');

  // Member-Specific Biometrics
  const [regGoal, setRegGoal] = useState<'Build Muscle' | 'Lose Weight' | 'Increase Strength' | 'Improve Endurance' | 'General Fitness'>('Build Muscle');
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regAge, setRegAge] = useState<number>(24);
  const [regHeightCm, setRegHeightCm] = useState<number>(175);
  const [regWeightKg, setRegWeightKg] = useState<number>(70);
  const [regActivity, setRegActivity] = useState<'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active'>('Moderately Active');
  const [regDiet, setRegDiet] = useState<'Non-Vegetarian' | 'Vegetarian' | 'Eggetarian' | 'Vegan'>('Non-Vegetarian');

  // Trainer-Specific Fields
  const [trainerSpecialization, setTrainerSpecialization] = useState<string>('Strength & Conditioning');
  const [trainerExperienceYears, setTrainerExperienceYears] = useState<number>(5);
  const [trainerQualifications, setTrainerQualifications] = useState<string>('B.Sc Sports & Exercise Science');
  const [trainerCertifications, setTrainerCertifications] = useState<string>('ACE Certified Personal Trainer, CPR/AED Certified');
  const [trainerBio, setTrainerBio] = useState<string>('');

  // Clean Slate & Storage Info Dialogs
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [cleanSlateBanner, setCleanSlateBanner] = useState(false);

  useEffect(() => {
    // Check if clean slate mode is currently active
    if (isCleanSlateActive()) {
      setCleanSlateBanner(true);
      setActiveTab('register');
    }
  }, []);

  const handleResetDatabase = () => {
    haptics.playSuccess();
    resetAllLocalData();
    setRegisteredAccounts([]);
    setLoginEmail('');
    setLoginPassword('');
    setRegName('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
    setRegConfirmPassword('');
    setActiveTab('register');
    setShowResetConfirm(false);
    setCleanSlateBanner(true);
  };

  useEffect(() => {
    // Check locally registered accounts on this device
    try {
      const users = getRegisteredUsers();
      const accounts = Object.values(users).map(u => ({
        email: u.email,
        name: u.name,
        role: u.state.userProfile?.role || 'member'
      }));
      setRegisteredAccounts(accounts);
    } catch (e) {
      console.error(e);
    }
  }, [activeTab]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleanEmail = loginEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setLoginError('Please enter your email address.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    // 1. Check if user is registered in local storage registry
    const registeredUser = findRegisteredUser(cleanEmail);
    if (registeredUser) {
      // Validate password if one was set during registration
      if (registeredUser.password && registeredUser.password !== loginPassword) {
        setLoginError('Incorrect password. Please verify your credentials or use Forgot Password.');
        haptics.playTap();
        return;
      }

      haptics.playSuccess();
      onAuthenticate({
        email: registeredUser.email,
        role: registeredUser.state.userProfile?.role || 'member',
        name: registeredUser.name,
        password: loginPassword,
        isDemo: false,
        isNewRegistration: false
      });
      return;
    }

    // 2. Check if user typed Coach Raj's credentials
    if (cleanEmail === 'coach.raj@fitsync.health' || (cleanEmail.includes('raj') && cleanEmail.includes('coach'))) {
      haptics.playSuccess();
      onAuthenticate({
        email: 'coach.raj@fitsync.health',
        role: 'trainer',
        name: 'Coach Raj Patel',
        isDemo: true,
        isNewRegistration: false
      });
      return;
    }

    // 3. Check if user typed Aarav's demo credentials
    if (cleanEmail === 'aarav.shah@fitsync.health' || (cleanEmail.includes('aarav') && cleanEmail.includes('demo'))) {
      haptics.playSuccess();
      onAuthenticate({
        email: 'aarav.shah@fitsync.health',
        role: 'member',
        name: 'Aarav Shah',
        isDemo: true,
        isNewRegistration: false
      });
      return;
    }

    // 4. Email not registered yet
    haptics.playTap();
    setLoginError(
      `No account found for "${cleanEmail}". Click 'Register' to create a new profile, or choose a '1-Click Demo' account.`
    );
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim() || !regEmail.trim()) {
      setRegError('Please provide your full name and a valid email address.');
      return;
    }

    if (!regPhone.trim()) {
      setRegError('Please enter your mobile phone number for gym verification.');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-enter your confirm password.');
      return;
    }

    haptics.playSuccess();
    const gymObj = gyms.find(g => g.id === selectedGymId) || gyms[0];

    const registrationParams: NewUserRegistrationParams = {
      role: regRole,
      fullName: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      phone: regPhone.trim(),
      mobile: regPhone.trim(),
      password: regPassword,
      avatarUrl: regAvatarUrl.trim() || (regRole === 'trainer' ? '/assets/trainer_raj.jpg' : ''),
      gym: gymObj,
      // Member-specific
      goal: regGoal,
      gender: regGender,
      age: Number(regAge) || 24,
      heightCm: Number(regHeightCm) || 175,
      weightKg: Number(regWeightKg) || 70,
      activity: regActivity,
      diet: regDiet,
      // Trainer-specific
      specialization: trainerSpecialization.split(',').map(s => s.trim()).filter(Boolean),
      experienceYears: Number(trainerExperienceYears) || 5,
      qualifications: trainerQualifications.split(',').map(s => s.trim()).filter(Boolean),
      certifications: trainerCertifications.split(',').map(s => s.trim()).filter(Boolean),
      bio: trainerBio.trim() || `${regName.trim()} is a certified gym trainer at ${gymObj.name}.`
    };

    setCleanSlateActive(true);
    onAuthenticate({
      email: regEmail.trim().toLowerCase(),
      role: regRole,
      name: regName.trim(),
      gym: gymObj,
      password: regPassword,
      isDemo: false,
      isNewRegistration: true,
      registrationParams
    });
  };

  const handleQuickDemo = (role: UserRole, email: string, name: string) => {
    haptics.playTap();
    setCleanSlateActive(false);
    onAuthenticate({
      email,
      role,
      name,
      isDemo: true,
      isNewRegistration: false
    });
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    haptics.playSuccess();
    setForgotSent(true);
  };

  return (
    <div className="min-h-screen bg-canvas-base text-gray-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-fitness-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-healthcare-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-xl z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-surface-2 border border-fitness-primary/40 shadow-glow-fitness mb-1">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden">
              <Image
                src="/assets/logo.jpg"
                alt="FitSync AI Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          <h1 className="font-headline font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            FitSync <span className="bg-ai-gradient bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            Personalized fitness intelligence for Gym Athletes and Certified Strength Trainers.
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-surface-1/90 backdrop-blur-xl border border-surface-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Main Top Tabs Selector */}
          <div className="grid grid-cols-3 gap-1.5 bg-surface-2 p-1.5 rounded-2xl border border-surface-border">
            <button
              onClick={() => {
                haptics.playTap();
                setActiveTab('signin');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'signin'
                  ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                haptics.playTap();
                setActiveTab('register');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'register'
                  ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Register (New)
            </button>
            <button
              onClick={() => {
                haptics.playTap();
                setActiveTab('demo');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'demo'
                  ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ⚡ 1-Click Demo
            </button>
          </div>

          {/* TAB 1: SIGN IN FORM */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4 animate-in fade-in duration-200">
              {loginError && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-fitness-primary" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. athlete@fitsync.health or coach@fitsync.health"
                  className="w-full bg-surface-2 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary transition"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-fitness-primary" /> Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      haptics.playTap();
                      setShowForgotPassword(true);
                      setForgotSent(false);
                      setForgotEmail(loginEmail);
                    }}
                    className="text-[11px] text-fitness-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-2 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary transition"
                />
              </div>

              {/* Saved accounts shortcut if any exist */}
              {registeredAccounts.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-gray-400">Registered accounts on this device:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {registeredAccounts.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => {
                          setLoginEmail(acc.email);
                          setLoginPassword('password123');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 border border-surface-border text-[11px] text-gray-300 hover:text-white transition flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3 h-3 text-fitness-primary" />
                        <span>
                          {acc.name} ({acc.role === 'trainer' ? 'Coach' : 'Athlete'})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-surface-2 border-surface-border text-fitness-primary focus:ring-0"
                  />
                  <span>Stay signed in</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('aarav.shah@fitsync.health');
                      setLoginPassword('password123');
                    }}
                    className="text-[11px] text-fitness-primary hover:underline cursor-pointer"
                  >
                    ⚡ Athlete Fill
                  </button>
                  <span className="text-gray-500">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('coach.raj@fitsync.health');
                      setLoginPassword('password123');
                    }}
                    className="text-[11px] text-healthcare-accent hover:underline cursor-pointer font-semibold"
                  >
                    🏋️ Coach Fill
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness transition flex items-center justify-center gap-2 mt-2"
              >
                <span>Sign In to FitSync</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: REGISTRATION FORM (MEMBER OR TRAINER) */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5 animate-in fade-in duration-200">
              {regError && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Role Selection Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-fitness-primary" /> Select Your FitSync Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      haptics.playTap();
                      setRegRole('member');
                    }}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                      regRole === 'member'
                        ? 'bg-fitness-primary/10 border-fitness-primary shadow-glow-fitness'
                        : 'bg-surface-2 border-surface-border hover:border-gray-500'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-fitness-primary/20 flex items-center justify-center text-fitness-primary font-bold">
                      🏃
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Gym Member</div>
                      <div className="text-[10px] text-gray-400">Workout & nutrition athlete</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      haptics.playTap();
                      setRegRole('trainer');
                    }}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                      regRole === 'trainer'
                        ? 'bg-fitness-primary/10 border-fitness-primary shadow-glow-fitness'
                        : 'bg-surface-2 border-surface-border hover:border-gray-500'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-healthcare-accent/20 flex items-center justify-center text-healthcare-accent font-bold">
                      🏋️
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Gym Trainer</div>
                      <div className="text-[10px] text-gray-400">Coach assigned athletes</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 1. Common Registration Fields */}
              <div className="space-y-3 pt-2 border-t border-surface-border/60">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-fitness-primary" /> Step 1: Personal Account Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder={regRole === 'trainer' ? 'e.g. Vikram Malhotra' : 'e.g. Rohan Sharma'}
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder={regRole === 'trainer' ? 'coach.vikram@fitsync.health' : 'rohan@example.com'}
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-fitness-primary" /> Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Profile Picture URL (Optional)</label>
                    <input
                      type="text"
                      value={regAvatarUrl}
                      onChange={(e) => setRegAvatarUrl(e.target.value)}
                      placeholder="https://... (or leave blank)"
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Password *</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary transition"
                    />
                  </div>
                </div>
              </div>

              {/* 2. ROLE SPECIFIC FIELDS */}
              {regRole === 'member' ? (
                /* Member Biometrics & Goal */
                <div className="space-y-3 pt-2 border-t border-surface-border/60">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-healthcare-accent" /> Step 2: Member Biometrics & Goal
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-400">Gender</label>
                      <select
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value as any)}
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-400">Age</label>
                      <input
                        type="number"
                        min="14"
                        max="90"
                        required
                        value={regAge}
                        onChange={(e) => setRegAge(parseInt(e.target.value) || 24)}
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-400">Height (cm)</label>
                      <input
                        type="number"
                        min="120"
                        max="230"
                        required
                        value={regHeightCm}
                        onChange={(e) => setRegHeightCm(parseInt(e.target.value) || 175)}
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-400">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="35"
                        max="220"
                        required
                        value={regWeightKg}
                        onChange={(e) => setRegWeightKg(parseFloat(e.target.value) || 70)}
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-400">Primary Goal</label>
                      <select
                        value={regGoal}
                        onChange={(e) => setRegGoal(e.target.value as any)}
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                      >
                        <option value="Build Muscle">Build Muscle (Hypertrophy Surplus)</option>
                        <option value="Lose Weight">Lose Weight (Fat Loss Deficit)</option>
                        <option value="Increase Strength">Increase Strength</option>
                        <option value="General Fitness">General Fitness</option>
                        <option value="Improve Endurance">Improve Endurance</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-400">Activity Level</label>
                      <select
                        value={regActivity}
                        onChange={(e) => setRegActivity(e.target.value as any)}
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                      >
                        <option value="Sedentary">Sedentary (1.2× BMR)</option>
                        <option value="Lightly Active">Lightly Active (1.375× BMR)</option>
                        <option value="Moderately Active">Moderately Active (1.55× BMR)</option>
                        <option value="Very Active">Very Active (1.725× BMR)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                /* Trainer Professional Credentials */
                <div className="space-y-3 pt-2 border-t border-surface-border/60">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-healthcare-accent" /> Step 2: Trainer Professional Profile
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-400">Trainer Specialization *</label>
                      <input
                        type="text"
                        required
                        value={trainerSpecialization}
                        onChange={(e) => setTrainerSpecialization(e.target.value)}
                        placeholder="Strength & Conditioning, Hypertrophy, Biomechanics"
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-400">Years of Experience *</label>
                      <input
                        type="number"
                        min="1"
                        max="40"
                        required
                        value={trainerExperienceYears}
                        onChange={(e) => setTrainerExperienceYears(parseInt(e.target.value) || 5)}
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Qualifications & Degree</label>
                    <input
                      type="text"
                      value={trainerQualifications}
                      onChange={(e) => setTrainerQualifications(e.target.value)}
                      placeholder="e.g. B.Sc Sports Science, Diploma in Fitness Training"
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Certifications (comma-separated) *</label>
                    <input
                      type="text"
                      required
                      value={trainerCertifications}
                      onChange={(e) => setTrainerCertifications(e.target.value)}
                      placeholder="ACE Certified Personal Trainer, CPR/AED First Aid"
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Coach Bio (Optional)</label>
                    <textarea
                      rows={2}
                      value={trainerBio}
                      onChange={(e) => setTrainerBio(e.target.value)}
                      placeholder="Introduce your coaching philosophy and track record..."
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                    />
                  </div>
                </div>
              )}

              {/* 3. Assigned Gym / Gym Association Selection */}
              <div className="space-y-2 pt-2 border-t border-surface-border/60">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-fitness-primary" />
                  {regRole === 'trainer' ? 'Step 3: Select Assigned Gym' : 'Step 3: Select Home Gym Branch'}
                </label>
                <div className="space-y-2">
                  {gyms.slice(0, 3).map((gym) => {
                    const isSelected = selectedGymId === gym.id;
                    return (
                      <div
                        key={gym.id}
                        onClick={() => {
                          haptics.playTap();
                          setSelectedGymId(gym.id);
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-fitness-primary/10 border-fitness-primary shadow-glow-fitness'
                            : 'bg-surface-2 border-surface-border hover:border-gray-500'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{gym.name}</span>
                            <span className="text-[10px] text-fitness-primary font-mono">{gym.rating} ★</span>
                          </div>
                          <div className="text-[11px] text-gray-400">{gym.location} • {gym.distance}</div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-fitness-primary" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness transition flex items-center justify-center gap-2 mt-3"
              >
                <span>
                  {regRole === 'trainer' ? 'Create Trainer Profile & Enter Coach Portal' : 'Create Athlete Profile & Enter FitSync'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: 1-CLICK QUICK DEMO ACCOUNTS */}
          {activeTab === 'demo' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="p-3 rounded-2xl bg-surface-2/80 border border-surface-border text-xs text-gray-400">
                Instantly enter either user role with pre-configured fitness data and workout plans:
              </div>

              {/* Demo Account: Aarav Shah */}
              <div
                onClick={() => handleQuickDemo('member', 'aarav.shah@fitsync.health', 'Aarav Shah')}
                className="p-4 rounded-2xl bg-surface-2 border border-surface-border hover:border-fitness-primary/60 cursor-pointer transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-fitness-primary/50">
                    <Image src="/assets/aarav.jpg" alt="Aarav Shah" fill className="object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-fitness-primary transition flex items-center gap-1.5">
                      <span>Aarav Shah</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-fitness-primary/20 text-fitness-primary font-semibold">
                        Gym Member
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">FitZone Vadodara • Workouts, nutrition logs, water, streak & attendance</div>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-fitness-primary text-gray-950 shadow-glow-fitness flex-shrink-0">
                  Athlete Dashboard →
                </span>
              </div>

              {/* Demo Account: Coach Raj Patel */}
              <div
                onClick={() => handleQuickDemo('trainer', 'coach.raj@fitsync.health', 'Coach Raj Patel')}
                className="p-4 rounded-2xl bg-surface-2 border border-surface-border hover:border-healthcare-accent/60 cursor-pointer transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden relative border-2 border-healthcare-accent/70">
                    <Image src="/assets/trainer_raj.jpg" alt="Coach Raj Patel" fill className="object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-healthcare-accent transition flex items-center gap-1.5">
                      <span>Coach Raj Patel</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-healthcare-accent/20 text-healthcare-accent font-bold">
                        Gym Trainer
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">FitZone Vadodara • 24 assigned members, attention alerts, routine builder</div>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-healthcare-accent text-white shadow-glow-healthcare flex-shrink-0">
                  Trainer Dashboard →
                </span>
              </div>
            </div>
          )}

          {/* Clean Slate Active Feedback Banner */}
          {cleanSlateBanner && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="font-bold text-white block">Clean Database Mode Active</span>
                  <span className="text-[11px] text-gray-300">All pre-defined demo data has been wiped. Register a real Athlete or Coach below to start from scratch.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCleanSlateBanner(false)}
                className="w-6 h-6 rounded-lg bg-surface-2 hover:bg-surface-3 text-gray-400 hover:text-white flex items-center justify-center flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Database Reset & Storage Info Toolbar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-surface-border/60">
            <button
              type="button"
              onClick={() => {
                haptics.playTap();
                setShowResetConfirm(true);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold transition flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition" />
              <span>🧹 Reset Database (Start from Scratch)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptics.playTap();
                setShowStorageModal(true);
              }}
              className="text-gray-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer py-1"
            >
              <Database className="w-3.5 h-3.5 text-fitness-primary" />
              <span>Where &amp; How is Data Stored?</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Database Confirmation Modal Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-1 border border-surface-border rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-400 font-bold text-base">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <span>Reset Database to Clean Slate?</span>
            </div>
            
            <p className="text-xs text-gray-300 leading-relaxed">
              This will clear all browser-stored data: demo accounts, registered athlete profiles, coach assignments, meal logs, hydration logs, and attendance streaks.
            </p>

            <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border text-[11px] text-gray-300 space-y-1.5 font-mono">
              <div className="text-fitness-primary font-bold">Wipes following local storage records:</div>
              <div className="text-gray-400">• fitsync_ai_state_v2 (Session &amp; telemetry)</div>
              <div className="text-gray-400">• fitsync_ai_registered_users_v2 (User registry)</div>
              <div className="text-gray-400">• fitsync_trainer_runtime_v1 (Coach cache)</div>
              <div className="text-emerald-400 pt-1">Result: 100% clean blank database for live demo.</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 bg-surface-2 hover:bg-surface-3 text-gray-300 text-xs font-semibold rounded-xl border border-surface-border transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDatabase}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                Yes, Wipe &amp; Start Fresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Storage & Architecture Info Modal */}
      {showStorageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto bg-surface-1 border border-surface-border rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                <Database className="w-4 h-4 text-fitness-primary" />
                <span>FitSync AI — Database Storage Architecture</span>
              </div>
              <button
                onClick={() => setShowStorageModal(false)}
                className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>1. Cloud PostgreSQL Database (Supabase)</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  All relational entities are stored in your Supabase project in the <code className="text-fitness-primary font-mono">public</code> PostgreSQL schema.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-300 pt-1">
                  <div className="p-2 rounded-lg bg-surface-1 border border-surface-border">
                    <span className="text-fitness-primary font-bold">user_profiles</span>: Athletes &amp; Trainers
                  </div>
                  <div className="p-2 rounded-lg bg-surface-1 border border-surface-border">
                    <span className="text-fitness-primary font-bold">trainers</span>: Bios, certifications, ratings
                  </div>
                  <div className="p-2 rounded-lg bg-surface-1 border border-surface-border">
                    <span className="text-fitness-primary font-bold">gyms</span>: Partner gyms &amp; locations
                  </div>
                  <div className="p-2 rounded-lg bg-surface-1 border border-surface-border">
                    <span className="text-fitness-primary font-bold">workout_sessions</span>: Logged sets &amp; reps
                  </div>
                  <div className="p-2 rounded-lg bg-surface-1 border border-surface-border">
                    <span className="text-fitness-primary font-bold">custom_workout_plans</span>: Coach splits
                  </div>
                  <div className="p-2 rounded-lg bg-surface-1 border border-surface-border">
                    <span className="text-fitness-primary font-bold">trainer_interventions</span>: Attention alerts
                  </div>
                </div>
                <div className="pt-2 text-[11px] text-gray-400">
                  <strong className="text-white">How to view in Supabase:</strong> Open your Supabase Dashboard → click <strong>Table Editor</strong> (grid icon in left menu) to view and edit tables like an Excel spreadsheet.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>2. Local Browser Engine Storage (localStorage)</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Client sessions, offline state cache, telemetry, and newly registered profiles are persisted in your browser under <code className="text-blue-400 font-mono">http://localhost:3000</code>.
                </p>
                <div className="text-[11px] text-gray-400 space-y-1 font-mono">
                  <div>• <span className="text-gray-200">fitsync_ai_state_v2</span>: Active session, meals, water, streak</div>
                  <div>• <span className="text-gray-200">fitsync_ai_registered_users_v2</span>: Registered accounts registry</div>
                </div>
                <div className="pt-2 text-[11px] text-gray-400">
                  <strong className="text-white">How to view in Browser:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-surface-1 border border-surface-border font-mono text-[10px]">F12</kbd> → click <strong>Application</strong> tab → expand <strong>Local Storage</strong> → <code className="text-white">http://localhost:3000</code>.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border space-y-1.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>3. Connecting Local Next.js to Your Supabase Cloud</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  In your project root, open <code className="text-purple-300 font-mono">.env.local</code> and paste your Supabase Project URL &amp; Anon Key from Supabase Dashboard → <strong>Project Settings → API</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-surface-border flex justify-end">
              <button
                type="button"
                onClick={() => setShowStorageModal(false)}
                className="px-5 py-2.5 bg-surface-2 hover:bg-surface-3 text-white text-xs font-bold rounded-xl border border-surface-border transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
