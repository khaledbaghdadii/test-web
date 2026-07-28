export { ActivityRunDetailsComponent } from "./lib/upgrade-process/activity-run-details/activity-run-details.component";
export { ValidationProcessActivityRunDetailsComponent } from "./lib/validation-process/activity-run-details/activity-run-details.component";
export { ValidationProcessArchivalUserStoriesComponent } from "./lib/validation-process/archival-user-stories/archival-user-stories.component";
export { BuildAndTestActivityRunDetailsComponent } from "./lib/build-and-test/activity-run-details/activity-run-details.component";
export { BuildEnvironmentScenarioActionsComponent } from "./lib/build-and-test/build-environment-scenario-actions/build-environment-scenario-actions.component";
export {
  DeleteDevelopmentCheckboxComponent,
  DeleteDevelopmentValue,
} from "./lib/delete-development-checkbox/delete-development-checkbox.component";
export { ReferenceScenariosTableComponent } from "./lib/reference-scenario/reference-scenarios-table.component";
export { ActivityRunsTableComponent } from "./lib/activity-runs-table/activity-runs-table.component";
export { MyRunsToggleComponent } from "./lib/my-builds-toggle/my-runs-toggle.component";
export { ActivityRunsHeaderFilterComponent } from "./lib/activity-runs-table/header-filter/activity-runs-header-filter.component";
export type {
  ActivityRunsPageRequest,
  ActivityRunsPage,
  ActivityRunsActionsColumn,
  ActivityRunsHeaderFilterType,
  ActivityRunsHeaderFilterOption,
  ActivityRunsHeaderFilterParams,
  ActivityRunsTableContext,
  ActivityRunsCellRendererParams,
} from "./lib/activity-runs-table/activity-runs-table.types";

// Shared leaf input selectors (new-arch, self-fetching widgets) consumed by the
// per-family executors (Steps 9/10/15/19). Decision VAL-27132: these live in
// type:widget (not type:ui) so they may inject their own data-access services.
export { InfraGroupSelectorComponent } from "./lib/inputs/infra-group-selector/infra-group-selector.component";
export { GroupDropdownSelectionComponent } from "./lib/inputs/group-dropdown-selection/group-dropdown-selection.component";
export { NotificationsRecipientsInputComponent } from "./lib/inputs/notifications-recipients-input/notifications-recipients-input.component";
export { ProjectUsersMultiselectComponent } from "./lib/inputs/project-users-multiselect/project-users-multiselect.component";
export { UserStoryInputComponent } from "./lib/inputs/user-story-input/user-story-input.component";

// Per-family prefilled-field display components (new design language; replace the
// legacy generic input-view-resolver) shown on the executor's expand panel.
export { PrefilledInputsComponent } from "./lib/inputs/prefilled-inputs/prefilled-inputs.component";
export { BuildAndTestPrefilledInputsComponent } from "./lib/inputs/prefilled-inputs/build-and-test-prefilled-inputs.component";
export { BackportPrefilledInputsComponent } from "./lib/inputs/prefilled-inputs/backport-prefilled-inputs.component";
export { ValidationPrefilledInputsComponent } from "./lib/inputs/prefilled-inputs/validation-prefilled-inputs.component";
export { UpgradePrefilledInputsComponent } from "./lib/inputs/prefilled-inputs/upgrade-prefilled-inputs.component";
export type { PrefilledInputRow } from "./lib/inputs/prefilled-inputs/prefilled-inputs.types";
export type { PrefilledSection } from "./lib/inputs/prefilled-inputs/prefilled-inputs.types";
