"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  PEOPLE_CONCIERGE_STATUS_OPTIONS,
  type ConciergeMember,
} from "@/types/admin-concierge";

const GENERIC_ERROR = "Unable to save Concierge information. Please try again.";

function initialFormState(member: ConciergeMember) {
  const status = member.peopleConciergeStatus?.trim() ?? "";
  return {
    conciergeStatus: (PEOPLE_CONCIERGE_STATUS_OPTIONS as readonly string[]).includes(
      status,
    )
      ? status
      : "",
    conciergeWelcomeDate: member.conciergeWelcomeDate?.trim() ?? "",
    lastConciergeContact: member.lastConciergeContact?.trim() ?? "",
    conciergeNotes: member.conciergeNotes ?? "",
  };
}

export default function ConciergeInformationForm({
  member,
}: {
  member: ConciergeMember;
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => initialFormState(member));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(initialFormState(member));
  }, [
    member.id,
    member.peopleConciergeStatus,
    member.conciergeWelcomeDate,
    member.lastConciergeContact,
    member.conciergeNotes,
  ]);

  const updateField = (key: keyof typeof form, value: string) => {
    setSaved(false);
    setError(null);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch(
        `/api/admin/concierge/members/${encodeURIComponent(member.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
        values?: Partial<typeof form>;
        error?: string;
      } | null;

      if (!response.ok || !data?.ok) {
        setError(data?.error || GENERIC_ERROR);
        return;
      }

      if (data.values) {
        setForm({
          conciergeStatus: data.values.conciergeStatus ?? form.conciergeStatus,
          conciergeWelcomeDate:
            data.values.conciergeWelcomeDate ?? form.conciergeWelcomeDate,
          lastConciergeContact:
            data.values.lastConciergeContact ?? form.lastConciergeContact,
          conciergeNotes: data.values.conciergeNotes ?? form.conciergeNotes,
        });
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-concierge-form" onSubmit={onSubmit}>
      <label className="admin-concierge-form__field">
        <span>Concierge Status</span>
        <select
          className="admin-select"
          value={form.conciergeStatus}
          onChange={(event) => updateField("conciergeStatus", event.target.value)}
          disabled={saving}
        >
          <option value="">Select status</option>
          {PEOPLE_CONCIERGE_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <div className="admin-concierge-form__row">
        <label className="admin-concierge-form__field">
          <span>Concierge Welcome Date</span>
          <input
            type="date"
            className="admin-concierge-input"
            value={form.conciergeWelcomeDate}
            onChange={(event) =>
              updateField("conciergeWelcomeDate", event.target.value)
            }
            disabled={saving}
          />
        </label>
        <label className="admin-concierge-form__field">
          <span>Last Concierge Contact</span>
          <input
            type="date"
            className="admin-concierge-input"
            value={form.lastConciergeContact}
            onChange={(event) =>
              updateField("lastConciergeContact", event.target.value)
            }
            disabled={saving}
          />
        </label>
      </div>

      <label className="admin-concierge-form__field">
        <span>Concierge Notes</span>
        <textarea
          className="admin-concierge-textarea"
          value={form.conciergeNotes}
          onChange={(event) => updateField("conciergeNotes", event.target.value)}
          disabled={saving}
          rows={6}
        />
      </label>

      <div className="admin-concierge-form__actions">
        <button
          type="submit"
          className="admin-btn admin-btn--approve"
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Concierge Update"}
        </button>
        {saved ? (
          <p className="admin-concierge-saved">Concierge information updated.</p>
        ) : null}
        {error ? (
          <p className="admin-form-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
