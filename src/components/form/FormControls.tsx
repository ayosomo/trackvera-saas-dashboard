import { useId, type InputHTMLAttributes, type ReactNode } from "react";

interface FieldFrameProps {
  label: string;
  error?: string;
  optional?: boolean;
  children: (describedBy: string | undefined) => ReactNode;
}

function FieldFrame({
  label,
  error,
  optional,
  children,
}: FieldFrameProps) {
  const errorId = useId();

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
      {children(error ? errorId : undefined)}
      {error && <small id={errorId}>{error}</small>}
    </label>
  );
}

interface TextFieldProps
  extends Pick<InputHTMLAttributes<HTMLInputElement>, "autoFocus" | "placeholder"> {
  label: string;
  value: string;
  error?: string;
  optional?: boolean;
  onChange: (value: string) => void;
}

export function TextField({
  label,
  value,
  error,
  optional,
  autoFocus,
  placeholder,
  onChange,
}: TextFieldProps) {
  return (
    <FieldFrame label={label} error={error} optional={optional}>
      {(describedBy) => (
        <input
          autoFocus={autoFocus}
          required={!optional}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          placeholder={placeholder}
        />
      )}
    </FieldFrame>
  );
}

interface DateFieldProps {
  label: string;
  value: string;
  error?: string;
  optional?: boolean;
  onChange: (value: string) => void;
}

export function DateField(props: DateFieldProps) {
  return (
    <FieldFrame
      label={props.label}
      error={props.error}
      optional={props.optional}
    >
      {(describedBy) => (
        <input
          type="date"
          required={!props.optional}
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          aria-invalid={Boolean(props.error)}
          aria-describedby={describedBy}
        />
      )}
    </FieldFrame>
  );
}

interface NumberFieldProps {
  label: string;
  value: string;
  error?: string;
  min?: number;
  step?: number;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function NumberField(props: NumberFieldProps) {
  return (
    <FieldFrame label={props.label} error={props.error}>
      {(describedBy) => (
        <input
          type="number"
          required
          min={props.min}
          step={props.step}
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          aria-invalid={Boolean(props.error)}
          aria-describedby={describedBy}
          placeholder={props.placeholder}
        />
      )}
    </FieldFrame>
  );
}

interface SelectFieldProps<Option extends string> {
  label: string;
  value: Option;
  options: readonly Option[];
  onChange: (value: Option) => void;
}

export function SelectField<Option extends string>({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<Option>) {
  return (
    <FieldFrame label={label}>
      {() => (
        <select
          required
          value={value}
          onChange={(event) => onChange(event.target.value as Option)}
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      )}
    </FieldFrame>
  );
}
