"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import BlackSwanEventAccess from "@/components/public/BlackSwanEventAccess";
import BlackSwanConcierge from "@/components/public/BlackSwanConcierge";
import BlackSwanShareSave from "@/components/public/BlackSwanShareSave";
import TicketTailorEmbed from "@/components/tickets/TicketTailorEmbed";
import { useTicketTailorCustomer } from "@/hooks/useTicketTailorCustomer";
import { TICKET_TAILOR_CUSTOM_DOMAIN } from "@/lib/tickets/ticket-tailor-config";
import { getBlackSwanDownloadUrl } from "@/lib/black-swan-film-download";
import {
  blackSwanAnalyticsProps,
  trackEvent,
  trackEventOnce,
} from "@/lib/analytics";

// ---------------------------------------------------------------------------
// Video configuration — update this block when the final film source arrives.
// Do not add Cloudflare Stream or Vimeo SDKs until a real source exists.
// ---------------------------------------------------------------------------
type VideoProvider = "cloudflare-stream" | "vimeo" | "mp4" | null;

const VIDEO_PROVIDER: VideoProvider = null;
const VIDEO_ID: string | null = null;
const VIDEO_URL: string | null = null;
// Reuse BLACK_SWAN_DOWNLOAD_URL — do not add a second download URL here.
const DOWNLOAD_URL = getBlackSwanDownloadUrl();

const hasConfiguredVideoSource =
  VIDEO_PROVIDER !== null && (Boolean(VIDEO_ID) || Boolean(VIDEO_URL));

const MEMBER_TICKETS_HREF = "/login?next=/events/black-swan-theory";
const REQUEST_ACCESS_HREF = "/request-access";
const PUBLIC_BLACK_SWAN_URL = "/black-swan-theory";
const SHARE_TITLE = "Masqué : Atelier — Black Swan Theory";
const SHARE_TEXT = "Black Swan Theory — September 26, 2026 · Washington, DC";

// Paste the official Black Swan Theory SINGLE-EVENT Ticket Tailor embed HTML here.
const BLACK_SWAN_TICKET_TAILOR_EMBED: string | null = null;

// ---------------------------------------------------------------------------
// Event copy — replace these strings when final editorial is ready.
// ---------------------------------------------------------------------------
const EVENT_COPY = {
  eyebrow: "MASQUÉ : ATELIER",
  heading: "BLACK SWAN THEORY",
  date: "SEPTEMBER 26, 2026",
  location: "WASHINGTON, DC",
  introduction:
    "Black Swan Theory explores the tension between elegance and unpredictability — a night shaped by transformation, contrast, and the unexpected.",
  musicHeading: "MUSIC & EXPERIENCE",
  music:
    "An immersive evening shaped by sound, movement, atmosphere, and shared experience.",
  dressHeading: "DRESS",
  dress:
    "Black, sculptural, dramatic, refined. Guests are encouraged to interpret the Black Swan through silhouette, texture, contrast, and personal expression.",
  privateHeading: "PRIVATE BY DESIGN",
  private:
    "Masqué is a private membership community. Event access, ticket ownership, verification, and admission eligibility remain subject to Masqué membership requirements.",
};

interface BlackSwanTheoryPageProps {
  showMemberTickets?: boolean;
}

function videoAnalyticsProvider(): "cloudflare" | "vimeo" | "unknown" {
  if (VIDEO_PROVIDER === "cloudflare-stream") return "cloudflare";
  if (VIDEO_PROVIDER === "vimeo") return "vimeo";
  return "unknown";
}

export default function BlackSwanTheoryPage({
  showMemberTickets = false,
}: BlackSwanTheoryPageProps) {
  const [filmCompleted, setFilmCompleted] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const shareResetRef = useRef<number | null>(null);
  const analyticsPage = showMemberTickets ? "member" : "public";
  const analyticsContext = blackSwanAnalyticsProps(analyticsPage, {
    provider: videoAnalyticsProvider(),
    ticketWidgetConfigured: Boolean(BLACK_SWAN_TICKET_TAILOR_EMBED),
  });

  useEffect(() => {
    const context = blackSwanAnalyticsProps(analyticsPage, {
      provider: videoAnalyticsProvider(),
      ticketWidgetConfigured: Boolean(BLACK_SWAN_TICKET_TAILOR_EMBED),
    });
    trackEventOnce(
      showMemberTickets
        ? "black_swan_member_event_view"
        : "black_swan_public_page_view",
      context.route ?? analyticsPage,
      context,
    );
  }, [analyticsPage, showMemberTickets]);

  useEffect(() => {
    return () => {
      if (shareResetRef.current !== null) {
        window.clearTimeout(shareResetRef.current);
      }
    };
  }, []);

  function handlePlay() {
    if (!hasConfiguredVideoSource) {
      return;
    }

    trackEvent("black_swan_film_play_clicked", analyticsContext);

    // TODO: Start playback on the configured Cloudflare Stream, Vimeo, or MP4 player.
    // Do not navigate. Do not set filmCompleted here.
    // TODO: When the player reports that playback has actually begun:
    // trackEvent("black_swan_film_started", analyticsContext);
  }

  function handleEnded() {
    trackEvent("black_swan_film_completed", analyticsContext);
    setFilmCompleted(true);
  }

  function handleReplay() {
    setFilmCompleted(false);

    // TODO: Restart the configured player from the beginning, then call handlePlay().
  }

  async function copyInviteLink(url: string) {
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    trackEvent("black_swan_link_copied", analyticsContext);

    if (shareResetRef.current !== null) {
      window.clearTimeout(shareResetRef.current);
    }

    shareResetRef.current = window.setTimeout(() => {
      setShareCopied(false);
      shareResetRef.current = null;
    }, 2000);
  }

  async function handleShareInvitation() {
    const url = new URL(PUBLIC_BLACK_SWAN_URL, window.location.origin).toString();
    trackEvent("black_swan_share_clicked", analyticsContext);

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url,
        });
        trackEvent("black_swan_share_completed", analyticsContext);
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

  const playback = {
    onPlay: handlePlay,
    onEnded: handleEnded,
    onReplay: handleReplay,
    downloadUrl: DOWNLOAD_URL,
  };

  return (
    <main className="bst-page">
      <section className="bst-hero" aria-label="Black Swan Theory film">
        <header className="bst-brand">
          <p className="bst-brand__masque">MASQUÉ</p>
          <p className="bst-brand__atelier">ATELIER</p>
          <p className="bst-brand__title">BLACK SWAN THEORY</p>
        </header>

        <div className="bst-film">
          <div className="bst-film__frame">
            {/*
              TODO: Replace placeholder with Cloudflare Stream or Vimeo player
              once the final video source is provided.
              Direct MP4 fallback: <video className="bst-film__media" src={VIDEO_URL} playsInline onEnded={playback.onEnded} />
            */}
            {VIDEO_PROVIDER === "cloudflare-stream" && VIDEO_ID ? (
              // TODO: Render Cloudflare Stream iframe/player using VIDEO_ID.
              // Call playback.onEnded when the film finishes. Do not add the Stream SDK yet.
              // When playback actually begins: trackEvent("black_swan_film_started", analyticsContext).
              null
            ) : VIDEO_PROVIDER === "vimeo" && VIDEO_ID ? (
              // TODO: Render Vimeo iframe/player using VIDEO_ID.
              // Call playback.onEnded when the film finishes. Do not add the Vimeo SDK yet.
              // When playback actually begins: trackEvent("black_swan_film_started", analyticsContext).
              null
            ) : VIDEO_PROVIDER === "mp4" && VIDEO_URL ? (
              // TODO: Render <video className="bst-film__media" src={VIDEO_URL} playsInline onEnded={playback.onEnded} />
              // When playback actually begins: trackEvent("black_swan_film_started", analyticsContext).
              null
            ) : (
              <div className="bst-film__placeholder">
                <button
                  type="button"
                  className="bst-play"
                  aria-label="Play film"
                  onClick={playback.onPlay}
                >
                  <Play className="bst-play__icon" strokeWidth={1.25} fill="currentColor" />
                </button>
                <p className="bst-film__name">BLACK SWAN THEORY</p>
                <p className="bst-film__cue">PLAY FILM</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="bst-content">
        <section className="bst-section bst-section--intro" aria-labelledby="bst-event-heading">
          <p className="bst-eyebrow">{EVENT_COPY.eyebrow}</p>
          <h1 id="bst-event-heading" className="bst-heading">
            {EVENT_COPY.heading}
          </h1>
          <p className="bst-meta">
            <span>{EVENT_COPY.date}</span>
            <span className="bst-meta__rule" aria-hidden="true" />
            <span>{EVENT_COPY.location}</span>
          </p>
          <p className="bst-body">{EVENT_COPY.introduction}</p>
        </section>

        <section className="bst-section" aria-labelledby="bst-music-heading">
          <h2 id="bst-music-heading" className="bst-subheading">
            {EVENT_COPY.musicHeading}
          </h2>
          <p className="bst-body">{EVENT_COPY.music}</p>
        </section>

        <section className="bst-section" aria-labelledby="bst-dress-heading">
          <h2 id="bst-dress-heading" className="bst-subheading">
            {EVENT_COPY.dressHeading}
          </h2>
          <p className="bst-body">{EVENT_COPY.dress}</p>
        </section>

        <section className="bst-section" aria-labelledby="bst-private-heading">
          <h2 id="bst-private-heading" className="bst-subheading">
            {EVENT_COPY.privateHeading}
          </h2>
          <p className="bst-body">{EVENT_COPY.private}</p>
        </section>

        {!showMemberTickets ? (
          <section
            className="bst-section bst-public-access"
            aria-label="Black Swan Theory access"
          >
            <div className="bst-invite__actions">
              <Link
                href={MEMBER_TICKETS_HREF}
                className="bst-cta bst-cta--primary"
                aria-label="Member tickets — continue to sign in"
                onClick={() =>
                  trackEvent("black_swan_member_access_clicked", analyticsContext)
                }
              >
                MEMBER TICKETS
              </Link>
              <Link
                href={REQUEST_ACCESS_HREF}
                className="bst-cta bst-cta--secondary"
                aria-label="Request Masqué membership access"
                onClick={() =>
                  trackEvent(
                    "black_swan_request_membership_clicked",
                    analyticsContext,
                  )
                }
              >
                REQUEST ACCESS
              </Link>
            </div>
          </section>
        ) : null}

        {showMemberTickets ? (
          <>
            <BlackSwanConcierge />
            <BlackSwanEventAccess />
            <MemberTicketsSection />
            <BlackSwanShareSave />
          </>
        ) : null}

        {/* Revealed after the Black Swan Theory film completes. */}
        {filmCompleted ? (
          showMemberTickets ? (
            <section
              className="bst-after bst-after--member"
              aria-labelledby="bst-after-heading"
            >
              <h2 id="bst-after-heading" className="bst-subheading">
                AFTER THE FILM
              </h2>
              <p className="bst-after__copy">Continue the experience.</p>
              <div className="bst-after__actions">
                <button
                  type="button"
                  className="bst-cta bst-cta--secondary"
                  onClick={handleShareInvitation}
                  aria-live="polite"
                  aria-label={
                    shareCopied
                      ? "Invitation link copied"
                      : "Share the invitation"
                  }
                >
                  {shareCopied ? "LINK COPIED" : "SHARE THE INVITATION"}
                </button>
                {playback.downloadUrl ? (
                  <a
                    href={playback.downloadUrl}
                    className="bst-cta bst-cta--secondary"
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Save the film"
                  >
                    SAVE THE FILM
                  </a>
                ) : (
                  <button
                    type="button"
                    className="bst-cta bst-cta--secondary"
                    disabled
                    aria-label="Save the film — download not available yet"
                  >
                    SAVE THE FILM
                  </button>
                )}
              </div>
              {playback.downloadUrl ? null : (
                <p className="bst-after__hint">
                  Download available after film release.
                </p>
              )}
            </section>
          ) : (
            <section className="bst-after" aria-label="After the film">
              <Link
                href={MEMBER_TICKETS_HREF}
                className="bst-cta bst-cta--primary"
                aria-label="Member tickets — continue to sign in"
                onClick={() =>
                  trackEvent("black_swan_member_access_clicked", analyticsContext)
                }
              >
                MEMBER TICKETS
              </Link>
              <Link
                href={REQUEST_ACCESS_HREF}
                className="bst-cta bst-cta--secondary"
                aria-label="Request Masqué membership access"
                onClick={() =>
                  trackEvent(
                    "black_swan_request_membership_clicked",
                    analyticsContext,
                  )
                }
              >
                REQUEST ACCESS
              </Link>
              <button
                type="button"
                className="bst-cta bst-cta--secondary"
                onClick={handleShareInvitation}
                aria-live="polite"
                aria-label={
                  shareCopied
                    ? "Invitation link copied"
                    : "Share the invitation"
                }
              >
                {shareCopied ? "LINK COPIED" : "SHARE THE INVITATION"}
              </button>
              {playback.downloadUrl ? (
                <a
                  href={playback.downloadUrl}
                  className="bst-cta bst-cta--secondary"
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Save the film"
                >
                  SAVE THE FILM
                </a>
              ) : (
                <button
                  type="button"
                  className="bst-cta bst-cta--secondary"
                  disabled
                  aria-label="Save the film — download not available yet"
                >
                  SAVE THE FILM
                </button>
              )}
            </section>
          )
        ) : null}
      </div>
    </main>
  );
}

function MemberTicketsSection() {
  const ticketTailorCustomer = useTicketTailorCustomer();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        trackEventOnce(
          "black_swan_ticket_section_viewed",
          "/events/black-swan-theory",
          blackSwanAnalyticsProps("member", {
            ticketWidgetConfigured: Boolean(BLACK_SWAN_TICKET_TAILOR_EMBED),
          }),
        );
        observer.disconnect();
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="member-tickets"
      className="bst-section bst-tickets"
      aria-labelledby="bst-tickets-heading"
    >
      <h2 id="bst-tickets-heading" className="bst-subheading">
        MEMBER TICKETS
      </h2>
      <p className="bst-body">
        Select your available ticket below. Ticket pricing and availability are
        managed directly through Ticket Tailor.
      </p>
      <p className="bst-tickets__notice">
        Ticket ownership does not override Masqué membership, verification,
        consent, or admission requirements.
      </p>

      <TicketTailorEmbed
        embedHtml={BLACK_SWAN_TICKET_TAILOR_EMBED}
        customer={ticketTailorCustomer}
        customDomain={TICKET_TAILOR_CUSTOM_DOMAIN}
      />
    </section>
  );
}
