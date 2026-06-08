import { Component, Input } from "@angular/core";

import { TagModule } from "primeng/tag";
import { BusinessProcessOfficialStatus } from "./business-process-official-status";

@Component({
  imports: [TagModule],
  selector: "mxevolve-business-process-official-status",
  templateUrl: "business-process-official-status.component.html",
})
export class BusinessProcessOfficialStatusComponent {
  @Input() status: BusinessProcessOfficialStatus;
  businessProcessOfficialStatus = BusinessProcessOfficialStatus;
}
