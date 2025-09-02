import React from 'react';
import { Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { DashboardStats as StatsType } from '../types';

interface DashboardStatsProps {
  stats: StatsType;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Patients Today',
      value: stats.patientsToday,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      subtitle: 'No data for yesterday'
    },
    {
      title: 'Total Appointments',
      value: stats.totalAppointments,
      icon: Calendar,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      subtitle: 'Active appointments'
    },
    {
      title: 'Average Payment',
      value: `LKR ${stats.averagePayment.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      subtitle: 'Per appointment'
    },
    {
      title: 'Revenue Today',
      value: `LKR ${stats.revenueToday.toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      subtitle: 'No data for yesterday'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} rounded-xl p-6 border border-gray-100`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 ${stat.color} rounded-lg`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
            <p className={`text-2xl font-bold ${stat.textColor} mb-1`}>{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;