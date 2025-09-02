import React, { useState } from 'react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (note: { title: string; content?: string }) => void;
  defaultAuthor?: string;
};

const AddNoteModal: React.FC<Props> = ({ open, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErr('Title is required');
      return;
    }
    onSave({ title: title.trim(), content: content.trim() || undefined });
    setTitle('');
    setContent('');
    setErr(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Add Note</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <form onSubmit={submit} className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Title <span className="text-red-500">*</span></label>
              <input
                className={`mt-1 w-full rounded-lg border p-2.5 ${err ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., Follow-up on cough"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Details</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
                rows={5}
                placeholder="Optional details..."
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                Save Note
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddNoteModal;
