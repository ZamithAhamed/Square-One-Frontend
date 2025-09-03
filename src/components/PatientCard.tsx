import React from 'react';
import { Phone, Mail, AlertTriangle, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Patient } from '../types';

interface PatientCardProps {
  patient: Patient;
  onView?: (patient: Patient) => void;
  onEdit?: (patient: Patient) => void;
  onDelete?: (patient: Patient) => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onView, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    const letters = (name || '')
      .trim()
      .split(/\s+/)
      .map(n => n[0]?.toUpperCase())
      .join('')
      .slice(0, 2);
    return letters || 'PT';
  };

  const age = patient.dob
    ? Math.max(0, Math.floor((Date.now() - new Date(patient.dob).getTime()) / 31557600000))
    : patient.age;

  // close menu on outside click / escape
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 hover:bg-gray-800/50 transition-colors shadow-sm">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-300">
                {getInitials(patient.name)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-100">{patient.name}</h3>
              <p className="text-sm text-gray-400">{patient.patientId}</p>
              <p className="text-xs text-gray-500">
                {age} years • {patient.gender}
              </p>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              className="p-1 text-gray-400 hover:text-gray-200 rounded-md hover:bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              onClick={() => setMenuOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-800 bg-gray-900 shadow-lg ring-1 ring-white/10 z-10"
              >
                <button
                  role="menuitem"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/60"
                  onClick={() => { setMenuOpen(false); onEdit?.(patient); }}
                >
                  <Pencil className="w-4 h-4 text-gray-400" />
                  Edit
                </button>
                <button
                  role="menuitem"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                  onClick={() => { setMenuOpen(false); onDelete?.(patient); }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Phone className="w-4 h-4 text-gray-500" />
            <span>{patient.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Mail className="w-4 h-4 text-gray-500" />
            <span>{patient.email}</span>
          </div>
        </div>

        {patient.allergies && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-medium">Allergies:</span>
              <span className="text-gray-300">{patient.allergies}</span>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-800">
          <button
            onClick={() => onView?.(patient)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientCard;
