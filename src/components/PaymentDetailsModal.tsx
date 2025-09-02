import React from 'react';
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
    case 'paid': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-blue-100 text-blue-800';
    case 'failed': return 'bg-red-100 text-red-800';
    case 'refunded': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const methodIcon = (method: Payment['method']) => {
  switch (method) {
    case 'card': return <CreditCard className="w-4 h-4 text-gray-400" />;
    case 'cash': return <Wallet className="w-4 h-4 text-gray-400" />;
    default: return <Tag className="w-4 h-4 text-gray-400" />; // insurance/bank-transfer
  }
};

const PaymentDetailsModal: React.FC<Props> = ({ open, payment, onClose, onRefund }) => {
  if (!open) return null;

  const { patientName, patientId, appointmentId, amount, currency, status, method, date, description } = payment;

  const money = `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Payment Details</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-800">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{patientName}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{patientId}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm">
                  {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{money}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                {methodIcon(method)}
                <span className="text-sm capitalize">{method.replace('-', ' ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusChip(status)}`}>{status}</span>
              </div>

              <div className="md:col-span-2 flex items-center gap-2 text-gray-700">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Appointment: {appointmentId}</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-gray-800">
                <FileText className="w-4 h-4 text-gray-400" />
                <h4 className="text-sm font-semibold">Description</h4>
              </div>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                {description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
            {onRefund && status === 'paid' && (
              <button
                onClick={() => onRefund(payment.id)}
                className="px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
              >
                Mark as Refunded
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
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
