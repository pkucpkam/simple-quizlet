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
} from "firebase/firestore";
import { db } from "./firebase_setup";
import type { Folder, CreateFolderData } from "../types/folder";

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
            const folders: Folder[] = foldersSnapshot.docs.map((doc) => {
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
};
