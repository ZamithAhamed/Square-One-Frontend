import React, { useEffect } from 'react';
import {
  X, User, Calendar as CalendarIcon, DollarSign, CreditCard, Wallet, FileText, Hash, Tag
} from 'lucide-react';
import type { Payment } from '../types';

type Props = {
  open: boolean;
  payment: Payment;
  onClose: () => void;
  onRefund?: (id: string) => void; // optional action
};

const statusChip = (status: Payment['status']) => {
  switch (status) {
    case 'paid': return 'bg-green-500/10 text-green-300 ring-1 ring-inset ring-green-500/30';
    case 'pending': return 'bg-blue-500/10 text-blue-300 ring-1 ring-inset ring-blue-500/30';
    case 'failed': return 'bg-red-500/10 text-red-300 ring-1 ring-inset ring-red-500/30';
    case 'refunded': return 'bg-gray-500/10 text-gray-300 ring-1 ring-inset ring-gray-500/30';
    default: return 'bg-gray-500/10 text-gray-300 ring-1 ring-inset ring-gray-500/30';
  }
};

const methodIcon = (method: Payment['method']) => {
  switch (method) {
    case 'card': return <CreditCard className="w-4 h-4 text-gray-400" />;
    case 'cash': return <Wallet className="w-4 h-4 text-gray-400" />;
    default: return <Tag className="w-4 h-4 text-gray-400" />; // online/bank-transfer/etc.
  }
};

const PaymentDetailsModal: React.FC<Props> = ({ open, payment, onClose, onRefund }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const { patientName, patientId, appointmentId, amount, currency, status, method, date, description } = payment;

  const money = `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-2xl bg-gray-900 text-gray-100 rounded-2xl shadow-xl border border-gray-800 ring-1 ring-white/5">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-800">
            <h3 className="text-lg font-semibold">Payment Details</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-200">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{patientName}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{patientId}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm">
                  {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{money}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                {methodIcon(method)}
                <span className="text-sm capitalize">{method.replace('-', ' ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusChip(status)}`}>{status}</span>
              </div>

              <div className="md:col-span-2 flex items-center gap-2 text-gray-300">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Appointment: {appointmentId}</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
              <div className="flex items-center gap-2 text-gray-100">
                <FileText className="w-4 h-4 text-gray-400" />
                <h4 className="text-sm font-semibold">Description</h4>
              </div>
              <p className="mt-2 text-sm text-gray-300 whitespace-pre-line">
                {description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-800">
            {onRefund && status === 'paid' && (
              <button
                onClick={() => onRefund(payment.id)}
                className="px-3 py-2 rounded-lg border border-red-800 text-red-300 hover:bg-red-950/40 focus:outline-none focus:ring-2 focus:ring-red-500/30"
              >
                Mark as Refunded
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;
