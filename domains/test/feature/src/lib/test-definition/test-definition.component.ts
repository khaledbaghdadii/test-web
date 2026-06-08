import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "mxevolve-test-definition",
  template: ` <router-outlet></router-outlet> `,
  imports: [RouterOutlet],
})
export class TestDefinitionComponent {}
