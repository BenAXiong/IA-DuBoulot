# Service Interfaces

Related: [README](../README.md) | [API route map](api_route_map.md) | [Invitation flows V1](invitation_flows_v1.md) | [Oversight surfaces V1](oversight_surfaces_v1.md) | [Privacy controls V1](privacy_controls_v1.md) | [Environment matrix](environment_matrix.md) | [Error and audit conventions](error_audit_conventions.md) | [Storage and attachment rules](storage_attachment_rules.md) | [MVP to-do list](mvp_todo.md)

## Purpose

This document defines the first stable service boundaries behind route handlers.

The goal is to keep:

- providers swappable
- route handlers thin
- product logic explicit
- future AI-assisted implementation from collapsing into god services

Current local status:

- `lib/server/ai/` now contains the first Gemini-backed provider adapter plus prompt modules
- `lib/server/uploads/` now contains the signed-upload, confirm, extraction, and read-access service layer
- `lib/server/moderation/`, `lib/server/summaries/`, and `lib/server/translations/` now exist in code
- `lib/server/oversight/` now contains parent/tutor/admin read services plus tutor-note mutation handling
- `lib/server/privacy/` now owns the `/app/settings` snapshot plus queued deletion request flow
- `scripts/smoke-student-flow.mjs` now verifies the real student route flow against a temporary local `next start` instance
- `scripts/smoke-adult-oversight.mjs` now verifies parent, tutor, and admin oversight routes against the same local server model
- `scripts/smoke-privacy-controls.mjs` now verifies settings rendering, linked-child deletion queueing, tutor-access revocation, and deletion-requested write blocking
- provider-unavailable fallbacks now exist for attachment extraction, coach replies, and the required student summary, while adult summary variants remain best-effort

## Interface Rules

- Interfaces live in server-only code under `lib/server/...`.
- Interface definitions should avoid framework-specific request/response objects.
- Each service owns a narrow responsibility and explicit input/output shape.
- Provider adapters implement interfaces; orchestrators compose them.
- Secrets remain inside provider adapters, never in UI or generic utilities.

## Core Provider Interfaces

### AI Provider

Owns model calls for coaching, extraction, and summary generation.

Primary implementation target: Gemini.
Future fallback target: OpenAI API or another production-ready API provider.

```ts
interface AiProvider {
  generateCoachReply(input: CoachReplyInput): Promise<CoachReplyResult>;
  generateSummary(input: SummaryGenerationInput): Promise<SummaryResult>;
  extractAttachmentText(input: AttachmentExtractionInput): Promise<AttachmentExtractionResult>;
  translateText(input: TranslateTextInput): Promise<TranslateTextResult>;
}
```

Rules:

- do not leak provider SDK types beyond the adapter
- return normalized token/cost/failure metadata
- prompt selection/versioning belongs to prompt config, not route handlers

### Upload Storage Service

Owns storage target reservation and metadata verification.

```ts
interface UploadStorageService {
  createUploadTarget(input: CreateUploadTargetInput): Promise<CreateUploadTargetResult>;
  confirmUpload(input: ConfirmUploadInput): Promise<ConfirmUploadResult>;
  createReadUrl(input: CreateAttachmentReadUrlInput): Promise<CreateAttachmentReadUrlResult>;
  deleteUpload(input: DeleteUploadInput): Promise<void>;
}
```

Rules:

- bucket/path strategy lives here
- MIME, byte-size, and extension rules are enforced here
- signed read URL issuance lives here
- storage cleanup should be callable from deletion flows and failure recovery

### Translation Service

Owns UI-facing translation of summaries or adult surfaces when needed.

```ts
interface TranslationService {
  translateText(input: TranslateTextInput): Promise<TranslateTextResult>;
}
```

Rules:

- translation stays optional and isolated from the coach core
- keep source/target language explicit
- preserve safety and summary metadata outside the translated body

### Moderation Service

Owns safety checks for user input, extracted text, and assistant output.

```ts
interface ModerationService {
  moderateUserInput(input: ModerateTextInput): Promise<ModerationResult>;
  moderateAssistantOutput(input: ModerateTextInput): Promise<ModerationResult>;
  moderateExtraction(input: ModerateTextInput): Promise<ModerationResult>;
}
```

Rules:

- return normalized status: `allowed`, `flagged`, or `blocked`
- include machine-readable reasons for logging
- moderation logging is separate from model invocation logic

### Billing Service

Owns Lemon Squeezy integration and webhook interpretation.

```ts
interface BillingService {
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  createPortalSession(input: CreatePortalSessionInput): Promise<CreatePortalSessionResult>;
  handleWebhook(input: BillingWebhookInput): Promise<BillingWebhookResult>;
}
```

Rules:

- provider event parsing stays inside the billing adapter
- route handlers should not know Lemon Squeezy payload details
- subscription state persistence belongs to a billing orchestration layer around this adapter

### Usage Service

Owns usage counter increments, trial/quota evaluation, and the shared quota snapshot used by student and parent surfaces.

```ts
interface UsageService {
  resolveStudentUsage(input: ResolveStudentUsageInput): Promise<StudentUsageSnapshot>;
  assertStudentActionAllowed(input: AssertStudentActionInput): Promise<StudentUsageSnapshot>;
  recordUsageDelta(input: RecordUsageDeltaInput): Promise<void>;
}
```

Rules:

- usage counters stay server-owned even when RLS would allow read access
- quota evaluation must be shared between dashboard reads and mutation gates so UI and API decisions stay aligned
- provider token usage should be recorded from the same service boundary that already receives normalized provider usage metadata

## Core Orchestration Services

These are application services that compose provider interfaces and repository helpers.

### Account Service

```ts
interface AccountService {
  getCurrentUserContext(input: CurrentUserContextInput): Promise<CurrentUserContext>;
  bootstrapProfile(input: BootstrapProfileInput): Promise<BootstrapProfileResult>;
  updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult>;
}
```

### Conversation Service

```ts
interface ConversationService {
  listVisibleConversations(input: ListConversationsInput): Promise<ListConversationsResult>;
  createConversation(input: CreateConversationInput): Promise<CreateConversationResult>;
  appendConversationMessage(
    input: AppendConversationMessageInput
  ): Promise<AppendConversationMessageResult>;
  saveWorkspace(input: SaveWorkspaceInput): Promise<SaveWorkspaceResult>;
  completeConversation(input: CompleteConversationInput): Promise<CompleteConversationResult>;
}
```

### Summary Service

```ts
interface SummaryService {
  listVisibleSummaries(input: ListSummariesInput): Promise<ListSummariesResult>;
  generateSummaries(input: GenerateSummariesInput): Promise<GenerateSummariesResult>;
}
```

### Link Service

```ts
interface LinkService {
  createParentApprovalRequest(
    input: CreateParentApprovalRequestInput
  ): Promise<CreateParentApprovalRequestResult>;
  createTutorInvitation(
    input: CreateTutorInvitationInput
  ): Promise<CreateTutorInvitationResult>;
  acceptInvitation(input: AcceptInvitationInput): Promise<AcceptInvitationResult>;
  createParentLink(input: CreateParentLinkInput): Promise<CreateParentLinkResult>;
  createTutorLink(input: CreateTutorLinkInput): Promise<CreateTutorLinkResult>;
  updateLinkStatus(input: UpdateLinkStatusInput): Promise<UpdateLinkStatusResult>;
}
```

Rules:

- canonical invitation rows belong to the link domain, not auth metadata
- raw invitation tokens must never be persisted outside transient request handling
- parent approval and tutor acceptance must stay server-side because they touch multiple tables plus audit state

### Memory Service

```ts
interface MemoryService {
  getVisibleMemory(input: GetVisibleMemoryInput): Promise<GetVisibleMemoryResult>;
  applyMemoryUpdate(input: ApplyMemoryUpdateInput): Promise<ApplyMemoryUpdateResult>;
}
```

### Privacy Service

```ts
interface PrivacyService {
  loadSettingsSnapshot(input: LoadPrivacySettingsInput): Promise<PrivacySettingsSnapshot>;
  requestDeletion(input: RequestPrivacyDeletionInput): Promise<PrivacyDeletionRequestResult>;
}
```

Rules:

- the request path should queue and freeze deletion, not silently hard-delete inside a route handler
- linked-child deletion must explicitly revalidate the active parent link server-side
- auth metadata sync and access revocation should happen in the same service boundary as the queued request
- retention timing and any billing/security carve-outs must stay explicit in the returned snapshot and product copy

### Audit Service

```ts
interface AuditService {
  recordEvent(input: RecordAuditEventInput): Promise<void>;
}
```

Rules:

- audit writes should be explicit, not hidden in generic helpers
- event names and metadata should follow `error_audit_conventions.md`
- do not use the audit service as a dumping ground for general debug logs

### Oversight Services

These services keep parent/tutor/admin review logic out of route handlers and dashboard components.

```ts
interface ParentOversightService {
  loadDashboardSnapshot(input: ParentOversightInput): Promise<ParentDashboardSnapshot>;
  loadStudentDetail(input: ParentStudentDetailInput): Promise<ParentStudentDetail>;
  loadConversationReview(input: ParentConversationReviewInput): Promise<ParentConversationReview>;
}

interface TutorOversightService {
  loadDashboardSnapshot(input: TutorOversightInput): Promise<TutorDashboardSnapshot>;
  loadStudentDetail(input: TutorStudentDetailInput): Promise<TutorStudentDetail>;
  loadConversationReview(input: TutorConversationReviewInput): Promise<TutorConversationReview>;
}

interface TutorNoteService {
  createNote(input: CreateTutorNoteInput): Promise<TutorNoteRecord>;
  updateNote(input: UpdateTutorNoteInput): Promise<TutorNoteRecord>;
  deleteNote(input: DeleteTutorNoteInput): Promise<void>;
}

interface AdminAuditReviewService {
  loadAccessAudit(input: AdminAuditReviewInput): Promise<AdminAccessAuditSnapshot>;
}
```

Rules:

- parent/tutor reads must explicitly revalidate linked-student access even though RLS already exists
- tutor notes stay behind canonical mutation routes so writes are auditable and reviewable
- admin audit review stays narrow to sensitive access events instead of becoming a generic reporting service

## Placement Guidance

Preferred folder direction:

```text
lib/server/auth/
lib/server/billing/
lib/server/conversations/
lib/server/links/
lib/server/memory/
lib/server/moderation/
lib/server/oversight/
lib/server/privacy/
lib/server/summaries/
lib/server/translations/
lib/server/usage/
lib/server/uploads/
```

Inside each domain:

- `types.ts` for request/result DTOs
- `service.ts` for orchestration
- `provider.ts` or `adapter.ts` for external integration
- `repository.ts` only when database access becomes large enough to justify extraction

## Anti-Patterns To Reject

- one giant `lib/services.ts`
- route handlers constructing provider prompts inline
- provider SDK calls from React components
- billing webhook parsing mixed into generic utilities
- moderation checks buried inside chat UI code
- translation logic mixed into summary rendering components

## Immediate Next Implementations

- implement `A6.1` memory profile behavior with explicit sensitive-profiling filters and user-facing edit/delete controls
- operationalize queued deletion execution so the current 30-day target is backed by a real purge worker or operator workflow before external beta
- improve provider reliability or add a second provider path so the student flow uses the fallbacks less often
- tighten upload guardrails to match the documented per-file limits and capture any missing metadata fields such as image dimensions and PDF page counts
- broaden the admin audit surface only when moderation/support workflows justify it
