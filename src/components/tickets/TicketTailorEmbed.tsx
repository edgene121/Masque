"use client";

import { useEffect, useRef, useState } from "react";

export type TicketTailorEmbedProps = {
  embedHtml?: string | null;
};

type WidgetStatus = "placeholder" | "loading" | "ready" | "error";

type ParsedEmbed = {
  markup: string;
  scriptSrc: string | null;
  dataAttributes: Record<string, string>;
  hasTicketTailorFrame: boolean;
};

const scriptLoaders = new Map<string, Promise<void>>();

function logTicketTailorDev(message: string, details?: Record<string, string>) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (details) {
    console.warn("[Ticket Tailor]", message, details);
    return;
  }

  console.warn("[Ticket Tailor]", message);
}

function isTicketTailorHost(hostname: string): boolean {
  return (
    hostname === "tickettailor.com" || hostname.endsWith(".tickettailor.com")
  );
}

function isAllowedTicketTailorUrl(value: string): boolean {
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === "https:" && isTicketTailorHost(url.hostname);
  } catch {
    return false;
  }
}

function parseTicketTailorEmbed(embedHtml: string): ParsedEmbed {
  const parser = new DOMParser();
  const doc = parser.parseFromString(embedHtml, "text/html");
  const dataAttributes: Record<string, string> = {};
  let scriptSrc: string | null = null;

  for (const script of Array.from(doc.querySelectorAll("script"))) {
    const src = script.getAttribute("src")?.trim() ?? "";

    if (src && isAllowedTicketTailorUrl(src) && !scriptSrc) {
      scriptSrc = src;

      for (const attr of Array.from(script.attributes)) {
        if (attr.name.startsWith("data-")) {
          dataAttributes[attr.name] = attr.value;
        }
      }
    }

    script.remove();
  }

  const hasTicketTailorFrame = Array.from(doc.querySelectorAll("iframe")).some(
    (frame) => {
      const src = frame.getAttribute("src") ?? "";
      return src ? isAllowedTicketTailorUrl(src) : false;
    },
  );

  return {
    markup: doc.body.innerHTML.trim(),
    scriptSrc,
    dataAttributes,
    hasTicketTailorFrame,
  };
}

function loadTicketTailorScript(
  src: string,
  dataAttributes: Record<string, string>,
): Promise<void> {
  const existing = scriptLoaders.get(src);
  if (existing) {
    return existing;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const alreadyPresent = document.querySelector(
      `script[src="${src.replace(/"/g, "")}"]`,
    );

    if (alreadyPresent) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;

    for (const [name, value] of Object.entries(dataAttributes)) {
      script.setAttribute(name, value);
    }

    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Ticket Tailor widget script failed to load."));

    document.body.appendChild(script);
  });

  scriptLoaders.set(src, promise);
  return promise;
}

function widgetLooksReady(root: HTMLElement): boolean {
  if (root.querySelector("iframe")) {
    return true;
  }

  const widget = root.querySelector(".tt-widget");
  if (!widget) {
    return false;
  }

  return widget.childElementCount > 1 || widget.scrollHeight > 120;
}

export default function TicketTailorEmbed({
  embedHtml,
}: TicketTailorEmbedProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const html = embedHtml?.trim() ?? "";
  const [status, setStatus] = useState<WidgetStatus>(
    html ? "loading" : "placeholder",
  );

  useEffect(() => {
    if (!html) {
      setStatus("placeholder");
      return;
    }

    const root = mountRef.current;
    if (!root) {
      return;
    }

    let cancelled = false;
    let observer: MutationObserver | null = null;
    let timeoutId: number | null = null;

    const parsed = parseTicketTailorEmbed(html);
    root.innerHTML = parsed.markup;
    setStatus("loading");

    const markReady = () => {
      if (!cancelled) {
        setStatus("ready");
      }
    };

    const markError = (reason: string) => {
      logTicketTailorDev(reason, {
        host: parsed.scriptSrc
          ? new URL(parsed.scriptSrc).hostname
          : "none",
        type: parsed.dataAttributes["data-type"] || "unknown",
      });
      if (!cancelled) {
        setStatus("error");
      }
    };

    if (parsed.hasTicketTailorFrame && widgetLooksReady(root)) {
      markReady();
      return () => {
        cancelled = true;
      };
    }

    if (!parsed.scriptSrc && !parsed.hasTicketTailorFrame) {
      markError("Embed HTML did not include a Ticket Tailor widget script.");
      return () => {
        cancelled = true;
      };
    }

    observer = new MutationObserver(() => {
      if (mountRef.current && widgetLooksReady(mountRef.current)) {
        markReady();
        observer?.disconnect();
      }
    });
    observer.observe(root, { childList: true, subtree: true });

    timeoutId = window.setTimeout(() => {
      if (mountRef.current && widgetLooksReady(mountRef.current)) {
        markReady();
        return;
      }
      markError("Ticket Tailor widget did not initialize in time.");
    }, 15000);

    if (parsed.scriptSrc) {
      void loadTicketTailorScript(parsed.scriptSrc, parsed.dataAttributes)
        .then(() => {
          if (cancelled) {
            return;
          }

          if (widgetLooksReady(root)) {
            markReady();
          }
        })
        .catch(() => {
          markError("Ticket Tailor widget script failed to load.");
        });
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [html]);

  if (status === "placeholder") {
    return (
      <div className="bst-tickets__placeholder">
        <p className="bst-tickets__soon">TICKET SALES OPENING SOON</p>
        <p className="bst-tickets__hint">
          The Black Swan Theory member ticket interface will appear here.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="bst-tickets__placeholder" role="alert">
        <p className="bst-tickets__soon">TICKET INTERFACE UNAVAILABLE</p>
        <p className="bst-tickets__hint">Please try again in a moment.</p>
      </div>
    );
  }

  return (
    <div className="bst-tickets__widget" aria-busy={status === "loading"}>
      {status === "loading" ? (
        <div className="bst-tickets__loading" role="status">
          <p className="bst-tickets__soon">LOADING TICKETS...</p>
        </div>
      ) : null}
      <div ref={mountRef} className="bst-tickets__mount" />
    </div>
  );
}
