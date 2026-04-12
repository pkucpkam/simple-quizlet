import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy, limit, startAfter, getCountFromServer, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from './firebase_setup';
import type { User, Auth } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';
import { uploadToCloudinary } from './cloudinaryService';

export interface UserInfo {
  uid?: string;
  username: string;
  email?: string;
  photoURL?: string;
  createdAt?: string | number;
  role?: string;
}

export const getUserInfo = async (user: User): Promise<UserInfo> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (userDoc.exists()) {
      const data = userDoc.data();
      return { 
        uid: user.uid,
        username: data.username || 'Không có username',
        photoURL: data.photoURL,
        role: data.role || 'USER',
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : undefined
      };
    } else {
      return { uid: user.uid, username: user.email || 'Người dùng', role: 'USER' };
    }
  } catch (err) {
    console.error('[getUserInfo] Lỗi khi lấy thông tin người dùng:', err);
    return { username: user.email || 'Người dùng', role: 'USER' };
  }
};

export const getAllUsers = async (): Promise<UserInfo[]> => {
  try {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    })) as UserInfo[];
    return userList;
  } catch (err) {
    console.error('[getAllUsers] Lỗi khi lấy danh sách người dùng:', err);
    return [];
  }
};

export const getPaginatedUsers = async (
  pageSize: number = 10,
  lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<{ 
  users: UserInfo[]; 
  lastVisible: QueryDocumentSnapshot<DocumentData> | null; 
  hasMore: boolean;
  total: number;
}> => {
  try {
    let q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1)
    );

    if (lastVisibleDoc) {
      q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisibleDoc),
        limit(pageSize + 1)
      );
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const actualDocs = hasMore ? docs.slice(0, pageSize) : docs;

    const users = actualDocs.map(doc => ({
      uid: doc.id,
      username: doc.data().username || 'Không có username',
      email: doc.data().email,
      photoURL: doc.data().photoURL,
      role: doc.data().role || 'USER',
      createdAt: doc.data().createdAt ? (doc.data().createdAt.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt) : undefined
    }));

    const total = await getTotalUsersCount();

    return {
      users,
      lastVisible: actualDocs.length > 0 ? actualDocs[actualDocs.length - 1] : null,
      hasMore,
      total
    };
  } catch (err) {
    console.error('[getPaginatedUsers] Lỗi:', err);
    throw new Error('Không thể tải danh sách người dùng.');
  }
};

export const getTotalUsersCount = async (): Promise<number> => {
  try {
    const q = query(collection(db, 'users'));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch {
    return 0;
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
