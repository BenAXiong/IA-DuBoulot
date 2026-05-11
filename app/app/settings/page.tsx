import { PrivacySettingsView } from "@/components/dashboard/settings/privacy-settings-view";
import { requireAppPageContext } from "@/lib/server/auth/page-guards";
import { loadPrivacySettingsSnapshot } from "@/lib/server/privacy/service";

export default async function AppSettingsPage() {
  const { appUser, context } = await requireAppPageContext();
  const snapshot = await loadPrivacySettingsSnapshot(appUser);

  return (
    <PrivacySettingsView
      appUser={appUser}
      email={context.email}
      snapshot={snapshot}
    />
  );
}
