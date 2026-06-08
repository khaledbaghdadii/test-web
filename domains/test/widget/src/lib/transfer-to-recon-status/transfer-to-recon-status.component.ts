import { Component, Input } from "@angular/core";
import { TagModule } from "primeng/tag";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import {
  TransferToReconProgressStatus,
  TransferToReconProgressStatusDisplayValue,
} from "@mxevolve/domains/test/model";

@Component({
  selector: "mxevolve-transfer-to-recon-status",
  imports: [TagModule, MxevolveIconComponent],
  templateUrl: "./transfer-to-recon-status.component.html",
})
export class TransferToReconStatusComponent {
  @Input() status: TransferToReconProgressStatus;
  protected readonly TransferToReconStatus = TransferToReconProgressStatus;
  protected readonly displayValue = TransferToReconProgressStatusDisplayValue;
}
