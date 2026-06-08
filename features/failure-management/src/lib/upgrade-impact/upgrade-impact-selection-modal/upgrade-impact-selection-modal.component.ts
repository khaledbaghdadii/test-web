import {
  Component,
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
      this.updateInitialSelection();
    }
  }

  get isVisible(): boolean {
    return this._isVisible;
  }

  @Input() hideSelection = false;
  @Input() selectedUpgradeImpactId?: string;
  @Input() warningMessage?: string;
  validationScope = model<ValidationScope | undefined>(undefined);
  initialValidationScope = input<ValidationScope | undefined>(undefined);

  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() selectedUpgradeImpactIdChange = new EventEmitter<
    string | undefined
  >();
  @ViewChild(UpgradeImpactSelectionTableComponent)
  upgradeImpactTable: UpgradeImpactSelectionTableComponent;
  refresh: boolean;
  showUpgradeImpactsWithoutDefects = signal(false);

  selectUpgradeImpactId(impact: string) {
    this.selectedUpgradeImpactId = impact;
  }

  submit() {
    this.updateInitialSelection();
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
