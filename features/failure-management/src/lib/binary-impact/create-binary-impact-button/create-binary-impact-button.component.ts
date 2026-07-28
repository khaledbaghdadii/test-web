import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { AppendToBodyDirective } from "../../utils/append-to-body.directive";
import { CreateBinaryImpactModalComponent } from "../create-binary-impact-modal/create-binary-impact-modal.component";
import { ButtonModule } from "primeng/button";
import { SplitButtonModule } from "primeng/splitbutton";
import { ValidationScope } from "@mxflow/features/validation-management";
import { CreateBinaryImpactResponse } from "../create-binary-impact-response.model";
import { UpgradeImpactSelectionModalComponent } from "../../upgrade-impact/upgrade-impact-selection-modal/upgrade-impact-selection-modal.component";
import { BinaryImpactService } from "../binary-impact.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import { Attachment } from "@mxflow/features/attachment";
import { Menu } from "primeng/menu";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-create-binary-impact-button",
  templateUrl: "./create-binary-impact-button.component.html",
  providers: [BinaryImpactService],
  imports: [
    AppendToBodyDirective,
    CreateBinaryImpactModalComponent,
    UpgradeImpactSelectionModalComponent,
    ButtonModule,
    SplitButtonModule,
    Menu,
    MxevolveIconComponent,
  ],
})
export class CreateBinaryImpactButtonComponent {
  private readonly binaryImpactService = inject(BinaryImpactService);
  private readonly toastMessageService = inject(ToastMessageService);

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
  isUpgradeImpactSelectionModalVisible = false;
  prefillDescription?: string;
  prefillAttachments?: Attachment[];
  prefillUpgradeImpactId?: string;

  createNewButtonItems = [
    {
      label: "With Upgrade Impact",
      command: () => this.onBinaryImpactCreationFromUpgradeImpactStarted(),
    },
    {
      label: "Without Upgrade Impact",
      command: () => this.onBinaryImpactCreationStarted(),
    },
  ];

  onBinaryImpactCreationFromUpgradeImpactStarted() {
    this.isUpgradeImpactSelectionModalVisible = true;
  }

  onUpgradeImpactSelected(upgradeImpactId: string | undefined) {
    this.isUpgradeImpactSelectionModalVisible = false;
    if (!upgradeImpactId) {
      this.resetPrefillState();
      this.onBinaryImpactCreationStarted();
      return;
    }
    this.initializeFromUpgradeImpact(upgradeImpactId);
  }

  onBinaryImpactCreationStarted() {
    this.isCreateModalVisible = true;
    this.binaryImpactCreationModalOpened.emit();
  }

  onBinaryImpactCreated(
    createBinaryImpactResponse: CreateBinaryImpactResponse
  ): void {
    this.isCreateModalVisible = false;
    this.resetPrefillState();
    this.binaryImpactCreated.emit(createBinaryImpactResponse);
  }

  onBinaryImpactCreationCancelled(): void {
    this.isCreateModalVisible = false;
    this.resetPrefillState();
    this.binaryImpactCreationModalClosed.emit();
  }

  private initializeFromUpgradeImpact(upgradeImpactId: string): void {
    this.binaryImpactService
      .prepareFromUpgradeImpact({
        projectId: this.projectId,
        upgradeImpactId,
      })
      .subscribe({
        next: (response) => {
          this.prefillDescription = response.description;
          this.prefillAttachments = response.attachments;
          this.prefillUpgradeImpactId = upgradeImpactId;
          this.onBinaryImpactCreationStarted();
        },
        error: (error) => {
          this.toastMessageService.showError(
            "Error prefilling upgrade impact:" + error.message
          );
          this.prefillDescription = undefined;
          this.prefillAttachments = undefined;
          this.prefillUpgradeImpactId = upgradeImpactId;
          this.onBinaryImpactCreationStarted();
        },
      });
  }

  private resetPrefillState(): void {
    this.prefillDescription = undefined;
    this.prefillAttachments = undefined;
    this.prefillUpgradeImpactId = undefined;
  }
}
