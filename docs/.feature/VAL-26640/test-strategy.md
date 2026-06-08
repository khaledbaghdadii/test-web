# Test Strategy — VAL-26640: [UI/UX][CI] Prepare Setup Step

## Risk-Based Focus
| Area | Risk | Test type(s) | Priority |
|------|------|--------------|----------|
| `subContextId` value | High — wrong value silently shows wrong TPK data | Unit (assert string) | High |
| Widget input config | High — wrong flags show/hide wrong UI elements | Unit (assert all inputs) | High |
| State-updater reload | Medium — stale data after scenario change | Unit (spy + emit) | High |
| Skipped rendering | Low — owned by VAL-26634 stepper | None (VAL-26634 owns) | — |
| Authorization | Low — widget internally handles via directive | Integration / E2E | Low |

## Contract / Integration Boundaries
- `GET /executions/ci-process/:id` — owned by VAL-26634; no new contract for this story.
- `subContextId="PREPARE_BUILD_ENVIRONMENT"` — verified against backend constant; no Pact test needed.

## Manual / Exploratory Needs
- Smoke-test the running / failed / passed states in a dev environment.
- Verify TPK history collapses by default and expands correctly.

## Test Data & Environment Notes
- `insert_build_and_test_read_model.sql` provides `prepare_build_environment_stage` seed data.
- Dev env: use `build-and-test-events.http` to trigger `PREPARE_BUILD_ENVIRONMENT` sub-context events.
