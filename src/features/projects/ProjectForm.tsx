import {
  projectPriorities,
  projectStatuses,
  type ProjectDraft,
} from "../../types";
import { useId, useRef, useState, type FormEvent } from "react";

interface ProjectFormProps {
  onSubmit: (project: ProjectDraft) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

interface ProjectFormValues {
  customer: string;
  name: string;
  owner: string;
  status: ProjectDraft["status"];
  priority: ProjectDraft["priority"];
  progress: string;
  dueDate: string;
  openRisks: string;
  monthlyValue: string;
}

type FormErrors = Partial<Record<keyof ProjectFormValues, string>>;

const initialValues: ProjectFormValues = {
  customer: "",
  name: "",
  owner: "",
  status: "On track",
  priority: "Medium",
  progress: "0",
  dueDate: "",
  openRisks: "0",
  monthlyValue: "",
};

function validate(values: ProjectFormValues): FormErrors {
  const errors: FormErrors = {};
  const progress = Number(values.progress);
  const openRisks = Number(values.openRisks);
  const monthlyValue = Number(values.monthlyValue);

  if (!values.customer.trim()) errors.customer = "Enter a customer name.";
  if (!values.name.trim()) errors.name = "Enter a project name.";
  if (!values.owner.trim()) errors.owner = "Enter a project owner.";
  if (!values.dueDate) errors.dueDate = "Choose a due date.";
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
    errors.progress = "Progress must be between 0 and 100.";
  }
  if (!Number.isInteger(openRisks) || openRisks < 0) {
    errors.openRisks = "Open risks must be a whole number of 0 or more.";
  }
  if (!values.monthlyValue.trim()) {
    errors.monthlyValue = "Enter the monthly value.";
  } else if (!Number.isFinite(monthlyValue) || monthlyValue < 0) {
    errors.monthlyValue = "Monthly value must be 0 or more.";
  }

  return errors;
}

export function ProjectForm({
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
}: ProjectFormProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  function updateValue<Key extends keyof ProjectFormValues>(
    key: Key,
    value: ProjectFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      window.setTimeout(() => {
        formRef.current
          ?.querySelector<HTMLElement>("[aria-invalid='true']")
          ?.focus();
      }, 0);
      return;
    }

    onSubmit({
      customer: values.customer.trim(),
      name: values.name.trim(),
      owner: values.owner.trim(),
      status: values.status,
      priority: values.priority,
      progress: Number(values.progress),
      dueDate: values.dueDate,
      openRisks: Number(values.openRisks),
      monthlyValue: Number(values.monthlyValue),
    });
  }

  const errorId = (field: keyof ProjectFormValues) =>
    errors[field] ? `${formId}-${field}-error` : undefined;

  return (
    <form
      ref={formRef}
      className="project-form"
      noValidate
      onSubmit={handleSubmit}
    >
      {Object.keys(errors).length > 0 && (
        <div className="form-error-summary" role="alert">
          <strong>Check the highlighted fields.</strong>
          <span>There are {Object.keys(errors).length} items to fix.</span>
        </div>
      )}

      {submitError && (
        <div className="form-submit-error" role="alert">
          <strong>Project not created.</strong>
          <span>{submitError}</span>
        </div>
      )}

      <div className="form-grid">
        <label className="form-field">
          <span>
            Customer <em aria-hidden="true">*</em>
          </span>
          <input
            autoFocus
            type="text"
            value={values.customer}
            onChange={(event) => updateValue("customer", event.target.value)}
            aria-invalid={Boolean(errors.customer)}
            aria-describedby={errorId("customer")}
            disabled={isSubmitting}
          />
          {errors.customer && (
            <small id={errorId("customer")}>{errors.customer}</small>
          )}
        </label>

        <label className="form-field">
          <span>
            Project name <em aria-hidden="true">*</em>
          </span>
          <input
            type="text"
            value={values.name}
            onChange={(event) => updateValue("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errorId("name")}
            disabled={isSubmitting}
          />
          {errors.name && <small id={errorId("name")}>{errors.name}</small>}
        </label>

        <label className="form-field">
          <span>
            Owner <em aria-hidden="true">*</em>
          </span>
          <input
            type="text"
            value={values.owner}
            onChange={(event) => updateValue("owner", event.target.value)}
            aria-invalid={Boolean(errors.owner)}
            aria-describedby={errorId("owner")}
            disabled={isSubmitting}
          />
          {errors.owner && <small id={errorId("owner")}>{errors.owner}</small>}
        </label>

        <label className="form-field">
          <span>Status</span>
          <select
            value={values.status}
            onChange={(event) =>
              updateValue("status", event.target.value as ProjectDraft["status"])
            }
            disabled={isSubmitting}
          >
            {projectStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Priority</span>
          <select
            value={values.priority}
            onChange={(event) =>
              updateValue(
                "priority",
                event.target.value as ProjectDraft["priority"],
              )
            }
            disabled={isSubmitting}
          >
            {projectPriorities.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>
            Due date <em aria-hidden="true">*</em>
          </span>
          <input
            type="date"
            value={values.dueDate}
            onChange={(event) => updateValue("dueDate", event.target.value)}
            aria-invalid={Boolean(errors.dueDate)}
            aria-describedby={errorId("dueDate")}
            disabled={isSubmitting}
          />
          {errors.dueDate && (
            <small id={errorId("dueDate")}>{errors.dueDate}</small>
          )}
        </label>

        <label className="form-field form-field--wide">
          <span className="range-label">
            <span>Progress</span>
            <output htmlFor={`${formId}-progress`}>{values.progress}%</output>
          </span>
          <input
            id={`${formId}-progress`}
            type="range"
            min="0"
            max="100"
            step="1"
            value={values.progress}
            onChange={(event) => updateValue("progress", event.target.value)}
            aria-invalid={Boolean(errors.progress)}
            aria-describedby={errorId("progress")}
            disabled={isSubmitting}
          />
          {errors.progress && (
            <small id={errorId("progress")}>{errors.progress}</small>
          )}
        </label>

        <label className="form-field">
          <span>Open risks</span>
          <input
            type="number"
            min="0"
            step="1"
            value={values.openRisks}
            onChange={(event) => updateValue("openRisks", event.target.value)}
            aria-invalid={Boolean(errors.openRisks)}
            aria-describedby={errorId("openRisks")}
            disabled={isSubmitting}
          />
          {errors.openRisks && (
            <small id={errorId("openRisks")}>{errors.openRisks}</small>
          )}
        </label>

        <label className="form-field">
          <span>
            Monthly value (£) <em aria-hidden="true">*</em>
          </span>
          <input
            type="number"
            min="0"
            step="100"
            inputMode="decimal"
            placeholder="e.g. 12500"
            value={values.monthlyValue}
            onChange={(event) => updateValue("monthlyValue", event.target.value)}
            aria-invalid={Boolean(errors.monthlyValue)}
            aria-describedby={errorId("monthlyValue")}
            disabled={isSubmitting}
          />
          {errors.monthlyValue && (
            <small id={errorId("monthlyValue")}>{errors.monthlyValue}</small>
          )}
        </label>
      </div>

      <p className="required-note">
        <span aria-hidden="true">*</span> Required fields
      </p>

      <div className="form-actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="button button--primary"
          disabled={isSubmitting}
        >
          {isSubmitting && <span className="button__spinner" aria-hidden="true" />}
          {isSubmitting ? "Creating project…" : "Create project"}
        </button>
      </div>
    </form>
  );
}
