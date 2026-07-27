interface FeedbackMessageProps {
  feedback: {
    kind: "success" | "error";
    message: string;
  } | null;
  onDismiss: () => void;
}

export function FeedbackMessage({
  feedback,
  onDismiss,
}: FeedbackMessageProps) {
  if (!feedback) return null;

  return (
    <div
      className={`feedback feedback--${feedback.kind}`}
      role={feedback.kind === "error" ? "alert" : "status"}
    >
      <span aria-hidden="true">{feedback.kind === "success" ? "✓" : "!"}</span>
      <span>{feedback.message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss message">
        ×
      </button>
    </div>
  );
}
