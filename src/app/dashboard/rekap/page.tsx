import React from "react";
import { getInstansiList } from "@/lib/actions/master";
import { RekapClient } from "@/components/rekap/RekapClient";

export const dynamic = "force-dynamic";

export default async function RekapPage() {
  const instansiList = await getInstansiList(false);

  return (
    <div className="max-w-7xl mx-auto py-2">
      <RekapClient instansiList={instansiList} />
    </div>
  );
}

