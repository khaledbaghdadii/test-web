import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";

import { ExecutionGroupsStoreModule } from "../store/execution-group/execution-groups-store.module";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { CardContainerModule } from "@mxflow/ui/container";
import { LaunchTechnicalReseedComponent } from "./button/launch-technical-reseed.component";
import { TechnicalReseedOperationDetailsComponent } from "./details/technical-reseed-operation-details.component";
import { ExecutionGroupsState } from "../store/execution-group/execution-group.state";
import { Store } from "@ngrx/store";
import {
  dropExecutionGroupDetails,
  retrieveExecutionGroup,
} from "../store/execution-group/execution-groups.action";
import { Panel } from "primeng/panel";
import { FinalProductService } from "../../../../artifact-manager/src/lib/final-product/final-product.service";
import { TechnicalReseedService } from "./service/technical-reseed.service";

@Component({
  selector: "mxevolve-technical-reseed-operation",
  imports: [
    ExecutionGroupsStoreModule,
    HeaderTitleModule,
    CardContainerModule,
    LaunchTechnicalReseedComponent,
    TechnicalReseedOperationDetailsComponent,
    Panel,
  ],
  providers: [FinalProductService, TechnicalReseedService],
  templateUrl: "./technical-reseed.component.html",
})
export class TechnicalReseedComponent implements OnInit, OnDestroy {
  @Input({ required: true }) executionGroupId: string;
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) infraGroup: string;
  @Input({ required: true }) targetBranch: string;

  @Output() reseedLaunchedSuccessfully = new EventEmitter<void>();

  store = inject(Store<ExecutionGroupsState>);

  ngOnInit(): void {
    this.store.dispatch(
      retrieveExecutionGroup({
        projectId: this.projectId,
        executionGroupId: this.executionGroupId,
      })
    );
  }

  ngOnDestroy(): void {
    this.store.dispatch(
      dropExecutionGroupDetails({ executionGroupId: this.executionGroupId })
    );
  }

  handleSuccessfulReseed() {
    this.reseedLaunchedSuccessfully.emit();
  }
}
