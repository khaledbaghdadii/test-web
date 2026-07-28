import {
  Component,
  computed,
  EventEmitter,
  inject,
  input,
  Input,
  model,
  Output,
  signal,
  ViewChild,
} from "@angular/core";
import { UpgradeImpactSelectionTableComponent } from "../upgrade-impact-selection-table/upgrade-impact-selection-table.component";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { ToastMessageService } from "@mxflow/ui/alert";
import { MessageModule } from "primeng/message";
import {
  ShowDetectionWithNoDefectsToggleComponent,
  ValidationScope,
  ValidationScopeSetterComponent,
} from "@mxflow/features/validation-management";
import { FormsModule } from "@angular/forms";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { Tooltip } from "primeng/tooltip";
import { DetectionCategory, DetectionType } from "../../detections";
import { OverrideBinaryImpactDescriptionComponent } from "../../binary-impact/override-binary-impact-description/override-binary-impact-description.component";

@Component({
  imports: [
    DialogModule,
    ButtonModule,
    MessageModule,
    UpgradeImpactSelectionTableComponent,
    FormsModule,
    ToggleSwitchModule,
    ValidationScopeSetterComponent,
    Tooltip,
    ShowDetectionWithNoDefectsToggleComponent,
    OverrideBinaryImpactDescriptionComponent,
  ],
  selector: "mxevolve-upgrade-impact-selection-modal",
  templateUrl: "./upgrade-impact-selection-modal.component.html",
})
export class UpgradeImpactSelectionModalComponent {
  private readonly toastMessageService = inject(ToastMessageService);
  private _isVisible = false;
  private initiallySelectedUpgradeImpactId?: string;

  @Input() set isVisible(value: boolean) {
    this._isVisible = value;
    if (value) {
      this.overrideBinaryImpactDescription.set(undefined);
      this.updateInitialSelection();
    }
  }

  get isVisible(): boolean {
    return this._isVisible;
  }

  @Input() hideSelection = false;
  private readonly currentSelectedUpgradeImpactId = signal<string | undefined>(
    undefined
  );

  @Input() set selectedUpgradeImpactId(value: string | undefined) {
    this.currentSelectedUpgradeImpactId.set(value);
  }

  get selectedUpgradeImpactId(): string | undefined {
    return this.currentSelectedUpgradeImpactId();
  }

  @Input() warningMessage?: string;
  showDescriptionOverrideOption = input(false);
  validationScope = model<ValidationScope | undefined>(undefined);
  initialValidationScope = input<ValidationScope | undefined>(undefined);

  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() selectedUpgradeImpactIdChange = new EventEmitter<
    string | undefined
  >();
  @Output() overrideBinaryImpactDescriptionChange = new EventEmitter<boolean>();
  @ViewChild(UpgradeImpactSelectionTableComponent)
  upgradeImpactTable: UpgradeImpactSelectionTableComponent;
  refresh: boolean;
  showUpgradeImpactsWithoutDefects = signal(false);
  overrideBinaryImpactDescription = signal<boolean | undefined>(undefined);

  readonly isSubmitDisabled = computed(
    () =>
      !this.currentSelectedUpgradeImpactId() ||
      (this.showDescriptionOverrideOption() &&
        this.overrideBinaryImpactDescription() === undefined)
  );

  selectUpgradeImpactId(impact: string) {
    this.selectedUpgradeImpactId = impact;
  }

  submit() {
    this.updateInitialSelection();
    if (this.showDescriptionOverrideOption()) {
      this.overrideBinaryImpactDescriptionChange.emit(
        this.overrideBinaryImpactDescription()
      );
    }
    this.selectedUpgradeImpactIdChange.emit(this.selectedUpgradeImpactId);
    this.hideModal();
  }

  handleCancel() {
    this.resetSelection();
    this.hideModal();
  }

  private resetSelection() {
    this.selectedUpgradeImpactId = this.initiallySelectedUpgradeImpactId;
  }

  private updateInitialSelection() {
    this.initiallySelectedUpgradeImpactId = this.selectedUpgradeImpactId;
  }

  private hideModal() {
    this.isVisible = false;
    this.isVisibleChange.emit(false);
    this.warningMessage = undefined;
  }

  handleErrorOccurred(errorMessage: string) {
    this.toastMessageService.showError(errorMessage);
  }

  handleWarningMessage(warningMessage?: string) {
    this.warningMessage = warningMessage;
  }

  handleRefresh() {
    this.upgradeImpactTable.fetchUpgradeImpacts();
  }

  protected readonly DetectionType = DetectionType;
  protected readonly DetectionCategory = DetectionCategory;
}
