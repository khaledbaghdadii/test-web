import { inject, Pipe, PipeTransform } from "@angular/core";
import { BusinessProcessGlobalUriFactoryService } from "./business-process-global-uri-factory.service";

@Pipe({
  name: "businessProcessGlobalUriFactory",
  standalone: false,
  pure: true,
})
export class BusinessProcessGlobalUriFactoryPipe implements PipeTransform {
  private readonly service = inject(BusinessProcessGlobalUriFactoryService);

  transform(id: string, projectId: string): string {
    return this.service.constructBusinessProcessExecutionUri(id, projectId);
  }
}
