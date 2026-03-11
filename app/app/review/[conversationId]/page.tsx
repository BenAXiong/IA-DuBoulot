import { redirect } from "next/navigation";
import { AdultConversationReview } from "@/components/dashboard/oversight/adult-conversation-review";
import { BillingStatusCard } from "@/components/dashboard/oversight/billing-status-card";
import { SummaryLanguagePanel } from "@/components/dashboard/oversight/summary-language-panel";
import { TutorNotesPanel } from "@/components/dashboard/oversight/tutor-notes-panel";
import { TutorSummaryPanel } from "@/components/dashboard/oversight/tutor-summary-panel";
import {
  redirectDeletionRequestedAppUser,
  requireAppPageContext,
} from "@/lib/server/auth/page-guards";
import { loadParentConversationReview } from "@/lib/server/oversight/parent-service";
import { loadTutorConversationReview } from "@/lib/server/oversight/tutor-service";

type Params = Promise<{ conversationId: string }> | { conversationId: string };

export default async function OversightConversationReviewPage({
  params,
}: {
  params: Params;
}) {
  const { appUser } = await requireAppPageContext();
  redirectDeletionRequestedAppUser(appUser);
  const resolvedParams = await params;

  if (appUser.role === "parent") {
    const review = await loadParentConversationReview({
      appUser,
      conversationId: resolvedParams.conversationId,
    });

    return (
      <AdultConversationReview
        audienceLabel="Vue parent"
        detail={review.detail}
        languageCode={appUser.preferred_ui_language}
        secondaryPanel={
          <BillingStatusCard
            billing={review.billing}
            languageCode={appUser.preferred_ui_language}
          />
        }
        studentName={review.student.displayName}
        summaryPanel={
          <SummaryLanguagePanel
            preferredLanguage={appUser.preferred_ui_language}
            variants={review.summaryVariants}
          />
        }
      />
    );
  }

  if (appUser.role === "tutor") {
    const review = await loadTutorConversationReview({
      appUser,
      conversationId: resolvedParams.conversationId,
    });

    return (
      <AdultConversationReview
        audienceLabel="Vue tuteur"
        detail={review.detail}
        languageCode={appUser.preferred_ui_language}
        secondaryPanel={
          <TutorNotesPanel
            body="Ajoute ici les notes privees liees a cette seance. Elles restent invisibles a l'eleve et au parent."
            conversationId={review.detail.conversation.id}
            initialNotes={review.notes}
            studentUserId={review.student.id}
            title="Notes privees de seance"
          />
        }
        studentName={review.student.displayName}
        summaryPanel={<TutorSummaryPanel summaries={review.detail.summaries} />}
      />
    );
  }

  redirect("/app");
}
