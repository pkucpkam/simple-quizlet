import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function VerifyEmail() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in">
            <Card className="max-w-md w-full p-8 text-center space-y-6">
                <div className="text-5xl text-claude-accent mb-2">✉️</div>
                <h2 className="text-2xl font-bold text-claude-text">Xác thực Email</h2>
                <p className="text-claude-text-2 text-sm leading-relaxed">
                    Tài khoản của bạn chưa được xác thực. Chúng tôi đã gửi một email xác thực đến địa chỉ của bạn.
                    <br /><br />
                    Vui lòng kiểm tra hộp thư (bao gồm cả thư mục Spam) và nhấp vào liên kết xác thực để kích hoạt tài khoản.
                </p>

                <div className="pt-2">
                    <Link to="/login" className="block w-full">
                        <Button variant="primary" className="w-full">
                            Quay lại Đăng nhập
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}
