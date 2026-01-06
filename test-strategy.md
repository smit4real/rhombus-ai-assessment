# Rhombus AI – Test Strategy

Author: <Smit khatri>  
Role: Software Engineer – Test  
System Under Test: Rhombus AI

---

## 1. Top Regression Risks

### 1.1 Data Ingestion (File Upload & Parsing)

**Why high impact**  
If file upload or parsing breaks, users cannot even start a pipeline. Any silent issues (missing columns, wrong delimiter, wrong encoding) poison everything downstream.

**Why likely to regress**  
- Support for more file formats and messy real-world CSVs.
- Changes to parsing libraries, type detection and validation.
- Edge cases (large files, special characters, quoted delimiters).

**Best test layers**  
- API tests for upload endpoint (status codes, error responses).
- Data validation comparing raw input vs parsed structure.
- One UI E2E flow to ensure upload works from the user’s point of view.

---

### 1.2 Pipeline Orchestration and Status

**Why high impact**  
If pipelines get stuck, never finish, or say “success” but haven’t actually processed data correctly, users lose trust and can’t complete their work.

**Why likely to regress**  
- Asynchronous job handling, queues and workers.
- Timeouts and retry logic when system load changes.
- UI polling logic for status and progress.

**Best test layers**  
- API tests: create pipeline, poll status, assert valid state transitions.
- UI E2E: one key flow from “create pipeline” → “completed” with visible result.
- Data validation to confirm “completed” really means correct output.

---

### 1.3 AI-Assisted Transformations Becoming Unstable

**Why high impact**  
Rhombus uses AI to clean and transform data. If AI behavior changes unexpectedly, users get inconsistent or wrong data even if the pipeline technically “succeeds.”

**Why likely to regress**  
- Model upgrades or provider changes.
- Changes to prompts or system instructions.
- New features that adjust how AI interprets the data.

**Best test layers**  
- Data validation on known input + fixed prompts (golden test cases).
- API tests checking response structure and required fields.
- UI E2E covering one representative AI pipeline with a deterministic prompt.

---

### 1.4 Downloaded Data Incorrect or Corrupted

**Why high impact**  
Exports are often consumed by other tools (Excel, BI, warehouses). If downloads are malformed, misaligned with the UI, or missing data, downstream systems break.

**Why likely to regress**  
- Changes to export pipeline or CSV/Excel generation.
- New columns not wired into export.
- Encoding and delimiter changes for “internationalization” and large files.

**Best test layers**  
- API tests on download endpoints (status, headers, content type).
- Data validation comparing output CSV schema and row counts to expectations.
- UI E2E to make sure the user can actually click “Download” and get a file.

---

### 1.5 Schema Drift and Backwards Compatibility

**Why high impact**  
Existing saved pipelines and external integrations rely on stable schema (column names, types, ordering). Unexpected schema drift silently breaks downstream logic.

**Why likely to regress**  
- Adding or renaming columns.
- Changes in type inference (e.g., dates vs strings).
- New features that enrich or reshape data.

**Best test layers**  
- Data validation comparing current outputs to versioned baseline “golden” files.
- API tests asserting contract-like properties (required keys and types).
- Targeted UI checks to ensure old pipelines still run and show expected columns.

---

## 2. Automation Prioritization

### 2.1 What I Automate First

1. **Core AI pipeline happy path (UI E2E)**  
   Sign in → upload messy CSV → configure AI cleaning prompt → run pipeline → preview → download.  
   This is the main value path and deserves a stable, high-quality end-to-end test.

2. **Core API flows for upload, pipeline status and download**  
   - Upload dataset via API.
   - Create pipeline and poll for status until completed/failed.
   - Hit download endpoint and verify basic CSV properties.
   These give fast, reliable feedback without UI flakiness.

3. **Data validation against a canonical messy dataset**  
   - Use a realistic CSV (e.g., FIFA-style dataset).
   - Run a fixed prompt.
   - Validate schema, row counts and basic invariants via script.
   This becomes a strong regression guard for future changes.

### 2.2 What I Don’t Automate Yet (On Purpose)

1. **Open-ended AI text (summaries, insights, explanations)**  
   Hard to assert deterministically. I would start with manual exploratory testing and later add structure-based checks if needed.

2. **Full visual/UI layout and styling**  
   CSS and design change often, while the regression signal is low. Only minimal visual assertions are useful at this stage.

3. **All combinations of transformations and corner cases**  
   The cartesian explosion of options is huge. I start with a small number of representative flows, then expand if we see recurring issues.

---

## 3. Test Layering Strategy

### 3.1 UI End-to-End Tests

**Purpose**  
Cover a few critical, high-value user journeys across frontend, backend, AI, and storage in one shot.

**Catch**  
- Wiring issues between UI and backend.
- Broken flows (buttons, navigation, missing steps).
- Session problems that are only visible in the UI.

**Examples**  
- AI pipeline flow: login → upload → AI prompt → run → preview → download.
- Manual transformation flow (if implemented).

---

### 3.2 API / Network-Level Tests

**Purpose**  
Validate backend behavior, contracts and error handling more quickly and reliably than UI tests.

**Catch**  
- Wrong status codes or missing validation.
- Broken contract: missing/renamed fields, type mismatches.
- Pipeline lifecycle problems (stuck in running, no failure state).

**Examples**  
- Auth/login returns proper token or session info.
- Dataset upload accepts valid CSV and rejects invalid input.
- Pipeline creation and status polling.
- Download returns a valid CSV with expected headers.

---

### 3.3 Data Validation and Correctness

**Purpose**  
Answer “Is the transformed data actually correct and stable?” rather than “Did the pipeline run?”

**Catch**  
-Wrong or missing columns.  
- Unexpected row loss or duplication.  
- Incorrect types (numbers as strings, broken dates).  
- Regressions in AI or transformation logic that don’t show up as errors.

**Examples**  
- Script that compares input vs transformed output.
- Checks for expected columns and row count tolerances.
- Comparison to versioned golden outputs for deterministic prompts.

---

## 4. Regression Strategy Over Time

### 4.1 On Every Pull Request

**Goals**: Fast feedback, low flakiness.

- Unit / service tests (in main codebase, if available).
- API tests tagged as `smoke`:
  - Basic auth.
  - Small CSV upload returning 2xx and valid JSON structure.
- A very small UI smoke test:
  - Login and basic navigation to main workspace.

**Blocking**  
Any `smoke` failure blocks the merge.

---

### 4.2 Nightly

**Goals**: Wider coverage and detection of cross-service regressions.

- Full API suite (happy path + negative cases).
- Full stable UI E2E suite (AI pipeline, manual transform).
- Data validation scripts run on canonical datasets.

**Blocking**  
Nightly failures don’t block merges directly, but:
- They create high-priority bugs.
- Repeatedly flaky tests are quarantined or refactored.

---

### 4.3 Pre-Release

**Goals**: High confidence for release.

- Run all tests tagged `release-blocker`:
  - Critical UI journeys.
  - Core API flows.
  - Data validation checks.

**Blocking**  
Any `release-blocker` test failure blocks the release until fixed or explicitly waived.

---

## 5. Testing AI-Driven Behavior

### 5.1 What I Assert

- **Structure and schema**, not exact text:
  - Required columns exist.
  - Types are consistent (numeric vs string).
  - No extra unexpected columns.
- **Row count rules**:
  - Output row count matches input, or differs in a controlled way (e.g., duplicates removed within a small tolerance).
- **Deterministic behavior** for testing inputs:
  - Fixed prompts, fixed datasets, and golden outputs for regression.

### 5.2 What I Avoid Asserting

- Exact wording of AI-generated text.
- Ordering of free-form sentences.
- Detailed internal model behavior.

Instead, I assert:
- Presence of key concepts or fields.
- JSON/CSV structure, shapes and counts.

### 5.3 Keeping Things Deterministic

- Use a specific “test prompt” that asks the AI to behave deterministically (no creativity, no randomness).
- Use a stable, versioned test dataset.
- Generate and version a baseline (“golden”) output for that dataset + prompt.
- When the model or prompt is updated deliberately:
  - Regenerate the golden file.
  - Review the diff like a code change.

---

## 6. Flaky Test Analysis

### 6.1 Common Causes of Flakiness in This System

- Async pipelines taking variable amounts of time.
- UI timing issues (elements not ready when asserted).
- Fragile selectors tied to dynamic IDs or text.
- AI outputs with small non-deterministic differences.
- Tests depending on data created by previous runs.

### 6.2 How I Detect Flakiness

- Track test history, not just the last run.
- Automatically rerun failing tests once:
  - If they pass on retry, flag as “suspected flaky”.
- Record metrics:
  - Failure rate per test.
  - Run-time spikes (often correlate with timeouts).

### 6.3 How I Reduce / Quarantine / Eliminate Flaky Tests

- **Reduce flakiness**  
  - Replace arbitrary sleeps with explicit waits (for status, locators, network idle).
  - Use stable selectors (`data-testid`, roles) instead of brittle ones.
  - Use deterministic prompts and test data for AI flows.

- **Quarantine flaky tests**  
  - Tag with something like `@flaky`.
  - Exclude from PR and release pipelines.
  - Still run them nightly in non-blocking mode until fixed.

- **Eliminate root causes**  
  - Improve test design where the test itself is the problem.
  - Collaborate with developers when product behavior is inherently non-deterministic and needs a “test mode” or better instrumentation.

---
