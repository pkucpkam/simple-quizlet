import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, query, where, updateDoc } from "firebase/firestore";
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

export const lessonService = {
  async createLesson(title: string, creator: string, vocabList: VocabItem[], description: string = "", isPrivate: boolean = false) {
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
        isPrivate
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
      })

        // .filter(
        //   (lesson) =>
        //     !lesson.isPrivate || lesson.creator === currentUserEmail
        // );
      ;

      return lessons;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bài học:", error);
      throw new Error("Không thể lấy danh sách bài học. Vui lòng thử lại.");
    }
  }
  ,

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
          isPrivate: data.isPrivate || false,
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




};