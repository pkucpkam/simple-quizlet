import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, query, where } from "firebase/firestore";
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
}

export const lessonService = {
  async createLesson(title: string, creator: string, vocabList: VocabItem[], description: string = "") {
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

  async getLessons(): Promise<Lesson[]> {
    try {
      const lessonsSnapshot = await getDocs(collection(db, "lessons"));
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
        };
      });
      return lessons;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bài học:", error);
      throw new Error("Không thể lấy danh sách bài học. Vui lòng thử lại.");
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

  async deleteLesson(lessonId: string, vocabId: string) {
    try {
      await deleteDoc(doc(db, "lessons", lessonId));
      await deleteDoc(doc(db, "vocabularies", vocabId));
    } catch (error) {
      console.error("Lỗi khi xóa bài học:", error);
      throw new Error("Không thể xóa bài học. Vui lòng thử lại.");
    }
  },

  async getMyLessons(creator: string): Promise<Lesson[]> {
    try {
      const q = query(collection(db, "lessons"), where("creator", "==", creator));
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
        };
      });
      return lessons;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bài học của người dùng:", error);
      throw new Error("Không thể lấy danh sách bài học. Vui lòng thử lại.");
    }
  },
};