import { Observable, of, switchMap } from "rxjs";
import {
  DropdownOption,
  MxEvolveSingleSelectDataProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import { TestSequenceService } from "@mxevolve/domains/test/data-access";
import { TestSequenceSummaryModel } from "@mxevolve/domains/test/model";
import { RepositoryService } from "@mxflow/features/repository";

export interface TestSequenceParams {
  projectId: string;
  repositoryId: string | null;
}

export class TestSequenceDataProvider
  implements
    MxEvolveSingleSelectDataProvider<
      TestSequenceSummaryModel,
      TestSequenceParams
    >
{
  constructor(
    private readonly service: TestSequenceService,
    private readonly repositoryService: RepositoryService
  ) {}

  fetchData(
    params: TestSequenceParams
  ): Observable<TestSequenceSummaryModel[]> {
    if (!params.repositoryId) {
      return of([]);
    }
    return this.repositoryService
      .getRepoById(params.projectId, params.repositoryId)
      .pipe(
        switchMap((repository) =>
          this.service.fetchTestSequences(
            params.projectId,
            params.repositoryId!,
            repository.defaultBranch
          )
        )
      );
  }

  toDropdownOption(
    item: TestSequenceSummaryModel
  ): DropdownOption<TestSequenceSummaryModel> {
    return { label: item.name, value: item };
  }

  getItemId(item: TestSequenceSummaryModel): string {
    return item.id;
  }
}
