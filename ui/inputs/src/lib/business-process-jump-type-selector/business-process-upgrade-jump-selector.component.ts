import { Component, Input, OnInit } from "@angular/core";
import { Select } from "primeng/select";
import { FormControl, ReactiveFormsModule } from "@angular/forms";

interface UpgradeJump {
  label: string;
  value: string;
}

@Component({
  selector: "mxevolve-business-process-upgrade-jump-selector",
  templateUrl: "business-process-upgrade-jump-selector.component.html",
  imports: [Select, ReactiveFormsModule],
})
export class BusinessProcessUpgradeJumpSelectorComponent implements OnInit {
  @Input({ required: true }) upgradeJumpFormControl: FormControl;
  @Input({ required: true }) upgradeJumpFormControlName: string;

  upgradeJump: UpgradeJump[];

  ngOnInit() {
    this.upgradeJump = [
      { label: "Continuous Greening", value: "Continuous Greening" },
      { label: "Mainstream Activation", value: "Mainstream Activation" },
    ];
  }
}
