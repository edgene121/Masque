import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MASQUÉ : ATELIER — Black Swan Theory",
  description: "Public event landing page for MASQUÉ : ATELIER — Black Swan Theory.",
};

export default function BlackSwanTheoryPublicPage() {
  return (
    <main className="flex min-h-dvh min-h-screen w-full items-center justify-center bg-black px-6 py-16 text-center">
      <div className="flex max-w-xl flex-col items-center gap-8 sm:gap-10">
        <p className="font-serif text-4xl font-semibold tracking-[0.28em] text-white uppercase sm:text-5xl md:text-6xl">
          MASQUÉ
        </p>

        <p className="font-serif text-xl font-medium tracking-[0.35em] text-[#b9965b] uppercase sm:text-2xl">
          ATELIER
        </p>

        <p className="font-serif text-2xl font-semibold tracking-[0.12em] text-white uppercase sm:text-3xl md:text-4xl">
          BLACK SWAN THEORY
        </p>

        <p className="mt-4 text-[11px] font-medium tracking-[0.22em] text-[#c5a568] uppercase sm:text-xs">
          PUBLIC EVENT LANDING PAGE
        </p>
      </div>
    </main>
  );
}
