import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";

import { GroupMetricsBarChartStateService } from "./state-service/group-metrics-bar-chart-state.service";
import { AgCharts } from "ag-charts-angular";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GroupMetricsBarChartOptionsGenerator } from "./utils/option/group-metrics-bar-chart-option-generator-service";
import { GroupMetricsBarChartMapper } from "./utils/mapper/group-metrics-bar-chart-mapper.service";
import { ErrorAlertComponent } from "@mxflow/ui/alert";
import { GroupsMultiSelectionModule } from "../../../groups-multi-selection-filter/groups-multi-selection-filter.module";
import { InfraGroupsService } from "../../../infra-groups/infra-groups.service";
import { SelectedGroup } from "../../../infra-groups/model/selected-group";
import { ProjectInfraConfigService } from "../../../project-infra-config/project-infra-config.service";
import { AgCartesianChartOptions } from "ag-charts-enterprise";

@Component({
  selector: "mxevolve-group-metrics-bar-chart",
  templateUrl: "group-metrics-bar-chart.component.html",
  imports: [GroupsMultiSelectionModule, AgCharts, ErrorAlertComponent],
  providers: [
    InfraGroupsService,
    ProjectInfraConfigService,
    GroupMetricsBarChartStateService,
    GroupMetricsBarChartOptionsGenerator,
    GroupMetricsBarChartMapper,
  ],
})
export class GroupMetricsBarChartComponent implements OnInit {
  stateService = inject(GroupMetricsBarChartStateService);
  optionsGenerator = inject(GroupMetricsBarChartOptionsGenerator);
  projectId = input.required<string>();
  groupNamesWithNoMetrics = this.stateService.groupNamesWithNoMetrics;
  shouldShowChart = this.stateService.shouldShowChart;
  groupMultiselectErrorMessage = signal<string | undefined>(undefined);
  groupMetricsErrorMessage = signal<string | undefined>(undefined);
  shouldShowGroupNamesWithNoMetricsMessage =
    this.stateService.shouldShowGroupNamesWithNoMetricsMessage;

  chartOptions = computed<AgCartesianChartOptions>(() => {
    return this.optionsGenerator.buildChartOptions(
      this.stateService.stackedData()
    );
  });

  constructor() {
    this.handleGroupMetricsStateServiceError();
  }

  ngOnInit(): void {
    this.stateService.setProjectId(this.projectId());
  }

  handleGroupListChange(groups: SelectedGroup[]) {
    const groupIds = groups.map((group) => group.id);
    const groupNames = groups.map((group) => group.name);
    this.stateService.setGroupIds(groupIds);
    this.stateService.setGroupNames(groupNames);
  }

  handleGroupMultiselectError(errorMessage: string) {
    this.groupMultiselectErrorMessage.set(errorMessage);
  }

  handleGroupMetricsStateServiceError() {
    this.stateService.errorMessageSubject
      .pipe(takeUntilDestroyed())
      .subscribe((next) => {
        this.groupMetricsErrorMessage.set(next);
      });
  }

  getWarningMessage() {
    return `We were not able to calculate the metrics on these groups: ${this.groupNamesWithNoMetrics().join(
      ", "
    )}`;
  }

  getMetricsErrorDetails(): string {
    return `
    1. No environment was deployed using the group
    2. If you already deployed on the group and you do not have metrics contact your support team for any technical failure`;
  }
}
