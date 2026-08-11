"use client";

import type { ChangeEvent, FormEvent } from "react";
import type { ProfileFormData } from "@/types/profile";

const GENDER_OPTIONS = [
  "Female",
  "Male",
  "Non-binary",
  "Prefer not to say",
  "Other",
] as const;

interface StepYourDetailsProps {
  form: ProfileFormData;
  error: string | null;
  isSaving: boolean;
  onChange: (key: keyof ProfileFormData, value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export default function StepYourDetails({
  form,
  error,
  isSaving,
  onChange,
  onSubmit,
}: StepYourDetailsProps) {
  const handleInput =
    (key: keyof ProfileFormData) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange(key, event.target.value);
    };

  const genderOptions: string[] = [...GENDER_OPTIONS];
  if (form.gender.trim() && !genderOptions.includes(form.gender)) {
    genderOptions.unshift(form.gender);
  }

  return (
    <section className="onboarding-step-panel">
      <h2 className="onboarding-step-panel__title">Fill Your Details</h2>
      <p className="onboarding-step-panel__desc">
        Please provide your personal details to complete your profile setup.
      </p>

      <form className="onboarding-form" onSubmit={onSubmit} noValidate>
        <div className="onboarding-form__field onboarding-form__field--full">
          <label htmlFor="onboarding-email" className="onboarding-form__label">
            Email Address
          </label>
          <input
            id="onboarding-email"
            name="email"
            type="email"
            className="onboarding-form__input"
            value={form.email}
            readOnly
            disabled
          />
        </div>

        <fieldset className="onboarding-form__group">
          <legend className="onboarding-form__legend">Enter Name</legend>
          <div className="onboarding-form__row">
            <div className="onboarding-form__field">
              <label
                htmlFor="onboarding-first-name"
                className="onboarding-form__label"
              >
                First Name
              </label>
              <input
                id="onboarding-first-name"
                name="firstName"
                type="text"
                className="onboarding-form__input"
                value={form.firstName}
                onChange={handleInput("firstName")}
                autoComplete="given-name"
                required
              />
            </div>
            <div className="onboarding-form__field">
              <label
                htmlFor="onboarding-last-name"
                className="onboarding-form__label"
              >
                Last Name
              </label>
              <input
                id="onboarding-last-name"
                name="lastName"
                type="text"
                className="onboarding-form__input"
                value={form.lastName}
                onChange={handleInput("lastName")}
                autoComplete="family-name"
                required
              />
            </div>
          </div>
        </fieldset>

        <div className="onboarding-form__field onboarding-form__field--full">
          <label htmlFor="onboarding-address" className="onboarding-form__label">
            Address
          </label>
          <input
            id="onboarding-address"
            name="address"
            type="text"
            className="onboarding-form__input"
            value={form.address}
            onChange={handleInput("address")}
            autoComplete="street-address"
            required
          />
        </div>

        <div className="onboarding-form__row">
          <div className="onboarding-form__field">
            <label htmlFor="onboarding-state" className="onboarding-form__label">
              Enter State
            </label>
            <input
              id="onboarding-state"
              name="state"
              type="text"
              className="onboarding-form__input"
              value={form.state}
              onChange={handleInput("state")}
              autoComplete="address-level1"
              required
            />
          </div>
          <div className="onboarding-form__field">
            <label
              htmlFor="onboarding-zip-code"
              className="onboarding-form__label"
            >
              Enter Zip Code
            </label>
            <input
              id="onboarding-zip-code"
              name="zipCode"
              type="text"
              className="onboarding-form__input"
              value={form.zipCode}
              onChange={handleInput("zipCode")}
              autoComplete="postal-code"
              required
            />
          </div>
        </div>

        <div className="onboarding-form__row">
          <div className="onboarding-form__field">
            <label
              htmlFor="onboarding-display-name"
              className="onboarding-form__label"
            >
              Display Name
            </label>
            <input
              id="onboarding-display-name"
              name="displayName"
              type="text"
              className="onboarding-form__input"
              value={form.displayName}
              onChange={handleInput("displayName")}
              required
            />
          </div>
          <div className="onboarding-form__field">
            <label
              htmlFor="onboarding-profile-name"
              className="onboarding-form__label"
            >
              Masqué Profile Name
            </label>
            <input
              id="onboarding-profile-name"
              name="profileName"
              type="text"
              className="onboarding-form__input"
              value={form.profileName}
              onChange={handleInput("profileName")}
              required
            />
          </div>
        </div>

        <div className="onboarding-form__field onboarding-form__field--full">
          <label htmlFor="onboarding-phone" className="onboarding-form__label">
            Phone
          </label>
          <input
            id="onboarding-phone"
            name="phone"
            type="tel"
            className="onboarding-form__input"
            value={form.phone}
            onChange={handleInput("phone")}
            autoComplete="tel"
            required
          />
        </div>

        <div className="onboarding-form__field onboarding-form__field--full">
          <label
            htmlFor="onboarding-birthdate"
            className="onboarding-form__label"
          >
            Birthdate
          </label>
          <input
            id="onboarding-birthdate"
            name="dateOfBirth"
            type="date"
            className="onboarding-form__input"
            value={form.dateOfBirth}
            onChange={handleInput("dateOfBirth")}
            required
          />
        </div>

        <div className="onboarding-form__field onboarding-form__field--full">
          <label htmlFor="onboarding-gender" className="onboarding-form__label">
            Gender
          </label>
          <select
            id="onboarding-gender"
            name="gender"
            className="onboarding-form__input"
            value={form.gender}
            onChange={handleInput("gender")}
            required
          >
            <option value="" disabled>
              Select gender
            </option>
            {genderOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="onboarding-form__field onboarding-form__field--full">
          <label
            htmlFor="onboarding-instagram"
            className="onboarding-form__label"
          >
            Instagram Name
          </label>
          <input
            id="onboarding-instagram"
            name="instagram"
            type="text"
            className="onboarding-form__input"
            value={form.instagram}
            onChange={handleInput("instagram")}
            autoComplete="off"
            required
          />
          <p className="onboarding-form__helper">
            Enter your Instagram username only (e.g. john_smith). Do not include
            @ or a URL.
          </p>
        </div>

        {error ? (
          <p className="onboarding-form__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="onboarding-form__actions">
          <button
            type="submit"
            className="onboarding-form__next"
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Next step"}
          </button>
        </div>
      </form>
    </section>
  );
}
