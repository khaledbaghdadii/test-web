import { Component, EventEmitter, Input, Output } from "@angular/core";
import { AppendToBodyDirective } from "../../utils/append-to-body.directive";
import { CreateConfigurationRegressionModalComponent } from "../create-configuration-regression-modal/create-configuration-regression-modal.component";
import { Button } from "primeng/button";
import { CreateConfigurationRegressionResponse } from "../model/create-configuration-regression-response.model";

@Component({
  selector: "mxevolve-create-configuration-regression-button",
  templateUrl: "./create-configuration-regression-button.component.html",
  imports: [
    AppendToBodyDirective,
    CreateConfigurationRegressionModalComponent,
    Button,
  ],
})
export class CreateConfigurationRegressionButtonComponent {
  @Input({ required: true }) projectId: string;
  @Input() buttonLabel = "Create";
  @Input() submitCreationButtonLabel: string;

  @Output() configurationRegressionCreationModalOpened =
    new EventEmitter<void>();
  @Output() configurationRegressionCreationModalClosed =
    new EventEmitter<void>();
  @Output() configurationRegressionCreated =
    new EventEmitter<CreateConfigurationRegressionResponse>();
  isCreateModalVisible = false;

  onConfigurationRegressionCreationStarted() {
    this.isCreateModalVisible = true;
    this.configurationRegressionCreationModalOpened.emit();
  }

  onConfigurationRegressionCreated(
    response: CreateConfigurationRegressionResponse
  ): void {
    this.isCreateModalVisible = false;
    this.configurationRegressionCreated.emit(response);
  }

  onConfigurationRegressionCreationCancelled(): void {
    this.isCreateModalVisible = false;
    this.configurationRegressionCreationModalClosed.emit();
  }
}
