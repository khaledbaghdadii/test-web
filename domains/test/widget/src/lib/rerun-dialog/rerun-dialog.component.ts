import {
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
} from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { Message } from "primeng/message";
import { InputText } from "primeng/inputtext";
import { WhitespaceValidators } from "@mxevolve/shared/ui/form";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { FactoryProductInputComponent } from "../rerun-scenario-button/factory-product-input/factory-product-input.component";

@Component({
  selector: "mxevolve-rerun-dialog",
  imports: [
    Button,
    Dialog,
    Message,
    InputText,
    ReactiveFormsModule,
    MxevolveIconComponent,
    FactoryProductInputComponent,
  ],
  templateUrl: "./rerun-dialog.component.html",
})
export class RerunDialogComponent {
  readonly visible = model(false);
  readonly projectId = input.required<string>();
  readonly factoryProductId = input<string>();
  readonly warningMessage = input<string>();
  readonly loading = input(false);

  readonly rerunRequested = output<{
    factoryProductId: string;
    commitId?: string;
  }>();

  readonly selectedFactoryProductId = signal<string | undefined>(undefined);
  readonly commitIdControl = new FormControl("", [
    Validators.maxLength(255),
    WhitespaceValidators.noWhitespaces(),
  ]);

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.commitIdControl.reset();
      }
    });
  }

  readonly isRerunDisabled = computed(
    () => !this.selectedFactoryProductId() || this.commitIdControl.invalid
  );

  submitRerun(): void {
    const factoryProductId = this.selectedFactoryProductId();
    if (!factoryProductId) return;

    this.rerunRequested.emit({
      factoryProductId,
      commitId: this.commitIdControl.value || undefined,
    });
  }

  resetForm(): void {
    this.selectedFactoryProductId.set(undefined);
    this.commitIdControl.reset();
  }
}
