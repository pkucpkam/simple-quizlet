export interface Folder {
    id: string;
    name: string;
    description?: string;
    creator: string;
    createdAt: Date;
    updatedAt?: Date;
    color?: string; // Màu sắc để phân biệt thư mục
    icon?: string; // Icon emoji cho thư mục
    lessonCount?: number; // Số lượng bài học trong thư mục
}

export interface CreateFolderData {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
}
