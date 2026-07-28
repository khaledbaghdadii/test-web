# Circular Dependency Fix

## Problem

You are getting this kind of runtime error:

```text
Cannot read properties of undefined (reading 'ArchiveScenarioDefinitionButtonComponent')
```

The archive button is probably not the real problem. The problem is a circular dependency caused by this import direction:

```text
domains/test/feature
  imports domains/test/widget
    imports abort-scenario-run-button
      imports domains/test/feature
```

More specifically:

```text
ScenarioDefinitionTableComponent
  -> imports ArchiveScenarioDefinitionButtonComponent from @mxevolve/domains/test/widget
  -> widget barrel also exports AbortScenarioRunButtonComponent
  -> AbortScenarioRunButtonComponent imports TestManagementAnalyticsTrackerService from @mxevolve/domains/test/feature
  -> feature barrel initializes scenario-definition code again
  -> ArchiveScenarioDefinitionButtonComponent is still undefined
```

The fix is to stop `domains/test/widget` from importing `domains/test/feature`.

## Files To Change

In the real repo, the paths probably start with:

```text
web/libs/domains/test/widget/...
```

In this extracted folder, they start with:

```text
domains/test/widget/...
```

Use the `web/libs/...` paths in your actual PR.

## Step 1: Create A New Service File

Create this file:

```text
web/libs/domains/test/widget/src/lib/abort-scenario-run-button/abort-scenario-run-analytics-tracker.service.ts
```

Paste this exact content:

```ts
import { inject, Injectable } from "@angular/core";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";

@Injectable({ providedIn: "root" })
export class AbortScenarioRunAnalyticsTrackerService {
  private readonly analyticsTrackerService = inject(AnalyticsTrackerService);

  trackAbortExecution(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Abort Execution"
    );
  }
}
```

## Step 2: Edit The Abort Button Component

Open this file:

```text
web/libs/domains/test/widget/src/lib/abort-scenario-run-button/abort-scenario-run-button.component.ts
```

Find this import:

```ts
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";
```

Replace it with this:

```ts
import { AbortScenarioRunAnalyticsTrackerService } from "./abort-scenario-run-analytics-tracker.service";
```

Then find this injection:

```ts
private readonly analyticsTrackerService = inject(
  TestManagementAnalyticsTrackerService
);
```

Replace it with this:

```ts
private readonly analyticsTrackerService = inject(
  AbortScenarioRunAnalyticsTrackerService
);
```

Do not change this line later in the file:

```ts
this.analyticsTrackerService.trackAbortExecution();
```

It should stay the same.

## Step 3: Edit The Abort Button Spec

Open this file:

```text
web/libs/domains/test/widget/src/lib/abort-scenario-run-button/abort-scenario-run-button.component.spec.ts
```

Find this import:

```ts
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";
```

Replace it with this:

```ts
import { AbortScenarioRunAnalyticsTrackerService } from "./abort-scenario-run-analytics-tracker.service";
```

Then find this provider:

```ts
{
  provide: TestManagementAnalyticsTrackerService,
  useValue: mockAnalyticsTrackerService,
},
```

Replace it with this:

```ts
{
  provide: AbortScenarioRunAnalyticsTrackerService,
  useValue: mockAnalyticsTrackerService,
},
```

## Step 4: Verify The Bad Import Is Gone

Run this from the repo root:

```bash
rg '@mxevolve/domains/test/feature' web/libs/domains/test/widget
```

Expected result:

```text
no output
```

If it prints anything, there is still a `test/widget -> test/feature` dependency to remove.

## Step 5: Run Tests Or Build

Run the smallest relevant test first:

```bash
nx test domains-test-widget
```

Then run affected build/tests if available:

```bash
nx affected --target=build
nx affected --target=test
```

## Note About The CiProcessModule Error

This error:

```text
Cannot access 'CiProcessModule' before initialization
```

is probably caused by the same module-initialization cycle, but it appears while Angular is resolving the MFE route.

The stack trace pointing to:

```text
ci-process.component.html:2
```

is misleading. That file is only the `<router-outlet>`. The actual failure happens while Angular loads the lazy child module graph.

After fixing the `test/widget -> test/feature` cycle, re-test. If this error remains, check `business-process-routing.module.ts` and make sure you are not half-mixing these two strategies:

```text
legacy remote MFE route -> loadChildren/loadRemoteModule -> CiProcessModule
new domains route      -> loadComponent -> BuildAndTestExecutionViewComponent
```

It should be one clean strategy, not both wired together in the same route path.
