interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  activeColor?: string; // Tailwind class like 'bg-blue-600'
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  activeColor = "bg-blue-600",
}: Props) {
  if (totalPages <= 1) return null;

  const delta = 2; // Show 2 pages before and after current
  const range: number[] = [];
  const rangeWithDots: (number | string)[] = [];

  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i++
  ) {
    range.push(i);
  }

  if (currentPage - delta > 2) {
    rangeWithDots.push(1, "...");
  } else {
    rangeWithDots.push(1);
  }

  rangeWithDots.push(...range);

  if (currentPage + delta < totalPages - 1) {
    rangeWithDots.push("...", totalPages);
  } else if (totalPages > 1) {
    rangeWithDots.push(totalPages);
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 hover:text-gray-700 transition-all font-bold text-gray-600 shadow-sm"
      >
        Trước
      </button>

      <div className="flex gap-1.5">
        {rangeWithDots.map((pageNum, index) =>
          pageNum === "..." ? (
            <span
              key={`dots-${index}`}
              className="w-11 h-11 flex items-center justify-center text-gray-400"
            >
              ...
            </span>
          ) : (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum as number)}
              className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all font-bold shadow-sm ${
                currentPage === pageNum
                  ? `${activeColor} text-white shadow-lg`
                  : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {pageNum}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 hover:text-gray-700 transition-all font-bold text-gray-600 shadow-sm"
      >
        Sau
      </button>
    </div>
  );
}
