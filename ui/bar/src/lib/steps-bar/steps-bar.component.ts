import { Component, Input } from "@angular/core";

import { Step } from "./step";

@Component({
  imports: [],
  selector: "mxevolve-steps-bar",
  templateUrl: "steps-bar.component.html",
})
export class StepsBarComponent {
  @Input() steps: Step[] = [];
}
