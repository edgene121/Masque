"use client";

import { useEffect, useState } from "react";
import memberstackDOM from "@memberstack/dom";
import type { Member } from "@memberstack/dom";
import type { MemberstackUser } from "@/types/dashboard";
import {
  mapMemberToHeaderUser,
  PLACEHOLDER_HEADER_USER,
} from "@/lib/profile-memberstack";

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

function toHeaderUser(member: Member | null | undefined): MemberstackUser {
  return member ? mapMemberToHeaderUser(member) : PLACEHOLDER_HEADER_USER;
}

/**
 * Top-right header user from the current Memberstack session.
 * Shows a neutral "Member" placeholder until the live member loads.
 */
export function useMemberstackUser(): MemberstackUser {
  const [user, setUser] = useState<MemberstackUser>(PLACEHOLDER_HEADER_USER);

  useEffect(() => {
    let mounted = true;

    async function loadCurrentMember() {
      try {
        const { data: member } = await getMemberstack().getCurrentMember({
          useCache: false,
        });
        if (mounted) setUser(toHeaderUser(member));
      } catch {
        if (mounted) setUser(PLACEHOLDER_HEADER_USER);
      }
    }

    void loadCurrentMember();

    const { unsubscribe } = getMemberstack().onAuthChange((member) => {
      if (!mounted) return;
      setUser(toHeaderUser(member));
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return user;
}

export async function fetchMemberstackUser(): Promise<MemberstackUser> {
  try {
    const { data: member } = await getMemberstack().getCurrentMember({
      useCache: false,
    });
    return toHeaderUser(member);
  } catch {
    return PLACEHOLDER_HEADER_USER;
  }
}
