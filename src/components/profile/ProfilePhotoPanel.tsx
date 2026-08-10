"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

interface ProfilePhotoPanelProps {
  initials: string;
  photoUrl?: string;
  disabled?: boolean;
  onPhotoChange?: (file: File, previewUrl: string) => void;
}

const MAX_BYTES = 2 * 1024 * 1024;

export default function ProfilePhotoPanel({
  initials,
  photoUrl,
  disabled = false,
  onPhotoChange,
}: ProfilePhotoPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(photoUrl);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(photoUrl);
  }, [photoUrl]);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Please choose a JPG or PNG image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_BYTES) {
      setError("Image must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    onPhotoChange?.(file, url);
  };

  return (
    <section className="profile-photo-panel">
      <div className="profile-photo-panel__avatar profile-avatar" aria-hidden={!preview}>
        {preview ? (
          <img src={preview} alt="Profile" />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      <div className="profile-photo-panel__copy profile-photo-content">
        <h3 className="profile-photo-panel__title">Profile Photo</h3>
        <p className="profile-photo-panel__hint">
          How you appear to other members · JPG or PNG, max 2 MB
        </p>
        {error ? <p className="profile-photo-panel__error">{error}</p> : null}
        <button
          type="button"
          className="profile-photo-panel__btn"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Change Profile
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        className="profile-photo-panel__input"
        disabled={disabled}
        onChange={handleFile}
      />
    </section>
  );
}
