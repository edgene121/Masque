import type { InputHTMLAttributes } from "react";

interface ProfileFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  fullWidth?: boolean;
}

export default function ProfileField({
  label,
  helperText,
  fullWidth = false,
  id,
  ...inputProps
}: ProfileFieldProps) {
  const fieldId = id ?? inputProps.name ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`profile-field${fullWidth ? " profile-field--full" : ""}`}>
      <label htmlFor={fieldId} className="profile-field__label">
        {label}
      </label>
      <input id={fieldId} className="profile-field__input" {...inputProps} />
      {helperText ? (
        <p className="profile-field__helper">{helperText}</p>
      ) : null}
    </div>
  );
}
