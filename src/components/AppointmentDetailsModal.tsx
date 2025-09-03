import React, { useEffect } from 'react';
import {
  X,
  User,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  Tag,
  DollarSign,
  Hash,
  CheckCircle2,
  Trash2,
  Pencil,
} from 'lucide-react';
import { Appointment } from '../types';

type Props = {
  open: boolean;
  appointment: Appointment;
  onClose: () => void;
  onEdit?: (appt: Appointment) => void;
  onDelete?: (appt: Appointment) => void;
  onComplete?: (id: string) => void;
};

const toAptId = (n: any, width = 6, prefix = 'APT-') =>
  `${prefix}${Math.trunc(Number(n)).toString().padStart(width, '0')}`;

const toPatientId = (n: any, width = 6, prefix = 'PAT-') =>
  `${prefix}${Math.trunc(Number(n)).toString().padStart(width, '0')}`;

const chipForStatus = (status: Appointment['status']) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-500/20 text-blue-300 ring-1 ring-inset ring-blue-500/30';
    case 'completed':
      return 'bg-green-500/20 text-green-300 ring-1 ring-inset ring-green-500/30';
    case 'cancelled':
      return 'bg-red-500/20 text-red-300 ring-1 ring-inset ring-red-500/30';
    case 'no-show':
      return 'bg-gray-500/20 text-gray-300 ring-1 ring-inset ring-gray-500/30';
    default:
      return 'bg-gray-500/20 text-gray-300 ring-1 ring-inset ring-gray-500/30';
  }
};

const chipForType = (type: Appointment['type']) => {
  switch (type) {
    case 'urgent':
      return 'bg-red-500/20 text-red-300 ring-1 ring-inset ring-red-500/30';
    case 'consultation':
      return 'bg-blue-500/20 text-blue-300 ring-1 ring-inset ring-blue-500/30';
    case 'follow-up':
      return 'bg-green-500/20 text-green-300 ring-1 ring-inset ring-green-500/30';
    case 'checkup':
      return 'bg-yellow-500/20 text-yellow-300 ring-1 ring-inset ring-yellow-500/30';
    default:
      return 'bg-gray-500/20 text-gray-300 ring-1 ring-inset ring-gray-500/30';
  }
};

const AppointmentDetailsModal: React.FC<Props> = ({
  open,
  appointment,
  onClose,
  onEdit,
  onDelete,
  onComplete,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const { patientName, patientId, date, time, type, duration, status, notes, fee, id } = appointment;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-2xl bg-gray-900 text-gray-100 rounded-2xl shadow-xl border border-gray-800 ring-1 ring-white/5">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-800">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold">Appointment Details</h3>
              <div className="mt-2 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${chipForStatus(status)}`}>
                  {status}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${chipForType(type)}`}>
                  {type}
                </span>
              </div>
            </div>
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
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">
                  {patientName} ({' '}{toPatientId(patientId)}{' '})
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Hash className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{toAptId(id)}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{date.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {date.toLocaleTimeString()} • {duration} min
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <Tag className="w-4 h-4 text-gray-500" />
                <span className="text-sm capitalize">{type}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm">LKR {fee.toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 ring-1 ring-white/5">
              <div className="flex items-center gap-2 text-gray-200">
                <FileText className="w-4 h-4 text-gray-500" />
                <h4 className="text-sm font-semibold">Notes</h4>
              </div>
              <p className="mt-2 text-sm text-gray-300 whitespace-pre-line">
                {notes ? notes : 'No notes provided.'}
              </p>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-800">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              onClick={onClose}
            >
              Close
            </button>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-blue-300 border border-blue-500/30 hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              onClick={() => onEdit?.(appointment)}
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button
              disabled={status === 'completed'}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 ${
                status === 'completed'
                  ? 'text-gray-500 border border-gray-800 cursor-not-allowed bg-gray-800/40'
                  : 'text-green-300 border border-green-500/30 hover:bg-green-500/10'
              }`}
              onClick={() => onComplete?.(appointment.id)}
            >
              <CheckCircle2 className="w-4 h-4" /> Complete
            </button>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-red-300 border border-red-500/30 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/30"
              onClick={() => onDelete?.(appointment)}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;
