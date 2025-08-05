import { useState, useEffect } from 'react';
import Flashcard from '../components/Flashcard';

interface FlashcardData {
  id: string;
  term: string;
  definition: string;
  status: 'know' | 'still_learning' | null;
}

const initialFlashcards: FlashcardData[] = [
  { id: '1', term: 'Apple', definition: 'Táo', status: null },
  { id: '2', term: 'Book', definition: 'Sách', status: null },
  { id: '3', term: 'House', definition: 'Nhà', status: null },
];

const Study: React.FC = () => {
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);

  useEffect(() => {
    console.log('[Study] Initializing flashcards');
    try {
      const storedFlashcards = sessionStorage.getItem('flashcards');
      if (storedFlashcards) {
        const parsedFlashcards = JSON.parse(storedFlashcards);
        console.log('[Study] Loaded flashcards from sessionStorage:', parsedFlashcards);
        if (Array.isArray(parsedFlashcards) && parsedFlashcards.length > 0) {
          setFlashcards(parsedFlashcards);
        } else {
          console.log('[Study] Invalid or empty flashcards in sessionStorage, using initialFlashcards');
          setFlashcards(initialFlashcards);
          sessionStorage.setItem('flashcards', JSON.stringify(initialFlashcards));
        }
      } else {
        console.log('[Study] No flashcards in sessionStorage, using initialFlashcards');
        setFlashcards(initialFlashcards);
        sessionStorage.setItem('flashcards', JSON.stringify(initialFlashcards));
      }
    } catch (error) {
      console.error('[Study] Error loading flashcards from sessionStorage:', error);
      setFlashcards(initialFlashcards);
      sessionStorage.setItem('flashcards', JSON.stringify(initialFlashcards));
    }
  }, []);

  useEffect(() => {
    if (flashcards.length > 0) {
      console.log('[Study] Saving flashcards to sessionStorage:', flashcards);
      sessionStorage.setItem('flashcards', JSON.stringify(flashcards));
    }
  }, [flashcards]);

  const shuffleFlashcards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setIsShuffled(true);
    setCurrentIndex(0);
    console.log('[Study] Shuffled flashcards:', shuffled);
  };

  const handleMarkKnow = (id: string) => {
    setFlashcards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, status: 'know' } : card
      )
    );
    goToNextCard();
    console.log('[Study] Marked card as know:', id);
  };

  const handleMarkStillLearning = (id: string) => {
    setFlashcards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, status: 'still_learning' } : card
      )
    );
    goToNextCard();
    console.log('[Study] Marked card as still_learning:', id);
  };

  const goToNextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      console.log('[Study] Moved to next card, index:', currentIndex + 1);
    } else {
      console.log('[Study] Reached end of flashcards');
      alert('Bạn đã xem hết bộ thẻ!');
    }
  };

  const goToPreviousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      console.log('[Study] Moved to previous card, index:', currentIndex - 1);
    }
  };

  if (flashcards.length === 0) {
    console.log('[Study] Flashcards array is empty');
    return (
      <div className="max-w-screen-xl mx-auto p-4 text-center">
        <p className="text-lg text-gray-600">Đang tải thẻ...</p>
      </div>
    );
  }

  console.log('[Study] Rendering with flashcards:', flashcards, 'currentIndex:', currentIndex);

  return (
    <div className="max-w-screen-xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Học Từ Mới</h1>
      <Flashcard
        key={flashcards[currentIndex].id}
        card={flashcards[currentIndex]}
        onMarkKnow={handleMarkKnow}
        onMarkStillLearning={handleMarkStillLearning}
      />
      <div className="mt-6 text-center">
        <p>Thẻ {currentIndex + 1} / {flashcards.length}</p>
        <p>
          Đã thuộc: {flashcards.filter((card) => card.status === 'know').length} | 
          Chưa thuộc: {flashcards.filter((card) => card.status === 'still_learning').length}
        </p>
      </div>
    </div>
  );
};

export default Study;