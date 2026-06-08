import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { CreateIncidentButtonComponent } from "../create-incident-button/create-incident-button.component";
import { ToggleButtonModule } from "primeng/togglebutton";
import {
  BehaviorSubject,
  catchError,
  defer,
  Observable,
  Subject,
  takeUntil,
  throwError,
} from "rxjs";
import { Incident } from "../model/incident.model";
import { IncidentsSelectionTableComponent } from "../incidents-selection-table/incidents-selection-table.component";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  IncidentLinkingStateService,
} from "@mxflow/features/analysis-objects";
import { toObservable } from "@angular/core/rxjs-interop";
import { ToastMessageService } from "@mxflow/ui/alert";

@Component({
  selector: "mxevolve-link-incidents-modal-content",
  imports: [
    CreateIncidentButtonComponent,
    ToggleButtonModule,
    FormsModule,
    IncidentsSelectionTableComponent,
  ],
  templateUrl: "./link-incidents-modal-content.component.html",
})
export class LinkIncidentsModalContentComponent implements OnInit, OnDestroy {
  private readonly toastMessageService = inject(ToastMessageService);

  private readonly destroy$ = new Subject();
  private readonly linkingStateService = inject(IncidentLinkingStateService);
  private readonly isLinking = this.linkingStateService.isLinking;
  refresh$ = new BehaviorSubject<boolean>(false);
  @Input()
  initiallySelectedIncidents: AnalysisObjectSelectionState<AnalysisObject>[] =
    [];
  @Output() selectedIncidentsChange = new EventEmitter<
    AnalysisObjectSelectionState<Incident>[]
  >();
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) scenarioExecutionId: string;
  @Input({ required: true }) businessProcessId: string;
  @Input({ required: true }) environmentId: string;
  @Input({ required: true }) mxVersion: string;
  @Input({ required: true }) scenarioName: string;
  @Input({ required: true }) jumpType: string | undefined;
  @Input() selectedIncidentIdsLoading = false;
  @Input() createIncidentLink: () => Observable<string | undefined>;
  @Input() qualityLevel: string | undefined;
  correlationId$: Observable<string | undefined>;

  constructor() {
    toObservable(this.isLinking)
      .pipe(takeUntil(this.destroy$))
      .subscribe((isLinking) => {
        if (isLinking) {
          this.refresh$.next(true);
        }
      });
  }

  ngOnInit(): void {
    this.correlationId$ = defer(() => this.createIncidentLink()).pipe(
      catchError((error) => {
        this.toastMessageService.showError(
          "Incident will be created but not linked."
        );
        return throwError(() => new Error(error.message));
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  onIncidentsSelectionChange(
    selectedIncidents: AnalysisObjectSelectionState<Incident>[]
  ): void {
    this.selectedIncidentsChange.emit(selectedIncidents);
  }
}
