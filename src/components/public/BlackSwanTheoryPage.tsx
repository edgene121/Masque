"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import BlackSwanPublicContent from "@/components/public/BlackSwanPublicContent";
import BlackSwanMemberEventCopy from "@/components/public/BlackSwanMemberEventCopy";
import BlackSwanEventAccess from "@/components/public/BlackSwanEventAccess";
import BlackSwanConcierge from "@/components/public/BlackSwanConcierge";
import BlackSwanShareSave from "@/components/public/BlackSwanShareSave";
import TicketTailorEmbed from "@/components/tickets/TicketTailorEmbed";
import { getBlackSwanDownloadUrl } from "@/lib/black-swan-film-download";
import {
  blackSwanAnalyticsProps,
  trackEvent,
  trackEventOnce,
} from "@/lib/analytics";

// Local film file: copy the MP4 to public/videos/black-swan-theory.mp4
const LOCAL_FILM_SRC = "/videos/black-swan-theory.mp4";
// Reuse BLACK_SWAN_DOWNLOAD_URL — do not add a second download URL here.
const DOWNLOAD_URL = getBlackSwanDownloadUrl();

const MEMBER_TICKETS_HREF = "/login?next=/events/black-swan-theory";
const REQUEST_ACCESS_HREF = "https://masque.co/apply";
const PUBLIC_BLACK_SWAN_URL = "/black-swan-theory";
const SHARE_TITLE = "Masqué : Atelier — Black Swan Theory";
const SHARE_TEXT = "Black Swan Theory — September 26, 2026 · Washington, DC";

// Official Black Swan Theory SINGLE-EVENT Ticket Tailor embed HTML.
// Do not modify checkout ID, chk token, data-url, script URL, or widget attributes.
const BLACK_SWAN_TICKET_TAILOR_EMBED = `<!-- Ticket Tailor Widget. Paste this into your website where you want the widget to appear. Do not change the code or the widget may not work properly. -->
<div class="tt-widget"><div class="tt-widget-fallback"><p><a href="https://www.tickettailor.com/checkout/new-session/id/8920098/chk/ab786d4810d600b50f5a5704446c91ea/?ref=website_widget&show_search_filter=true&show_date_filter=true&show_sort=true" target="_blank">Click here to buy tickets</a><br /><small><a href="https://www.tickettailor.com?rf=wdg_241065" class="tt-widget-powered">Sell tickets online with Ticket Tailor</a></small></p></div><script src="https://cdn.tickettailor.com/js/widgets/min/widget.js" data-url="https://www.tickettailor.com/checkout/new-session/id/8920098/chk/ab786d4810d600b50f5a5704446c91ea/?ref=website_widget&show_search_filter=true&show_date_filter=true&show_sort=true" data-type="inline" data-inline-minimal="true" data-inline-show-logo="false" data-inline-bg-fill="true" data-inline-inherit-ref-from-url-param="" data-inline-ref="website_widget"></script></div>
<!-- End of Ticket Tailor Widget -->`;

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
  return "unknown";
}

export default function BlackSwanTheoryPage({
  showMemberTickets = false,
}: BlackSwanTheoryPageProps) {
  const [filmCompleted, setFilmCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
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

  useEffect(() => {
    if (!isPlaying) return;
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => {
      // If autoplay is blocked, native controls remain visible.
    });
  }, [isPlaying]);

  function handlePlay() {
    trackEvent("black_swan_film_play_clicked", analyticsContext);
    setFilmCompleted(false);
    setIsPlaying(true);
  }

  function handleFilmStarted() {
    trackEventOnce(
      "black_swan_film_started",
      `${analyticsPage}-film-started`,
      analyticsContext,
    );
  }

  function handleEnded() {
    trackEvent("black_swan_film_completed", analyticsContext);
    setFilmCompleted(true);
  }

  function handleReplay() {
    setFilmCompleted(false);
    setIsPlaying(true);

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      void video.play().catch(() => {
        // Native controls remain available if replay autoplay is blocked.
      });
    }
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
          {showMemberTickets ? (
            <>
              <p className="bst-brand__masque">MASQUÉ</p>
              <p className="bst-brand__atelier">ATELIER</p>
              <p className="bst-brand__title">BLACK SWAN THEORY</p>
            </>
          ) : (
            <>
              <p className="bst-brand__series">MASQUÉ : ATELIER</p>
              <p className="bst-brand__title">BLACK SWAN THEORY</p>
              <p className="bst-brand__when">SEPTEMBER 26 · WASHINGTON, DC</p>
            </>
          )}
        </header>

        <div className="bst-film">
          <div className="bst-film__frame">
            {isPlaying ? (
              <video
                ref={videoRef}
                className="bst-film__media"
                src={LOCAL_FILM_SRC}
                playsInline
                controls
                preload="metadata"
                autoPlay
                onPlaying={handleFilmStarted}
                onEnded={playback.onEnded}
              >
                <a href={LOCAL_FILM_SRC}>Download Black Swan Theory</a>
              </video>
            ) : showMemberTickets ? (
              <div
                className="bst-film__placeholder"
                onClick={playback.onPlay}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    playback.onPlay();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Play film"
              >
                <span className="bst-play" aria-hidden="true">
                  <Play className="bst-play__icon" strokeWidth={1.25} fill="currentColor" />
                </span>
                <p className="bst-film__name">BLACK SWAN THEORY</p>
                <p className="bst-film__cue">PLAY FILM</p>
              </div>
            ) : (
              <button
                type="button"
                className="bst-film__placeholder bst-film__surface"
                aria-label="Play Black Swan Theory"
                onClick={playback.onPlay}
              >
                <span className="bst-play" aria-hidden="true">
                  <Play className="bst-play__icon" strokeWidth={1.25} fill="currentColor" />
                </span>
                <span className="bst-film__name">BLACK SWAN THEORY</span>
                <span className="bst-film__cue bst-film__cue--launch">
                  PLAY BLACK SWAN THEORY
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="bst-content">
        {showMemberTickets ? (
          <>
            <section className="bst-section bst-section--intro" aria-labelledby="bst-event-heading">
              <p className="bst-eyebrow">{EVENT_COPY.eyebrow}</p>
              <h1 id="bst-event-heading" className="bst-heading">
                {EVENT_COPY.heading}
              </h1>
              <p className="bst-meta">
                <span>SEPTEMBER 26 · WASHINGTON, DC</span>
              </p>
            </section>

            <BlackSwanMemberEventCopy />

            <BlackSwanConcierge />
            <BlackSwanEventAccess />
            <MemberTicketsSection />
            <BlackSwanShareSave />
          </>
        ) : (
          <BlackSwanPublicContent analyticsContext={analyticsContext} />
        )}

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
                aria-label="Members — access event"
                onClick={() =>
                  trackEvent("black_swan_member_access_clicked", analyticsContext)
                }
              >
                MEMBERS — ACCESS EVENT
              </Link>
              <Link
                href={REQUEST_ACCESS_HREF}
                className="bst-cta bst-cta--secondary"
                aria-label="Request membership"
                onClick={() =>
                  trackEvent(
                    "black_swan_request_membership_clicked",
                    analyticsContext,
                  )
                }
              >
                REQUEST MEMBERSHIP
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
        Purchase Tickets
      </h2>

      <TicketTailorEmbed embedHtml={BLACK_SWAN_TICKET_TAILOR_EMBED} />

      <p className="bst-tickets__notice">
        Ticket ownership does not override Masqué membership, verification,
        consent, or admission requirements.
      </p>
    </section>
  );
}
