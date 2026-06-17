import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Quiz from "../components/review/Quiz";
import QuizReverse from "../components/review/QuizReverse";
import Practice from "../components/review/Practice";
import ListenPractice from "../components/review/ListenPractice";
import MatchingGame from "../components/review/MatchingGame";
import { lessonService } from "../service/lessonService";
import ReviewResult from "../components/review/ReviewResult";
import { historyService } from "../service/historyService";
import { auth } from "../service/firebase_setup";
import LoadingScreen from "../components/common/LoadingScreen";
import { ArrowLeft } from "lucide-react";

const allQuizTypes = ["normal", "reverse", "practice", "matching", "listen"] as const;
type QuizType = (typeof allQuizTypes)[number];

const ReviewPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.from || (lessonId ? `/lesson/${lessonId}` : "/");

  const [fullVocabList, setFullVocabList] = useState<{ term: string; definition: string }[]>([]);
  const [vocabList, setVocabList] = useState<{ term: string; definition: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [, setSessionCount] = useState(0);
  const [, setIsCorrect] = useState<boolean | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [hasSaved, setHasSaved] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");


  const [searchParams] = useSearchParams();
  const [quizTypes, setQuizTypes] = useState<QuizType[]>(["normal", "reverse", "practice", "matching", "listen"]);
  const [quizType, setQuizType] = useState<QuizType>("normal");

  const WORDS_PER_SESSION = 9;

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        if (!lessonId) return;
        const lesson = await lessonService.getLesson(lessonId);
        setLessonTitle(lesson.title);
        const vocabData = lesson.vocabulary.map((item: { word: string; definition: string }) => ({
          term: item.word,
          definition: item.definition,
        }));
        const shuffledVocabData = [...vocabData].sort(() => Math.random() - 0.5);
        setFullVocabList(vocabData);
        setVocabList(shuffledVocabData);

        // Parse types from URL
        const typesParam = searchParams.get("types");
        let filteredTypes: QuizType[] = [...allQuizTypes];
        if (typesParam) {
          const requestedTypes = typesParam.split(",") as QuizType[];
          filteredTypes = allQuizTypes.filter(t => requestedTypes.includes(t));
        }
        
        if (filteredTypes.length === 0) filteredTypes = [...allQuizTypes];
        setQuizTypes(filteredTypes);
        setQuizType(filteredTypes[Math.floor(Math.random() * filteredTypes.length)]);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu bài học:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [lessonId, searchParams]);

  useEffect(() => {
    if (currentIndex >= vocabList.length && vocabList.length > 0 && !hasSaved) {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      historyService.incrementStudyStats(userId, "review", timeSpent);
      setHasSaved(true);
    }
  }, [currentIndex, vocabList.length, hasSaved, lessonId, lessonTitle, startTime, correctAnswers]);

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
    setQuizType(quizTypes[Math.floor(Math.random() * quizTypes.length)]);
    setShowResult(false);
  };


  const handleAnswer = (_: string, isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
      setShowResult(true);
      setIsCorrect(true);
      setTimeout(() => {
        handleNext();
      }, 1000);
    } else {
      setShowResult(true);
      setIsCorrect(false);
    }
  };

  const handleRestart = () => {
    setVocabList(fullVocabList);
    setCurrentIndex(0);
    setCorrectAnswers(0);
    setShowResult(false);
    setIsCorrect(null);
    setSessionCount(0);
    setHasSaved(false);
    setStartTime(Date.now());
    setQuizType(quizTypes[Math.floor(Math.random() * quizTypes.length)]);
  };

  const getMatchingVocabList = () => {
    const shuffledVocabs = [...fullVocabList].sort(() => Math.random() - 0.5);
    return shuffledVocabs.slice(0, Math.min(WORDS_PER_SESSION, fullVocabList.length));
  };


  if (loading) {
    return <LoadingScreen />;
  }

  if (currentIndex >= vocabList.length) {
    return (
      <ReviewResult
        correctAnswers={correctAnswers}
        totalQuestions={vocabList.length}
        onRestart={handleRestart}
        fromPath={fromPath}
        onBack={() => navigate(fromPath)}
      />
    );
  }

  const currentWord = vocabList[currentIndex];

  return (
    <div className="w-full mx-auto p-6 h-full">
      <div className={`${quizType === "matching" ? "max-w-6xl" : "max-w-2xl"} mx-auto mb-8 flex items-center relative min-h-[40px]`}>
        <button
          onClick={() => navigate(fromPath)}
          className="text-claude-text-3 hover:text-claude-accent flex items-center gap-2 font-medium transition-colors z-10"
        >
          <ArrowLeft className="h-4 w-4" /> Thoát
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
          Ôn tập từ vựng
        </h1>
      </div>

      {quizType === "normal" && (
        <Quiz
          term={currentWord.term}
          definition={currentWord.definition}
          allDefinitions={vocabList.map((item) => item.definition)}
          onAnswer={handleAnswer}
          showResult={showResult}
          onNext={handleNext}
        />
      )}

      {quizType === "reverse" && (
        <QuizReverse
          vocab={currentWord}
          allVocabs={vocabList}
          onAnswer={handleAnswer}
          showResult={showResult}
          onNext={handleNext}
        />
      )}

      {quizType === "practice" && (
        <Practice
          vocab={currentWord}
          onAnswer={handleAnswer}
          showResult={showResult}
          onNext={handleNext}
        />
      )}

      {quizType === "listen" && (
        <ListenPractice
          vocab={currentWord}
          onAnswer={handleAnswer}
          showResult={showResult}
          onNext={handleNext}
        />
      )}


      {quizType === "matching" && (
        <MatchingGame
          vocabList={getMatchingVocabList()}
          onAnswer={handleAnswer}
          showResult={showResult}
        />
      )}
    </div>
  );
};

export default ReviewPage;