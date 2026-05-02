import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    deleteDoc,
    query,
    where,
    updateDoc,
    orderBy,
    limit,
    startAfter,
    getCountFromServer,
    type QueryDocumentSnapshot,
    type DocumentData
} from "firebase/firestore";
import { db } from "./firebase_setup";
import type { Folder, CreateFolderData } from "../types/folder";
import type { Lesson } from "./lessonService"; // Import Lesson here

export const folderService = {
    /**
     * Tạo thư mục mới
     */
    async createFolder(creator: string, folderData: CreateFolderData): Promise<{ folderId: string; success: boolean }> {
        try {
            const folderRef = await addDoc(collection(db, "folders"), {
                name: folderData.name,
                description: folderData.description || "",
                creator,
                createdAt: new Date(),
                color: folderData.color || "#3B82F6", // Default blue
                icon: folderData.icon || "📁",
                lessonCount: 0,
                isOfficial: folderData.isOfficial || false,
            });

            return {
                folderId: folderRef.id,
                success: true,
            };
        } catch (error) {
            console.error("Lỗi khi tạo thư mục:", error);
            throw new Error("Không thể tạo thư mục. Vui lòng thử lại.");
        }
    },

    /**
     * Lấy tất cả thư mục của người dùng
     */
    async getMyFolders(creator: string): Promise<Folder[]> {
        try {
            const q = query(
                collection(db, "folders"),
                where("creator", "==", creator),
                orderBy("createdAt", "desc")
            );

            const foldersSnapshot = await getDocs(q);
            
            // Use the stored lessonCount instead of live counting for every folder to save quota
            const folders: Folder[] = foldersSnapshot.docs.map((folderDoc) => {
                const data = folderDoc.data();
                return {
                    id: folderDoc.id,
                    name: data.name,
                    description: data.description || "",
                    creator: data.creator,
                    createdAt: data.createdAt.toDate(),
                    updatedAt: data.updatedAt?.toDate(),
                    color: data.color || "#3B82F6",
                    icon: data.icon || "📁",
                    lessonCount: data.lessonCount || 0,
                };
            });

            return folders;
        } catch (error) {
            console.error("Lỗi khi lấy danh sách thư mục:", error);
            throw new Error("Không thể lấy danh sách thư mục. Vui lòng thử lại.");
        }
    },

    /**
     * Lấy thông tin một thư mục
     */
    async getFolder(folderId: string): Promise<Folder> {
        try {
            const folderDoc = await getDoc(doc(db, "folders", folderId));
            if (!folderDoc.exists()) {
                throw new Error("Không tìm thấy thư mục.");
            }

            const data = folderDoc.data();
            
            return {
                id: folderDoc.id,
                name: data.name,
                description: data.description || "",
                creator: data.creator,
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt?.toDate(),
                color: data.color || "#3B82F6",
                icon: data.icon || "📁",
                lessonCount: data.lessonCount || 0,
            };
        } catch (error) {
            console.error("Lỗi khi lấy thông tin thư mục:", error);
            throw new Error("Không thể lấy thông tin thư mục.");
        }
    },

    /**
     * Cập nhật thông tin thư mục
     */
    async updateFolder(folderId: string, folderData: Partial<CreateFolderData>): Promise<{ success: boolean }> {
        try {
            await updateDoc(doc(db, "folders", folderId), {
                ...folderData,
                updatedAt: new Date(),
            });

            return { success: true };
        } catch (error) {
            console.error("Lỗi khi cập nhật thư mục:", error);
            throw new Error("Không thể cập nhật thư mục. Vui lòng thử lại.");
        }
    },

    /**
     * Xóa thư mục
     */
    async deleteFolder(folderId: string): Promise<{ success: boolean }> {
        try {
            // TODO: Có thể cần kiểm tra xem thư mục có bài học không trước khi xóa
            await deleteDoc(doc(db, "folders", folderId));
            return { success: true };
        } catch (error) {
            console.error("Lỗi khi xóa thư mục:", error);
            throw new Error("Không thể xóa thư mục.");
        }
    },

    /**
     * Cập nhật số lượng bài học trong thư mục
     */
    async updateLessonCount(folderId: string, count: number): Promise<void> {
        try {
            await updateDoc(doc(db, "folders", folderId), {
                lessonCount: count,
                updatedAt: new Date(),
            });
        } catch (error) {
            console.error("Lỗi khi cập nhật số lượng bài học:", error);
            // Không throw error vì đây là operation phụ
        }
    },

    async getAllFoldersPaginated(
        pageSize: number = 10,
        lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null,
        skipCount: boolean = false
    ): Promise<{ 
        folders: Folder[]; 
        lastVisible: QueryDocumentSnapshot<DocumentData> | null; 
        hasMore: boolean;
        total: number;
    }> {
        try {
            let q = query(
                collection(db, "folders"),
                orderBy("createdAt", "desc"),
                limit(pageSize + 1)
            );

            if (lastVisibleDoc) {
                q = query(
                    collection(db, "folders"),
                    orderBy("createdAt", "desc"),
                    startAfter(lastVisibleDoc),
                    limit(pageSize + 1)
                );
            }

            const foldersSnapshot = await getDocs(q);
            const docs = foldersSnapshot.docs;
            const hasMore = docs.length > pageSize;
            const actualDocs = hasMore ? docs.slice(0, pageSize) : docs;

            const folders: Folder[] = actualDocs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    description: data.description || "",
                    creator: data.creator,
                    createdAt: data.createdAt.toDate(),
                    updatedAt: data.updatedAt?.toDate(),
                    color: data.color || "#3B82F6",
                    icon: data.icon || "📁",
                    lessonCount: data.lessonCount || 0,
                    isOfficial: data.isOfficial || false
                };
            });

            const total = skipCount ? 0 : await this.getTotalFoldersCount();

            return {
                folders,
                lastVisible: actualDocs.length > 0 ? actualDocs[actualDocs.length - 1] : null,
                hasMore,
                total
            };
        } catch (error) {
            console.error("Lỗi khi lấy thư mục phân trang:", error);
            throw new Error("Không thể lấy tất cả thư mục.");
        }
    },

    async getTotalFoldersCount(): Promise<number> {
        try {
            const q = query(collection(db, "folders"));
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
        } catch {
            return 0;
        }
    },

    async getOfficialFolders(): Promise<Folder[]> {
        try {
            const q = query(
                collection(db, "folders"),
                where("isOfficial", "==", true),
                orderBy("createdAt", "desc")
            );

            const foldersSnapshot = await getDocs(q);
            
            // Use stored lessonCount to avoid quota exhaustion
            const folders: Folder[] = foldersSnapshot.docs.map((folderDoc) => {
                const data = folderDoc.data();
                
                return {
                    id: folderDoc.id,
                    name: data.name,
                    description: data.description || "",
                    creator: data.creator,
                    createdAt: data.createdAt.toDate(),
                    updatedAt: data.updatedAt?.toDate(),
                    color: data.color || "#3B82F6",
                    icon: data.icon || "📁",
                    lessonCount: data.lessonCount || 0,
                    isOfficial: true
                };
            });

            return folders;
        } catch (error) {
            console.error("Lỗi khi lấy thư mục chính thức:", error);
            throw new Error("Không thể lấy danh sách thư mục hệ thống.");
        }
    },

    /**
     * Lấy tất cả bài học trong một thư mục (Công khai/Hệ thống)
     */
    async getLessonsInFolder(folderId: string) {
        try {
            const q = query(
                collection(db, "lessons"),
                where("folderId", "==", folderId),
                orderBy("createdAt", "desc")
            );

            const snapshot = await getDocs(q);
            const lessons: Lesson[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    creator: data.creator,
                    vocabId: data.vocabId,
                    description: data.description || "",
                    wordCount: data.wordCount || 0,
                    isPrivate: data.isPrivate || false,
                    isOfficial: data.isOfficial || false,
                    folderId: data.folderId || null,
                    createdAt: data.createdAt.toDate(),
                };
            });
            return lessons;
        } catch (error) {
            console.error("Lỗi khi lấy bài học trong thư mục:", error);
            throw new Error("Không thể lấy danh sách bài học.");
        }
    }
};
