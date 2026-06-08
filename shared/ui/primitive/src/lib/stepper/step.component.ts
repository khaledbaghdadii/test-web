import { Component, contentChild, input, TemplateRef } from "@angular/core";

@Component({
  selector: "mxevolve-step",
  template: ``,
  host: {
    style: "display: contents;",
  },
})
export class StepComponent {
  readonly stepId = input.required<string>();
  readonly contentTemplate = contentChild(TemplateRef);
}
