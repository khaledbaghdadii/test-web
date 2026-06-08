import { Component, Input } from "@angular/core";
import { EnvironmentDefinitionStatus } from "../environment-definition-status";
import { EnvironmentDefinition } from "../environment-definition";

@Component({
  standalone: true,
  selector: "mxevolve-environment-definition-name",
  templateUrl: "./environment-definition-name.component.html",
})
export class EnvironmentDefinitionNameComponent {
  @Input({ required: true }) environmentDefinition: EnvironmentDefinition;
  protected readonly EnvironmentDefinitionStatus = EnvironmentDefinitionStatus;
}
