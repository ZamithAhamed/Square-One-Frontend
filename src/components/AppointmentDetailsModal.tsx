import React from 'react';
import {
  X, User, Calendar as CalendarIcon, Clock, FileText, Tag, DollarSign, Hash, CheckCircle2, Trash2, Pencil
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
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'no-show': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const chipForType = (type: Appointment['type']) => {
  switch (type) {
    case 'urgent': return 'bg-red-100 text-red-800';
    case 'consultation': return 'bg-blue-100 text-blue-800';
    case 'follow-up': return 'bg-green-100 text-green-800';
    case 'checkup': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const AppointmentDetailsModal: React.FC<Props> = ({
  open, appointment, onClose, onEdit, onDelete, onComplete
}) => {
  if (!open) return null;

  const { patientName, patientId, date, time, type, duration, status, notes, fee, id } = appointment;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold">Appointment Details</h3>
              <div className="mt-2 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${chipForStatus(status)}`}>{status}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${chipForType(type)}`}>{type}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-800">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{patientName} ( {toPatientId(patientId)} )</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{toAptId(id)}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{date.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{time} • {duration} min</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-sm capitalize">{type}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-sm">LKR {fee.toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-gray-800">
                <FileText className="w-4 h-4 text-gray-400" />
                <h4 className="text-sm font-semibold">Notes</h4>
              </div>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                {notes ? notes : 'No notes provided.'}
              </p>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={onClose}
            >
              Close
            </button>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-blue-700 border border-blue-200 hover:bg-blue-50"
              onClick={() => onEdit?.(appointment)}
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button
              disabled={status === 'completed'}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${status === 'completed'
                ? 'text-gray-400 border border-gray-200 cursor-not-allowed'
                : 'text-green-700 border border-green-200 hover:bg-green-50'}`}
              onClick={() => onComplete?.(appointment.id)}
            >
              <CheckCircle2 className="w-4 h-4" /> Complete
            </button>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-red-700 border border-red-200 hover:bg-red-50"
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
