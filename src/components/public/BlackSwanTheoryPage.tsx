"use client";

import { useState } from "react";
import { Play } from "lucide-react";

// ---------------------------------------------------------------------------
// Video configuration — update this block when the final film source arrives.
// Do not add Cloudflare Stream or Vimeo SDKs until a real source exists.
// ---------------------------------------------------------------------------
type VideoProvider = "cloudflare-stream" | "vimeo" | "mp4" | null;

const VIDEO_PROVIDER: VideoProvider = null;
const VIDEO_ID: string | null = null;
const VIDEO_URL: string | null = null;
const DOWNLOAD_URL: string | null = null;

const hasConfiguredVideoSource =
  VIDEO_PROVIDER !== null && (Boolean(VIDEO_ID) || Boolean(VIDEO_URL));

export default function BlackSwanTheoryPage() {
  const [filmCompleted, setFilmCompleted] = useState(false);

  function handlePlay() {
    if (!hasConfiguredVideoSource) {
      return;
    }

    // TODO: Start playback on the configured Cloudflare Stream, Vimeo, or MP4 player.
    // Do not navigate. Do not set filmCompleted here.
  }

  function handleEnded() {
    setFilmCompleted(true);
  }

  function handleReplay() {
    setFilmCompleted(false);

    // TODO: Restart the configured player from the beginning, then call handlePlay().
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
              null
            ) : VIDEO_PROVIDER === "vimeo" && VIDEO_ID ? (
              // TODO: Render Vimeo iframe/player using VIDEO_ID.
              // Call playback.onEnded when the film finishes. Do not add the Vimeo SDK yet.
              null
            ) : VIDEO_PROVIDER === "mp4" && VIDEO_URL ? (
              // TODO: Render <video className="bst-film__media" src={VIDEO_URL} playsInline onEnded={playback.onEnded} />
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

      {/* Revealed after the Black Swan Theory film completes. */}
      {filmCompleted ? (
        <section className="bst-after" aria-label="After the film">
          <p className="bst-after__label">MEMBER TICKETS</p>
          <p className="bst-after__label">SHARE THE INVITATION</p>
          {/* SAVE THE FILM will use playback.downloadUrl once a downloadable file exists. */}
          <p className="bst-after__label">SAVE THE FILM</p>
        </section>
      ) : null}
    </main>
  );
}
