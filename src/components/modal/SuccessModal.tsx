import React from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  wordCount: number;
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, title, wordCount }) => {
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
    navigate("/my-lessons");
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Tạo bài học thành công!"
      size="sm"
    >
      <div className="flex flex-col items-center justify-center py-4 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <p className="text-claude-text-2 mb-6">
          {title || "Bài học của bạn đã được tạo thành công."}
          {wordCount > 0 && ` Đã thêm ${wordCount} từ vựng vào bài học.`}
        </p>
        <Button
          onClick={handleClose}
          variant="primary"
          className="w-full"
        >
          OK
        </Button>
      </div>
    </Modal>
  );
};

export default SuccessModal;