import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  catchError,
  EMPTY,
  Observable,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from "rxjs";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { BinaryRegressionDataService } from "../binary-regression-data.service";
import { BinaryRegression } from "../binary-regression";
import { QuillEditorComponent } from "@mxflow/ui/editor";
import { Project, ProjectService } from "@mxflow/features/project";
import { IncidentExternalLinkPipe } from "@mxflow/features/incident-management";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "mxevolve-binary-regression-details",
  imports: [
    CommonModule,
    SkeletonModule,
    TagModule,
    QuillEditorComponent,
    FormsModule,
    IncidentExternalLinkPipe,
  ],
  templateUrl: "./binary-regression-details.component.html",
  providers: [BinaryRegressionDataService],
})
export class BinaryRegressionDetailsComponent implements OnInit, OnDestroy {
  private readonly binaryRegressionDataService = inject(
    BinaryRegressionDataService
  );
  private readonly projectService = inject(ProjectService);

  @Input({ required: true }) binaryRegressionId: string;
  @Input({ required: true }) projectId: string;
  @Output() errorMessageEmitter = new EventEmitter<string>();

  private readonly destroy$ = new Subject();
  isLoading = false;
  binaryRegression?: BinaryRegression;
  projectName = "-";

  ngOnInit(): void {
    this.isLoading = true;
    this.getBinaryRegressionDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  getBinaryRegressionDetails() {
    this.fetchBinaryRegressionById()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((regression: BinaryRegression) => {
          this.binaryRegression = regression;
          if (regression.projectId) {
            return this.fetchProjectById(regression.projectId).pipe(
              tap((project) => (this.projectName = project.name))
            );
          } else return EMPTY;
        }),
        catchError((error) => {
          throw error;
        })
      )
      .subscribe({
        error: (err) => {
          this.errorMessageEmitter.emit(err);
        },
      })
      .add(() => {
        this.isLoading = false;
      });
  }

  private fetchBinaryRegressionById(): Observable<BinaryRegression> {
    return this.binaryRegressionDataService.getBinaryRegressionById(
      this.binaryRegressionId
    );
  }

  private fetchProjectById(
    binaryRegressionProjectId: string
  ): Observable<Project> {
    return this.projectService.getProjectById(binaryRegressionProjectId);
  }
}
