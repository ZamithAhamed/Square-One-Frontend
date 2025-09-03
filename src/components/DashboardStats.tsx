import React from 'react';
import { Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import type { DashboardStats as StatsType } from '../types';

interface DashboardStatsProps {
  stats: StatsType;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Patients Today',
      value: stats.patientsToday,
      icon: Users,
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      valueColor: 'text-blue-300',
      subtitle: 'No data for yesterday',
    },
    {
      title: 'Total Appointments',
      value: stats.totalAppointments,
      icon: Calendar,
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      valueColor: 'text-orange-300',
      subtitle: 'Active appointments',
    },
    {
      title: 'Average Payment',
      value: `LKR ${stats.averagePayment.toFixed(2)}`,
      icon: DollarSign,
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      valueColor: 'text-purple-300',
      subtitle: 'Per appointment',
    },
    {
      title: 'Revenue Today',
      value: `LKR ${stats.revenueToday.toFixed(2)}`,
      icon: TrendingUp,
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      valueColor: 'text-green-300',
      subtitle: 'No data for yesterday',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-gray-900 rounded-xl p-6 border border-gray-800"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${stat.iconBg}`}>
              <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">{stat.title}</h3>
            <p className={`text-2xl font-bold ${stat.valueColor} mb-1`}>{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
