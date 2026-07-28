import { inject, Injectable, Injector, ProviderToken } from "@angular/core";
import { FinalProductApiService } from "@mxevolve/domains/artifact/data-access";
import { ProvidedInput } from "@mxevolve/domains/business-process/data-access";
import { EnvironmentDefinitionService } from "@mxevolve/domains/environment/data-access";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import {
  MergeConfigurationService,
  RepositoryService,
} from "@mxevolve/domains/scm/data-access";
import { ScenarioDefinitionService } from "@mxevolve/domains/test/data-access";
import { catchError, forkJoin, map, Observable, of } from "rxjs";

export interface PrefilledInputLabels {
  readonly labels: ReadonlyMap<string, string>;
  readonly errors: readonly string[];
}

interface LookupResult {
  readonly key: string;
  readonly value: string;
  readonly error?: string;
}

const INFRA_GROUP_INPUT_IDS = new Set([
  "buildEnvironmentInfraGroup",
  "buildAndTestInfraGroup",
  "qualityGateExecutionInfraGroupId",
  "qualityGateInfraGroupId",
  "binaryConversionInfraGroupId",
  "referenceEnvironmentInfraGroupId",
]);

const TEST_SCENARIO_INPUT_IDS = new Set([
  "buildScenarioDefinitionId",
  "testScenarioIds",
  "qualityGateScenarioDefinitionIds",
  "technicalUpgradeTestScenarioId",
]);

/**
 * Resolves the reference IDs supplied by process definitions into the labels
 * displayed in executor Details panels. It deliberately leaves literal inputs
 * untouched and returns the original ID when an individual lookup fails.
 *
 * Lookup services are resolved lazily (via `Injector`, not constructor
 * `inject()`) because each executor family only provides the subset of
 * services its own inputs need (see the per-family `*-prefilled-inputs`
 * components' `providers`). Injecting all of them eagerly would construct
 * every service unconditionally, including `providedIn: 'root'` ones like
 * `FinalProductApiService`, even for families that never use them.
 */
@Injectable()
export class PrefilledInputLabelsResolverService {
  private readonly injector = inject(Injector);

  private optional<T>(token: ProviderToken<T>): T | null {
    return this.injector.get(token, null);
  }

  resolve(
    projectId: string | undefined,
    providedInputs: readonly ProvidedInput[]
  ): Observable<PrefilledInputLabels> {
    if (projectId == null || projectId === "") {
      return of({ labels: new Map(), errors: [] });
    }

    const valuesByInputId = new Map(
      providedInputs.map((input) => [input.inputId, input.value])
    );
    const lookups: Observable<readonly LookupResult[]>[] = [
      this.resolveInfraGroups(projectId, valuesByInputId),
      this.resolveTestScenarios(projectId, valuesByInputId),
      this.resolveRepositories(projectId, valuesByInputId),
      this.resolveEnvironmentDefinition(projectId, valuesByInputId),
      this.resolveFinalProduct(projectId, valuesByInputId),
      this.resolveMergeConfiguration(projectId, valuesByInputId),
    ];

    return forkJoin(lookups).pipe(
      map((groups) => {
        const results = groups.flat();
        const resolvedValues = new Map(
          results.map((result) => [result.key, result.value])
        );
        return {
          labels: new Map(
            providedInputs.flatMap((input) => {
              if (typeof input.value === "string") {
                const value = resolvedValues.get(input.value);
                return value == null ? [] : [[input.inputId, value] as const];
              }
              if (Array.isArray(input.value)) {
                return [
                  [
                    input.inputId,
                    input.value
                      .map((value) => resolvedValues.get(value) ?? value)
                      .join(", "),
                  ] as const,
                ];
              }
              return [];
            })
          ),
          errors: results.flatMap((result) =>
            result.error == null ? [] : [result.error]
          ),
        };
      })
    );
  }

  private resolveInfraGroups(
    projectId: string,
    values: ReadonlyMap<string, unknown>
  ): Observable<readonly LookupResult[]> {
    const ids = this.valuesFor(INFRA_GROUP_INPUT_IDS, values);
    if (ids.length === 0) {
      return of([]);
    }
    const infraGroupsService = this.optional(InfraGroupService);
    if (infraGroupsService == null) {
      return of([]);
    }
    return this.resolveEach(ids, (id) =>
      infraGroupsService
        .getGroup(projectId, id)
        .pipe(map((group) => group.name))
    );
  }

  private resolveTestScenarios(
    projectId: string,
    values: ReadonlyMap<string, unknown>
  ): Observable<readonly LookupResult[]> {
    const ids = this.valuesFor(TEST_SCENARIO_INPUT_IDS, values);
    if (ids.length === 0) {
      return of([]);
    }
    const scenarioDefinitionService = this.optional(ScenarioDefinitionService);
    if (scenarioDefinitionService == null) {
      return of([]);
    }
    return this.resolveEach(ids, (id) =>
      scenarioDefinitionService
        .getScenarioDefinitionById(id, projectId)
        .pipe(map((definition) => definition.name))
    );
  }

  private resolveRepositories(
    projectId: string,
    values: ReadonlyMap<string, unknown>
  ): Observable<readonly LookupResult[]> {
    const ids = this.valueAsIds(values.get("repositoryId"));
    if (ids.length === 0) {
      return of([]);
    }
    const repositoryService = this.optional(RepositoryService);
    if (repositoryService == null) {
      return of([]);
    }
    return this.resolveEach(ids, (id) =>
      repositoryService
        .getRepository(projectId, id)
        .pipe(map((repository) => repository.name))
    );
  }

  private resolveEnvironmentDefinition(
    projectId: string,
    values: ReadonlyMap<string, unknown>
  ): Observable<readonly LookupResult[]> {
    const ids = this.valueAsIds(values.get("referenceEnvironmentDefinitionId"));
    if (ids.length === 0) {
      return of([]);
    }
    const environmentDefinitionService = this.optional(
      EnvironmentDefinitionService
    );
    if (environmentDefinitionService == null) {
      return of([]);
    }
    return this.resolveEach(ids, (id) =>
      environmentDefinitionService
        .getEnvironmentDefinitionById(projectId, id)
        .pipe(map((definition) => definition.name))
    );
  }

  private resolveFinalProduct(
    projectId: string,
    values: ReadonlyMap<string, unknown>
  ): Observable<readonly LookupResult[]> {
    const ids = this.valueAsIds(values.get("finalProductId"));
    if (ids.length === 0) {
      return of([]);
    }
    const finalProductService = this.optional(FinalProductApiService);
    if (finalProductService == null) {
      return of([]);
    }
    return this.resolveEach(ids, (id) =>
      finalProductService
        .getFinalProductById(projectId, id)
        .pipe(map((product) => product.tag ?? product.version ?? product.id))
    );
  }

  private resolveMergeConfiguration(
    projectId: string,
    values: ReadonlyMap<string, unknown>
  ): Observable<readonly LookupResult[]> {
    const repositoryId = values.get("repositoryId");
    const ids = this.valueAsIds(values.get("mergeConfigurationId"));
    if (typeof repositoryId !== "string" || ids.length === 0) {
      return of([]);
    }
    const mergeConfigurationService = this.optional(MergeConfigurationService);
    if (mergeConfigurationService == null) {
      return of([]);
    }
    return mergeConfigurationService
      .getFilteredMergeConfigurations(projectId, repositoryId, "", 0, 100)
      .pipe(
        map((page) => {
          const names = new Map(
            page.content.map((configuration) => [
              configuration.id,
              configuration.branchName,
            ])
          );
          return ids.map((id) =>
            names.has(id)
              ? { key: id, value: names.get(id) as string }
              : this.notFoundLookup(id)
          );
        }),
        catchError((error) => of(ids.map((id) => this.failedLookup(id, error))))
      );
  }

  private valuesFor(
    inputIds: ReadonlySet<string>,
    values: ReadonlyMap<string, unknown>
  ): string[] {
    return [
      ...new Set(
        [...inputIds].flatMap((inputId) => this.valueAsIds(values.get(inputId)))
      ),
    ];
  }

  private valueAsIds(value: unknown): string[] {
    const ids = Array.isArray(value) ? value : [value];
    return [
      ...new Set(
        ids.filter((id): id is string => typeof id === "string" && id !== "")
      ),
    ];
  }

  private resolveEach(
    ids: readonly string[],
    resolveLabel: (id: string) => Observable<string>
  ): Observable<readonly LookupResult[]> {
    if (ids.length === 0) {
      return of([]);
    }
    return forkJoin(
      ids.map((id) =>
        resolveLabel(id).pipe(
          map((value) => ({ key: id, value })),
          catchError((error) => of(this.failedLookup(id, error)))
        )
      )
    );
  }

  private failedLookup(id: string, error: unknown): LookupResult {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return { key: id, value: id, error: `Could not resolve ${id}: ${detail}` };
  }

  private notFoundLookup(id: string): LookupResult {
    return { key: id, value: id, error: `Could not resolve ${id}: not found` };
  }
}
