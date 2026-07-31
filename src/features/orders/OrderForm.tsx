import { useRef, useState, type FormEvent } from "react";
import { getStageProgress } from "./orderJourney";
import { orderPriorities, type OrderDraft } from "../../types";

interface OrderFormProps {
  onSubmit: (order: OrderDraft) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

interface OrderFormValues {
  customer: string;
  name: string;
  product: string;
  site: string;
  owner: string;
  salesOwner: string;
  thirdParty: string;
  supplier: string;
  crfReference: string;
  thirdPartyReference: string;
  supplierReference: string;
  priority: OrderDraft["priority"];
  dueDate: string;
  monthlyValue: string;
}

type FormErrors = Partial<Record<keyof OrderFormValues, string>>;

const initialValues: OrderFormValues = {
  customer: "",
  name: "",
  product: "",
  site: "",
  owner: "",
  salesOwner: "",
  thirdParty: "",
  supplier: "",
  crfReference: "",
  thirdPartyReference: "",
  supplierReference: "",
  priority: "Medium",
  dueDate: "",
  monthlyValue: "",
};

const formSteps = [
  { label: "Customer & service", fields: ["customer", "name", "product", "site"] },
  {
    label: "Supply chain",
    fields: ["thirdParty", "supplier", "crfReference"],
  },
  {
    label: "Ownership & controls",
    fields: ["owner", "salesOwner", "dueDate", "monthlyValue"],
  },
] as const;

function validate(values: OrderFormValues): FormErrors {
  const errors: FormErrors = {};
  const required: Array<[keyof OrderFormValues, string]> = [
    ["customer", "Enter the customer name."],
    ["name", "Enter an order name."],
    ["product", "Enter the agreed product or service."],
    ["site", "Enter the delivery site or programme scope."],
    ["owner", "Enter the MSP order owner."],
    ["salesOwner", "Enter the sales owner."],
    ["thirdParty", "Enter the third-party ordering partner."],
    ["supplier", "Enter the fulfilment supplier."],
    ["crfReference", "Enter the CRF reference."],
    ["dueDate", "Choose a target live date."],
  ];

  required.forEach(([field, message]) => {
    if (!values[field].trim()) errors[field] = message;
  });

  const monthlyValue = Number(values.monthlyValue);
  if (!values.monthlyValue.trim()) {
    errors.monthlyValue = "Enter the monthly contract value.";
  } else if (!Number.isFinite(monthlyValue) || monthlyValue < 0) {
    errors.monthlyValue = "Monthly value must be 0 or more.";
  }

  return errors;
}

export function OrderForm({
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
}: OrderFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  function updateValue<Key extends keyof OrderFormValues>(
    key: Key,
    value: OrderFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function focusFirstInvalid() {
    window.setTimeout(() => {
      formRef.current
        ?.querySelector<HTMLElement>("[aria-invalid='true']")
        ?.focus();
    }, 0);
  }

  function continueToNextStep() {
    const allErrors = validate(values);
    const stepFields = new Set<string>(formSteps[step]?.fields ?? []);
    const stepErrors = Object.fromEntries(
      Object.entries(allErrors).filter(([field]) => stepFields.has(field)),
    ) as FormErrors;

    if (Object.keys(stepErrors).length > 0) {
      setErrors((current) => ({ ...current, ...stepErrors }));
      focusFirstInvalid();
      return;
    }
    setStep((current) => Math.min(current + 1, formSteps.length - 1));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step < formSteps.length - 1) {
      continueToNextStep();
      return;
    }

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstInvalidStep = formSteps.findIndex((item) =>
        item.fields.some((field) => nextErrors[field]),
      );
      if (firstInvalidStep >= 0) setStep(firstInvalidStep);
      focusFirstInvalid();
      return;
    }

    const currentStage = values.supplierReference.trim()
      ? "supplier-order"
      : values.thirdPartyReference.trim()
        ? "partner-order"
        : "crf-raised";

    onSubmit({
      customer: values.customer.trim(),
      name: values.name.trim(),
      product: values.product.trim(),
      site: values.site.trim(),
      owner: values.owner.trim(),
      salesOwner: values.salesOwner.trim(),
      thirdParty: values.thirdParty.trim(),
      supplier: values.supplier.trim(),
      crfReference: values.crfReference.trim(),
      thirdPartyReference: values.thirdPartyReference.trim(),
      supplierReference: values.supplierReference.trim(),
      status: "On track",
      priority: values.priority,
      progress: getStageProgress(currentStage),
      currentStage,
      dueDate: values.dueDate,
      openRisks: 0,
      blockers: [],
      monthlyValue: Number(values.monthlyValue),
    });
  }

  const describedBy = (field: keyof OrderFormValues) =>
    errors[field] ? `${field}-error` : undefined;

  return (
    <form
      ref={formRef}
      className="order-form"
      noValidate
      onSubmit={handleSubmit}
    >
      <ol className="form-steps" aria-label="New order steps">
        {formSteps.map((item, index) => (
          <li
            className={
              index === step
                ? "form-step form-step--active"
                : index < step
                  ? "form-step form-step--complete"
                  : "form-step"
            }
            key={item.label}
            aria-current={index === step ? "step" : undefined}
          >
            <span>{index < step ? "✓" : index + 1}</span>
            <strong>{item.label}</strong>
          </li>
        ))}
      </ol>

      {submitError && (
        <div className="form-submit-error" role="alert">
          <strong>Order tracker not created.</strong>
          <span>{submitError}</span>
        </div>
      )}

      {step === 0 && (
        <fieldset className="form-stage">
          <legend>
            <span>Step 1 of 3</span>
            Customer and service
          </legend>
          <p>Capture the agreed commercial scope before the order enters delivery.</p>
          <div className="form-grid">
            <FormField
              label="Customer"
              value={values.customer}
              error={errors.customer}
              onChange={(value) => updateValue("customer", value)}
              autoFocus
            />
            <FormField
              label="Order name"
              value={values.name}
              error={errors.name}
              onChange={(value) => updateValue("name", value)}
            />
            <FormField
              label="Product or service"
              value={values.product}
              error={errors.product}
              onChange={(value) => updateValue("product", value)}
              placeholder="e.g. Managed Ethernet · 1 Gbps"
            />
            <FormField
              label="Delivery site or scope"
              value={values.site}
              error={errors.site}
              onChange={(value) => updateValue("site", value)}
              placeholder="Site, postcode, or multi-site programme"
            />
          </div>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="form-stage">
          <legend>
            <span>Step 2 of 3</span>
            Supply-chain references
          </legend>
          <p>
            Link the customer request, partner order, and supplier portal order
            in one tracker.
          </p>
          <div className="form-grid">
            <FormField
              label="Third-party ordering partner"
              value={values.thirdParty}
              error={errors.thirdParty}
              onChange={(value) => updateValue("thirdParty", value)}
              autoFocus
              placeholder="e.g. ChannelLink"
            />
            <FormField
              label="Fulfilment supplier"
              value={values.supplier}
              error={errors.supplier}
              onChange={(value) => updateValue("supplier", value)}
              placeholder="e.g. Openreach"
            />
            <FormField
              label="CRF reference"
              value={values.crfReference}
              error={errors.crfReference}
              onChange={(value) => updateValue("crfReference", value)}
              placeholder="CRF-260727-001"
            />
            <FormField
              label="Third-party order reference"
              value={values.thirdPartyReference}
              onChange={(value) => updateValue("thirdPartyReference", value)}
              optional
              placeholder="Add when the partner accepts"
            />
            <FormField
              label="Supplier portal reference"
              value={values.supplierReference}
              onChange={(value) => updateValue("supplierReference", value)}
              optional
              placeholder="Add after portal submission"
            />
            <div className="reference-hint">
              <span aria-hidden="true">i</span>
              <p>
                Missing downstream references remain marked as pending. The
                tracker starts at the correct milestone automatically.
              </p>
            </div>
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="form-stage">
          <legend>
            <span>Step 3 of 3</span>
            Ownership and controls
          </legend>
          <p>Set the people and dates that will drive proactive order management.</p>
          <div className="form-grid">
            <FormField
              label="MSP order owner"
              value={values.owner}
              error={errors.owner}
              onChange={(value) => updateValue("owner", value)}
              autoFocus
            />
            <FormField
              label="Sales owner"
              value={values.salesOwner}
              error={errors.salesOwner}
              onChange={(value) => updateValue("salesOwner", value)}
            />
            <label className="form-field">
              <span>
                Priority <em aria-hidden="true">*</em>
              </span>
              <select
                required
                value={values.priority}
                onChange={(event) =>
                  updateValue(
                    "priority",
                    event.target.value as OrderDraft["priority"],
                  )
                }
              >
                {orderPriorities.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>
                Target live date <em aria-hidden="true">*</em>
              </span>
              <input
                required
                type="date"
                value={values.dueDate}
                onChange={(event) => updateValue("dueDate", event.target.value)}
                aria-invalid={Boolean(errors.dueDate)}
                aria-describedby={describedBy("dueDate")}
              />
              {errors.dueDate && (
                <small id={describedBy("dueDate")}>{errors.dueDate}</small>
              )}
            </label>
            <label className="form-field">
              <span>
                Monthly contract value (£) <em aria-hidden="true">*</em>
              </span>
              <input
                required
                type="number"
                min="0"
                step="100"
                value={values.monthlyValue}
                onChange={(event) =>
                  updateValue("monthlyValue", event.target.value)
                }
                aria-invalid={Boolean(errors.monthlyValue)}
                aria-describedby={describedBy("monthlyValue")}
                placeholder="e.g. 12500"
              />
              {errors.monthlyValue && (
                <small id={describedBy("monthlyValue")}>
                  {errors.monthlyValue}
                </small>
              )}
            </label>
            <div className="tracker-created-note">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>Tracker created automatically</strong>
                <p>
                  Eight milestones, stage RACI, reference controls, owner
                  notifications, and exception playbooks will be ready.
                </p>
              </div>
            </div>
          </div>
        </fieldset>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={step === 0 ? onCancel : () => setStep((value) => value - 1)}
          disabled={isSubmitting}
        >
          {step === 0 ? "Cancel" : "← Back"}
        </button>
        <button
          type="submit"
          className="button button--primary"
          disabled={isSubmitting}
        >
          {isSubmitting && <span className="button__spinner" aria-hidden="true" />}
          {isSubmitting
            ? "Creating tracker…"
            : step === formSteps.length - 1
              ? "Create order tracker"
              : "Continue →"}
        </button>
      </div>
    </form>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  optional?: boolean;
  autoFocus?: boolean;
  onChange: (value: string) => void;
}

function FormField({
  label,
  value,
  error,
  placeholder,
  optional,
  autoFocus,
  onChange,
}: FormFieldProps) {
  const errorId = `${label.toLowerCase().replaceAll(/[^a-z]+/g, "-")}-error`;
  return (
    <label className="form-field">
      <span>
        {label}{" "}
        {optional ? (
          <small className="optional-label">Optional</small>
        ) : (
          <em aria-hidden="true">*</em>
        )}
      </span>
      <input
        required={!optional}
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        placeholder={placeholder}
      />
      {error && <small id={errorId}>{error}</small>}
    </label>
  );
}
