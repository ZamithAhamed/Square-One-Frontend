import { Patient, Appointment, Payment, DashboardStats } from '../types';

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'سامي',
    patientId: 'PAT-f995-1004',
    age: 22,
    gender: 'male',
    phone: '+812312312',
    email: 'marvis@hotmail.com',
    createdAt: new Date('2024-01-15'),
    lastVisit: new Date('2024-12-01'),
    bloodType: undefined,
    contact: '',
    dob: undefined
  },
  {
    id: '2',
    name: 'Mr RIC',
    patientId: 'PAT-f995-1003',
    age: 39,
    gender: 'male',
    phone: '123123123131',
    email: 'davin@gmail.com',
    allergies: 'Nothingasd',
    createdAt: new Date('2024-02-10'),
    lastVisit: new Date('2024-11-28'),
    bloodType: undefined,
    contact: '',
    dob: undefined
  },
  {
    id: '3',
    name: 'Mr Francis',
    patientId: 'PAT-f995-1002',
    age: 35,
    gender: 'male',
    phone: '12312312123',
    email: 'aasdasl@gmail.com',
    allergies: 'asd',
    createdAt: new Date('2024-03-05'),
    lastVisit: new Date('2024-11-25'),
    bloodType: undefined,
    contact: '',
    dob: undefined
  },
  {
    id: '4',
    name: 'Mr.Zaidi',
    patientId: 'PAT-f995-1001',
    age: 23,
    gender: 'male',
    phone: '1241243141321',
    email: 'test@gmail.com',
    createdAt: new Date('2024-04-20'),
    lastVisit: new Date('2024-11-20'),
    bloodType: undefined,
    contact: '',
    dob: undefined
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientId: '1',
    patientName: 'سامي',
    date: new Date('2025-08-30'),
    time: '10:30',
    duration: 30,
    type: 'consultation',
    status: 'scheduled',
    fee: 100
  },
  {
    id: '2',
    patientId: '2',
    patientName: 'Mr RIC',
    date: new Date('2025-08-30'),
    time: '19:00',
    duration: 45,
    type: 'follow-up',
    status: 'scheduled',
    fee: 75
  },
  {
    id: '3',
    patientId: '3',
    patientName: 'Mr Francis',
    date: new Date('2024-12-16'),
    time: '14:00',
    duration: 30,
    type: 'checkup',
    status: 'scheduled',
    fee: 85
  }
];

export const mockPayments: Payment[] = [
  {
    id: '1',
    patientId: '1',
    patientName: 'Mohamed',
    appointmentId: '1',
    amount: 100,
    currency: 'LKR',
    method: 'card',
    status: 'paid',
    date: new Date('2024-12-01'),
    description: 'Consultation fee'
  },
  {
    id: '2',
    patientId: '2',
    patientName: 'Mr RIC',
    appointmentId: '2',
    amount: 75,
    currency: 'LKR',
    method: 'cash',
    status: 'paid',
    date: new Date('2024-11-28'),
    description: 'Follow-up appointment'
  }
];

export const mockDashboardStats: DashboardStats = {
  patientsToday: 0,
  totalAppointments: 3,
  revenueToday: 0,
  totalRevenue: 175,
  averagePayment: 87.5,
  monthlyRevenue: 175
};