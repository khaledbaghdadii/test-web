import { Observable } from "rxjs";
import { InfraFamily } from "../model/infra-family.model";
import { InfraFamilyService } from "../infra-family.service";
import {
  MxEvolveSingleSelectDataProvider,
  DropdownOption,
} from "@mxflow/ui/mxevolve-dropdown";

/**
 * Data provider for infra family single-select dropdown
 * Implements the generic single-select dropdown data provider interface
 * Fetches all data from backend once and filters on frontend
 */
export class InfraFamilyDataProvider
  implements
    MxEvolveSingleSelectDataProvider<InfraFamily, { projectId: string }>
{
  constructor(private readonly infraFamilyService: InfraFamilyService) {}

  /**
   * Fetch all infra families for a project
   * @param params - Contains projectId
   * @returns Observable of all InfraFamily items
   */
  fetchData(params: { projectId: string }): Observable<InfraFamily[]> {
    return this.infraFamilyService.getInfraFamilies(params.projectId);
  }

  /**
   * Convert an InfraFamily to a dropdown option
   * @param infraFamily - The infra family to convert
   * @returns DropdownOption with name as label and full object as value
   */
  toDropdownOption(infraFamily: InfraFamily): DropdownOption<InfraFamily> {
    return {
      label: infraFamily.name,
      value: infraFamily,
    };
  }

  /**
   * Get unique identifier for an infra family
   * @param infraFamily - The infra family
   * @returns The id as unique identifier
   */
  getItemId(infraFamily: InfraFamily): string {
    return infraFamily.id;
  }
}
