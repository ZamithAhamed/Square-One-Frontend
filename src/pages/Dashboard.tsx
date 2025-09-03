// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import DashboardStats from '../components/DashboardStats';
import AppointmentsList from '../components/AppointmentsList';
import { api } from '../utils/api';
import type { Appointment, DashboardStats as StatsType } from '../types';

const pad2 = (n: number) => String(n).padStart(2, '0');
const fmtHHmm = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const startOfDayLocal = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toLocaleDateString('en-ca'); // 'YYYY-MM-DD' in local TZ
  // optionally: { timeZone: 'Asia/Colombo' }
};
const endOfDayLocal = (d: Date) => startOfDayLocal(d); // we pass same date and use 23:59:59 on server

// Map API rows -> Appointment (frontend)
function mapApptRow(row: any): Appointment {
  const dt = new Date(row.start_time);
  return {
    id: String(row.appt_code ?? row.id),
    patientId: row.patient_code ?? String(row.patient_id ?? ''),
    patientName: row.patient_name ?? '',
    date: dt,
    time: fmtHHmm(dt),
    duration: Number(row.duration_min ?? 0),
    type: (row.type ?? 'consultation') as Appointment['type'],
    status: (row.status ?? 'scheduled') as Appointment['status'],
    fee: Number(row.fee ?? 0),
    notes: row.notes ?? undefined,
  };
}

const Dashboard: React.FC = () => {
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<StatsType>({
    patientsToday: 0,
    totalAppointments: 0,
    averagePayment: 0,
    revenueToday: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch today's appointments + today's payments
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const from = startOfDayLocal(new Date());
        const to = endOfDayLocal(new Date());

        // GET /api/appointments?from=YYYY-MM-DD
        const allApptRes = await api(`/api/appointments?from=${from}`);
        if (!allApptRes.ok) {
          const j = await allApptRes.json().catch(() => ({}));
          throw new Error(j?.error?.message || `Failed to load appointments (${allApptRes.status})`);
        }
        const allApptRows = await allApptRes.json();
        const allAppts: Appointment[] = Array.isArray(allApptRows) ? allApptRows.map(mapApptRow) : [];
        
        const apptRes = await api(`/api/appointments?from=${from}&to=${to}`);
        if (!apptRes.ok) {
          const j = await apptRes.json().catch(() => ({}));
          throw new Error(j?.error?.message || `Failed to load appointments (${apptRes.status})`);
        }
        const apptRows = await apptRes.json();
        const appts: Appointment[] = Array.isArray(apptRows) ? apptRows.map(mapApptRow) : [];

        // GET /api/payments?from=YYYY-MM-DD&to=YYYY-MM-DD&status=paid
        const payRes = await api(`/api/payments?from=${from}&to=${to}&status=paid`);
        if (!payRes.ok) {
          const j = await payRes.json().catch(() => ({}));
          throw new Error(j?.error?.message || `Failed to load payments (${payRes.status})`);
        }
        const pays: any[] = await payRes.json();

        if (cancelled) return;

        // Compute stats
        const patientsToday = new Set(appts.map(a => a.patientId)).size;
        const totalAppointments = allAppts.length;

        const paidAmounts = pays.map(p => Number(p.amount ?? 0)).filter(n => !Number.isNaN(n));
        const revenueToday = paidAmounts.reduce((s, n) => s + n, 0);
        const averagePayment = paidAmounts.length ? revenueToday / paidAmounts.length : 0;

        setTodayAppointments(appts);
        setStats({
          patientsToday,
          totalAppointments,
          averagePayment,
          revenueToday,
          totalRevenue: stats.totalRevenue,
          monthlyRevenue: stats.monthlyRevenue,
        });
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load dashboard data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // on mount

  // Find the next upcoming (today) by time after "now"
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const upcoming = useMemo(() => {
    return [...todayAppointments]
      .filter(a => a.status === 'scheduled')
      .sort((a, b) => toMinutes(a.time) - toMinutes(b.time))
      .find(a => toMinutes(a.time) >= nowMin);
  }, [todayAppointments, nowMin]);

  // Loading / error states kept simple for the dashboard
  if (loading) {
    return (
      <div className="space-y-6 text-gray-100">
        <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6">
          <p className="text-gray-300">Loading dashboard…</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-6 text-gray-100">
        <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6">
          <p className="text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-100">
      {/* Welcome Section */}
      <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome back, Mr Doctor</h1>
            <p className="text-gray-400">{currentDate}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 mb-1">Next appointment</p>
            <p className="font-semibold text-gray-100">
              {upcoming ? `Today at ${upcoming.date.toISOString().substring(11, 16)}` : 'No appointments'}
            </p>
            {upcoming && (
              <p className="text-xs text-gray-500">{String(upcoming.type).toUpperCase()}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards (from API) */}
      <DashboardStats stats={stats} />

      {/* Today's Appointments */}
      <div className="grid grid-cols-1 gap-6">
        <AppointmentsList
          appointments={todayAppointments}
          title="Today's Appointments"
        />
      </div>
    </div>
  );
};

export default Dashboard;
