import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getBidangList } from "@/lib/actions/master";
import { BidangClient } from "@/components/master/BidangClient";

export const dynamic = "force-dynamic";

export default async function BidangPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");

  const bidangList = await getBidangList(false);

  return (
    <div className="max-w-5xl mx-auto py-2">
      <BidangClient initialList={bidangList} />
    </div>
  );
}

