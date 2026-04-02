import { ParentActivityHub } from "@/components/dashboard/parent/parent-activity-hub";
import { ParentAccountDock } from "@/components/dashboard/parent/parent-account-dock";
import {
  buildParentDashboardAccountModel,
  buildParentDashboardViewModel,
} from "@/components/dashboard/parent/parent-dashboard-presenters";
import { ParentLearnersRail } from "@/components/dashboard/parent/parent-learners-rail";
import { ParentPendingApprovalsPanel } from "@/components/dashboard/parent/parent-pending-approvals-panel";
import type { AppUserRecord, UiLanguageCode } from "@/lib/server/auth/types";
import type { ParentDashboardSnapshot } from "@/lib/server/oversight/types";

type ParentDashboardProps = {
  appUser: AppUserRecord;
  email: string | null;
  snapshot: ParentDashboardSnapshot;
  languageCode: UiLanguageCode;
};

export function ParentDashboard({
  appUser,
  email,
  snapshot,
  languageCode,
}: ParentDashboardProps) {
  const model = buildParentDashboardViewModel(snapshot, languageCode);
  const account = buildParentDashboardAccountModel({
    appUser,
    email,
    languageCode,
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[21rem_minmax(0,1fr)]">
      <aside className="grid gap-6 self-start xl:sticky xl:top-6">
        <ParentAccountDock
          account={account}
          billing={snapshot.billing}
          languageCode={languageCode}
        />
        <ParentPendingApprovalsPanel
          approvals={model.pendingApprovals}
          languageCode={languageCode}
        />
        <ParentLearnersRail
          languageCode={languageCode}
          learners={model.learners}
        />
      </aside>

      <ParentActivityHub
        languageCode={languageCode}
        model={model}
      />
    </div>
  );
}
