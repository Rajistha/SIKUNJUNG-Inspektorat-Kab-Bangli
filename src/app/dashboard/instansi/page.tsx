import React from "react";
import { getInstansiList } from "@/lib/actions/master";
import { InstansiClient } from "@/components/master/InstansiClient";

export const dynamic = "force-dynamic";

export default async function InstansiPage() {
  const instansiList = await getInstansiList(false);

  return (
    <div className="max-w-5xl mx-auto py-2">
      <InstansiClient initialList={instansiList} />
    </div>
  );
}

