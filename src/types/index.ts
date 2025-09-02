export interface Patient {
  bloodType: any;
  contact: string;
  dob: any;
  id: string;
  name: string;
  patientId: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  medicalInfo?: string;
  allergies?: string;
  createdAt: Date;
  lastVisit?: Date;
  appointments?: Appointment[]; 
  notes?: Note[]; // <-- add this
}

export type Note = {
  id: number;
  title: string;
  content?: string;
  createdAt: string; // ISO
  author: string;
};

export interface Appointment {
  id: string;
  patientId: string;
  appt_code?: string;
  patientName: string;
  date: Date;
  time: string;
  duration: number; // in minutes
  type: 'consultation' | 'follow-up' | 'checkup' | 'urgent';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  fee: number;
}

export interface Payment {
  appointment_id: any;
  id: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  amount: number;
  currency: string;
  method: 'cash' | 'card' | 'online' | 'bank-transfer';
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  date: Date;
  description: string;
}

export interface DashboardStats {
  patientsToday: number;
  totalAppointments: number;
  revenueToday: number;
  totalRevenue: number;
  averagePayment: number;
  monthlyRevenue: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'doctor' | 'admin';
}