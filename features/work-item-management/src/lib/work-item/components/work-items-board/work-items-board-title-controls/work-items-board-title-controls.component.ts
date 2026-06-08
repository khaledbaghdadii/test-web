import { Component, computed, inject } from "@angular/core";

import { NgClass } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { Tooltip } from "primeng/tooltip";
import { InputTextModule } from "primeng/inputtext";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { InputIcon } from "primeng/inputicon";
import { IconField } from "primeng/iconfield";
import {
  ProjectViewMultiselectComponent,
  Project,
} from "@mxflow/features/project";
import { WorkItemBoardStateService } from "../services/state/work-item-board-state.service";

@Component({
  selector: "mxevolve-work-items-board-title-controls",
  imports: [
    NgClass,
    FormsModule,
    CardModule,
    Tooltip,
    InputTextModule,
    ToggleSwitchModule,
    InputIcon,
    IconField,
    ProjectViewMultiselectComponent,
  ],
  templateUrl: "./work-items-board-title-controls.component.html",
  styleUrls: ["./work-items-board-title-controls.component.scss"],
})
export class WorkItemsBoardTitleControlsComponent {
  private readonly workItemState = inject(WorkItemBoardStateService);

  readonly searchKey = computed(() => this.workItemState.filters.searchKey());
  readonly showMyTasksOnly = computed(() =>
    this.workItemState.filters.showMyTasksOnly()
  );
  readonly isProjectSpecific = computed(() =>
    this.workItemState.isProjectSpecific()
  );
  readonly selectedProjects = computed(() =>
    this.workItemState.filters.selectedProjects()
  );

  readonly isSearchActive = computed(() => !!this.searchKey());
  readonly isProjectsActive = computed(
    () => this.selectedProjects().length > 0
  );

  onProjectsChange(projects: Project[]): void {
    this.workItemState.setSelectedProjects(projects.map((p) => p.id));
  }

  onSearchChange(searchValue: string): void {
    this.workItemState.setSearchKey(searchValue);
  }

  clearSearch(): void {
    this.workItemState.setSearchKey("");
  }

  onMyTasksToggle(): void {
    this.workItemState.setShowMyTasksOnly(!this.showMyTasksOnly());
  }

  onRefreshClick(): void {
    this.workItemState.fullBoardRefresh();
  }
}
