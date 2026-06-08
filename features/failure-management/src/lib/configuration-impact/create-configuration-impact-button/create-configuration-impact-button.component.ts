import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Button } from "primeng/button";
import { CreateConfigurationImpactModalComponent } from "../create-configuration-impact-modal/create-configuration-impact-modal.component";
import { AppendToBodyDirective } from "../../utils/append-to-body.directive";
import { CreateConfigurationImpactResponse } from "../create-configuration-impact-modal/create-configuration-impact-response";

@Component({
  selector: "mxevolve-create-configuration-impact-button",
  templateUrl: "./create-configuration-impact-button.component.html",
  imports: [
    Button,
    CreateConfigurationImpactModalComponent,
    AppendToBodyDirective,
  ],
})
export class CreateConfigurationImpactButtonComponent {
  @Input({ required: true }) projectId: string;
  @Input() buttonLabel = "Create";
  @Input() submitCreationButtonLabel: string;
  @Output() configurationImpactCreationModalOpened = new EventEmitter<void>();
  @Output() configurationImpactCreationModalClosed = new EventEmitter<void>();
  @Output() configurationImpactCreated =
    new EventEmitter<CreateConfigurationImpactResponse>();
  isCreateModalVisible = false;

  onConfigurationImpactCreationStarted() {
    this.isCreateModalVisible = true;
    this.configurationImpactCreationModalOpened.emit();
  }

  onConfigurationImpactCreated(
    response: CreateConfigurationImpactResponse
  ): void {
    this.isCreateModalVisible = false;
    this.configurationImpactCreated.emit(response);
  }

  onConfigurationImpactCreationCancelled(): void {
    this.isCreateModalVisible = false;
    this.configurationImpactCreationModalClosed.emit();
  }
}
