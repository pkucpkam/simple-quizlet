import { Link } from 'react-router-dom';

export default function VerifyEmail() {
    return (
        <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded shadow text-center">
            <h2 className="text-2xl font-bold mb-4 text-yellow-600">Xác thực Email</h2>
            <p className="text-gray-700 mb-6">
                Tài khoản của bạn chưa được xác thực. Chúng tôi đã gửi một email xác thực đến địa chỉ của bạn.
                <br /><br />
                Vui lòng kiểm tra hộp thư (bao gồm cả thư mục Spam) và nhấp vào liên kết xác thực để kích hoạt tài khoản.
            </p>

            <div className="flex flex-col gap-3">
                <Link
                    to="/login"
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                    Quay lại Đăng nhập
                </Link>
            </div>
        </div>
    );
}
