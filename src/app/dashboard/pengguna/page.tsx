import React from "react";
import { getUserList } from "@/lib/actions/master";
import { PenggunaClient } from "@/components/master/PenggunaClient";

export const dynamic = "force-dynamic";

export default async function PenggunaPage() {
  const users = await getUserList();

  return (
    <div className="max-w-5xl mx-auto py-2">
      <PenggunaClient initialUsers={users} />
    </div>
  );
}

