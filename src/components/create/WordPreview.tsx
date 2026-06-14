interface Word {
  word: string;
  definition: string;
}

interface WordPreviewProps {
  words: Word[];
}

export default function WordPreview({ words }: WordPreviewProps) {
  if (!words || words.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold text-claude-text mb-3">Xem trước:</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {words.map((item, idx) => (
          <div
            key={idx}
            className="border border-claude-border rounded-claude shadow-claude-sm overflow-hidden"
          >
            <div className="grid grid-cols-2">
              {/* Cột từ */}
              <div className="bg-claude-accent-lighter p-3 flex items-center justify-center font-bold text-claude-accent text-center">
                {item.word}
              </div>

              {/* Cột nghĩa */}
              <div className="bg-claude-surface p-3 flex items-center justify-center text-claude-text-2 text-center border-l border-claude-border">
                {item.definition}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
