import { redirect } from "next/navigation";
import { AdminAccessAuditList } from "@/components/dashboard/oversight/admin-access-audit-list";
import { requireAppPageContext } from "@/lib/server/auth/page-guards";
import { loadAdminAccessAuditSnapshot } from "@/lib/server/oversight/admin-service";

export default async function AdminAuditPage() {
  const { appUser } = await requireAppPageContext();

  if (appUser.role !== "admin") {
    redirect("/app");
  }

  const snapshot = await loadAdminAccessAuditSnapshot(appUser);

  return (
    <AdminAccessAuditList
      events={snapshot.events}
      languageCode={appUser.preferred_ui_language}
    />
  );
}
