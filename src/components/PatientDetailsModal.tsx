import React, { useMemo, useState } from 'react';
import { X, BadgeCheck, Calendar, Phone, Mail, CalendarClock, Heart, FileText, Plus } from 'lucide-react';
import { Patient, Note } from '../types';
import AddNoteModal from './AddNoteModal';

type Props = {
  open: boolean;
  patient: Patient;
  onClose: () => void;
  onSchedule?: (patient: Patient) => void;
};

const tabs = ['Overview', 'Appointments', 'Notes'] as const;
type Tab = typeof tabs[number];

const formatWhen = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString()} • ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const PatientDetailsModal: React.FC<Props> = ({ open, patient, onClose, onSchedule }) => {
  const [tab, setTab] = useState<Tab>('Overview');
  const [notes, setNotes] = useState<Note[]>(patient.notes ?? []);
  const [openAddNote, setOpenAddNote] = useState(false);

  if (!open) return null;

  const age = patient.dob
    ? Math.max(0, Math.floor((Date.now() - new Date(patient.dob as any).getTime()) / 31557600000))
    : null;

  const latestId = useMemo(() => (notes[0]?.id ?? null), [notes]);

  const addNote = (payload: { title: string; content?: string }) => {
    const n: Note = {
      id: Date.now(),
      title: payload.title,
      content: payload.content,
      createdAt: new Date().toISOString(),
      author: 'Mr. Admin',
    };
    setNotes(prev => [n, ...prev]);
  };

  const formattedDob = patient.dob
    ? new Date(patient.dob as any).toLocaleDateString()
    : '—';

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold truncate">
                Patient Details: {patient.name || patient.patientId}
              </h3>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  {patient.name?.[0]?.toUpperCase() ?? 'P'}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                    {age !== null && <span>{age} years</span>}
                    {patient.gender && <span>• {String(patient.gender).toLowerCase()}</span>}
                    {patient.bloodType && <span>• {String(patient.bloodType)}</span>}
                    {patient.patientId && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                        <BadgeCheck className="h-3.5 w-3.5" /> {patient.patientId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Patient since: Unknown</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                Active
              </span>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4 border-b border-gray-200">
            <div className="flex items-center gap-6">
              {tabs.map(t => (
                <button
                  key={t}
                  className={`pb-3 -mb-px border-b-2 text-sm ${
                    tab === t
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}

              {tab === 'Notes' && (
                <div className="ml-auto">
                  <button
                    onClick={() => setOpenAddNote(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" /> Add Note
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {tab === 'Overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Info */}
                <div className="lg:col-span-2 bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h4>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Date of Birth:</span>
                      <span className="truncate">
                        {formattedDob}{age !== null ? ` (${age} years)` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Phone:</span>
                      <span>{patient.contact || patient.phone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Email:</span>
                      <span className="truncate">{patient.email || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Medical Info */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Medical Information</h4>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Primary Condition</span>
                    </div>
                    <p className="text-gray-700">N/A</p>
                    <div className="pt-2">
                      <p className="font-medium text-gray-700">Blood Type</p>
                      <p>{patient.bloodType ?? '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Appointments */}
                <div className="lg:col-span-3 bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                  <CalendarClock className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                  No appointments found
                </div>
              </div>
            )}

            {tab === 'Appointments' && (
              <div className="rounded-xl border border-gray-200">
                <div className="p-8 text-center text-gray-500">
                  <CalendarClock className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                  No appointments found
                </div>
              </div>
            )}

            {tab === 'Notes' && (
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800">Clinical Notes</h4>

                {notes.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                    No notes yet. Click “Add Note” to create one.
                  </div>
                )}

                {notes.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white">
                    {notes.map((n, i) => (
                      <div key={n.id} className={`flex items-start gap-3 p-4 ${i !== notes.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{n.title}</p>
                            {n.id === (notes[0]?.id ?? null) && (
                              <span className="text-[11px] rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                                Latest
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatWhen(n.createdAt)} • {n.author}
                          </p>
                          {n.content && <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{n.content}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => onSchedule?.(patient)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <CalendarClock className="h-4 w-4" /> Schedule Appointment
            </button>
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      <AddNoteModal
        open={openAddNote}
        onClose={() => setOpenAddNote(false)}
        onSave={addNote}
      />
    </div>
  );
};

export default PatientDetailsModal;
