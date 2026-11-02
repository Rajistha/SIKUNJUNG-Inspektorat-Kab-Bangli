import React from "react";
import { getKunjunganDetail } from "@/lib/actions/kunjungan";
import { notFound } from "next/navigation";
import { FotoCaptureClient } from "@/components/kunjungan/FotoCaptureClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FotoPage({ params }: Props) {
  const { id } = await params;
  const res = await getKunjunganDetail(id);

  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-2">
      <FotoCaptureClient kunjungan={res.data} />
    </div>
  );
}

