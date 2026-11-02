import React from "react";
import { QrDisplayClient } from "@/components/qr/QrDisplayClient";

export const dynamic = "force-dynamic";

export default function QrPage() {
  return (
    <div className="max-w-4xl mx-auto py-2">
      <QrDisplayClient />
    </div>
  );
}

