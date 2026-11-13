"use client";

import dynamic from "next/dynamic";

// Client-only: settings live in this browser's storage, so there's nothing to
// render on the server.
const Trainer = dynamic(() => import("@/components/trainer").then(m => m.Trainer), { ssr: false });

export default function Page() {
  return <Trainer />;
}
