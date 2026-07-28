import { inject, Injectable } from "@angular/core";
import { map, Observable, of } from "rxjs";
import { Version } from "@mxevolve/domains/test/model";
import {
  VersionApiModel,
  VersionType,
  FetchVersionsQuery,
  VersionService,
} from "@mxevolve/domains/test/data-access";
import { VersionValidationResult } from "./version-validation-result";

@Injectable({
  providedIn: "root",
})
export class VersionValidationService {
  private readonly versionService = inject(VersionService);

  validateVersions(
    versionNames: string[],
    versionTypes?: VersionType[],
    active?: boolean
  ): Observable<VersionValidationResult> {
    if (versionNames.length === 0) {
      return of({ validVersions: [], invalidVersions: [] });
    }

    return this.versionService
      .fetchVersions(
        this.buildFetchVersionsQueryParams(versionNames, versionTypes, active)
      )
      .pipe(
        map((page) => page.content.map((v) => this.buildVersion(v))),
        map((validVersions) =>
          this.buildValidationResult(versionNames, validVersions)
        )
      );
  }

  private buildValidationResult(
    versionNames: string[],
    validVersions: Version[]
  ): VersionValidationResult {
    const validVersionNames = new Set(validVersions.map((v) => v.name));
    const invalidVersions = versionNames.filter(
      (name) => !validVersionNames.has(name)
    );

    return { validVersions: validVersions, invalidVersions: invalidVersions };
  }

  private buildVersion(v: VersionApiModel) {
    return { id: v.id, name: v.name };
  }

  private buildFetchVersionsQueryParams(
    names: string[],
    versionTypes?: VersionType[],
    active?: boolean
  ): FetchVersionsQuery {
    return {
      page: 0,
      size: names.length,
      ...(versionTypes?.length ? { versionTypes } : {}),
      ...(active !== undefined ? { active } : {}),
      names: names,
    };
  }
}
