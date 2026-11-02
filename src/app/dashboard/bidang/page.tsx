import React from "react";
import { getBidangList } from "@/lib/actions/master";
import { BidangClient } from "@/components/master/BidangClient";

export const dynamic = "force-dynamic";

export default async function BidangPage() {
  const bidangList = await getBidangList(false);

  return (
    <div className="max-w-5xl mx-auto py-2">
      <BidangClient initialList={bidangList} />
    </div>
  );
}

