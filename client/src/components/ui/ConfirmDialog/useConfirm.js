import { useState, useCallback } from 'react';

/**
 * useConfirm — drop-in replacement for window.confirm
 *
 * Usage:
 *   const { confirmProps, confirm } = useConfirm();
 *   ...
 *   // In your async handler:
 *   const ok = await confirm({
 *     title: 'Delete user?',
 *     message: 'This cannot be undone.',
 *     confirmText: 'Delete',
 *     variant: 'danger',
 *   });
 *   if (!ok) return;
 *   // proceed…
 *
 *   // In JSX:
 *   <ConfirmDialog {...confirmProps} />
 */
const useConfirm = () => {
  const [state, setState] = useState({ isOpen: false, resolve: null, options: {} });
  const [loading, setLoading] = useState(false);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({ isOpen: true, resolve, options });
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      state.resolve?.(true);
    } finally {
      setLoading(false);
      setState(s => ({ ...s, isOpen: false, resolve: null }));
    }
  }, [state]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState(s => ({ ...s, isOpen: false, resolve: null }));
  }, [state]);

  const confirmProps = {
    isOpen:      state.isOpen,
    onConfirm:   handleConfirm,
    onCancel:    handleCancel,
    loading,
    ...state.options,
  };

  return { confirm, confirmProps };
};

export default useConfirm;
