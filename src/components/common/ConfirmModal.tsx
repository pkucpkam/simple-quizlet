import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Xác nhận',
  confirmVariant = 'danger',
  loading = false,
}) => (
  <Modal open={open} onClose={onCancel} title={title} size="sm">
    <p className="text-sm text-claude-text-2 mb-5">{message}</p>
    <div className="flex justify-end gap-2">
      <Button variant="ghost" onClick={onCancel} disabled={loading}>
        Hủy
      </Button>
      <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);

export default ConfirmModal;
