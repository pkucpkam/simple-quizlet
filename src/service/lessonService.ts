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
  QueryDocumentSnapshot,
  getCountFromServer
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { db } from "./firebase_setup";

interface VocabItem {
  word: string;
  definition: string;
}

interface Lesson {
  id: string;
  title: string;
  creator: string;
  vocabId: string;
  createdAt: Date;
  description: string;
  wordCount: number;
  isPrivate: boolean;
}

export interface PaginatedLessonsResult {
  lessons: Lesson[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  total: number;
}

export const lessonService = {
  async createLesson(title: string, creator: string, vocabList: VocabItem[], description: string = "", isPrivate: boolean = false, folderId?: string) {
    try {
      const vocabData = vocabList.map(({ word, definition }) => ({
        word,
        definition,
      }));

      const vocabRef = await addDoc(collection(db, "vocabularies"), {
        words: vocabData,
        createdAt: new Date(),
      });

      const lessonRef = await addDoc(collection(db, "lessons"), {
        title,
        creator,
        vocabId: vocabRef.id,
        createdAt: new Date(),
        description,
        wordCount: vocabData.length,
        isPrivate,
        folderId: folderId || null
      });

      return {
        lessonId: lessonRef.id,
        vocabId: vocabRef.id,
        success: true,
      };
    } catch (error) {
      console.error("Lỗi khi tạo bài học:", error);
      throw new Error("Không thể tạo bài học. Vui lòng thử lại.");
    }
  },

  // Legacy method - fetch all lessons (for backward compatibility)
  async getLessons(): Promise<Lesson[]> {
    try {
      const q = query(collection(db, "lessons"), where("isPrivate", "==", false));
      const lessonsSnapshot = await getDocs(q);

      const lessons: Lesson[] = lessonsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          creator: data.creator,
          vocabId: data.vocabId,
          createdAt: data.createdAt.toDate(),
          description: data.description || "",
          wordCount: data.wordCount || 0,
          isPrivate: data.isPrivate || false,
        };
      });

      return lessons;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bài học:", error);
      throw new Error("Không thể lấy danh sách bài học. Vui lòng thử lại.");
    }
  },

  // NEW: Search across ALL lessons (Firestore constraint workaround)
  async searchLessons(term: string): Promise<Lesson[]> {
    try {
      // Fetch all public lessons first
      // Note: In a larger app with 10k+ items, you would use Algolia/ElasticSearch here
      const q = query(
        collection(db, "lessons"),
        where("isPrivate", "==", false),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const allLessons = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          creator: data.creator,
          vocabId: data.vocabId,
          createdAt: data.createdAt.toDate(),
          description: data.description || "",
          wordCount: data.wordCount || 0,
          isPrivate: data.isPrivate || false,
        };
      });

      // Filter in memory (supports robust fuzzy search including description/creator)
      const lowerTerm = term.toLowerCase();
      return allLessons.filter(lesson =>
        lesson.title.toLowerCase().includes(lowerTerm) ||
        lesson.description.toLowerCase().includes(lowerTerm) ||
        lesson.creator.toLowerCase().includes(lowerTerm)
      );
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error);
      throw new Error("Không thể tìm kiếm bài học.");
    }
  },

  // NEW: Optimized paginated lessons fetching
  async getLessonsPaginated(
    pageSize: number = 10,
    lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null
  ): Promise<PaginatedLessonsResult> {
    try {
      // Build base query
      let q = query(
        collection(db, "lessons"),
        where("isPrivate", "==", false),
        orderBy("createdAt", "desc"), // Sort by newest first
        limit(pageSize + 1) // Fetch one extra to check if there are more
      );

      // If continuing from previous page, add cursor
      if (lastVisibleDoc) {
        q = query(
          collection(db, "lessons"),
          where("isPrivate", "==", false),
          orderBy("createdAt", "desc"),
          startAfter(lastVisibleDoc),
          limit(pageSize + 1)
        );
      }

      const lessonsSnapshot = await getDocs(q);
      const docs = lessonsSnapshot.docs;

      // Check if there are more results
      const hasMore = docs.length > pageSize;
      const actualDocs = hasMore ? docs.slice(0, pageSize) : docs;

      const lessons: Lesson[] = actualDocs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          creator: data.creator,
          vocabId: data.vocabId,
          createdAt: data.createdAt.toDate(),
          description: data.description || "",
          wordCount: data.wordCount || 0,
          isPrivate: data.isPrivate || false,
        };
      });

      // Get total count (cached by Firestore)
      const total = await this.getTotalLessonsCount();

      return {
        lessons,
        lastVisible: actualDocs.length > 0 ? actualDocs[actualDocs.length - 1] : null,
        hasMore,
        total,
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bài học phân trang:", error);
      throw new Error("Không thể lấy danh sách bài học. Vui lòng thử lại.");
    }
  },

  // Get total count of public lessons (for pagination info)
  async getTotalLessonsCount(): Promise<number> {
    try {
      const q = query(
        collection(db, "lessons"),
        where("isPrivate", "==", false)
      );
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error("Lỗi khi đếm số bài học:", error);
      return 0; // Return 0 on error to prevent UI break
    }
  },

  async getVocabulary(vocabId: string): Promise<VocabItem[]> {
    try {
      const vocabDoc = await getDoc(doc(db, "vocabularies", vocabId));
      if (!vocabDoc.exists()) {
        throw new Error("Không tìm thấy danh sách từ vựng.");
      }
      return vocabDoc.data().words as VocabItem[];
    } catch (error) {
      console.error("Lỗi khi lấy từ vựng:", error);
      throw new Error("Không thể lấy danh sách từ vựng. Vui lòng thử lại.");
    }
  },

  async deleteLessonById(lessonId: string) {
    try {
      const lessonDoc = await getDoc(doc(db, "lessons", lessonId));
      if (!lessonDoc.exists()) {
        throw new Error("Không tìm thấy bài học.");
      }

      const { vocabId } = lessonDoc.data();

      await deleteDoc(doc(db, "lessons", lessonId));

      if (vocabId) {
        await deleteDoc(doc(db, "vocabularies", vocabId));
      }

      return { success: true };
    } catch (error) {
      console.error("Lỗi khi xóa bài học:", error);
      throw new Error("Không thể xóa bài học.");
    }
  },


  async getMyLessons(creator: string, folderId?: string | null): Promise<Lesson[]> {
    try {
      let q;
      if (folderId === undefined) {
        // Get all lessons
        q = query(collection(db, "lessons"), where("creator", "==", creator));
      } else if (folderId === null) {
        // Get lessons without folder
        q = query(
          collection(db, "lessons"),
          where("creator", "==", creator),
          where("folderId", "==", null)
        );
      } else {
        // Get lessons in specific folder
        q = query(
          collection(db, "lessons"),
          where("creator", "==", creator),
          where("folderId", "==", folderId)
        );
      }

      const lessonsSnapshot = await getDocs(q);
      const lessons: Lesson[] = lessonsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          creator: data.creator,
          vocabId: data.vocabId,
          createdAt: data.createdAt.toDate(),
          description: data.description || "",
          wordCount: data.wordCount || 0,
          isPrivate: data.isPrivate || false,
          folderId: data.folderId || null,
        };
      });
      return lessons;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bài học của người dùng:", error);
      throw new Error("Không thể lấy danh sách bài học. Vui lòng thử lại.");
    }
  },

  async getLesson(lessonId: string) {
    try {
      const lessonDoc = await getDoc(doc(db, "lessons", lessonId));
      if (!lessonDoc.exists()) {
        throw new Error("Không tìm thấy bài học.");
      }
      const lessonData = lessonDoc.data();

      const vocab = await this.getVocabulary(lessonData.vocabId);

      return {
        id: lessonDoc.id,
        title: lessonData.title,
        creator: lessonData.creator,
        vocabId: lessonData.vocabId,
        createdAt: lessonData.createdAt.toDate(),
        description: lessonData.description || "",
        wordCount: lessonData.wordCount || vocab.length,
        vocabulary: vocab,
      };
    } catch (error) {
      console.error("Lỗi khi lấy bài học:", error);
      throw new Error("Không thể lấy bài học. Vui lòng thử lại.");
    }
  },

  async updateLesson(lessonId: string, title: string, vocabList: VocabItem[], description: string = "") {
    try {
      const lessonDoc = await getDoc(doc(db, "lessons", lessonId));
      if (!lessonDoc.exists()) {
        throw new Error("Không tìm thấy bài học.");
      }
      const { vocabId } = lessonDoc.data();

      await updateDoc(doc(db, "vocabularies", vocabId), {
        words: vocabList,
        updatedAt: new Date(),
      });

      await updateDoc(doc(db, "lessons", lessonId), {
        title,
        description,
        wordCount: vocabList.length,
        updatedAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      console.error("Lỗi khi cập nhật bài học:", error);
      throw new Error("Không thể cập nhật bài học. Vui lòng thử lại.");
    }
  },

  // Public / Private
  async togglePrivacyLesson(lessonId: string, isPrivate: boolean) {
    try {
      await updateDoc(doc(db, "lessons", lessonId), {
        isPrivate,
        updatedAt: new Date(),
      });
      return { success: true };
    } catch (error) {
      console.error("Lỗi khi cập nhật quyền riêng tư:", error);
      throw new Error("Không thể cập nhật trạng thái bài học.");
    }
  },

  // Move lesson to folder
  async moveLessonToFolder(lessonId: string, folderId: string | null) {
    try {
      await updateDoc(doc(db, "lessons", lessonId), {
        folderId: folderId,
        updatedAt: new Date(),
      });
      return { success: true };
    } catch (error) {
      console.error("Lỗi khi di chuyển bài học:", error);
      throw new Error("Không thể di chuyển bài học.");
    }
  },

  // Count lessons in folder
  async countLessonsInFolder(creator: string, folderId: string): Promise<number> {
    try {
      const q = query(
        collection(db, "lessons"),
        where("creator", "==", creator),
        where("folderId", "==", folderId)
      );
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error("Lỗi khi đếm bài học trong thư mục:", error);
      return 0;
    }
  },
};