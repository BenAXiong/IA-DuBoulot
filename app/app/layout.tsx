import { AppShell } from "@/components/layout/app-shell";
import { requireAppPageContext } from "@/lib/server/auth/page-guards";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { context, appUser } = await requireAppPageContext();

  return (
    <AppShell appUser={appUser} context={context}>
      {children}
    </AppShell>
  );
}
