import React from 'react';
import { Clock, User, Calendar } from 'lucide-react';
import type { Appointment } from '../types';

interface AppointmentsListProps {
  appointments: Appointment[];
  title: string;
  emptyMessage?: string;
}

const AppointmentsList: React.FC<AppointmentsListProps> = ({ 
  appointments, 
  title, 
  emptyMessage = "No appointments for today" 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-300 ring-1 ring-inset ring-blue-500/30';
      case 'completed': return 'bg-green-500/20 text-green-300 ring-1 ring-inset ring-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 ring-1 ring-inset ring-red-500/30';
      case 'no-show': return 'bg-gray-500/20 text-gray-300 ring-1 ring-inset ring-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 ring-1 ring-inset ring-gray-500/30';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'border-l-red-500';
      case 'consultation': return 'border-l-blue-500';
      case 'follow-up': return 'border-l-green-500';
      case 'checkup': return 'border-l-yellow-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
          </div>
          <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">
            View all →
          </button>
        </div>
      </div>
      
      <div className="p-6">
        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div 
                key={appointment.id} 
                className={`border-l-4 ${getTypeColor(appointment.type)} bg-gray-900 rounded-r-lg p-4 transition-colors hover:bg-gray-800/50 ring-1 ring-white/5`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-100">{appointment.patientName}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{appointment.time}</span>
                      </span>
                      <span className="capitalize">{appointment.type}</span>
                      <span>LKR {appointment.fee}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsList;