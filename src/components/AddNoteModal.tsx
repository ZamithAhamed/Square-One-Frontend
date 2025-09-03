import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (note: { title: string; content?: string }) => void;
  defaultAuthor?: string; // kept for API compatibility (unused here)
};

const AddNoteModal: React.FC<Props> = ({ open, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // autofocus title
    const id = requestAnimationFrame(() => titleRef.current?.focus());
    // close on Escape
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

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
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-xl bg-gray-900 text-gray-100 rounded-2xl shadow-xl border border-gray-800">
          <div className="flex items-center justify-between p-5 border-b border-gray-800">
            <h3 className="text-lg font-semibold">Add Note</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <form onSubmit={submit} className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                ref={titleRef}
                className={`mt-1 w-full rounded-lg border p-2.5 bg-gray-950 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  err ? 'border-red-500' : 'border-gray-800'
                }`}
                placeholder="e.g., Follow-up on cough"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (err) setErr(null);
                }}
              />
              {err && <p className="text-xs text-red-400 mt-1">{err}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Details</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-800 p-2.5 bg-gray-950 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                placeholder="Optional details..."
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
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
