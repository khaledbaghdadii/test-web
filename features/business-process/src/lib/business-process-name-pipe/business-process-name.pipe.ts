import { Pipe, PipeTransform, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { BusinessProcessExecutionService } from "../business-process-execution-service/business-process-execution.service";

@Pipe({
  name: "businessProcessName",
})
export class BusinessProcessNamePipe implements PipeTransform {
  private readonly businessProcessExecutionService = inject(
    BusinessProcessExecutionService
  );

  transform(id: string, projectId: string): Observable<string> {
    return this.businessProcessExecutionService
      .getBusinessProcessExecution(projectId, id)
      .pipe(
        map((execution) => execution.name),
        catchError(() => of(""))
      );
  }
}
