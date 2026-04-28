# Sample Attachment Corpus

Related: [README](../README.md) | [Storage and attachment rules](storage_attachment_rules.md) | [RLS fixture verification](rls_fixture_verification.md) | [MVP to-do list](mvp_todo.md) | [Decision log](decision_log.md)

## Purpose

This document defines the source-controlled homework attachment corpus used for upload, extraction, and demo work.

The goal is to keep sample files explicit, reviewable, and reusable across future sessions instead of recreating ad hoc example inputs each time.

## Location

Canonical corpus root:

`fixtures/homework-samples/`

Contents:

- `attachments/` for the original sample files
- `extracted/` for the expected extracted-text baselines
- `manifest.json` for metadata, scenario notes, and file pairing
- `manifest.json.retrieval_fixtures` for extracted-text-only retrieval checks that do not require storing a binary attachment

## Current Samples

| Sample key | Attachment | Extracted text | Modality | Subject | Notes |
| --- | --- | --- | --- | --- | --- |
| `fractions_pdf_fr` | `fixtures/homework-samples/attachments/fractions-partage.pdf` | `fixtures/homework-samples/extracted/fractions-partage.txt` | typed PDF | `mathematiques` | clean worksheet with a student note |
| `geometry_screenshot_fr` | `fixtures/homework-samples/attachments/geometrie-capture.png` | `fixtures/homework-samples/extracted/geometrie-capture.txt` | screenshot image | `mathematiques` | tablet-style capture with student draft text |

## Current Retrieval Fixtures

| Fixture key | Extracted text | Subject | Check |
| --- | --- | --- | --- |
| `late_page_marker_circuit_fr` | `fixtures/homework-samples/extracted/late-page-marker-circuit.txt` | `physique-chimie` | `npm run verify:subject-resource-retrieval` verifies that a `court-circuit` query ranks page 6 or later above front-loaded content |

## Rules

- keep all sample content fictional and safe for demos
- every attachment file must have a paired extracted-text baseline
- every sample must be declared in `manifest.json`
- extracted-text-only retrieval fixtures must be declared under `retrieval_fixtures` and must not contain real student work
- prefer French-first schoolwork samples until the student core flow is stable
- do not store real student work in this folder
- if a sample is replaced, update both the manifest and this document in the same session

## Intended Uses

- local upload-flow development
- extraction and OCR normalization tests
- subject-resource retrieval regression checks
- demo-safe seeded content references
- smoke checks before beta or external demos

## Scope Notes

- this corpus satisfies `A1.4.2`
- future extraction work in `A4.3` should use these files before adding new ad hoc samples
- if the corpus grows, split it by modality or subject but keep one manifest as the entry point
