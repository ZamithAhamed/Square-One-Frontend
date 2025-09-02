import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'default';
};

const ConfirmDialog: React.FC<Props> = ({
  open,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
}) => {
  if (!open) return null;

  const confirmClasses =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white';

  const iconClasses =
    variant === 'danger' ? 'text-red-600' : 'text-blue-600';

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${iconClasses}`} />
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            </div>
            <button
              className="p-2 rounded-lg hover:bg-gray-50"
              onClick={onCancel}
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="p-5 text-sm text-gray-700">
            {message}
          </div>

          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg ${confirmClasses}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
