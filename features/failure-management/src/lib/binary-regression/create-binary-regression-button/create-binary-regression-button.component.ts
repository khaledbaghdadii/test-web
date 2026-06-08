import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Button } from "primeng/button";
import { CreateBinaryRegressionModalComponent } from "../create-binary-regression-modal/create-binary-regression-modal.component";
import { ValidationScope } from "@mxflow/features/validation-management";
import { AppendToBodyDirective } from "../../utils/append-to-body.directive";

@Component({
  selector: "mxevolve-create-binary-regression-button",
  templateUrl: "./create-binary-regression-button.component.html",
  imports: [
    Button,
    CreateBinaryRegressionModalComponent,
    AppendToBodyDirective,
  ],
})
export class CreateBinaryRegressionButtonComponent {
  @Input({ required: true }) projectId: string;
  @Input() buttonLabel = "Create";
  @Input() mxVersionInitialValue: string | null = null;
  @Input() validationScope?: ValidationScope;
  @Input() initialValidationScope?: ValidationScope;
  @Input() defectsWarningMessage?: string;
  @Input() submitCreationButtonLabel: string;
  @Output() binaryRegressionCreationModalOpened = new EventEmitter<void>();
  @Output() binaryRegressionCreationModalClosed = new EventEmitter<void>();
  @Output() binaryRegressionCreated = new EventEmitter<string>();
  isCreateModalVisible = false;

  onBinaryRegressionCreationStarted() {
    this.isCreateModalVisible = true;
    this.binaryRegressionCreationModalOpened.emit();
  }

  onBinaryRegressionCreated(id: string): void {
    this.isCreateModalVisible = false;
    this.binaryRegressionCreated.emit(id);
  }

  onBinaryRegressionCreationCancelled(): void {
    this.isCreateModalVisible = false;
    this.binaryRegressionCreationModalClosed.emit();
  }
}
