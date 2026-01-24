import { signInWithEmailAndPassword, type User } from 'firebase/auth';
import { auth } from './firebase_setup';

interface LoginData {
  email: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  user?: User;
  message?: string;
}

export const loginUser = async ({ email, password }: LoginData): Promise<LoginResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      await auth.signOut();
      return {
        success: false,
        message: 'EMAIL_NOT_VERIFIED', // Special flag for UI
      };
    }

    return {
      success: true,
      user: user,
      message: 'Đăng nhập thành công!',
    };
  } catch (err: unknown) {
    const error = err as { code?: string; message: string };
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return { success: false, message: 'Email hoặc mật khẩu không đúng!' };
      case 'auth/invalid-email':
        return { success: false, message: 'Email không hợp lệ!' };
      case 'auth/too-many-requests':
        return { success: false, message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau!' };
      default:
        return { success: false, message: 'Đã có lỗi xảy ra: ' + error.message };
    }
  }
};