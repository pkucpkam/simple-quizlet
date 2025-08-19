import React from "react";
import { useNavigate } from "react-router-dom";

interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  wordCount: number;
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    navigate("/my-lessons");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl transform transition-all duration-300 scale-100">
        <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">
          Tạo bài học thành công!
        </h2>
        <div className="flex justify-center">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;