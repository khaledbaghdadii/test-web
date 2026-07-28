import { Component } from "@angular/core";

import { SharedModule } from "primeng/api";

@Component({
  imports: [SharedModule],
  selector: "mxflow-table-empty-message",
  templateUrl: "./table-empty-message.component.html",
})
export class TableEmptyMessageComponent {}
