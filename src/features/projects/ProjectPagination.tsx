interface ProjectPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ProjectPagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
}: ProjectPaginationProps) {
  if (totalItems === 0) return null;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <nav className="project-pagination" aria-label="Order pages">
      <p>
        Showing <strong>{firstItem}–{lastItem}</strong> of {totalItems} orders
      </p>
      <div>
        <button
          className="button button--secondary button--small"
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          ← Previous
        </button>
        <span aria-live="polite">
          Page {page} of {totalPages}
        </span>
        <button
          className="button button--secondary button--small"
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          Next →
        </button>
      </div>
    </nav>
  );
}
