import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Search, CreditCard, Wallet, Globe } from 'lucide-react';
import { Appointment, Patient, Payment } from '../types';
import { api } from '../utils/api';

type Tab = 'appointment' | 'manual';
type Method = 'card' | 'cash' | 'online';

type Props = {
  open: boolean;
  onClose: () => void;
  appointments: Appointment[]; // kept for prop compatibility (not used after fetch)
  payments: Payment[];         // kept for prop compatibility (not used after fetch)
  patients: Patient[];
  onCreate: (payment: Payment) => void;
  currency?: string; // default "LKR"
};

type UnpaidAppt = {
  key: string; // stable selection key (appt_code if present, else id as string)
  appointmentId?: number | null;
  apptCode?: string | null;
  patientCode: string;
  patientName: string;
  date: Date;
  time: string; // HH:mm
  duration: number;
  type: 'consultation' | 'follow-up' | 'checkup' | 'urgent';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  fee: number; // this is the unpaid amount we’ll charge
  notes?: string | null;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const RecordPaymentModal: React.FC<Props> = ({
  open,
  onClose,
  // appointments, payments (unused after switching to backend fetch)
  patients,
  onCreate,
  currency = 'LKR',
}) => {
  const [tab, setTab] = useState<Tab>('appointment');
  const [method, setMethod] = useState<Method>('card');

  // ---- Appointment tab state ----
  const [search, setSearch] = useState('');
  const [selectedApptId, setSelectedApptId] = useState<string>('');
  const [unpaid, setUnpaid] = useState<UnpaidAppt[]>([]);
  const [loadingUnpaid, setLoadingUnpaid] = useState(false);

  const [cardTxnId, setCardTxnId] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [notes, setNotes] = useState('');

  // ---- Manual entry state ----
  const [manualPatientId, setManualPatientId] = useState<string>('');
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [manualNotes, setManualNotes] = useState('');

  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset when opening
  useEffect(() => {
    if (!open) return;
    setTab('appointment');
    setMethod('card');
    setSearch('');
    setSelectedApptId('');
    setCardTxnId('');
    setCardLast4('');
    setNotes('');
    setManualPatientId(patients[0]?.patientId ?? '');
    setManualAmount(0);
    setManualNotes('');
    setErr(null);
  }, [open, patients]);

  // Fetch unpaid appointments from backend with debounce
  const debounceRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!open) return;

    const run = async () => {
      setLoadingUnpaid(true);
      setErr(null);
      const qs = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : '';
      const res = await api(`/api/appointments/unpaid${qs}`);
      if (!res.ok) {
        setLoadingUnpaid(false);
        const body = await res.json().catch(() => ({}));
        setUnpaid([]);
        setErr(body?.error?.message || 'Failed to fetch unpaid appointments');
        return;
      }
      const list = await res.json();
      const mapped: UnpaidAppt[] = (list as any[]).map((r) => {
        const d = new Date(r.start_time);
        const hh = pad2(d.getHours());
        const mm = pad2(d.getMinutes());
        return {
          key: String(r.appt_code ?? r.id),
          appointmentId: r.id ?? null,
          apptCode: r.appt_code ?? null,
          patientCode: r.patient_code,
          patientName: r.patient_name,
          date: d,
          time: `${hh}:${mm}`,
          duration: Number(r.duration_min ?? 30),
          type: r.type,
          status: r.status,
          fee: Number(r.fee ?? 0),
          notes: r.notes ?? null,
        };
      });
      setUnpaid(mapped);
      setLoadingUnpaid(false);
    };

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(run, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [open, search]);

  // Selected appointment from fetched unpaid list
  const selectedAppt = useMemo(
    () => unpaid.find((a) => a.key === selectedApptId) || null,
    [unpaid, selectedApptId]
  );

  if (!open) return null;

  // Map backend payment -> UI Payment shape
  const buildClientPaymentFromServer = (data: any): Payment => {
    const paidAt = data.paid_at || data.created_at || data.createdAt || Date.now();
    return {
      id: String(data.id ?? Date.now()),
      patientId: data.patientId || data.patient_id || '',
      patientName: data.patient_name || data.patientName || '',
      appointmentId: String(data.appt_code ?? data.appointment_code ?? data.appointment_id ?? ''),
      amount: Number(data.amount ?? 0),
      currency: data.currency || currency,
      method: (data.method || method) as Payment['method'],
      status: (data.status || 'paid') as Payment['status'],
      date: new Date(paidAt),
      appointment_id: data.appointment_id ? String(data.appointment_id) : undefined,
      description: data.notes || data.description || undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    // ---- Appointment flow (from fetched unpaid) ----
    if (tab === 'appointment') {
      if (!selectedAppt) return setErr('Please select an unpaid appointment.');
      if (method === 'card' && !cardTxnId.trim()) {
        return setErr('Transaction ID is required for card payments.');
      }

      const description = [
        `Payment for ${selectedAppt.type} on ${selectedAppt.date.toLocaleDateString()} at ${selectedAppt.time}.`,
        method === 'card' && cardTxnId ? `Txn: ${cardTxnId}${cardLast4 ? ` • ****${cardLast4}` : ''}` : '',
        notes ? `Notes: ${notes}` : '',
      ]
        .filter(Boolean)
        .join(' ');

      const payload: any = {
        amount: selectedAppt.fee, // unpaid amount from backend
        patient_id: selectedAppt.patientCode, // let the backend resolve the numeric ID
        appointment_id: selectedAppt.appointmentId,
        currency,
        method,
        status: 'paid',
        description: description,
      };
      if (selectedAppt.apptCode) payload.appointment_code = selectedAppt.apptCode;
      else if (selectedAppt.appointmentId) payload.appointment_id = selectedAppt.appointmentId;
      if (method === 'card') {
        payload.card_txn_id = cardTxnId.trim();
        if (cardLast4) payload.card_last4 = cardLast4;
      }

      try {
        setSubmitting(true);
        const res = await api('/api/payments', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error?.message || `Failed to record payment (${res.status})`);
        }
        const data = await res.json();
        onCreate(buildClientPaymentFromServer(data));
        onClose();
      } catch (ex: any) {
        setErr(ex?.message || 'Failed to record payment.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ---- Manual flow ----
    const patient = patients.find((p) => p.patientId === manualPatientId);
    if (!patient) return setErr('Please choose a patient.');
    if (!manualAmount || manualAmount <= 0) return setErr('Enter a valid amount.');
    if (method === 'card' && !cardTxnId.trim()) {
      return setErr('Transaction ID is required for card payments.');
    }

    const description = [
      'Manual payment.',
      method === 'card' && cardTxnId ? `Txn: ${cardTxnId}${cardLast4 ? ` • ****${cardLast4}` : ''}` : '',
      manualNotes ? `Notes: ${manualNotes}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    const payload: any = {
      patient_code: patient.patientId, // let the backend resolve the numeric ID
      amount: manualAmount,
      currency,
      method,
      status: 'paid',
      notes: description,
    };
    if (method === 'card') {
      payload.card_txn_id = cardTxnId.trim();
      if (cardLast4) payload.card_last4 = cardLast4;
    }

    try {
      setSubmitting(true);
      const res = await api('/api/payments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error?.message || `Failed to record payment (${res.status})`);
      }
      const data = await res.json();
      onCreate(buildClientPaymentFromServer(data));
      onClose();
    } catch (ex: any) {
      setErr(ex?.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Record Payment</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-5">
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setTab('appointment')}
                className={`px-4 py-2 text-sm ${
                  tab === 'appointment' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Appointment Payment
              </button>
              <button
                onClick={() => setTab('manual')}
                className={`px-4 py-2 text-sm ${
                  tab === 'manual' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Manual Entry
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {tab === 'appointment' ? (
              <>
                <div>
                  <p className="text-sm font-medium mb-2">Select Unpaid Appointment</p>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search appointments by patient name, code, or appointment code..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="max-h-56 overflow-auto rounded-lg border border-gray-200 divide-y">
                    {loadingUnpaid && <div className="p-4 text-sm text-gray-500">Loading…</div>}
                    {!loadingUnpaid && unpaid.length === 0 && (
                      <div className="p-4 text-sm text-gray-500">No unpaid appointments</div>
                    )}
                    {!loadingUnpaid &&
                      unpaid.map((a) => (
                        <button
                          key={a.key}
                          type="button"
                          onClick={() => setSelectedApptId(a.key)}
                          className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                            selectedApptId === a.key ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{a.patientName}</p>
                              <p className="text-xs text-gray-500">
                                {a.patientCode} • {a.apptCode || a.appointmentId} •{' '}
                                {a.date.toLocaleDateString()} {a.time}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">{a.type}</p>
                            </div>
                            <div className="text-blue-600 font-semibold">
                              {currency} {a.fee.toLocaleString()}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                 --- Under Cosntruction ----
              </>
            )}

            {/* Payment Method */}
            <div>
              <p className="text-sm font-medium mb-2">Payment Method</p>
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="method"
                    className="text-blue-600"
                    checked={method === 'card'}
                    onChange={() => setMethod('card')}
                  />
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-800">Card Payment</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="method"
                    className="text-blue-600"
                    checked={method === 'cash'}
                    onChange={() => setMethod('cash')}
                  />
                  <Wallet className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-800">Cash</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="method"
                    className="text-blue-600"
                    checked={method === 'online'}
                    onChange={() => setMethod('online')}
                  />
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-800">Online</span>
                </label>
              </div>
            </div>

            {/* Card details (only for card method) */}
            {method === 'card' && (
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium mb-3">Card Payment Details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-700">Transaction ID</label>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
                      placeholder="Transaction reference"
                      value={cardTxnId}
                      onChange={(e) => setCardTxnId(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Last 4 Digits</label>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
                      placeholder="xxxx"
                      maxLength={4}
                      value={cardLast4}
                      onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
                placeholder="Additional notes about this payment..."
                value={tab === 'appointment' ? notes : manualNotes}
                onChange={(e) => (tab === 'appointment' ? setNotes(e.target.value) : setManualNotes(e.target.value))}
              />
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecordPaymentModal;
