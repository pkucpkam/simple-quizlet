import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => (
  <Modal open={isOpen} onClose={onClose} size="sm" showClose={false}>
    <div className="text-center">
      {/* Icon */}
      <div className="w-10 h-10 rounded-full bg-claude-info-light border border-blue-200 flex items-center justify-center mx-auto mb-4">
        <svg className="h-5 w-5 text-claude-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h2 className="text-base font-semibold text-claude-text mb-3">Thông báo cập nhật</h2>

      <div className="text-sm text-claude-text-2 space-y-2 text-left leading-relaxed mb-6">
        <p>Chào bạn, cảm ơn bạn đã sử dụng và ủng hộ ứng dụng trong suốt thời gian qua.</p>
        <p>
          Nhằm mục đích duy trì hệ thống và nâng cấp thêm nhiều tính năng mới, ứng dụng sẽ chính thức bắt đầu{' '}
          <span className="font-semibold text-claude-accent">thu phí từ ngày 1/8</span> sắp tới.
        </p>
        <p>Rất mong nhận được sự thông cảm và tiếp tục đồng hành từ mọi người!</p>
      </div>

      <Button variant="primary" onClick={onClose} className="w-full justify-center">
        Đã hiểu
      </Button>
    </div>
  </Modal>
);

export default NotificationModal;
