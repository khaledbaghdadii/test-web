import {
  Component,
  EventEmitter,
  Input,
  model,
  Output,
  signal,
  WritableSignal,
} from "@angular/core";
import { Button } from "primeng/button";
import { Chip } from "primeng/chip";
import { Dialog } from "primeng/dialog";
import {
  Step,
  StepList,
  StepPanel,
  StepPanels,
  Stepper,
} from "primeng/stepper";
import { PrimeTemplate } from "primeng/api";
import { toObservable } from "@angular/core/rxjs-interop";
import { filter } from "rxjs";
import { CycleSelectorComponent } from "@mxflow/features/reconciliation";

@Component({
  selector: "mxevolve-transfer-to-recon-modal",
  templateUrl: "./transfer-to-recon-modal.component.html",
  imports: [
    Dialog,
    Button,
    Stepper,
    StepList,
    Step,
    StepPanels,
    StepPanel,
    Chip,
    CycleSelectorComponent,
    PrimeTemplate,
    CycleSelectorComponent,
  ],
})
export class TransferToReconModalComponent {
  @Input({ required: true }) projectId: string;
  @Input() pathsToTransfer: string[] = [];

  isVisible = model<boolean>(false);

  @Output() transfer = new EventEmitter<string>();

  protected cycleStepperActiveStep: WritableSignal<number> = signal(1);
  protected cycleId: string | undefined;

  protected setCycle($event: { id: string }[]) {
    this.cycleId = $event[0].id;
  }

  protected onHide() {
    this.cycleStepperActiveStep.set(1);
    this.cycleId = undefined;
  }

  protected submit() {
    this.transfer.emit(this.cycleId);
    this.isVisible.set(false);
  }

  constructor() {
    toObservable(this.isVisible)
      .pipe(filter((isVisible) => !isVisible))
      .subscribe(() => this.onHide());
  }
}
