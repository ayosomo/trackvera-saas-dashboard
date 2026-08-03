import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import type { Project, ProjectDraft } from "../../types";
import { ProjectForm, type ProjectFormMode } from "./ProjectForm";

interface ProjectModalProps {
  isOpen: boolean;
  mode: ProjectFormMode;
  project?: Project;
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
  mode,
  project,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}: ProjectModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const isEditing = mode === "edit";
  const titleId = "project-form-title";
  const descriptionId = "project-form-description";

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
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={handleKeyDown}
      >
        <div className="modal__header">
          <div>
            <p className="eyebrow">
              {isEditing ? "Project details" : "New managed service order"}
            </p>
            <h2 id={titleId}>
              {isEditing
                ? `Edit ${project?.customer ?? "project"}`
                : "Create an order tracker"}
            </h2>
            <p id={descriptionId}>
              {isEditing
                ? "Update commercial, supply-chain, ownership, and delivery details without resetting the order journey."
                : "Connect the commercial request, supply chain, ownership, and delivery journey from day one."}
            </p>
          </div>
          <button
            className="modal__close"
            type="button"
            onClick={onClose}
            aria-label={isEditing ? "Close project editor" : "Close new order dialog"}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>
        <ProjectForm
          mode={mode}
          project={project}
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
