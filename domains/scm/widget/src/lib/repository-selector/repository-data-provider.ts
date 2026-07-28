import { Observable } from "rxjs";
import {
  DropdownOption,
  MxEvolveSingleSelectDataProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  RepositoryListItem,
  RepositoryService,
} from "@mxevolve/domains/scm/data-access";

export interface RepositorySelectorParams {
  projectId: string;
}

/**
 * Feeds the repository single-select dropdown with the project's test
 * repositories (migrated legacy `getTestRepositories`). The option label is the
 * repository URL and the value is the repository itself (matching the legacy
 * `{ name: r.url, value: r.id }` mapping — the id is read back via getItemId).
 */
export class RepositoryDataProvider
  implements
    MxEvolveSingleSelectDataProvider<
      RepositoryListItem,
      RepositorySelectorParams
    >
{
  constructor(private readonly repositoryService: RepositoryService) {}

  fetchData(
    params: RepositorySelectorParams
  ): Observable<RepositoryListItem[]> {
    return this.repositoryService.getTestRepositories(params.projectId);
  }

  toDropdownOption(
    item: RepositoryListItem
  ): DropdownOption<RepositoryListItem> {
    return { label: item.url, value: item };
  }

  getItemId(item: RepositoryListItem): string {
    return item.id;
  }
}
