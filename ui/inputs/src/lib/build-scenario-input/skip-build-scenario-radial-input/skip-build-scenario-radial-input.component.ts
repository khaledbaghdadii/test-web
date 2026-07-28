import { Component, Input, OnInit } from "@angular/core";
import { Checkbox, CheckboxChangeEvent } from "primeng/checkbox";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";

@Component({
  selector: "mxevolve-skip-build-scenario-radial-input",
  templateUrl: "./skip-build-scenario-radial-input.component.html",
  imports: [Checkbox, ReactiveFormsModule],
})
export class SkipBuildScenarioRadialInputComponent implements OnInit {
  @Input() formControl: FormControl;

  customSkipEnvironmentForm: FormGroup;

  ngOnInit(): void {
    this.customSkipEnvironmentForm = new FormGroup({
      skipEnvironmentDeployment: new FormControl(this.formControl?.value),
    });
  }

  onSkipEnvironmentDeployment(event: CheckboxChangeEvent) {
    this.formControl.setValue(event.checked);
  }
}
