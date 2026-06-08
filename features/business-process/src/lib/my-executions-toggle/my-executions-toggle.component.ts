import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { Table } from "primeng/table";
import { AuthenticationService } from "@mxflow/core/auth";
import { FormsModule } from "@angular/forms";
import { ToggleSwitch } from "primeng/toggleswitch";

@Component({
  selector: "mxevolve-my-executions-toggle",
  templateUrl: "./my-executions-toggle.component.html",
  imports: [FormsModule, ToggleSwitch],
})
export class MyExecutionsToggleComponent {
  @Input({ required: true }) field: string;
  @Input({ required: true }) table: Table;
  @Input() showMyExecutionsOnly: boolean = false;
  @Output() showMyExecutionsOnlyChange = new EventEmitter<boolean>();

  private readonly authService = inject(AuthenticationService);

  onMyExecutionsToggle() {
    this.showMyExecutionsOnlyChange.emit(this.showMyExecutionsOnly);

    if (this.showMyExecutionsOnly) {
      this.table.filter(this.authService.getUsername(), this.field, "contains");
    } else {
      this.table.filter(null, this.field, "contains");
    }
  }
}
