import React, { useState } from 'react';
import { api } from '../services/api';
import {
  GraduationCap,
  Users2,
  X,
  CheckCircle2,
  ShieldCheck,
  Plus
} from 'lucide-react';

export function AddStudentProfileModal({ isOpen, onClose, onSuccess, existingGuardian = null }) {
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [guardianName, setGuardianName] = useState(existingGuardian?.guardian_name || '');
  const [guardianEmail, setGuardianEmail] = useState(existingGuardian?.guardian_email || '');
  const [dailyLimit, setDailyLimit] = useState(String(existingGuardian?.default_daily_limit ?? 100));
  const [weeklyLimit, setWeeklyLimit] = useState(String(existingGuardian?.default_weekly_limit ?? 400));
  const [monthlyLimit, setMonthlyLimit] = useState(String(existingGuardian?.default_monthly_limit ?? 1200));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!studentName.trim()) {
      setFormError('Please enter the student full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid student email address.');
      return;
    }
    if (!dateOfBirth) {
      setFormError('Please enter the student date of birth for age & guardrail verification.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.student.createProfile({
        student_name: studentName.trim(),
        email: email.trim(),
        date_of_birth: dateOfBirth,
        institution_name: institutionName.trim() || 'University / Learning Institution',
        student_id_number: studentIdNumber.trim(),
        guardian_name: existingGuardian?.guardian_name || guardianName.trim(),
        guardian_email: existingGuardian?.guardian_email || guardianEmail.trim(),
        daily_limit: parseFloat(dailyLimit || 100),
        weekly_limit: parseFloat(weeklyLimit || 400),
        monthly_limit: parseFloat(monthlyLimit || 1200)
      });

      if (res?.success || res?.profile) {
        setStudentName('');
        setEmail('');
        setDateOfBirth('');
        setInstitutionName('');
        setStudentIdNumber('');
        if (onSuccess) onSuccess(res);
        onClose();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create student profile.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-student-profile-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] rounded-2xl shadow-2xl overflow-y-auto max-h-[92vh] p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#DEDEDE] dark:border-[#222222]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 id="add-student-profile-title" className="text-base font-semibold text-[#111111] dark:text-white">
                Add Student Profile
              </h3>
              <p className="text-xs text-[#666666] dark:text-[#999999]">
                Set up age verification, institution details, and educational limits
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Add Student Profile modal"
            className="p-1.5 rounded-lg text-[#666666] hover:text-[#111111] dark:text-[#999999] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-[#F7F7F7] dark:bg-[#141414] border border-[#111111] dark:border-[#444444] text-[#111111] dark:text-white text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                Student Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rohan Verma"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                Student Email
              </label>
              <input
                type="email"
                required
                placeholder="e.g. rohan@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                School / University Name
              </label>
              <input
                type="text"
                placeholder="e.g. Delhi Public School"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
              Student ID / Enrollment No. (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. STU-2026-041"
              value={studentIdNumber}
              onChange={(e) => setStudentIdNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
            />
          </div>

          {!existingGuardian && (
            <div className="p-3.5 rounded-xl bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#262626] space-y-3">
              <div className="text-[11px] font-semibold text-[#111111] dark:text-white">
                Link Parent / Guardian Now (Optional — or add later)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Parent Name"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                />
                <input
                  type="email"
                  placeholder="parent@email.com"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#666666] dark:text-[#999999] mb-1">
                Daily Limit (USD)
              </label>
              <input
                type="number"
                min="10"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#666666] dark:text-[#999999] mb-1">
                Weekly Limit (USD)
              </label>
              <input
                type="number"
                min="10"
                value={weeklyLimit}
                onChange={(e) => setWeeklyLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#666666] dark:text-[#999999] mb-1">
                Monthly Limit (USD)
              </label>
              <input
                type="number"
                min="10"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#DEDEDE] dark:border-[#222222]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-[#666666] hover:text-[#111111] dark:text-[#999999] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-full bg-black hover:bg-[#222222] dark:bg-white dark:text-black dark:hover:bg-[#EEEEEE] text-white font-semibold text-xs disabled:opacity-50 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{submitting ? 'Creating Profile...' : 'Create Student Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddParentProfileModal({ isOpen, onClose, onSuccess }) {
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [dailyLimit, setDailyLimit] = useState('100');
  const [weeklyLimit, setWeeklyLimit] = useState('400');
  const [monthlyLimit, setMonthlyLimit] = useState('1200');
  const [autoThreshold, setAutoThreshold] = useState('50');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!guardianName.trim()) {
      setFormError('Please enter Parent / Guardian full name.');
      return;
    }
    if (!guardianEmail.trim() || !guardianEmail.includes('@')) {
      setFormError('Please enter a valid Parent / Guardian email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.guardian.createProfile({
        guardian_name: guardianName.trim(),
        guardian_email: guardianEmail.trim(),
        relationship,
        daily_limit: parseFloat(dailyLimit || 100),
        weekly_limit: parseFloat(weeklyLimit || 400),
        monthly_limit: parseFloat(monthlyLimit || 1200),
        auto_approval_threshold: parseFloat(autoThreshold || 50)
      });

      if (res?.success || res?.guardian) {
        setGuardianName('');
        setGuardianEmail('');
        if (onSuccess) onSuccess(res);
        onClose();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create parent profile.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-parent-profile-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#DEDEDE] dark:border-[#222222]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="add-parent-profile-title" className="text-base font-semibold text-[#111111] dark:text-white">
                Add Parent / Guardian Profile
              </h3>
              <p className="text-xs text-[#666666] dark:text-[#999999]">
                Configure approval authority and default student spending limits
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Add Parent Profile modal"
            className="p-1.5 rounded-lg text-[#666666] hover:text-[#111111] dark:text-[#999999] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-[#F7F7F7] dark:bg-[#141414] border border-[#111111] dark:border-[#444444] text-[#111111] dark:text-white text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                Parent / Guardian Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Meera Verma"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                Parent / Guardian Email
              </label>
              <input
                type="email"
                required
                placeholder="e.g. meera.parent@email.com"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                Relationship
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              >
                <option value="Parent">Parent</option>
                <option value="Legal Guardian">Legal Guardian</option>
                <option value="Sponsor">Educational Sponsor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                Auto-Approval Limit (USD)
              </label>
              <input
                type="number"
                min="0"
                value={autoThreshold}
                onChange={(e) => setAutoThreshold(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#666666] dark:text-[#999999] mb-1">
                Daily Limit (USD)
              </label>
              <input
                type="number"
                min="10"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#666666] dark:text-[#999999] mb-1">
                Weekly Limit (USD)
              </label>
              <input
                type="number"
                min="10"
                value={weeklyLimit}
                onChange={(e) => setWeeklyLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#666666] dark:text-[#999999] mb-1">
                Monthly Limit (USD)
              </label>
              <input
                type="number"
                min="10"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#2B2B2B] flex items-center gap-2.5 text-[11px] text-[#666666] dark:text-[#999999]">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#111111] dark:text-white" />
            <span>
              Any student profile added to this account will automatically inherit guardian oversight and approval routing.
            </span>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#DEDEDE] dark:border-[#222222]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-[#666666] hover:text-[#111111] dark:text-[#999999] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-full bg-black hover:bg-[#222222] dark:bg-white dark:text-black dark:hover:bg-[#EEEEEE] text-white font-semibold text-xs disabled:opacity-50 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving Profile...' : 'Create Parent Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FamilyProfileSetupCard({
  hasStudent,
  hasGuardian,
  guardianProfile,
  studentProfile,
  onOpenStudentModal,
  onOpenParentModal,
  onSwitchPortal,
  currentPortal
}) {
  return (
    <div className="p-8 rounded-[24px] bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] shadow-sm space-y-6">
      <div className="max-w-2xl space-y-2">
        <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#EEEEEE] dark:bg-[#1A1A1A] text-[#111111] dark:text-white border border-[#DEDEDE] dark:border-[#333333]">
          Family &amp; Student Setup
        </span>
        <h2 className="text-2xl font-semibold text-[#111111] dark:text-white tracking-[-0.025em]">
          {currentPortal === 'student'
            ? 'No student profile linked to this account yet'
            : 'No parent or guardian profile linked yet'}
        </h2>
        <p className="text-xs sm:text-sm text-[#666666] dark:text-[#999999] leading-relaxed">
          Start by adding a <strong>Student Profile</strong> or a <strong>Parent / Guardian Profile</strong> first. You can create either one in any order and link them together.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1: Student Profile Card */}
        <div className="p-5 rounded-2xl bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#262626] flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#111111] dark:text-white">
              {hasStudent ? `Student Linked: ${studentProfile?.student_name}` : '1. Add Student Profile'}
            </h3>
            <p className="text-xs text-[#666666] dark:text-[#999999] leading-relaxed">
              {hasStudent
                ? `${studentProfile?.institution_name || 'Student'} • ${studentProfile?.email}`
                : 'Register a student account with age verification, educational institution details, and course allowance limits.'}
            </p>
          </div>
          {hasStudent ? (
            <button
              type="button"
              onClick={onSwitchPortal}
              className="px-4 py-2.5 rounded-full bg-[#EEEEEE] dark:bg-[#1E1E1E] text-[#111111] dark:text-white text-xs font-semibold hover:bg-[#E0E0E0] dark:hover:bg-[#2A2A2A] transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <span>Open Student Portal</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenStudentModal}
              className="px-4 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student Profile</span>
            </button>
          )}
        </div>

        {/* Option 2: Parent / Guardian Profile Card */}
        <div className="p-5 rounded-2xl bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#262626] flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
              <Users2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#111111] dark:text-white">
              {hasGuardian ? `Parent Linked: ${guardianProfile?.guardian_name}` : '2. Add Parent / Guardian Profile'}
            </h3>
            <p className="text-xs text-[#666666] dark:text-[#999999] leading-relaxed">
              {hasGuardian
                ? `${guardianProfile?.relationship || 'Parent'} • ${guardianProfile?.guardian_email}`
                : 'Set up parent/guardian consent controls, spending limits, and real-time approval permissions.'}
            </p>
          </div>
          {hasGuardian ? (
            <button
              type="button"
              onClick={onSwitchPortal}
              className="px-4 py-2.5 rounded-full bg-[#EEEEEE] dark:bg-[#1E1E1E] text-[#111111] dark:text-white text-xs font-semibold hover:bg-[#E0E0E0] dark:hover:bg-[#2A2A2A] transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <span>Open Parent Portal</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenParentModal}
              className="px-4 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Parent Profile</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

