import { useState } from "react";
import type { Flashcard } from "../types/flashcard";

interface Props {
  card: Flashcard;
}

export default function Flashcard({ card }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="w-80 h-48 bg-white text-black shadow-lg rounded-lg flex items-center justify-center text-xl cursor-pointer"
      onClick={() => setFlipped(!flipped)}
    >
      {flipped ? card.definition : card.word}
    </div>
  );
}
