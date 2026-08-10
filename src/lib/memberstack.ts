"use client";

import memberstackDOM from "@memberstack/dom";
import type { MemberstackUser } from "@/types/dashboard";

/** Singleton Memberstack DOM client type */
export type MemberstackInstance = ReturnType<typeof memberstackDOM.init>;

const MEMBERSTACK_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY ?? "pk_6091ebc0f49c21e75516";

let memberstackInstance: MemberstackInstance | null = null;

/**
 * Returns the app-wide Memberstack DOM singleton.
 * Browser-only — call from client components, event handlers, or effects.
 *
 * @example
 * import { getMemberstack } from "@/lib/memberstack";
 * const memberstack = getMemberstack();
 * const { data: member } = await memberstack.getCurrentMember();
 */
export function getMemberstack(): MemberstackInstance {
  if (typeof window === "undefined") {
    throw new Error(
      "Memberstack is only available in the browser. Call getMemberstack() from a client component.",
    );
  }

  if (!memberstackInstance) {
    memberstackInstance = memberstackDOM.init({
      publicKey: MEMBERSTACK_PUBLIC_KEY,
      useCookies: true,
    });
  }

  return memberstackInstance;
}

const FALLBACK_USER: MemberstackUser = {
  name: "Arcade J Mamangun",
  initials: "AJ",
  email: "arcade@example.com",
};

/**
 * TODO: Replace with live Memberstack member data via getMemberstack().
 */
export function useMemberstackUser(): MemberstackUser {
  return FALLBACK_USER;
}

export async function fetchMemberstackUser(): Promise<MemberstackUser> {
  // TODO: Resolve current member from getMemberstack().getCurrentMember()
  return FALLBACK_USER;
}
