import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase_setup';
import type { User, Auth } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';
import { uploadToCloudinary } from './cloudinaryService';

interface UserInfo {
  username: string;
  photoURL?: string;
  createdAt?: string | number;
}

export const getUserInfo = async (user: User): Promise<UserInfo> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (userDoc.exists()) {
      const data = userDoc.data();
      return { 
        username: data.username || 'Không có username',
        photoURL: data.photoURL,
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : undefined
      };
    } else {
      return { username: user.email || 'Người dùng' };
    }
  } catch (err) {
    console.error('[getUserInfo] Lỗi khi lấy thông tin người dùng:', err);
    return { username: user.email || 'Người dùng' };
  }
};

export const updateUserAvatar = async (authObj: Auth, user: User, file: File): Promise<string | null> => {
  try {
    const downloadURL = await uploadToCloudinary(file);
    
    if (!downloadURL) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    // 1. Cập nhật vào Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, { photoURL: downloadURL });

    // 2. Cập nhật vào Firebase Auth hiện tại
    if (authObj.currentUser) {
        await updateProfile(authObj.currentUser, { photoURL: downloadURL });
    }

    return downloadURL;
  } catch (error) {
    console.error('[updateUserAvatar] Lỗi nâng cấp avatar:', error);
    return null;
  }
};
