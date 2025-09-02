import type { Patient } from '../types';

export function normalizePatient(api: any): Patient {
  // accept multiple possible backend key styles
  const id = api.id ?? api.patient_id ?? api.patientId ?? null;
  const patientId =
    api.patientId ?? api.patient_code ?? api.patientCode ?? api.code ?? '';

  return {
    id: String(id ?? patientId ?? cryptoRandomId()),
    patientId: String(patientId || ''),
    name: api.name ?? api.full_name ?? '',
    email: api.email ?? '',
    phone: api.phone ?? api.contact ?? '',
    contact: api.contact ?? api.phone ?? '',
    dob: api.dob ? new Date(api.dob) : undefined,
    age: api.age ?? (api.dob ? calcAge(api.dob) : 0),
    gender: (api.gender?.toLowerCase?.() ?? 'other') as 'male'|'female'|'other',
    bloodType: api.blood_type ?? api.bloodType ?? '',
    allergies: api.allergies ?? undefined,
    createdAt: api.created_at ? new Date(api.created_at) : new Date(),
    lastVisit: api.last_visit ? new Date(api.last_visit) : undefined,
    appointments: api.appointments ?? [],
    notes: api.notes ?? [],
    medicalInfo: api.medical_info ?? api.medicalInfo ?? undefined,
  };
}

function calcAge(d: string | Date) {
  const dob = new Date(d);
  return Math.max(0, Math.floor((Date.now() - dob.getTime()) / 31557600000));
}

function cryptoRandomId() {
  // avoids import of crypto for simplicity
  return Math.random().toString(36).slice(2);
}
