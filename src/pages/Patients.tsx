import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Users, Activity, AlertTriangle, Clock } from 'lucide-react';

import PatientCard from '../components/PatientCard';
import AddPatientModal from '../components/AddPatientModal';
import PatientDetailsModal from '../components/PatientDetailsModal';
import ScheduleAppointmentModal from '../components/ScheduleAppointmentModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { normalizePatient } from '../utils/normalize';


import type { Patient, Appointment } from '../types';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// --- cookie helpers + fetch wrapper (adds CSRF & refresh-once) ---
function getCookie(name: string): string | null {
  const m = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/[-.\\[\\]]/g, '\\$&') + '=([^;]*)')
  );
  return m ? decodeURIComponent(m[1]) : null;
}

async function api(path: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = getCookie('csrf');
    if (csrf) headers.set('x-csrf-token', csrf);
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }
  }
  const send = () =>
    fetch(`${API}${path}`, { ...options, method, headers, credentials: 'include' });

  let res = await send();
  if (res.status === 401 && path !== '/api/auth/refresh') {
    const r = await fetch(`${API}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (r.ok) res = await send();
  }
  return res;
}

const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // search & selection
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // add/edit modal
  const [openAdd, setOpenAdd] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);

  // schedule modal
  const [openSchedule, setOpenSchedule] = useState(false);
  const [scheduleFor, setScheduleFor] = useState<Patient | null>(null);

  // delete confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Patient | null>(null);

  // ---- initial fetch ----
  useEffect(() => {
    (async () => {
      try {
        const res = await api('/api/patients');
        if (!res.ok) throw new Error('Failed to load patients');
        const json = await res.json();
        const raw = json?.data ?? json ?? [];
        setPatients(raw.map(normalizePatient));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [patients]);


  // derived
  const filteredPatients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.patientId || '').toLowerCase().includes(q) ||
      (p.contact ?? '').toLowerCase().includes(q) ||
      (p.phone ?? '').toLowerCase().includes(q)
    );
  }, [patients, searchTerm]);

  const stats = [
    { label: 'Total Patients', value: patients.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Active Patients', value: patients.length, icon: Activity, color: 'bg-green-500' },
    { label: 'Pending Lab Results', value: 0, icon: Clock, color: 'bg-orange-500' },
    { label: 'Critical Follow-ups', value: 0, icon: AlertTriangle, color: 'bg-red-500' },
  ];

  // ---- CRUD handlers (talk to API) ----
  const handleCreatePatient = async (payload: {
    name: string; email: string; phone: string; dob: string;
    gender: 'male' | 'female' | 'other'; bloodType?: string; allergies?: string;
  }) => {
    const res = await api('/api/patients', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body?.error?.message || 'Failed to create patient');
      return;
    }
    const created = await res.json();
    const p: Patient = created?.data ?? created;
    setPatients(prev => [p, ...prev]);
  };

  const handleUpdatePatient = async (who: Patient, payload: {
    name: string; email: string; phone: string; dob: string;
    gender: 'male'|'female'|'other'; bloodType?: string; allergies?: string;
  }) => {
    const identifier = who.id || who.patientId;
    if (!identifier) {
      alert('Missing patient identifier');
      return;
    }

    let url = `/api/patients/${encodeURIComponent(identifier)}`;

    // If your backend expects the human code instead, flip to:
    // let url = `/api/patients/code/${encodeURIComponent(who.patientId)}`;

    const res = await api(url, { method: 'PUT', body: JSON.stringify(payload) });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body?.error?.message || 'Failed to update patient');
      return;
    }
    const updated = normalizePatient((await res.json())?.data ?? {});
    setPatients(prev => prev.map(x => (x.id === updated.id ? updated : x)));
  };


  const handleAskDelete = (p: Patient) => {
    setToDelete(p);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    const identifier = toDelete.id || toDelete.patientId;
    if (!identifier) {
      alert('Missing patient identifier');
      return;
    }
    let url = `/api/patients/${encodeURIComponent(identifier)}`;
    // or `/api/patients/code/${encodeURIComponent(toDelete.patientId)}` if your backend expects code

    const res = await api(url, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body?.error?.message || 'Failed to delete patient');
      return;
    }
    setPatients(prev => prev.filter(x => (x.id || x.patientId) !== identifier));
    setConfirmOpen(false);
    setToDelete(null);
  };


  const handleScheduleFromDetails = (p: Patient) => {
    setScheduleFor(p);
    setOpenSchedule(true);
  };

  const handleCreateAppointment = async (appt: Appointment) => {
    // Expect ScheduleAppointmentModal to provide a fully-formed payload (or adapt here)
    const res = await api('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        patientId: appt.patientId,
        date: appt.date,
        time: appt.time,
        duration: appt.duration,
        type: appt.type,
        notes: appt.notes || '',
        fee: appt.fee,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body?.error?.message || 'Failed to create appointment');
      return;
    }
    const created = await res.json();
    const saved: Appointment = created?.data ?? created;
    setPatients(prev =>
      prev.map((p) =>
        p.patientId === saved.patientId
          ? { ...p, appointments: [saved, ...(p.appointments ?? [])] }
          : p
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600">Manage your patient records</p>
        </div>
        <button
          onClick={() => { setEditPatient(null); setOpenAdd(true); }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Patient</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patients by name, ID, email, phone..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className={`p-3 ${stat.color} rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Patient Records</h2>
            <span className="text-sm text-gray-500">
              {loading ? 'Loading…' : `${filteredPatients.length} patients`}
            </span>
          </div>
        </div>

        <div className="p-6">
          {!loading && filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No patients found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient) => (
                <PatientCard
                  key={patient.id || patient.patientId}
                  patient={patient}
                  onView={setSelectedPatient}
                  onEdit={(p) => { setEditPatient(p); setOpenAdd(true); }}
                  onDelete={handleAskDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Patient Modal */}
      <AddPatientModal
        open={openAdd}
        mode={editPatient ? 'edit' : 'create'}
        initialPatient={editPatient ?? undefined}
        onClose={() => { setOpenAdd(false); setEditPatient(null); }}
        onCreate={handleCreatePatient}
        onUpdate={(payload) => {
          if (editPatient) {
            handleUpdatePatient(editPatient, payload);
          }
        }}
      />


      {/* View Patient Details */}
      {selectedPatient && (
        <PatientDetailsModal
          open={!!selectedPatient}
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onSchedule={handleScheduleFromDetails}
        />
      )}

      {/* Schedule Appointment */}
      <ScheduleAppointmentModal
        open={openSchedule}
        onClose={() => setOpenSchedule(false)}
        patients={patients}
        defaultPatient={scheduleFor}
        onCreate={handleCreateAppointment}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete patient?"
        message={
          toDelete
            ? `This will permanently remove ${toDelete.name} (${toDelete.patientId}) and their local records.`
            : 'This will permanently remove the patient.'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setConfirmOpen(false); setToDelete(null); }}
      />
    </div>
  );
};

export default Patients;
