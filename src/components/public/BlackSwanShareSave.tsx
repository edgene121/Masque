"use client";

import { useEffect, useRef, useState } from "react";
import { blackSwanAnalyticsProps, trackEvent } from "@/lib/analytics";
import {
  getBlackSwanDownloadUrl,
  startBlackSwanFilmDownload,
} from "@/lib/black-swan-film-download";

const PUBLIC_BLACK_SWAN_PATH = "/black-swan-theory";
const SHARE_TITLE = "MASQUÉ: ATELIER — Black Swan Theory";
const SHARE_TEXT = "Black Swan Theory — September 26, 2026 · Washington, DC";
const SHARE_FEEDBACK_MS = 2000;
const SAVE_FEEDBACK_MS = 2000;

type ShareStatus = "idle" | "copied" | "failed";
type SaveStatus = "idle" | "unavailable";

function publicInvitationUrl() {
  return new URL(PUBLIC_BLACK_SWAN_PATH, window.location.origin).toString();
}

function isShareAbort(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "name" in error && error.name === "AbortError";
}

function logShareDev(message: string, error?: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (error === undefined) {
    console.warn("[Black Swan share]", message);
    return;
  }

  console.warn("[Black Swan share]", message, error);
}

export default function BlackSwanShareSave() {
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const shareResetRef = useRef<number | null>(null);
  const saveResetRef = useRef<number | null>(null);
  const shareInFlightRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const filmDownloadUrl = getBlackSwanDownloadUrl();

  useEffect(() => {
    return () => {
      if (shareResetRef.current !== null) {
        window.clearTimeout(shareResetRef.current);
      }
      if (saveResetRef.current !== null) {
        window.clearTimeout(saveResetRef.current);
      }
    };
  }, []);

  function scheduleShareReset() {
    if (shareResetRef.current !== null) {
      window.clearTimeout(shareResetRef.current);
    }

    shareResetRef.current = window.setTimeout(() => {
      setShareStatus("idle");
      shareResetRef.current = null;
    }, SHARE_FEEDBACK_MS);
  }

  async function copyInviteLink(url: string) {
    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard API unavailable");
    }

    await navigator.clipboard.writeText(url);
    setShareStatus("copied");
    trackEvent("black_swan_link_copied", blackSwanAnalyticsProps("member"));
    scheduleShareReset();
  }

  async function handleShareInvitation() {
    if (shareInFlightRef.current) {
      return;
    }

    shareInFlightRef.current = true;

    try {
      const url = publicInvitationUrl();
      trackEvent("black_swan_share_clicked", blackSwanAnalyticsProps("member"));

      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: SHARE_TITLE,
            text: SHARE_TEXT,
            url,
          });
          trackEvent("black_swan_share_completed", blackSwanAnalyticsProps("member"));
          return;
        } catch (error) {
          if (isShareAbort(error)) {
            return;
          }
        }
      }

      try {
        await copyInviteLink(url);
      } catch (error) {
        logShareDev("clipboard copy failed", error);
        setShareStatus("failed");
        scheduleShareReset();
      }
    } finally {
      shareInFlightRef.current = false;
    }
  }

  function handleSaveFilm() {
    if (!filmDownloadUrl || saveInFlightRef.current) {
      return;
    }

    saveInFlightRef.current = true;
    trackEvent("black_swan_save_film_clicked", blackSwanAnalyticsProps("member"));

    try {
      const started = startBlackSwanFilmDownload(filmDownloadUrl);
      if (!started) {
        throw new Error("Download did not start");
      }
      trackEvent("black_swan_save_film_started", blackSwanAnalyticsProps("member"));
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Black Swan download] save film failed", error);
      }
      setSaveStatus("unavailable");
      if (saveResetRef.current !== null) {
        window.clearTimeout(saveResetRef.current);
      }
      saveResetRef.current = window.setTimeout(() => {
        setSaveStatus("idle");
        saveResetRef.current = null;
      }, SAVE_FEEDBACK_MS);
    } finally {
      saveInFlightRef.current = false;
    }
  }

  return (
    <>
      <section
        className="bst-section bst-invite"
        aria-labelledby="bst-share-heading"
      >
        <h2 id="bst-share-heading" className="bst-subheading">
          SHARE THE INVITATION
        </h2>
        <p className="bst-body">
          Extend the invitation to someone you believe belongs in the room.
        </p>
        <div className="bst-invite__actions">
          <button
            type="button"
            className="bst-cta bst-cta--primary"
            onClick={handleShareInvitation}
            aria-live="polite"
            aria-label={
              shareStatus === "copied"
                ? "Invitation link copied"
                : shareStatus === "failed"
                  ? "Copy failed"
                  : "Share invitation"
            }
          >
            {shareStatus === "copied"
              ? "LINK COPIED"
              : shareStatus === "failed"
                ? "COPY FAILED"
                : "SHARE INVITATION"}
          </button>
        </div>
      </section>

      <section
        className="bst-section bst-save-film"
        aria-labelledby="bst-save-heading"
      >
        <h2 id="bst-save-heading" className="bst-subheading">
          SAVE THE FILM
        </h2>
        <div className="bst-invite__actions">
          {filmDownloadUrl ? (
            <button
              type="button"
              className="bst-cta bst-cta--secondary"
              onClick={handleSaveFilm}
              aria-live="polite"
              aria-label={
                saveStatus === "unavailable"
                  ? "Download unavailable"
                  : "Save the film"
              }
            >
              {saveStatus === "unavailable"
                ? "DOWNLOAD UNAVAILABLE"
                : "SAVE THE FILM"}
            </button>
          ) : (
            <button
              type="button"
              className="bst-cta bst-cta--secondary"
              disabled
              aria-label="Save the film — available after film release"
            >
              SAVE THE FILM
            </button>
          )}
        </div>
        {filmDownloadUrl ? null : (
          <p className="bst-save-film__status">AVAILABLE AFTER FILM RELEASE</p>
        )}
      </section>
    </>
  );
}
