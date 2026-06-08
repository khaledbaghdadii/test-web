import { Pipe, PipeTransform, inject } from "@angular/core";
import { EnvironmentExecutionUriFactoryService } from "../../environment-execution-uri-factory.service";

@Pipe({
  name: "environmentUriFactory",
  standalone: true,
  pure: true,
})
export class EnvironmentUriFactoryPipe implements PipeTransform {
  private readonly service = inject(EnvironmentExecutionUriFactoryService);

  transform(environmentId: string, projectId: string): string {
    return this.service.constructEnvironmentExecutionUri(
      environmentId,
      projectId
    );
  }
}
