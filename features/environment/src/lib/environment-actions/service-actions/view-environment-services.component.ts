import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { EnvironmentServiceModel } from "../../service/models/environment-service.model";
import { catchError, finalize, of, Subject, takeUntil } from "rxjs";
import {
  EnvironmentService,
  EnvironmentServiceStatusModule,
} from "@mxflow/features/environment";
import { Dialog } from "primeng/dialog";
import { TableModule } from "primeng/table";
import { Skeleton } from "primeng/skeleton";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";

@Component({
  selector: "mxevolve-view-environment-services",
  templateUrl: "./view-environment-services.component.html",
  standalone: true,
  imports: [
    Dialog,
    TableModule,
    Skeleton,
    EnvironmentServiceStatusModule,
    TableEmptyMessageComponent,
  ],
})
export class ViewEnvironmentServicesComponent
  implements OnDestroy, OnInit, OnChanges
{
  private readonly destroy$ = new Subject();

  @Input() projectId!: string;
  @Input() environmentId!: string;
  @Input() dialogOpen: boolean = false;

  @Output() servicesLoaded = new EventEmitter<{
    error?: string;
    summary?: string;
  }>();
  @Output() componentClosed = new EventEmitter<void>();

  services: EnvironmentServiceModel[];
  pageSize = 30;
  tableSize = "70vh";
  isLoading: boolean;
  isOpen: boolean = false;

  private readonly environmentService = inject(EnvironmentService);

  ngOnInit(): void {
    this.isOpen = this.dialogOpen;
    if (this.isOpen) {
      this.fetchEnvironmentServices();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["dialogOpen"] != undefined) {
      this.isOpen = this.dialogOpen;
      if (this.isOpen) {
        this.fetchEnvironmentServices();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  getArray(n: number) {
    return Array(n);
  }

  private fetchEnvironmentServices() {
    this.isLoading = true;
    let errorPayload: { error: string; summary: string } | null = null;
    this.environmentService
      .getEnvironmentServices(this.projectId, this.environmentId)
      .pipe(
        catchError((err: string) => {
          errorPayload = {
            error: err,
            summary: "The request to fetch the environment services failed",
          };
          return of([] as EnvironmentServiceModel[]);
        }),
        finalize(() => {
          this.isLoading = false;
          if (errorPayload) {
            this.servicesLoaded.emit(errorPayload);
            this.closeEnvironmentServicesView();
          } else {
            this.servicesLoaded.emit();
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          this.services = data;
          this.servicesLoaded.emit();
        },
        error: () => {
          this.closeEnvironmentServicesView();
        },
      });
  }

  closeEnvironmentServicesView() {
    this.services = [];
    this.isOpen = false;
    this.componentClosed.emit();
  }
}
