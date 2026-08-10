"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { Upload } from "lucide-react";

interface SupportFormState {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  file: File | null;
}

const INITIAL_STATE: SupportFormState = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
  file: null,
};

const MAX_BYTES = 10 * 1024 * 1024;

export default function ContactSupportForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<SupportFormState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);

  const updateField =
    (key: keyof Omit<SupportFormState, "file">) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setError("File must be 10 MB or smaller.");
      event.target.value = "";
      setForm((prev) => ({ ...prev, file: null }));
      return;
    }

    setError(null);
    setForm((prev) => ({ ...prev, file }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.subject.trim() ||
      !form.message.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    // TODO: Submit to support backend / Airtable / email service
    console.log("Support request:", {
      fullName: form.fullName,
      email: form.email,
      subject: form.subject,
      message: form.message,
      fileName: form.file?.name ?? null,
      fileSize: form.file?.size ?? null,
    });
  };

  return (
    <form className="contact-support-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-support-form__field">
        <label htmlFor="support-full-name">Full Name</label>
        <input
          id="support-full-name"
          name="fullName"
          type="text"
          required
          value={form.fullName}
          onChange={updateField("fullName")}
        />
      </div>

      <div className="contact-support-form__field">
        <label htmlFor="support-email">Email Address</label>
        <input
          id="support-email"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={updateField("email")}
        />
      </div>

      <div className="contact-support-form__field">
        <label htmlFor="support-subject">Subject</label>
        <input
          id="support-subject"
          name="subject"
          type="text"
          required
          value={form.subject}
          onChange={updateField("subject")}
        />
      </div>

      <div className="contact-support-form__field">
        <label htmlFor="support-message">How Can We Help ?</label>
        <textarea
          id="support-message"
          name="message"
          required
          placeholder="How Can We Help ?"
          value={form.message}
          onChange={updateField("message")}
        />
      </div>

      <div className="contact-support-form__upload">
        <p className="contact-support-form__upload-label">
          Share Screenshot or Recording here.
        </p>
        <div className="contact-support-form__upload-row">
          <button
            type="button"
            className="contact-support-form__upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" strokeWidth={1.75} />
            Upload File
          </button>
          <span className="contact-support-form__upload-hint">
            Max file size 10MB.
            {form.file ? ` Selected: ${form.file.name}` : ""}
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx"
          className="contact-support-form__file-input"
          onChange={handleFile}
        />
      </div>

      {error ? (
        <p className="contact-support-form__error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="contact-support-form__submit">
        Send Support Request
      </button>
    </form>
  );
}
