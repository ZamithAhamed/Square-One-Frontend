import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import type { Patient } from '../types';

type Mode = 'create' | 'edit';

type Props = {
  open: boolean;
  mode?: Mode;
  initialPatient?: Patient | null;
  onClose: () => void;
  onCreate?: (payload: {
    name: string; email: string; phone: string; dob: string;
    gender: 'male' | 'female' | 'other'; bloodType?: string; allergies?: string;
  }) => Promise<void> | void;
  onUpdate?: (payload: {
    name: string; email: string; phone: string; dob: string;
    gender: 'male' | 'female' | 'other'; bloodType?: string; allergies?: string;
  }) => Promise<void> | void;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  dob: string; // yyyy-mm-dd
  gender: 'male' | 'female' | 'other' | '';
  bloodType: string;
  allergies: string;
  patientId?: string; // read-only in edit
};

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  dob: '',
  gender: '',
  bloodType: '',
  allergies: '',
};

// Safely format various date inputs to yyyy-mm-dd (local timezone)
function toLocalInputDate(value?: string | Date | null): string {
  if (!value) return '';
  if (typeof value === 'string') {
    // If it's already yyyy-mm-dd, use as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return tz.toISOString().slice(0, 10);
  }
  const tz = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

const AddPatientModal: React.FC<Props> = ({
  open,
  mode = 'create',
  initialPatient,
  onClose,
  onCreate,
  onUpdate,
}) => {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialPatient) {
      setForm({
        name: initialPatient.name ?? '',
        email: initialPatient.email ?? '',
        phone: initialPatient.phone ?? initialPatient.contact ?? '',
        dob: toLocalInputDate(initialPatient.dob ?? ''),
        gender: (initialPatient.gender as any) ?? '',
        bloodType: (initialPatient.bloodType as any) ?? '',
        allergies: initialPatient.allergies ?? '',
        patientId: initialPatient.patientId ?? undefined,
      });
      setErrors({});
    } else {
      setForm(emptyForm);
      setErrors({});
    }
  }, [open, mode, initialPatient]);

  useEffect(() => {
    if (open) firstFieldRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const set = (k: keyof FormState, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim()) e.phone = 'Required';
    if (!form.dob) e.dob = 'Required';
    if (!form.gender) e.gender = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        dob: form.dob, // yyyy-mm-dd
        gender: form.gender as 'male' | 'female' | 'other',
        bloodType: form.bloodType || undefined, // <- fixed key
        allergies: form.allergies.trim() || undefined,
      };
      if (mode === 'create') {
        await onCreate?.(payload);
      } else {
        await onUpdate?.(payload);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === 'edit' ? 'Edit Patient' : 'Add New Patient';
  const submitLabel = submitting ? 'Saving…' : (mode === 'edit' ? 'Save Changes' : 'Save Patient');

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      {/* Modal container */}
      <div className="absolute inset-0 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-3xl bg-gray-900 text-gray-100 rounded-2xl shadow-xl border border-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-800">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="text-sm font-medium">Full Name <span className="text-red-400">*</span></label>
                <input
                  ref={firstFieldRef}
                  className={`mt-1 w-full rounded-lg border p-2.5 bg-gray-950 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-800'
                  }`}
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium">Email <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  className={`mt-1 w-full rounded-lg border p-2.5 bg-gray-950 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-800'
                  }`}
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-medium">Phone <span className="text-red-400">*</span></label>
                <input
                  className={`mt-1 w-full rounded-lg border p-2.5 bg-gray-950 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-800'
                  }`}
                  placeholder="+94 77 123 4567"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                />
                {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
              </div>

              {/* DOB */}
              <div>
                <label className="text-sm font-medium">Date of Birth <span className="text-red-400">*</span></label>
                <input
                  type="date"
                  className={`mt-1 w-full rounded-lg border p-2.5 bg-gray-950 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.dob ? 'border-red-500' : 'border-gray-800'
                  }`}
                  value={form.dob}
                  onChange={e => set('dob', e.target.value)}
                />
                {errors.dob && <p className="text-xs text-red-400 mt-1">{errors.dob}</p>}
              </div>

              {/* Gender */}
              <div>
                <label className="text-sm font-medium">Gender <span className="text-red-400">*</span></label>
                <select
                  className={`mt-1 w-full rounded-lg border p-2.5 bg-gray-950 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.gender ? 'border-red-500' : 'border-gray-800'
                  }`}
                  value={form.gender}
                  onChange={e => set('gender', e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="text-xs text-red-400 mt-1">{errors.gender}</p>}
              </div>

              {/* Blood Type */}
              <div>
                <label className="text-sm font-medium">Blood Type</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-800 p-2.5 bg-gray-950 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.bloodType}
                  onChange={e => set('bloodType', e.target.value)}
                >
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>

              {/* Patient ID (read-only, edit mode only) */}
              {mode === 'edit' && form.patientId && (
                <div>
                  <label className="text-sm font-medium">Patient ID</label>
                  <input
                    className="mt-1 w-full rounded-lg border p-2.5 bg-gray-800 text-gray-400 border-gray-800"
                    value={form.patientId}
                    disabled
                  />
                </div>
              )}

              {/* Allergies */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Allergies</label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-gray-800 p-2.5 bg-gray-950 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Comma-separated list (optional)"
                  value={form.allergies}
                  onChange={e => set('allergies', e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                {submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPatientModal;
