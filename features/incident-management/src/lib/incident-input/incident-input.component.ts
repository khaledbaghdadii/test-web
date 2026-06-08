import {
  Component,
  forwardRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  computed,
} from "@angular/core";
import { ButtonModule } from "primeng/button";
import { InputGroup } from "primeng/inputgroup";
import { InputGroupAddon } from "primeng/inputgroupaddon";
import { InputText } from "primeng/inputtext";
import { Tooltip } from "primeng/tooltip";
import { IncidentInputSelectorModalComponent } from "./modal/incident-input-selector-modal.component";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { Incident } from "../model/incident.model";
import { IncidentService } from "../incident.service";
import { Subject, takeUntil } from "rxjs";

@Component({
  selector: "mxevolve-incident-input",
  imports: [
    ButtonModule,
    InputGroup,
    InputGroupAddon,
    InputText,
    Tooltip,
    IncidentInputSelectorModalComponent,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IncidentInputComponent),
      multi: true,
    },
  ],
  templateUrl: "./incident-input.component.html",
})
export class IncidentInputComponent
  implements ControlValueAccessor, OnInit, OnDestroy
{
  incidentService: IncidentService = inject(IncidentService);

  private readonly destroy$ = new Subject<void>();
  private readonly incomingIncidentId$ = new Subject<string | undefined>();

  incidentModalVisibility = false;
  initialSelection = signal<Incident | undefined>(undefined);
  disabled = signal(false);
  displayValue = computed(() => {
    const incident = this.initialSelection();
    return this.formatIncidentDisplay(incident);
  });

  private onChange: (value: string | undefined) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.incomingIncidentId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((incidentId) => {
        if (incidentId) {
          this.incidentService
            .fetchIncidentsByIds([incidentId])
            .pipe(takeUntil(this.destroy$))
            .subscribe((incidents) => {
              this.initialSelection.set(incidents[0]);
            });
        } else {
          this.initialSelection.set(undefined);
        }
      });
  }

  writeValue(incidentId: string | undefined): void {
    this.incomingIncidentId$.next(incidentId);
  }

  registerOnChange(fn: (value: string | undefined) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  showIncidentModal(): void {
    this.incidentModalVisibility = true;
  }

  handleSelectedIncidentChange(incident: Incident | undefined): void {
    this.initialSelection.set(incident);
    this.onChange(incident?.id);
    this.onTouched();
  }

  clearSelectedIncident(): void {
    this.initialSelection.set(undefined);
    this.onChange(undefined);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private formatIncidentDisplay(incident: Incident | undefined): string {
    const id = incident?.externalIssue?.id;
    const title = incident?.title;

    if (!id && !title) {
      return "";
    }

    return `${id || ""} - ${title || ""}`.trim();
  }
}
