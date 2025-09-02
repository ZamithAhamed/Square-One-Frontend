import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Plus, Search, Filter, Trash2, Pencil } from 'lucide-react';
import ScheduleAppointmentModal from '../components/ScheduleAppointmentModal';
import AppointmentDetailsModal from '../components/AppointmentDetailsModal';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Appointment, Patient } from '../types';
import { api } from '../utils/api.ts';

type DateFilterMode = 'all' | 'range';

const toAptId = (n: any, width = 6, prefix = 'APT-') =>
  `${prefix}${Math.trunc(Number(n)).toString().padStart(width, '0')}`;


// -------- helpers --------
function normalizeAppointment(apiA: any): Appointment {
  // Accepts snake_case or camelCase from API
  const dateStr = apiA.date ?? apiA.start ?? apiA.start_time ?? apiA.start_at;
  return {
    id: String(apiA.id ?? apiA.appointment_id ?? apiA.code ?? Date.now()),
    patientId: String(apiA.patientId ?? apiA.patient_id ?? apiA.patient_code ?? ''),
    patientName: String(apiA.patientName ?? apiA.patient_name ?? apiA.patient?.name ?? ''),
    date: dateStr ? new Date(dateStr) : new Date(),
    time: String(apiA.time ?? apiA.start_time_str ?? apiA.time_str ?? '09:00'),
    duration: Number(apiA.duration_min ?? 30),
    type: (apiA.type ?? 'consultation') as Appointment['type'],
    status: (apiA.status ?? 'scheduled') as Appointment['status'],
    notes: apiA.notes ?? apiA.reason ?? undefined,
    fee: Number(apiA.fee ?? apiA.amount ?? 0),
  };
}

function normalizePatient(apiP: any): Patient {
  return {
    id: String(apiP.id ?? apiP.patient_id ?? apiP.patient_code ?? cryptoRand()),
    patientId: String(apiP.patientId ?? apiP.patient_code ?? apiP.code ?? ''),
    name: apiP.name ?? apiP.full_name ?? '',
    email: apiP.email ?? '',
    phone: apiP.phone ?? apiP.contact ?? '',
    contact: apiP.contact ?? apiP.phone ?? '',
    dob: apiP.dob ? new Date(apiP.dob) : undefined,
    age: apiP.age ?? (apiP.dob ? Math.max(0, Math.floor((Date.now() - new Date(apiP.dob).getTime()) / 31557600000)) : 0),
    gender: (apiP.gender?.toLowerCase?.() ?? 'other') as 'male' | 'female' | 'other',
    bloodType: apiP.blood_type ?? apiP.bloodType ?? '',
    allergies: apiP.allergies ?? undefined,
    createdAt: apiP.created_at ? new Date(apiP.created_at) : new Date(),
    lastVisit: apiP.last_visit ? new Date(apiP.last_visit) : undefined,
    appointments: apiP.appointments ? apiP.appointments.map(normalizeAppointment) : [],
    notes: apiP.notes ?? [],
    medicalInfo: apiP.medical_info ?? undefined,
  };
}

function cryptoRand() {
  return Math.random().toString(36).slice(2);
}

const Appointments: React.FC = () => {
  // Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'all' | 'scheduled' | 'completed' | 'cancelled' | 'no-show'>('all');

  // Date filter mode + optional range
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('all');
  const [fromDate, setFromDate] = useState<string>(''); // yyyy-mm-dd
  const [toDate, setToDate] = useState<string>('');     // yyyy-mm-dd

  // Modals
  const [openSchedule, setOpenSchedule] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Appointment | null>(null);

  const [openView, setOpenView] = useState(false);
  const [viewAppt, setViewAppt] = useState<Appointment | null>(null);

  // ---------- load from backend ----------
  useEffect(() => {
    (async () => {
      try {
        const [aRes, pRes] = await Promise.all([
          api('/api/appointments', { method: 'GET' }),
          api('/api/patients', { method: 'GET' }),
        ]);
        const aJson = await aRes.json().catch(() => []);
        const pJson = await pRes.json().catch(() => []);
        const aRaw = (aJson?.data ?? aJson) as any[];
        const pRaw = (pJson?.data ?? pJson) as any[];
        setAppointments(aRaw.map(normalizeAppointment));
        setPatients(pRaw.map(normalizePatient));
      } catch (e) {
        console.error('Failed to load data', e);
        // (optional) fallback: keep empty, UI shows empty state
      }
    })();
  }, []);

  // ---------- derived / filters ----------
  const filteredAppointments = useMemo(() => {
    const matchesDate = (a: Appointment) => {
      if (dateFilterMode === 'all') return true;
      const aDay = a.date.toISOString().slice(0, 10);
      if (fromDate && toDate) {
        const start = fromDate < toDate ? fromDate : toDate;
        const end = toDate > fromDate ? toDate : fromDate;
        return aDay >= start && aDay <= end;
      }
      if (fromDate) return aDay >= fromDate;
      if (toDate) return aDay <= toDate;
      return true;
    };

    return appointments.filter((a) => {
      const matchesSearch =
        a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.patientId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesStatus && matchesDate(a);
    });
  }, [appointments, searchTerm, statusFilter, dateFilterMode, fromDate, toDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'consultation': return 'border-l-blue-500 bg-blue-50';
      case 'follow-up': return 'border-l-green-500 bg-green-50';
      case 'checkup': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  // ---------- CRUD handlers (backend) ----------

  // Create from modal → POST /api/appointments
  const handleCreateAppointment = async (draft: Appointment) => {
    try {
      const payload = {
        patient_id: encodeURIComponent(draft.patientId),
        date: draft.date.toISOString(), // ISO
        time: draft.time,
        duration_min: draft.duration,
        type: draft.type,
        status: draft.status,
        notes: draft.notes ?? '',
        fee: draft.fee,
      };
      const res = await api('/api/appointments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Create failed');
      const json = await res.json();
      const created = normalizeAppointment(json?.data ?? json);
      setAppointments(prev => [created, ...prev]);
    } catch (e) {
      console.error(e);
      alert('Failed to create appointment');
    } finally {
      setOpenSchedule(false);
    }
  };

  // Edit from modal → PUT /api/appointments/:id
  const handleUpdateAppointment = async (appt: Appointment) => {
    try {
      const payload = {
        patientId: appt.patientId,
        date: appt.date.toISOString(),
        time: appt.time,
        duration_min: appt.duration,
        type: appt.type,
        status: appt.status,
        notes: appt.notes ?? '',
        fee: appt.fee,
      };
      const res = await api(`/api/appointments/${encodeURIComponent(appt.id)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Update failed');
      const json = await res.json();
      const updated = normalizeAppointment(json?.data ?? json);
      setAppointments(prev => prev.map(a => {
          if (a.id !== updated.id) return a;
          const { patientName: _ignore, ...rest } = updated; 
          return { ...a, ...rest };                  
        })
      );
    } catch (e) {
      console.error(e);
      alert('Failed to update appointment');
    } finally {
      setOpenSchedule(false);
      setEditAppt(null);
    }
  };

  // Complete quick action (PATCH /complete or PUT status)
  const handleComplete = async (id: string) => {
    // optimistic update
    const prev = appointments;
    setAppointments(prev => prev.map(a => (a.id === id ? { ...a, status: 'completed' } : a)));
    try {
      let res = await api(`/api/appointments/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) });
      if (!res.ok) {
        // fallback to simple PUT status change
        res = await api(`/api/appointments/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'completed' }),
        });
      }
      if (!res.ok) throw new Error('Complete failed');
      
    } catch (e) {
      console.error(e);
      alert('Failed to complete appointment');
      setAppointments(prev); // rollback
    }
  };

  // Delete (with confirm) → DELETE /api/appointments/:id
  const askDelete = (appt: Appointment) => {
    setToDelete(appt);
    setConfirmOpen(true);
  };
  const confirmDelete = async () => {
    if (!toDelete) return;
    // optimistic remove
    const prev = appointments;
    setAppointments(prev => prev.filter(a => a.id !== toDelete.id));
    setConfirmOpen(false);
    try {
      const res = await api(`/api/appointments/${encodeURIComponent(toDelete.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
    } catch (e) {
      console.error(e);
      alert('Failed to delete appointment');
      setAppointments(prev); // rollback
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Schedule and manage appointments</p>
        </div>
        <button
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => { setMode('create'); setEditAppt(null); setOpenSchedule(true); }}
        >
          <Plus className="w-4 h-4" />
          <span>New Appointment</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search appointments..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date filter mode */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={dateFilterMode}
              onChange={(e) => setDateFilterMode(e.target.value as DateFilterMode)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All dates</option>
              <option value="range">Date range</option>
            </select>
          </div>

          {/* Status */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>
        </div>

        {/* Range inputs */}
        {dateFilterMode === 'range' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="From"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="To"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Appointments</h2>
            <span className="text-sm text-gray-500">{filteredAppointments.length} appointments</span>
          </div>
        </div>
        
        <div className="p-6">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No appointments found for selected criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className={`border-l-4 ${getTypeColor(appointment.type)} rounded-r-lg p-4 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium text-gray-900">{toAptId(appointment.id)} : {appointment.patientName}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{appointment.date.toDateString()} - {appointment.date.toLocaleTimeString()}</span>
                        </span>
                        <span className="capitalize">{appointment.type}</span>
                        <span>{appointment.duration} min</span>
                        <span className="font-medium">LKR {appointment.fee.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                        onClick={() => { setViewAppt(appointment); setOpenView(true); }}
                        title="View"
                      >
                        View
                      </button>
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        onClick={() => { setMode('edit'); setEditAppt(appointment); setOpenSchedule(true); }}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" /> Edit
                      </button>
                      <button
                        className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded transition-colors"
                        onClick={() => handleComplete(appointment.id)}
                      >
                        Complete
                      </button>
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                        onClick={() => askDelete(appointment)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule / Edit Modal */}
      <ScheduleAppointmentModal
        open={openSchedule}
        onClose={() => setOpenSchedule(false)}
        patients={patients}
        mode={mode}
        initialAppointment={editAppt}
        defaultPatient={null}
        onCreate={handleCreateAppointment}
        onUpdate={handleUpdateAppointment}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        variant="danger"
        title="Delete appointment?"
        message={
          toDelete
            ? `This will permanently remove the appointment for ${toDelete.patientName} on ${toDelete.date.toLocaleDateString()} at ${toDelete.time}.`
            : 'This will permanently remove the appointment.'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setToDelete(null); }}
      />

      {/* View modal */}
      {viewAppt && (
        <AppointmentDetailsModal
          open={openView}
          appointment={viewAppt}
          onClose={() => { setOpenView(false); setViewAppt(null); }}
          onEdit={(a) => { setOpenView(false); setMode('edit'); setEditAppt(a); setOpenSchedule(true); }}
          onDelete={(a) => { setOpenView(false); askDelete(a); }}
          onComplete={(id) => { setOpenView(false); handleComplete(id); }}
        />
      )}
    </div>
  );
};

export default Appointments;
