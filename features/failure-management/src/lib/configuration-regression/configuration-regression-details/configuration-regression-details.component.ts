import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from "@angular/core";
import { TableModule } from "primeng/table";
import { ConfigurationRegression } from "../model/configuration-regression";
import { CommonModule, DatePipe } from "@angular/common";
import { TagModule } from "primeng/tag";
import { SkeletonModule } from "primeng/skeleton";
import { Subject, takeUntil } from "rxjs";
import { ConfigurationRegressionService } from "../configuration-regression.service";
import { QuillEditorComponent } from "@mxflow/ui/editor";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "mxevolve-configuration-regression-details",
  templateUrl: "./configuration-regression-details.component.html",
  imports: [
    TableModule,
    DatePipe,
    TagModule,
    SkeletonModule,
    CommonModule,
    QuillEditorComponent,
    FormsModule,
  ],
  providers: [ConfigurationRegressionService],
})
export class ConfigurationRegressionDetailsComponent
  implements OnInit, OnDestroy
{
  private configurationRegressionService = inject(
    ConfigurationRegressionService
  );

  @Input({ required: true }) configurationRegressionId: string;
  @Input({ required: true }) projectId: string;
  @Input() projectName?: string;
  @Output() errorMessageEmitter = new EventEmitter<string>();

  private readonly destroy$ = new Subject();
  isLoading = false;
  configurationRegression?: ConfigurationRegression;

  ngOnInit(): void {
    this.isLoading = true;
    this.getConfigurationRegressionDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  getConfigurationRegressionDetails() {
    this.configurationRegressionService
      .fetch(this.projectId, this.configurationRegressionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (configurationRegression) => {
          this.configurationRegression = configurationRegression;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessageEmitter.emit(err.message);
          this.isLoading = false;
        },
      });
  }
}
