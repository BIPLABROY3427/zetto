import React, { useEffect, useRef } from 'react';
import { FiAlertTriangle, FiTrash2, FiInfo, FiCheckCircle, FiX } from 'react-icons/fi';
import './ConfirmDialog.css';

/**
 * ConfirmDialog — replaces window.confirm / window.alert
 *
 * Props:
 *  isOpen        boolean        — show / hide
 *  onConfirm     () => void     — called when user clicks confirm
 *  onCancel      () => void     — called when user clicks cancel / closes
 *  title         string
 *  message       string | node
 *  confirmText   string         default "Confirm"
 *  cancelText    string         default "Cancel"
 *  variant       'danger' | 'warning' | 'info' | 'success'  default 'danger'
 *  loading       boolean        — show spinner on confirm button while async op runs
 */
const ICON_MAP = {
  danger:  <FiTrash2 />,
  warning: <FiAlertTriangle />,
  info:    <FiInfo />,
  success: <FiCheckCircle />,
};

const ConfirmDialog = ({
  isOpen = false,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  variant     = 'danger',
  loading     = false,
}) => {
  const confirmBtnRef = useRef(null);

  /* Auto-focus confirm button when dialog opens */
  useEffect(() => {
    if (isOpen && confirmBtnRef.current) {
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="cd-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cd-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <div className={`cd-box cd-${variant}`}>
        {/* Absolute Close Button */}
        <button className="cd-close-abs" onClick={onCancel} aria-label="Close">
          <FiX />
        </button>

        {/* Icon */}
        <div className={`cd-icon-wrap cd-icon-${variant}`}>
          {ICON_MAP[variant]}
        </div>

        {/* Header */}
        <div className="cd-header">
          <h3 id="cd-title" className="cd-title">{title}</h3>
        </div>

        {/* Message */}
        <p className="cd-message">{message}</p>

        {/* Actions */}
        <div className="cd-footer">
          <button
            className="cd-btn cd-btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            className={`cd-btn cd-btn-confirm cd-confirm-${variant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <span className="cd-spinner" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
