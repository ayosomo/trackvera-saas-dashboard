import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import type { ProjectDraft } from "../../types";
import { ProjectForm } from "./ProjectForm";

interface ProjectModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onClose: () => void;
  onSubmit: (project: ProjectDraft) => void;
}

const focusableSelector = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function ProjectModal({
  isOpen,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}: ProjectModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => {
      dialogRef.current
        ?.querySelector<HTMLElement>("[autofocus]")
        ?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && !isSubmitting) {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    );
    const first = focusable[0];
    const last = focusable.at(-1);

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.currentTarget === event.target && !isSubmitting) onClose();
  }

  return createPortal(
    <div className="modal-backdrop" onMouseDown={handleBackdropClick}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
        aria-describedby="new-project-description"
        onKeyDown={handleKeyDown}
      >
        <div className="modal__header">
          <div>
            <p className="eyebrow">New implementation</p>
            <h2 id="new-project-title">Create a project</h2>
            <p id="new-project-description">
              Add the key delivery details. You can update them as the work
              progresses.
            </p>
          </div>
          <button
            className="modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close new project dialog"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>
        <ProjectForm
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </div>
    </div>,
    document.body,
  );
}
