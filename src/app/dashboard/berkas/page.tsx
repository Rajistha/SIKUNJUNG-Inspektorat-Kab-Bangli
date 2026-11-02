import React from "react";
import { getDaftarBerkas } from "@/lib/actions/berkas";
import { getCurrentUser } from "@/lib/actions/auth";
import { BerkasClient } from "@/components/admin/BerkasClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BerkasPage() {
  const user = await getCurrentUser();

  // Hanya admin yang dapat mengakses arsip berkas penyimpanan
  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  const { folders, files, totalSize, maxSizeBytes } = await getDaftarBerkas();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <BerkasClient
        initialFolders={folders}
        initialFiles={files}
        totalBytes={totalSize}
        maxBytes={maxSizeBytes}
      />
    </div>
  );
}
