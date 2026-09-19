import React from 'react';
import { AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-react';

export type ModalType = 'info' | 'success' | 'warning' | 'error' | 'question' | 'danger';

export interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: ModalType;
  isConfirm: boolean;
  okText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ConfirmModalProps {
  modal: ModalState;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ modal, onClose }) => {
  if (!modal.isOpen) return null;

  const handleOk = () => {
    onClose();
    if (modal.onConfirm) modal.onConfirm();
  };

  const handleCancel = () => {
    onClose();
    if (modal.onCancel) modal.onCancel();
  };

  const getIcon = () => {
    switch (modal.type) {
      case 'success':
        return (
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6" />
          </div>
        );
      case 'warning':
      case 'error':
      case 'danger':
        return (
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case 'question':
        return (
          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-6 h-6" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Info className="w-6 h-6" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl border border-slate-100 transform transition-all">
        {getIcon()}
        <h3 className="text-lg font-bold text-slate-800 mb-2">{modal.title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-6 whitespace-pre-line">
          {modal.message}
        </p>
        <div className="flex gap-2.5">
          {modal.isConfirm && (
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition active:scale-95"
            >
              {modal.cancelText || 'Batal'}
            </button>
          )}
          <button
            onClick={handleOk}
            className={`flex-1 py-2.5 px-4 rounded-xl text-white font-semibold text-sm shadow-md transition active:scale-95 ${
              modal.type === 'danger' || modal.type === 'error'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {modal.okText || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};
