import {
  Component,
  computed,
  inject,
  Input,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { Subject } from "rxjs";
import { CommitIdPipeModule } from "@mxflow/pipe";
import { DatePipe, CommonModule } from "@angular/common";
import { SkeletonModule } from "primeng/skeleton";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { CommitsDetailsStateService } from "./state-service/commits-details-state-service";
import { WarningAlertModule } from "@mxflow/ui/alert";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { MergeRequestService } from "../merge-request/merge-request.service";

@Component({
  selector: "mxevolve-commits-details",
  templateUrl: "./commits-details.component.html",
  imports: [
    CommonModule,
    CommitIdPipeModule,
    DatePipe,
    SkeletonModule,
    TableEmptyMessageComponent,
    TableModule,
    WarningAlertModule,
  ],
  providers: [MergeRequestService, CommitsDetailsStateService],
  standalone: true,
})
export class CommitsDetailsComponent implements OnInit, OnDestroy {
  commitsDetailsStateService = inject(CommitsDetailsStateService);

  private readonly componentDestroy$ = new Subject();

  @Input() developmentId!: string;
  @Input() businessProcessId!: string;
  @Input() projectId!: string;

  errorMessage = computed(
    () => this.commitsDetailsStateService.errorMessage() ?? undefined
  );
  commitsData = computed(
    () => this.commitsDetailsStateService.commitsPage()?.content ?? []
  );
  fetchCommitsLoading = this.commitsDetailsStateService.fetchCommitsLoading;
  totalElements = this.commitsDetailsStateService.totalElements;
  pageSize = this.commitsDetailsStateService.pageSize;
  pageIndex = this.commitsDetailsStateService.pageIndex;

  ngOnInit(): void {
    this.commitsDetailsStateService.fetchCommits(
      this.projectId,
      this.developmentId,
      this.businessProcessId
    );
  }

  ngOnDestroy(): void {
    this.componentDestroy$.next({});
    this.componentDestroy$.complete();
  }

  onPageIndexOrSizeChange(event: TableLazyLoadEvent): void {
    const computedPageSize = event?.rows ?? this.pageSize();
    const computedPageIndex = Math.floor(
      (event?.first ?? 0) / computedPageSize
    );

    this.commitsDetailsStateService.setPageIndex(computedPageIndex);
    this.commitsDetailsStateService.setPageSize(computedPageSize);
  }
}
