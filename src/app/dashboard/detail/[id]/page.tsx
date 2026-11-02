import React from "react";
import { getKunjunganDetail } from "@/lib/actions/kunjungan";
import { getCurrentUser } from "@/lib/actions/auth";
import { notFound } from "next/navigation";
import { DetailKunjunganClient } from "@/components/kunjungan/DetailKunjunganClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetailPage({ params }: Props) {
  const { id } = await params;
  const [res, user] = await Promise.all([
    getKunjunganDetail(id),
    getCurrentUser(),
  ]);

  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto py-2">
      <DetailKunjunganClient
        kunjungan={res.data}
        currentUser={user}
      />
    </div>
  );
}

