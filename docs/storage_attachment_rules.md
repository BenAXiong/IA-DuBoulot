# Storage And Attachment Rules

Related: [README](../README.md) | [API route map](api_route_map.md) | [Service interfaces](service_interfaces.md) | [Supabase schema V1](supabase_schema_v1.md) | [Supabase project setup](supabase_project_setup.md) | [MVP to-do list](mvp_todo.md)

## Purpose

This document defines the canonical storage model for uploaded homework files and related derived artifacts.

It exists so future upload work does not scatter bucket names, file limits, or metadata semantics across route handlers and UI code.

## Core Rules

- All student-related files stay in private Supabase buckets.
- Bucket names are source-controlled constants, not environment variables.
- `public.attachments.storage_bucket` and `public.attachments.storage_path` are the canonical references to the original uploaded file.
- Original filenames should never shape bucket paths.
- Browser clients should never receive unrestricted public URLs for student files.
- Read access should use short-lived signed URLs or server streaming after authorization.

## Bucket Plan

| Bucket | Public | Purpose | Canonical in `attachments` table | Notes |
| --- | --- | --- | --- | --- |
| `homework-attachments` | no | original uploaded student files | yes | only bucket expected in `public.attachments` for MVP |
| `processing-artifacts` | no | temporary server-side derivatives such as previews or conversion outputs | no | optional internal bucket, cleanup-oriented |

## Path Conventions

Canonical original upload path:

```text
student/{studentUserId}/conversation/{conversationId}/attachment/{attachmentId}/source.{ext}
```

Temporary processing artifact path:

```text
attachment/{attachmentId}/{artifactKind}.{ext}
```

Rules:

- use stable IDs, not display names
- do not include original filenames in paths
- do not include parent or tutor identifiers in paths
- extension should match the normalized stored file type

## Allowed Attachment Types For MVP

| Attachment kind | Allowed MIME types | Max size | Extra rule |
| --- | --- | --- | --- |
| `image` | `image/jpeg`, `image/png`, `image/webp`, `image/heic` | `10 MB` | image dimensions should be captured in metadata when available |
| `screenshot` | `image/jpeg`, `image/png`, `image/webp` | `10 MB` | handled like image with different semantic source |
| `pdf` | `application/pdf` | `20 MB` | soft page limit `40` pages |
| `document` | none in MVP UI | n/a | reserved in schema but not enabled in the first upload flow |

Conversation-level guardrails:

- max `5` attachments per conversation in MVP
- soft total upload budget `50 MB` per conversation

## Read And Write Access Rules

- Uploads should be created through a server route that returns a signed upload target.
- The server should create the `attachmentId` before the actual upload so the path stays deterministic.
- File confirmation should happen through a second server route after upload completion.
- Attachment preview or download should go through a server route that checks authorization and returns a short-lived signed read URL.
- Signed read URLs should have a short TTL, target `5` minutes by default.

## Attachment Metadata Contract

The `attachments.metadata` JSON field should stay machine-readable and compact.

Recommended canonical keys:

| Key | Type | Required | Meaning |
| --- | --- | --- | --- |
| `upload_source` | string | yes | `file_picker`, `camera`, `paste`, or `drag_drop` |
| `client_extension` | string | yes | extension observed from the client before normalization |
| `sha256` | string | yes | content hash for dedupe and support debugging |
| `image_width` | number | no | normalized width for image inputs |
| `image_height` | number | no | normalized height for image inputs |
| `pdf_page_count` | number | no | populated for PDFs |
| `extraction_engine` | string | no | OCR or extraction pipeline identifier |
| `extraction_version` | string | no | extraction pipeline version |
| `ocr_confidence` | number | no | optional normalized confidence score |
| `detected_language` | string | no | source language guess when available |
| `preview_generated` | boolean | no | whether a preview artifact exists |

Rules:

- keep raw extracted text in `attachments.raw_extracted_text`, not in `metadata`
- keep security or moderation decisions out of `metadata`
- prefer stable lowercase snake_case keys
- add new keys in docs before relying on them in code

## Lifecycle Rules

1. Server creates attachment shell and storage target.
2. Client uploads to the signed target.
3. Server confirms upload, writes canonical attachment metadata, and attaches it to the conversation.
4. Extraction runs later and updates `extraction_status`, `raw_extracted_text`, and extraction-related metadata keys.

Cleanup rules:

- orphaned unconfirmed uploads should be deleted within `24` hours
- deleting an attachment should remove the storage object and the row in the same workflow or queued cleanup path
- account deletion should purge both original uploads and processing artifacts
- `processing-artifacts` objects should be treated as disposable and cleaned aggressively

## Supabase Bucket Settings

For `homework-attachments`:

- private bucket
- MIME restrictions should match the MVP allowlist
- file-size limit should match the route guardrails

For `processing-artifacts`:

- private bucket
- no direct browser listing or browsing
- short retention via cleanup job or admin script

## Relationship To Routes And Services

Expected route additions or clarifications:

- `POST /api/uploads/create`
- `POST /api/uploads/confirm`
- `POST /api/uploads/extract`
- `GET /api/attachments/[attachmentId]/access`

Expected service behavior:

- `UploadStorageService` owns signed upload and signed read URL creation
- conversation services should reference attachments by ID, not raw bucket/path strings
- bucket names should live in a storage constants module later, not repeated inline
