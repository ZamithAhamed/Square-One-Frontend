import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Appointment, Patient } from '../types';

type Mode = 'create' | 'edit';

type Props = {
  open: boolean;
  onClose: () => void;
  patients: Patient[];
  // create mode
  defaultPatient?: Patient | null;
  onCreate?: (appt: Appointment) => void;
  // edit mode
  mode?: Mode;
  initialAppointment?: Appointment | (Record<string, any> & Partial<Appointment>) | null;
  onUpdate?: (appt: Appointment) => void;
};

const timeSlots = (() => {
  const out: string[] = [];
  for (let h = 8; h <= 18; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      out.push(`${hh}:${mm}`);
    }
  }
  return out;
})();

const durations = [15, 30, 45, 60];
const todayISO = () => {
  const d = new Date();
  // local-safe yyyy-mm-dd for date input
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

// Local-safe formatter for date inputs from mixed sources
function toLocalInputDate(value?: string | Date | null): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

// --- robust resolver for edit mode ---
function resolvePatientCodeForEdit(
  appt: any | null | undefined,
  patients: Patient[]
): string {
  if (!appt || !patients.length) return '';

  const codesToTry: (string | undefined)[] = [
    (appt as any).patientId,      // UI shape (code)
    (appt as any).patient_code,   // API shape (code)
    (appt as any).patientCode,    // alt
  ].filter(Boolean);

  for (const code of codesToTry) {
    if (code && patients.some(p => p.patientId === code)) return code!;
  }

  const numeric = (appt as any).patient_id ?? (appt as any).patientId;
  if (numeric !== undefined && numeric !== null) {
    const numStr = String(numeric);
    const byId = patients.find(p => String((p as any).id) === numStr);
    if (byId) return byId.patientId;
  }

  return patients[0]?.patientId ?? '';
}

const ScheduleAppointmentModal: React.FC<Props> = ({
  open,
  onClose,
  patients,
  defaultPatient,
  onCreate,
  mode = 'create',
  initialAppointment,
  onUpdate,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const selectedPatient: Patient | undefined = useMemo(
    () => patients.find(p => p.patientId === selectedPatientId),
    [patients, selectedPatientId]
  );

  // Form fields
  const [dateStr, setDateStr] = useState<string>(todayISO());
  const [time, setTime] = useState<string>('');
  const [type, setType] = useState<'consultation' | 'follow-up' | 'checkup' | 'urgent'>('consultation');
  const [duration, setDuration] = useState<number>(30);
  const [reason, setReason] = useState<string>('');
  const [fee, setFee] = useState<number>(0);
  const [status, setStatus] = useState<'scheduled' | 'completed' | 'cancelled' | 'no-show'>('scheduled');
  const [err, setErr] = useState<string | null>(null);

  const patientSelectRef = useRef<HTMLSelectElement | null>(null);

  // Prefill on open for create/edit + focus + Esc
  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialAppointment) {
      const code = resolvePatientCodeForEdit(initialAppointment, patients);
      setSelectedPatientId(code);

      const apptDate =
        (initialAppointment as any).date ??
        (initialAppointment as any).start_time ??
        (initialAppointment as any).start_at ??
        new Date();

      setDateStr(toLocalInputDate(apptDate) || todayISO());
      setTime((initialAppointment as any).time ?? (initialAppointment as any).time_str ?? '');
      setType((initialAppointment as any).type ?? 'consultation');
      setDuration(
        (initialAppointment as any).duration ??
        (initialAppointment as any).duration_min ??
        30
      );
      setReason((initialAppointment as any).notes ?? '');
      setFee((initialAppointment as any).fee ?? (initialAppointment as any).amount ?? 0);
      setStatus((initialAppointment as any).status ?? 'scheduled');
      setErr(null);
    } else {
      if (defaultPatient?.patientId) {
        setSelectedPatientId(defaultPatient.patientId);
      } else if (patients.length) {
        setSelectedPatientId(patients[0].patientId);
      } else {
        setSelectedPatientId('');
      }
      setDateStr(todayISO());
      setTime('');
      setType('consultation');
      setDuration(30);
      setReason('');
      setFee(0);
      setStatus('scheduled');
      setErr(null);
    }

    const raf = requestAnimationFrame(() => patientSelectRef.current?.focus());
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, initialAppointment, defaultPatient, patients.length]);

  // If patients load after open (async), ensure valid selection
  useEffect(() => {
    if (!open) return;
    if (!selectedPatientId && patients.length) {
      setSelectedPatientId(patients[0].patientId);
    } else if (selectedPatientId && patients.length && !patients.some(p => p.patientId === selectedPatientId)) {
      const fallback =
        mode === 'edit' ? resolvePatientCodeForEdit(initialAppointment, patients) : patients[0].patientId;
      setSelectedPatientId(fallback);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patients]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return setErr('Please choose a patient.');
    if (!dateStr) return setErr('Please pick a date.');
    if (!time) return setErr('Please select a time.');
    if (fee === null || fee === undefined || Number.isNaN(fee) || fee < 0)
      return setErr('Please enter a valid fee.');

    const base: Appointment = {
      id:
        mode === 'edit' && initialAppointment
          ? (initialAppointment as any).id?.toString?.() ?? Date.now().toString()
          : Date.now().toString(),
      patientId: selectedPatient.patientId,
      patientName: selectedPatient.name,
      date: new Date(dateStr),
      time,
      duration,
      type,
      status,
      notes: reason.trim() || undefined,
      fee,
    };

    if (mode === 'edit') onUpdate?.(base);
    else onCreate?.(base);

    onClose();
  };

  const title = mode === 'edit' ? 'Edit Appointment' : 'Schedule New Appointment';
  const submitLabel = mode === 'edit' ? 'Save Changes' : 'Schedule Appointment';

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-2xl bg-gray-900 text-gray-100 rounded-2xl shadow-xl border border-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-800">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="p-6 space-y-5">
            {/* Patient */}
            <div>
              <label className="text-sm font-medium">Patient</label>
              <select
                ref={patientSelectRef}
                className="mt-1 w-full rounded-lg border border-gray-800 p-2.5 bg-gray-950 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                {patients.length === 0 && <option value="">No patients available</option>}
                {patients.map((p) => (
                  <option key={`${p.id}-${p.patientId}`} value={p.patientId}>
                    {p.patientId} — {p.name}
                  </option>
                ))}
              </select>
              {selectedPatient && (
                <p className="mt-2 text-xs text-gray-400">
                  Selected: <span className="font-medium text-gray-200">{selectedPatient.name}</span> ({selectedPatient.patientId})
                </p>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-gray-800 p-2.5 bg-gray-950 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Time</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-800 p-2.5 bg-gray-950 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                >
                  <option value="">Select Time</option>
                  {timeSlots.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-800 p-2.5 bg-gray-950 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="checkup">Checkup</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Duration</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-800 p-2.5 bg-gray-950 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  {durations.map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="text-sm font-medium">Reason / Notes</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-800 p-2.5 bg-gray-950 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter reason for the appointment"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {/* Fee & (Edit-only) Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Fee</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-gray-800 p-2.5 bg-gray-950 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  placeholder="Enter consultation fee"
                  min={0}
                />
              </div>
              {mode === 'edit' && (
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-800 p-2.5 bg-gray-950 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no-show">No Show</option>
                  </select>
                </div>
              )}
            </div>

            {err && <p className="text-sm text-red-400">{err}</p>}

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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

export default ScheduleAppointmentModal;
