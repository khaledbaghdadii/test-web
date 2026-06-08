import { Component, EventEmitter, Input, Output } from "@angular/core";
import { AppendToBodyDirective } from "../../utils/append-to-body.directive";
import { CreateBinaryImpactModalComponent } from "../create-binary-impact-modal/create-binary-impact-modal.component";
import { ButtonModule } from "primeng/button";
import { ValidationScope } from "@mxflow/features/validation-management";
import { CreateBinaryImpactResponse } from "../create-binary-impact-response.model";

@Component({
  selector: "mxevolve-create-binary-impact-button",
  templateUrl: "./create-binary-impact-button.component.html",
  imports: [
    AppendToBodyDirective,
    CreateBinaryImpactModalComponent,
    ButtonModule,
  ],
})
export class CreateBinaryImpactButtonComponent {
  @Input() submitCreationButtonLabel: string;
  @Input() buttonLabel = "Create";
  @Input({ required: true }) projectId: string;
  @Input() correlationId: string;
  @Input() validationScope?: ValidationScope;
  @Input() initialValidationScope?: ValidationScope;
  @Input() upgradeImpactWarningMessage?: string;
  @Input() mxVersionInitialValue: string;
  @Output() binaryImpactCreationModalOpened = new EventEmitter<void>();
  @Output() binaryImpactCreationModalClosed = new EventEmitter<void>();
  @Output() binaryImpactCreated =
    new EventEmitter<CreateBinaryImpactResponse>();
  isCreateModalVisible = false;

  onBinaryImpactCreationStarted() {
    this.isCreateModalVisible = true;
    this.binaryImpactCreationModalOpened.emit();
  }

  onBinaryImpactCreated(
    createBinaryImpactResponse: CreateBinaryImpactResponse
  ): void {
    this.isCreateModalVisible = false;
    this.binaryImpactCreated.emit(createBinaryImpactResponse);
  }

  onBinaryImpactCreationCancelled(): void {
    this.isCreateModalVisible = false;
    this.binaryImpactCreationModalClosed.emit();
  }
}
