interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  activeColor?: string; // kept for backward compatibility (ignored – uses Claude tokens)
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  const delta = 2;
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
    rangeWithDots.push(1, '...');
  } else {
    rangeWithDots.push(1);
  }

  rangeWithDots.push(...range);

  if (currentPage + delta < totalPages - 1) {
    rangeWithDots.push('...', totalPages);
  } else if (totalPages > 1) {
    rangeWithDots.push(totalPages);
  }

  const navBtn = (disabled: boolean, onClick: () => void, label: string) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="h-8 px-3 text-xs font-medium text-claude-text-2 border border-claude-border rounded-claude bg-claude-surface
                 hover:bg-claude-surface-2 hover:text-claude-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-1">
      {navBtn(currentPage === 1, () => onPageChange(Math.max(currentPage - 1, 1)), '←')}

      {rangeWithDots.map((pageNum, index) =>
        pageNum === '...' ? (
          <span key={`dots-${index}`} className="w-8 h-8 flex items-center justify-center text-claude-text-3 text-xs">
            ···
          </span>
        ) : (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum as number)}
            className={`w-8 h-8 flex items-center justify-center rounded-claude text-xs font-medium transition-colors ${
              currentPage === pageNum
                ? 'bg-claude-accent text-white border border-claude-accent'
                : 'bg-claude-surface text-claude-text-2 border border-claude-border hover:bg-claude-surface-2 hover:text-claude-text'
            }`}
          >
            {pageNum}
          </button>
        )
      )}

      {navBtn(currentPage === totalPages, () => onPageChange(Math.min(currentPage + 1, totalPages)), '→')}
    </div>
  );
}
