import React from "react";
import { getCurrentUser } from "@/lib/actions/auth";
import { getInstansiList, getBidangList } from "@/lib/actions/master";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export const dynamic = "force-dynamic";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, instansiList, bidangList] = await Promise.all([
    getCurrentUser(),
    getInstansiList(false),
    getBidangList(false),
  ]);

  return (
    <DashboardLayout
      user={user}
      instansiList={instansiList}
      bidangList={bidangList}
    >
      {children}
    </DashboardLayout>
  );
}

