import { redirect } from "next/navigation";
import { AdultConversationReview } from "@/components/dashboard/oversight/adult-conversation-review";
import { BillingStatusCard } from "@/components/dashboard/oversight/billing-status-card";
import { SummaryLanguagePanel } from "@/components/dashboard/oversight/summary-language-panel";
import { TutorNotesPanel } from "@/components/dashboard/oversight/tutor-notes-panel";
import { TutorSummaryPanel } from "@/components/dashboard/oversight/tutor-summary-panel";
import {
  getAdultConversationAudienceLabel,
  getTutorStudentDetailCopy,
} from "@/lib/i18n/oversight-copy";
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
        audienceLabel={getAdultConversationAudienceLabel(
          "parent",
          appUser.preferred_ui_language,
        )}
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
    const tutorCopy = getTutorStudentDetailCopy(appUser.preferred_ui_language);

    return (
      <AdultConversationReview
        audienceLabel={getAdultConversationAudienceLabel(
          "tutor",
          appUser.preferred_ui_language,
        )}
        detail={review.detail}
        languageCode={appUser.preferred_ui_language}
        secondaryPanel={
          <TutorNotesPanel
            body={tutorCopy.notesBody}
            conversationId={review.detail.conversation.id}
            initialNotes={review.notes}
            languageCode={appUser.preferred_ui_language}
            studentUserId={review.student.id}
            title={tutorCopy.notesTitle}
          />
        }
        studentName={review.student.displayName}
        summaryPanel={
          <TutorSummaryPanel
            languageCode={appUser.preferred_ui_language}
            summaries={review.detail.summaries}
          />
        }
      />
    );
  }

  redirect("/app");
}
