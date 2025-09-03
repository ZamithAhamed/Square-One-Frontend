import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  User as UserIcon
} from 'lucide-react';

interface SidebarProps {
  activeItem?: string;
  onItemClick?: (item: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem = 'dashboard', onItemClick }) => {
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    // { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-gray-900 text-gray-100 shadow-sm border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          {/* If your logo is dark, consider adding 'invert' class: className="h-14 invert" */}
          <img src="src/uploads/squareone_logo.png" alt="Logo" className="h-14" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 overflow-y-auto">
        <div className="px-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Main Navigation
          </p>
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onItemClick?.(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isActive
                      ? 'bg-gray-800/70 text-gray-100 border-r-2 border-blue-500'
                      : 'text-gray-300 hover:bg-gray-800/50 hover:text-gray-100'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Profile (optional) */}
      {/* <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">MD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-100 truncate">Mr Doctor</p>
            <p className="text-xs text-gray-400 truncate">admin@dms.com</p>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Sidebar;