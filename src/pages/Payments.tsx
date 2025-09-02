// src/pages/Payments.tsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {api} from '../utils/api'; // your api.ts wrapper
import {
  Search, Plus, DollarSign, TrendingUp, Download, Calendar as CalendarIcon,
  Pencil, Trash2, X, AlertTriangle, Eye
} from 'lucide-react';

import RecordPaymentModal from '../components/RecordPaymentModal';
import PaymentDetailsModal from '../components/PaymentDetailsModal';
import type { Payment, Appointment, Patient } from '../types';

// If you already have these elsewhere, delete the next two lines and import them
import { mockAppointments, mockPatients } from '../data/mockData';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL+'/api' || 'http://localhost:4000/api',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

const CURRENCY = 'LKR';
type DateFilterMode = 'all' | 'range';

/* ---------- utils ---------- */
const pad2 = (n: number) => String(n).padStart(2, '0');
const fmtMoney = (n: number) =>
  `${CURRENCY} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const toApiDateTime = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;

const combineToDate = (dateStr: string, timeStr?: string) => {
  const d = new Date(dateStr);
  if (timeStr) {
    const [hh, mm] = timeStr.split(':').map(Number);
    d.setHours(hh || 0, mm || 0, 0, 0);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d;
};

// Map backend row -> Payment (UI)
function mapServerPayment(row: any): Payment {
  // accepted backend fields (be defensive)
  const when =
    row.occurred_at ||
    row.paid_at ||
    row.created_at ||
    row.date ||
    row.datetime ||
    row.start_time;

  const d = when ? new Date(when) : new Date();

  return {
    id: String(row.id ?? row.payment_id ?? row.code ?? crypto.randomUUID()),
    patientId: row.patient_code ?? row.patientId ?? row.patient_id ?? '',
    patientName: row.patient_name ?? row.patientName ?? 'Unknown',
    appointmentId: row.appt_code ?? row.appointment_code ?? row.appointmentId ?? '',
    amount: Number(row.amount ?? 0),
    currency: String(row.currency ?? CURRENCY),
    method: (row.method ?? 'cash') as Payment['method'],
    status: (row.status ?? 'paid') as Payment['status'],
    date: d,
    description: row.description ?? row.notes ?? '',
    appointment_id: row.appointment_id ?? null,
  };
}

/* ---------- Edit Modal ---------- */
type EditPaymentProps = {
  open: boolean;
  payment: Payment | null;
  onClose: () => void;
  onSave: (p: Payment) => void;
};
const EditPaymentModal: React.FC<EditPaymentProps> = ({ open, payment, onClose, onSave }) => {
  if (!open || !payment) return null;

  const [amount, setAmount] = useState<number>(payment.amount);
  const [method, setMethod] = useState<Payment['method']>(payment.method);
  const [status, setStatus] = useState<Payment['status']>(payment.status);
  const [description, setDescription] = useState<string>(payment.description ?? '');

  const d = payment.date;
  const [dateStr, setDateStr] = useState(d.toISOString().slice(0, 10));
  const [timeStr, setTimeStr] = useState(`${pad2(d.getHours())}:${pad2(d.getMinutes())}`);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const nd = combineToDate(dateStr, timeStr);
    onSave({
      ...payment,
      amount: Number(amount) || 0,
      method,
      status,
      description,
      date: nd,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b">
            <h3 className="text-lg font-semibold">Edit Payment</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <form onSubmit={save} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient</label>
                <div className="mt-1 px-3 py-2 rounded-lg border bg-gray-50 text-sm">
                  <div className="font-medium text-gray-900">{payment.patientName}</div>
                  <div className="text-gray-500">{payment.patientId}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Appointment ID</label>
                <div className="mt-1 px-3 py-2 rounded-lg border bg-gray-50 text-sm">{payment.appointmentId || '—'}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as Payment['method'])}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                  <option value="bank-transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Payment['status'])}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
                placeholder="Optional notes or reference"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-gray-700">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ---------- Delete Confirm Modal ---------- */
type ConfirmDeleteProps = {
  open: boolean;
  payment: Payment | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
};
const ConfirmDeleteModal: React.FC<ConfirmDeleteProps> = ({ open, payment, onClose, onConfirm }) => {
  if (!open || !payment) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-start justify-center p-4 md:p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200">
          <div className="flex items-center gap-3 p-5 border-b">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold">Delete payment?</h3>
          </div>
          <div className="p-5 space-y-2 text-sm text-gray-700">
            <p>
              This will permanently remove the payment record for{' '}
              <span className="font-medium text-gray-900">{payment.patientName}</span> (
              {payment.patientId}) amount <span className="font-medium">{fmtMoney(payment.amount)}</span>.
            </p>
            <p className="text-gray-500">This action cannot be undone.</p>
          </div>
          <div className="flex items-center justify-end gap-3 p-5 border-t">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border text-gray-700">
              Cancel
            </button>
            <button
              onClick={() => onConfirm(payment.id)}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===================== Main Page ===================== */
const Payments: React.FC = () => {
  // server data
  const [payments, setPayments] = useState<Payment[]>([]);
  // keep these for your modals (not fetched here)
  const [appointments] = useState<Appointment[]>(mockAppointments);
  const [patients] = useState<Patient[]>(mockPatients);

  // Filters (synced to API)
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | Payment['method']>('all');
  const [dateMode, setDateMode] = useState<DateFilterMode>('all');
  const [fromDate, setFromDate] = useState<string>(''); // yyyy-mm-dd
  const [toDate, setToDate] = useState<string>('');     // yyyy-mm-dd

  // Modals
  const [openRecord, setOpenRecord] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [deletePayment, setDeletePayment] = useState<Payment | null>(null);

  /* ------------------- API calls ------------------- */

  const loadPayments = async () => {
    const params: Record<string, string> = {};
    if (searchTerm) params.search = searchTerm;
    if (methodFilter !== 'all') params.method = methodFilter;
    if (dateMode === 'range') {
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
    }
    const res = await API.get('/payments', { params });
    const rows = Array.isArray(res.data) ? res.data : res.data?.data || [];
    setPayments(rows.map(mapServerPayment));
  };

  useEffect(() => {
    loadPayments().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, methodFilter, dateMode, fromDate, toDate]);

  // Create (from RecordPaymentModal)
  const createPaymentViaAPI = async (p: Payment) => {
    // Prefer linking to appointment if present, else by patient_code
    const payload: any = {
      amount: p.amount,
      currency: p.currency || CURRENCY,
      method: p.method, // compatibility
      status: p.status || 'paid',
      description: p.description || null,
      occurred_at: toApiDateTime(p.date), // backend expects occurred_at or will map to its column
    };
    if (p.appointmentId) payload.appt_code = p.appointmentId;
    else payload.patient_code = p.patientId;

    const res = await API.post('/payments', payload);
    const saved = mapServerPayment(res.data);
    setPayments(prev => [saved, ...prev]);
  };

  // Update
  const updatePaymentViaAPI = async (p: Payment) => {
    const payload: any = {
      amount: p.amount,
      currency: p.currency || CURRENCY,
      method: p.method,
      status: p.status,
      description: p.description || null,
      occurred_at: toApiDateTime(p.date),
      appointment_id: parseInt(p.appointmentId.replace(/\D/g, ''), 10) || undefined,
    };
    console.log('Updating payment with payload:', payload);
    console.log('p.appointmentId:', p.appointmentId);

    if (p.appointmentId) payload.appt_code = p.appointmentId;
    else payload.patient_code = p.patientId;
    const res = await API.put(`/payments/${p.id}`, payload);
    const updated = mapServerPayment(res.data);
    setPayments(prev => prev.map(a => {
          if (a.id !== updated.id) return a;
          const { patientName, appointmentId: _ignore, ...rest } = updated; 
          return { ...a, ...rest };                  
        }));
  };

  // Delete
  const deletePaymentViaAPI = async (id: string) => {
    await API.delete(`/payments/${id}`);
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  // Refund (status change)
  const refundViaAPI = async (id: string) => {
    await API.patch(`/payments/${id}/status`, { status: 'refunded' });
    setPayments(prev => prev.map(p => (p.id === id ? { ...p, status: 'refunded' } as Payment : p)));
  };

  /* ------------------- Derived data / UX ------------------- */

  const filteredPayments = useMemo(() => {
    // Most filtering is server-side now; keep client search as a secondary guard
    if (!searchTerm) return payments;
    const q = searchTerm.toLowerCase();
    return payments.filter(p =>
      p.patientName.toLowerCase().includes(q) ||
      p.patientId.toLowerCase().includes(q) ||
      (p.appointmentId || '').toLowerCase().includes(q)
    );
  }, [payments, searchTerm]);

  const totalRevenue = useMemo(
    () => payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    [payments]
  );
  const totalTransactions = payments.length;
  const averagePayment = totalTransactions ? totalRevenue / totalTransactions : 0;

  const thisMonthRevenue = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return payments
      .filter(p => p.status === 'paid' && p.date.getFullYear() === y && p.date.getMonth() === m)
      .reduce((s, p) => s + p.amount, 0);
  }, [payments]);

  // CSV Export (respects current filters in view)
  const toCSV = (rows: Payment[]) => {
    const headers = [
      'Patient Name', 'Patient ID', 'Appointment ID', 'Date', 'Amount',
      'Currency', 'Method', 'Status', 'Description'
    ];
    const escape = (val: unknown) =>
      `"${String(val ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    const lines = rows.map(p => [
      p.patientName,
      p.patientId,
      p.appointmentId,
      p.date.toISOString(),
      p.amount.toFixed(2),
      p.currency,
      p.method,
      p.status,
      p.description ?? ''
    ].map(escape).join(','));
    return [headers.map(escape).join(','), ...lines].join('\r\n');
  };

  const handleExport = (scope: 'filtered' | 'all' = 'filtered') => {
    const rows = scope === 'all' ? payments : filteredPayments;
    if (!rows.length) {
      alert('No payments to export.');
      return;
    }
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `payments_${scope}_${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setSearchTerm('');
    setMethodFilter('all');
    setDateMode('all');
    setFromDate('');
    setToDate('');
  };

  /* ------------------- Render ------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-6 border border-green-200 bg-green-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            </div>
            <p className="text-gray-600">Track and manage payment transactions</p>
          </div>
          <button
            onClick={() => setOpenRecord(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-xl p-5 border bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-green-700">{fmtMoney(totalRevenue)}</p>
        </div>
        <div className="rounded-xl p-5 border bg-white">
          <h3 className="text-sm font-medium text-gray-600">Total Transactions</h3>
          <p className="mt-2 text-2xl font-bold text-blue-700">{totalTransactions}</p>
        </div>
        <div className="rounded-xl p-5 border bg-white">
          <h3 className="text-sm font-medium text-gray-600">Average Payment</h3>
          <p className="mt-2 text-2xl font-bold text-purple-700">{fmtMoney(averagePayment)}</p>
        </div>
        <div className="rounded-xl p-5 border bg-white">
          <h3 className="text-sm font-medium text-gray-600">This Month</h3>
          <p className="mt-2 text-2xl font-bold text-orange-700">{fmtMoney(thisMonthRevenue)}</p>
        </div>
      </div>

      {/* Filters + side boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-xl border bg-white">
          <div className="p-5 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Payment Transactions</h2>
          </div>

          {/* Toolbar */}
          <div className="px-5 py-4 flex flex-col gap-3 border-b">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search payments..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="online">Online</option>
                {/* <option value="bank-transfer">Bank Transfer</option> */}
              </select>

              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={dateMode}
                  onChange={(e) => setDateMode(e.target.value as DateFilterMode)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All dates</option>
                  <option value="range">Date range</option>
                </select>
              </div>

              <button
                onClick={clearAll}
                className="px-3 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>

            {dateMode === 'range' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-14 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="w-10 h-10" />
                        <div className="font-medium">No payments found</div>
                        <div className="text-sm">Try adjusting your filters or date range.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-4">
                        <div className="text-xs text-gray-900">{p.patientName}</div>
                        <div className="text-xs text-gray-500">{p.patientId}</div>
                      </td>
                      <td className="px-3 py-4 text-xs text-gray-700">
                        {p.date.toLocaleDateString()} {p.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-3 py-4 text-xs">{fmtMoney(p.amount)}</td>
                      <td className="px-5 py-4">
                        <span className={
                          p.status === 'paid' ? 'px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
                          : p.status === 'pending' ? 'px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
                          : p.status === 'failed' ? 'px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
                          : 'px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
                        }>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 space-x-2">
                        <button
                          onClick={() => { setViewPayment(p); setOpenView(true); }}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditPayment(p); setOpenEdit(true); }}
                          className="px-3 py-1 text-sm text-amber-700 hover:bg-amber-50 rounded inline-flex items-center gap-1"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setDeletePayment(p); setOpenDelete(true); }}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded inline-flex items-center gap-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-white">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-gray-900">Payment Methods</h3>
            </div>
            <div className="p-5 text-sm text-gray-500">
              Record payments via <span className="font-medium text-gray-700">Card</span> or <span className="font-medium text-gray-700">Cash</span>. Online / bank transfer appear here when imported from your gateway.
            </div>
          </div>

          <div className="rounded-xl border bg-white">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-5 space-y-3">
              <button
                onClick={() => setOpenRecord(true)}
                className="w-full inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Record New Payment</span>
              </button>
              <button
                onClick={() => handleExport('filtered')}
                className="w-full inline-flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
              <button
                onClick={() => handleExport('all')}
                className="w-full inline-flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export All</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Modal (create) */}
      <RecordPaymentModal
        open={openRecord}
        onClose={() => setOpenRecord(false)}
        appointments={appointments}
        payments={payments}
        patients={patients}
        currency={CURRENCY}
        onCreate={async (p) => {
          await createPaymentViaAPI(p);
          setOpenRecord(false);
        }}
      />

      {/* View Payment Modal */}
      {viewPayment && (
        <PaymentDetailsModal
          open={openView}
          payment={viewPayment}
          onClose={() => { setOpenView(false); setViewPayment(null); }}
          onRefund={async (id) => {
            await refundViaAPI(id);
            setOpenView(false);
            setViewPayment(null);
          }}
        />
      )}

      {/* Edit Payment Modal */}
      <EditPaymentModal
        open={openEdit}
        payment={editPayment}
        onClose={() => { setOpenEdit(false); setEditPayment(null); }}
        onSave={async (p) => {
          await updatePaymentViaAPI(p);
        }}
      />

      {/* Delete Confirm Modal */}
      <ConfirmDeleteModal
        open={openDelete}
        payment={deletePayment}
        onClose={() => { setOpenDelete(false); setDeletePayment(null); }}
        onConfirm={async (id) => {
          await deletePaymentViaAPI(id);
          setOpenDelete(false);
          setDeletePayment(null);
        }}
      />
    </div>
  );
};

export default Payments;
