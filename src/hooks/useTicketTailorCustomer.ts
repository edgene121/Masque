"use client";

import { useEffect, useState } from "react";
import { getMemberstack } from "@/lib/memberstack";
import {
  toTicketTailorCustomer,
  type TicketTailorCustomer,
} from "@/lib/tickets/ticket-tailor-customer";

export function useTicketTailorCustomer(): TicketTailorCustomer | null {
  const [customer, setCustomer] = useState<TicketTailorCustomer | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await getMemberstack().getCurrentMember();
        if (cancelled) return;
        setCustomer(toTicketTailorCustomer(data));
      } catch {
        if (!cancelled) {
          setCustomer(null);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return customer;
}
