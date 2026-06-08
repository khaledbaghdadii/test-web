import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from "@angular/core";
import { ConfigurationImpactService } from "../configuration-impact.service";
import { ConfigurationImpact } from "../model/configuration-impact";
import { DatePipe } from "@angular/common";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { Subject, takeUntil } from "rxjs";
import { QuillEditorComponent } from "@mxflow/ui/editor";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "mxevolve-configuration-impact-details",
  templateUrl: "./configuration-impact-details.component.html",
  imports: [
    DatePipe,
    SkeletonModule,
    TagModule,
    QuillEditorComponent,
    FormsModule,
  ],
  providers: [ConfigurationImpactService],
})
export class ConfigurationImpactDetailsComponent implements OnInit, OnDestroy {
  private configurationImpactService = inject(ConfigurationImpactService);

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) configurationImpactId: string;
  @Input({ required: true }) projectName: string;
  @Output() errorMessageEmitter = new EventEmitter<string>();
  configurationImpact?: ConfigurationImpact;
  isLoading = false;
  private readonly destroy$ = new Subject();

  ngOnInit(): void {
    this.fetchConfigurationImpactDetails();
  }

  private fetchConfigurationImpactDetails() {
    this.isLoading = true;
    this.configurationImpactService
      .fetch(this.projectId, this.configurationImpactId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (configurationImpact) => {
          this.configurationImpact = configurationImpact;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessageEmitter.emit(error.message);
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
