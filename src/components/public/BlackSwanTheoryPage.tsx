"use client";

import { useState } from "react";
import { Play } from "lucide-react";

export default function BlackSwanTheoryPage() {
  const [filmCompleted, setFilmCompleted] = useState(false);

  return (
    <main className="bst-page">
      <section className="bst-hero" aria-label="Black Swan Theory film">
        <header className="bst-brand">
          <p className="bst-brand__masque">MASQUÉ</p>
          <p className="bst-brand__atelier">ATELIER</p>
          <p className="bst-brand__title">BLACK SWAN THEORY</p>
        </header>

        <div className="bst-film">
          {/*
            Next step: replace the placeholder with the vertical film, e.g.
            <video
              className="bst-film__media"
              playsInline
              onEnded={() => setFilmCompleted(true)}
            />
            Connect the actual source here. Do not set filmCompleted until the film ends.
          */}
          <div className="bst-film__frame">
            <div className="bst-film__placeholder">
              <button
                type="button"
                className="bst-play"
                aria-label="Play film"
              >
                <Play className="bst-play__icon" strokeWidth={1.25} fill="currentColor" />
              </button>
              <p className="bst-film__name">BLACK SWAN THEORY</p>
              <p className="bst-film__cue">PLAY FILM</p>
            </div>
          </div>
        </div>
      </section>

      {/* Revealed after the Black Swan Theory film completes. */}
      {filmCompleted ? (
        <section className="bst-after" aria-label="After the film">
          <p className="bst-after__label">MEMBER TICKETS</p>
          <p className="bst-after__label">SHARE THE INVITATION</p>
          <p className="bst-after__label">SAVE THE FILM</p>
        </section>
      ) : null}
    </main>
  );
}
