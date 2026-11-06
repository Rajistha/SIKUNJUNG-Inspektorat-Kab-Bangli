import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getInstansiList } from "@/lib/actions/master";
import { InstansiClient } from "@/components/master/InstansiClient";

export const dynamic = "force-dynamic";

export default async function InstansiPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");

  const instansiList = await getInstansiList(false);

  return (
    <div className="max-w-5xl mx-auto py-2">
      <InstansiClient initialList={instansiList} />
    </div>
  );
}

