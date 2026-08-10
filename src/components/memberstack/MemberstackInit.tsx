"use client";

import { useEffect } from "react";
import { getMemberstack } from "@/lib/memberstack";

/** Ensures the Memberstack DOM client is initialized once on the client. */
export default function MemberstackInit() {
  useEffect(() => {
    getMemberstack();
  }, []);

  return null;
}
