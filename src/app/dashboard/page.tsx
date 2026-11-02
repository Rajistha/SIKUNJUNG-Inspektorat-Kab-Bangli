import React from "react";
import { getKunjunganHariIni } from "@/lib/actions/kunjungan";
import { getInstansiList } from "@/lib/actions/master";
import { getCurrentUser } from "@/lib/actions/auth";
import { TamuTableClient } from "@/components/dashboard/TamuTableClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [kunjunganRes, instansiList, user] = await Promise.all([
    getKunjunganHariIni(),
    getInstansiList(false),
    getCurrentUser(),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <TamuTableClient
        initialKunjungan={kunjunganRes.data || []}
        instansiList={instansiList}
        userName={user?.nama || "Petugas"}
      />
    </div>
  );
}

