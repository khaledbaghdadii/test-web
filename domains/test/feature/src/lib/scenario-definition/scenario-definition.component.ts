import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "mxevolve-scenario-definition",
  template: `<router-outlet></router-outlet>`,
  standalone: true,
  imports: [RouterOutlet],
})
export class ScenarioDefinitionComponent {}
