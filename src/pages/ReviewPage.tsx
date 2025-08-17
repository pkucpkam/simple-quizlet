import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Quiz from "../components/review/Quiz";
import QuizReverse from "../components/review/QuizReverse";
import Practice from "../components/review/Practice";
import MatchingGame from "../components/review/MatchingGame";
import { lessonService } from "../service/lessonService";

const ReviewPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();

  const [fullVocabList, setFullVocabList] = useState<{ term: string; definition: string }[]>([]);
  const [vocabList, setVocabList] = useState<{ term: string; definition: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  const quizTypes = ["normal", "reverse", "practice", "matching"] as const;
  type QuizType = (typeof quizTypes)[number];
  const [quizType, setQuizType] = useState<QuizType>("normal");

  const WORDS_PER_SESSION = 5;

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        if (!lessonId) return;
        const lesson = await lessonService.getLesson(lessonId);
        const vocabData = lesson.vocabulary.map((item: any) => ({
          term: item.word,
          definition: item.definition,
        }));
        setFullVocabList(vocabData);
        setVocabList(vocabData.slice(0, Math.min(WORDS_PER_SESSION, vocabData.length)));
        setQuizType(quizTypes[Math.floor(Math.random() * quizTypes.length)]);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu bài học:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [lessonId]);

  const handleAnswer = (_: string, isCorrect: boolean) => {
    if (isCorrect) setCorrectAnswers((prev) => prev + 1);
    setShowResult(true);

    setTimeout(() => {
      setShowResult(false);
      setCurrentIndex((prev) => prev + 1);
      setQuizType(quizTypes[Math.floor(Math.random() * quizTypes.length)]);
    }, 1500);
  };

  const handleRestart = () => {
    const startIndex = sessionCount * WORDS_PER_SESSION;
    const nextVocabList = fullVocabList.slice(
      startIndex,
      startIndex + Math.min(WORDS_PER_SESSION, fullVocabList.length - startIndex)
    );

    if (nextVocabList.length === 0) {
      setVocabList(fullVocabList.slice(0, Math.min(WORDS_PER_SESSION, fullVocabList.length)));
      setSessionCount(0);
    } else {
      setVocabList(nextVocabList);
      setSessionCount((prev) => prev + 1);
    }

    setCurrentIndex(0);
    setCorrectAnswers(0);
    setShowResult(false);
    setQuizType(quizTypes[Math.floor(Math.random() * quizTypes.length)]);
  };

  if (loading) {
    return <div className="p-6 text-center text-lg">Đang tải dữ liệu...</div>;
  }

  if (currentIndex >= vocabList.length) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Hoàn thành ôn tập!
        </h1>
        <div className="bg-gray-50 p-6 rounded-lg shadow-md text-center">
          <p className="text-xl text-gray-600 mb-4">
            Bạn đã trả lời đúng {correctAnswers} / {vocabList.length} câu hỏi
          </p>
          <p className="text-xl text-gray-600 mb-6">
            Tỷ lệ chính xác: {((correctAnswers / vocabList.length) * 100).toFixed(0)}%
          </p>
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {fullVocabList.length > vocabList.length ? "Tiếp tục ôn tập" : "Ôn tập lại"}
          </button>
        </div>
      </div>
    );
  }

  const currentWord = vocabList[currentIndex];

  return (
    <div className="w-full mx-auto p-6 h-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Ôn tập từ vựng
      </h1>

      {quizType === "normal" && (
        <Quiz
          term={currentWord.term}
          definition={currentWord.definition}
          allDefinitions={vocabList.map((item) => item.definition)}
          onAnswer={handleAnswer}
          showResult={showResult}
        />
      )}

      {quizType === "reverse" && (
        <QuizReverse
          vocab={currentWord}
          allVocabs={vocabList}
          onAnswer={handleAnswer}
          showResult={showResult}
        />
      )}

      {quizType === "practice" && (
        <Practice
          vocab={currentWord}
          onAnswer={handleAnswer}
          showResult={showResult}
        />
      )}

      {quizType === "matching" && (
        <MatchingGame
          vocabList={vocabList}
          onAnswer={handleAnswer}
          showResult={showResult}
        />
      )}
    </div>
  );
};

export default ReviewPage;