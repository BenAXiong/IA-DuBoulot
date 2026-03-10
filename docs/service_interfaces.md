# Service Interfaces

Related: [README](../README.md) | [API route map](api_route_map.md) | [Invitation flows V1](invitation_flows_v1.md) | [Environment matrix](environment_matrix.md) | [Error and audit conventions](error_audit_conventions.md) | [Storage and attachment rules](storage_attachment_rules.md) | [MVP to-do list](mvp_todo.md)

## Purpose

This document defines the first stable service boundaries behind route handlers.

The goal is to keep:

- providers swappable
- route handlers thin
- product logic explicit
- future AI-assisted implementation from collapsing into god services

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
  appendStudentMessage(input: AppendStudentMessageInput): Promise<AppendStudentMessageResult>;
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

## Placement Guidance

Preferred folder direction:

```text
lib/server/auth/
lib/server/billing/
lib/server/conversations/
lib/server/links/
lib/server/memory/
lib/server/moderation/
lib/server/summaries/
lib/server/translations/
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

- extend `ConversationService` from intake persistence into real chat turns and workspace saves
- add upload storage routes/services so attachment references become real `attachments` rows
- start the `A3.4` coaching surface on top of the now-persisted session route
