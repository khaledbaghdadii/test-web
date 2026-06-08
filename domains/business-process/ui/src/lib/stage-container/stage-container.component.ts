import { Component } from "@angular/core";

@Component({
  selector: "mxevolve-stage-container",
  templateUrl: "./stage-container.component.html",
  host: {
    style: "display: contents;",
  },
})
export class StageContainerComponent {}
