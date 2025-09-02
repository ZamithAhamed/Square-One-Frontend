import React, { useEffect, useMemo, useState } from 'react';
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
const todayISO = () => new Date().toISOString().slice(0, 10);

// --- NEW: robust resolver for edit mode ---
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

  // If we got an explicit code, use it when present in list
  for (const code of codesToTry) {
    if (code && patients.some(p => p.patientId === code)) return code!;
  }

  // Try numeric id from API: patient_id
  const numeric = (appt as any).patient_id ?? (appt as any).patientId;
  if (numeric !== undefined && numeric !== null) {
    const numStr = String(numeric);
    // Match by patient.id if your Patient carries DB id there
    const byId = patients.find(p => String((p as any).id) === numStr);
    if (byId) return byId.patientId;
  }

  // Last resort: nothing matched, pick first so modal is valid
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

  // Prefill on open for create/edit
  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialAppointment) {
      // --- KEY PART: make sure we derive a patient code that exists in the list ---
      const code = resolvePatientCodeForEdit(initialAppointment, patients);
      setSelectedPatientId(code);

      // Accept both Date and ISO/string coming from API
      const apptDate = (initialAppointment as any).date
        ? new Date((initialAppointment as any).date)
        : (initialAppointment as any).start_time
        ? new Date((initialAppointment as any).start_time)
        : new Date();

      setDateStr(apptDate.toISOString().slice(0, 10));
      setTime((initialAppointment as any).time ?? '');
      setType((initialAppointment as any).type ?? 'consultation');
      setDuration((initialAppointment as any).duration ?? (initialAppointment as any).duration_min ?? 30);
      setReason((initialAppointment as any).notes ?? '');
      setFee((initialAppointment as any).fee ?? 0);
      setStatus((initialAppointment as any).status ?? 'scheduled');
      setErr(null);
    } else {
      // create defaults
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, initialAppointment, defaultPatient, patients.length]);

  // If patients load after the modal opened (async fetch), ensure we always have a valid selection
  useEffect(() => {
    if (!open) return;
    if (!selectedPatientId && patients.length) {
      // no selection -> select first
      setSelectedPatientId(patients[0].patientId);
    } else if (selectedPatientId && patients.length && !patients.some(p => p.patientId === selectedPatientId)) {
      // current selection not found -> resolve again (edit) or set first (create)
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
      id: mode === 'edit' && initialAppointment ? (initialAppointment as any).id ?? (initialAppointment as any).id?.toString() ?? Date.now().toString() : Date.now().toString(),
      patientId: selectedPatient.patientId, // <-- always a code from dropdown
      patientName: selectedPatient.name,
      date: new Date(dateStr),
      time,
      duration: duration,
      type,
      status,
      notes: reason.trim() || undefined,
      fee,
    };

    if (mode === 'edit') {
      onUpdate?.(base);
    } else {
      onCreate?.(base);
    }

    onClose();
  };

  const title = mode === 'edit' ? 'Edit Appointment' : 'Schedule New Appointment';
  const submitLabel = mode === 'edit' ? 'Save Changes' : 'Schedule Appointment';

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="p-6 space-y-5">
            {/* Patient (IDs dropdown) */}
            <div>
              <label className="text-sm font-medium">Patient</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
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
                <p className="mt-2 text-xs text-gray-600">
                  Selected: <span className="font-medium">{selectedPatient.name}</span> ({selectedPatient.patientId})
                </p>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Time</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
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
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
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
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
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
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
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
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
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
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
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

            {err && <p className="text-sm text-red-600">{err}</p>}

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
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
