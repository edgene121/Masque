"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";

const PUBLIC_BLACK_SWAN_PATH = "/black-swan-theory";
const SHARE_TITLE = "MASQUÉ: ATELIER — Black Swan Theory";
const SHARE_TEXT =
  "An invitation to MASQUÉ : ATELIER — Black Swan Theory. September 26, 2026 · Washington, DC.";

// Insert the downloadable Black Swan Theory MP4 URL here when provided.
const FILM_DOWNLOAD_URL: string | null = null;

function publicInvitationUrl() {
  return new URL(PUBLIC_BLACK_SWAN_PATH, window.location.origin).toString();
}

export default function BlackSwanShareSave() {
  const [shareCopied, setShareCopied] = useState(false);
  const shareResetRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (shareResetRef.current !== null) {
        window.clearTimeout(shareResetRef.current);
      }
    };
  }, []);

  async function copyInviteLink(url: string) {
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    trackEvent("black_swan_link_copied", { url });

    if (shareResetRef.current !== null) {
      window.clearTimeout(shareResetRef.current);
    }

    shareResetRef.current = window.setTimeout(() => {
      setShareCopied(false);
      shareResetRef.current = null;
    }, 2000);
  }

  async function handleShareInvitation() {
    const url = publicInvitationUrl();
    trackEvent("black_swan_share_clicked", { url });

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url,
        });
        trackEvent("black_swan_share_completed", { url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await copyInviteLink(url);
    } catch {
      // Clipboard fallback failed; do not use alert().
    }
  }

  function handleSaveFilm() {
    if (!FILM_DOWNLOAD_URL) {
      return;
    }

    trackEvent("black_swan_save_film_clicked", { url: FILM_DOWNLOAD_URL });
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
              shareCopied ? "Invitation link copied" : "Share invitation"
            }
          >
            {shareCopied ? "LINK COPIED" : "SHARE INVITATION"}
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
          {FILM_DOWNLOAD_URL ? (
            <a
              href={FILM_DOWNLOAD_URL}
              className="bst-cta bst-cta--secondary"
              download
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSaveFilm}
              aria-label="Save the film"
            >
              SAVE THE FILM
            </a>
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
        {FILM_DOWNLOAD_URL ? null : (
          <p className="bst-save-film__status">AVAILABLE AFTER FILM RELEASE</p>
        )}
      </section>
    </>
  );
}
