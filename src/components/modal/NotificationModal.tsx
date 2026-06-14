import React from "react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 md:p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Thông báo cập nhật
        </h2>
        
        <div className="text-gray-600 mb-8 space-y-3 text-center leading-relaxed">
          <p>
            Chào bạn, cảm ơn bạn đã sử dụng và ủng hộ ứng dụng trong suốt thời gian qua.
          </p>
          <p>
            Nhằm mục đích duy trì hệ thống và nâng cấp thêm nhiều tính năng mới, ứng dụng sẽ chính thức bắt đầu <span className="font-semibold text-blue-600">thu phí từ ngày 1/8</span> sắp tới.
          </p>
          <p>
            Rất mong nhận được sự thông cảm và tiếp tục đồng hành từ mọi người!
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
