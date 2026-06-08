import { Pipe, PipeTransform, inject } from "@angular/core";
import { ScenarioExecutionUriFactoryService } from "./scenario-execution-uri-factory.service";

@Pipe({
  name: "scenarioExecutionUriFactory",
  standalone: true,
  pure: true,
})
export class ScenarioExecutionUriFactoryPipe implements PipeTransform {
  private readonly service = inject(ScenarioExecutionUriFactoryService);

  transform(id: string, projectId: string): string {
    return this.service.constructScenarioExecutionUrl(id, projectId);
  }
}
