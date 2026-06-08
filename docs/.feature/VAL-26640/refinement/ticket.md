# Jira Ticket — VAL-26640

> Raw Jira data captured for traceability.

- **Key:** VAL-26640
- **Summary:** [UI/UX][CI] Prepare Setup Step
- **Type:** Epic
- **Status:** Backlog
- **Assignee:** MOUZAYA Myriam
- **Reporter:** MOUZAYA Myriam
- **Components:** ATLANTIS

## Description

### In Scope

In this step, we are deploying the build environment. Technically, we are launching a TPK so we will
use the same component used in the convert binary step in the upgrade process.

Support all three states:
- Running
- Failed — Show the termination message + they can repush
- Passed — the process jumps automatically to the next step (Build & Test)

By default, collapse the component.

This step might be skipped from the BP definition/execution inputs. So we just skip it and jump
directly to the Build & Test step.

Attachment: `image-2026-05-25-16-34-00-668.png` (mxjira attachment 1753189).
