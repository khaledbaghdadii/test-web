import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
} from "@angular/core";
import { Project } from "../project";
import { ProjectService } from "../project.service";
import { ProjectViewDataProvider } from "./data-provider/project-view-data-provider";
import {
  MxevolveMultiselectDropdownComponent,
  BaseMultiselectDropdown,
  MxevolveMultiselectFrontendStateProvider,
  MxEvolveDropdownState,
} from "@mxflow/ui/mxevolve-dropdown";

@Component({
  selector: "mxevolve-project-view-multiselect",
  standalone: true,
  imports: [MxevolveMultiselectDropdownComponent],
  providers: [
    ...BaseMultiselectDropdown.createProviders(ProjectViewMultiselectComponent),
  ],
  template: `
    <mxevolve-multiselect-dropdown
      data-testid="project-view-multiselect"
      [stateProvider]="stateProvider"
      [dataParams]="{}"
      [config]="{
        placeholder: 'Select Projects'
      }"
      (errorEvent)="onError($event)"
      (selectionChange)="onProjectSelectionChange($event)"
    />
  `,
})
export class ProjectViewMultiselectComponent extends BaseMultiselectDropdown<
  Project,
  Record<string, never>
> {
  initialSelectedIds = input<string[]>([]);
  selectedProjectsChange = output<Project[]>();

  protected override stateProvider: MxEvolveDropdownState<
    Project,
    Record<string, never>
  >;

  constructor() {
    super();
    const destroyRef = inject(DestroyRef);
    const projectService = inject(ProjectService);
    const dataProvider = new ProjectViewDataProvider(projectService);

    this.stateProvider = new MxevolveMultiselectFrontendStateProvider(
      dataProvider,
      destroyRef
    );

    effect(() => {
      const ids = this.initialSelectedIds();
      const items = this.stateProvider.items();
      if (ids.length > 0 && items && items.length > 0) {
        const idSet = new Set(ids);
        const matched = items.filter((p) =>
          idSet.has(dataProvider.getItemId(p))
        );
        if (matched.length > 0) {
          this.stateProvider.setSelectedItems(matched);
        }
      }
    });
  }

  onProjectSelectionChange(selectedProjects: Project[]): void {
    this.onSelectionChange(selectedProjects);
    this.selectedProjectsChange.emit(selectedProjects);
  }
}
