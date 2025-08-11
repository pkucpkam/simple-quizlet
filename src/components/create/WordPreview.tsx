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
      <h2 className="text-xl font-semibold mb-3">Xem trước:</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {words.map((item, idx) => (
          <div
            key={idx}
            className="border border-gray-300 rounded-lg shadow-sm overflow-hidden"
          >
            <div className="grid grid-cols-2">
              {/* Cột từ */}
              <div className="bg-blue-50 p-3 flex items-center justify-center font-bold text-blue-800 text-center">
                {item.word}
              </div>

              {/* Cột nghĩa */}
              <div className="bg-white p-3 flex items-center justify-center text-gray-700 text-center">
                {item.definition}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
