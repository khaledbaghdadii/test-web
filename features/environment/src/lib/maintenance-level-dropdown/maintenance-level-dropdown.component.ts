import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";

import { MaintenanceConfiguration } from "@mxflow/features/environment";
import { Subject, takeUntil } from "rxjs";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { SelectModule } from "primeng/select";
import { MandatoryModule } from "@mxflow/directive";

@Component({
  selector: "mxevolve-maintenance-level-dropdown",
  imports: [ReactiveFormsModule, MandatoryModule, SelectModule],
  templateUrl: "./maintenance-level-dropdown.component.html",
})
export class MaintenanceLevelDropdownComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();

  @Input({ required: true }) projectId: string;
  @Input() form: FormGroup;
  @Input() showLabel = true;

  @Output()
  maintenanceLevelSelected = new EventEmitter<MaintenanceConfiguration>();

  maintenanceLevels: { key: string; value: MaintenanceConfiguration }[] = [
    { key: "Full", value: { full: true } },
    { key: "Custom", value: { full: false } },
  ];

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.subscribeToMaintenanceChanges();
  }

  private subscribeToMaintenanceChanges() {
    this.form
      .get("maintenanceConfiguration")
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (maintenanceConfiguration: MaintenanceConfiguration) => {
          this.maintenanceLevelSelected.emit(maintenanceConfiguration);
        },
      });
  }
}
