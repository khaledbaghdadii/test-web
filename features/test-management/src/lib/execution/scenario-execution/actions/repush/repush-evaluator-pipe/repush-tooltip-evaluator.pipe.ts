import { inject, Pipe, PipeTransform } from "@angular/core";
import { RejectionReasonMapperService } from "../rejection-reason-mapper/rejection-reason-mapper.service";
import { ScenarioExecutionGroupActionPermissionApiModel } from "../../../model/scenario-execution-group-action-permission-api-model";

@Pipe({
  name: "repushTooltipEvaluator",
})
export class RepushTooltipEvaluatorPipe implements PipeTransform {
  private rejectionReasonMapper = inject(RejectionReasonMapperService);

  transform(scenarioId: string, ...args: unknown[]): string {
    let repushEligibility =
      args[0] as ScenarioExecutionGroupActionPermissionApiModel;
    let rejectionReason = this.rejectionReasonMapper.map(
      repushEligibility?.rejectionReasons
    );
    return repushEligibility?.actionAllowed ? "Repush" : rejectionReason;
  }
}
