import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase_setup';

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
}

interface RegisterResult {
  success: boolean;
  message?: string;
}

export const registerUser = async ({
  email,
  password,
  confirmPassword,
  username,
}: RegisterData): Promise<RegisterResult> => {
  if (password !== confirmPassword) {
    return { success: false, message: 'Mật khẩu và xác nhận mật khẩu không khớp!' };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      username: username,
      createdAt: new Date().toISOString(),
    });

    return { success: true, message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác minh.' };
  } catch (err: any) {
    switch (err.code) {
      case 'auth/email-already-in-use':
        return { success: false, message: 'Email đã được sử dụng!' };
      case 'auth/invalid-email':
        return { success: false, message: 'Email không hợp lệ!' };
      case 'auth/weak-password':
        return { success: false, message: 'Mật khẩu quá yếu! Vui lòng sử dụng mật khẩu mạnh hơn.' };
      default:
        return { success: false, message: 'Đã có lỗi xảy ra: ' + err.message };
    }
  }
};