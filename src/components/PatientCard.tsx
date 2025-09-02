import React from 'react';
import { Phone, Mail, AlertTriangle, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Patient } from '../types';

interface PatientCardProps {
  patient: Patient;
  onView?: (patient: Patient) => void;
  onEdit?: (patient: Patient) => void;
  onDelete?: (patient: Patient) => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onView, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

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
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-700">
                {getInitials(patient.name)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{patient.name}</h3>
              <p className="text-sm text-gray-500">{patient.patientId}</p>
              <p className="text-xs text-gray-400">
                {age} years • {patient.gender}
              </p>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50"
              onClick={() => setMenuOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-lg z-10"
              >
                <button
                  role="menuitem"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => { setMenuOpen(false); onEdit?.(patient); }}
                >
                  <Pencil className="w-4 h-4 text-gray-500" />
                  Edit
                </button>
                <button
                  role="menuitem"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
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
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{patient.phone}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{patient.email}</span>
          </div>
        </div>

        {patient.allergies && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-red-600 font-medium">Allergies:</span>
              <span className="text-gray-600">{patient.allergies}</span>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={() => onView?.(patient)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
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
