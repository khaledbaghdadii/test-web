# VAL-27132 — Activities Landing Pages (Functional Overview)

## What we're building
Three new **Activity Landing Pages**, each on its own navigation tab. The three tabs sit together at the
front of the header, before "Business Processes", in this order:

1. **Build & Test Activity**
2. **Validation Activity**
3. **Upgrade Activity**

Each page is the new home for that activity's runs and for starting new ones. This replaces the need to
hunt through the generic "Available Processes" and "Executions" pages for a single activity.

> Naming note: the new UI uses friendlier vocabulary — **Process Template** (was BP Definition),
> **Process Run** (was Business Process Execution), **Process Family** / **Process Sub Family** for the
> grouping levels.

## What each page shows
- **Active Runs** — runs currently *running*, *pending input* or *aborting*.
- **Show History** — a button reveals all other runs (completed, failed, aborted, expired, …).
- The **same columns, filters, sorting and pagination** users have today (nothing is lost; default page
  size 5 for active, 10 for history).
- A **My Builds** toggle to show only your own runs.
- Per-row actions: **Abort** a run and **Repush** it, in a column that stays visible while scrolling. The
  actions column appears on **both** tables; on the History table Abort is shown disabled (those runs have
  already finished).

## Starting a new run
A **Build** button opens a single dialog with two steps (with a back button, never a pop-up on a pop-up):

1. **Choose a template** — the available Process Templates for that activity, with a **Sub-Family**
   dropdown to narrow the list, and a **Run** button per template. The Sub-Family options are read
   straight from the templates' own data (each template's readable name), so they always match what's
   configured — for all three activities.
2. **Enter the run inputs** — the form for the chosen template, showing only the fields that still need a
   value; an **expand arrow** beside the template name reveals the values already pre-filled on the
   template. A **Build** button launches the run.

## What ships (in order)
| Increment | What the user gets |
|-----------|--------------------|
| Build & Test Activity | The full Build & Test page: both tables, actions, My Builds, and the new Build dialog with its run forms. |
| Validation Activity | The same experience for Validation runs. |
| Upgrade Activity | The same experience for Upgrade runs. |

Build & Test is delivered first as a complete, usable slice; Validation and Upgrade follow with the same
capabilities.

## Acceptance criteria (functional)
- A new tab per activity routes to its landing page; the three tabs appear together at the front of the
  header, before "Business Processes", in the order Build & Test → Validation → Upgrade.
- Active Runs shows running / pending-input / aborting runs; Show History reveals the rest.
- All existing columns, filters, sorting and pagination are preserved.
- My Builds shows only the current user's runs; Abort and Repush work as today, available on both tables
  (Abort disabled for already-finished history runs).
- The Build dialog lists the right templates for the activity, lets you filter by Sub-Family, and starts a
  run end-to-end; the run form shows only the not-yet-filled fields, with pre-filled values shown on expand.
- Feature-flag-gated behaviour (user-story validation, validation-scope field) is unchanged.
- No existing page, behaviour, authorization or feature flag is removed or changed — this is purely additive.

## Out of scope
- The "Pending Input / Running" summary **cards** at the top of the mock-ups.
- The **search** box in the templates dialog and the "additional settings" panel in the run form.
- Removing or changing any legacy page.

---
_Technical detail (for engineers): see `devo/feature/VAL-27132/spec.md` in the repo._
