import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";
import {
  CreateTestDefinitionRequest,
  CreateTestSelectionRequest,
  EditTestDefinitionRequest,
  EditTestSelectionRequest,
  PreconfiguredTestSelection,
  TestDefinition,
  TestSelection,
} from "@mxevolve/domains/test/model";
import { TestDefinitionApiModel } from "../api-models/test-definition-api-model";
import { TestSelectionApiModel } from "../api-models/test-selection-api-model";
import { PreconfiguredTestSelectionApiModel } from "../api-models/preconfigured-test-selection-api-model";

@Injectable()
export class TestDefinitionService {
  private readonly http = inject(HttpClient);
  config = inject<AppConfig>(APP_CONFIG);

  private static toTestDefinitions(
    testDefinitionApiModels: TestDefinitionApiModel[]
  ): TestDefinition[] {
    return testDefinitionApiModels.map(TestDefinitionService.toTestDefinition);
  }

  private static toTestDefinition(
    testDefinition: TestDefinitionApiModel
  ): TestDefinition {
    return {
      id: testDefinition.id,
      name: testDefinition.name,
      projectId: testDefinition.projectId,
      repoId: testDefinition.repoId,
      path: testDefinition.path,
      description: testDefinition.description,
      timeoutDuration: {
        days: testDefinition.timeoutDuration.days,
        hours: testDefinition.timeoutDuration.hours,
        minutes: testDefinition.timeoutDuration.minutes,
      },
      testSelections: testDefinition.testSelections.map(
        (ts: TestSelectionApiModel) => ({
          id: ts.id,
          name: ts.name,
          path: ts.path,
          tags: ts.tags,
        })
      ),
    };
  }

  fetchAll(
    projectId: string,
    testDefinitionIds?: string[]
  ): Observable<TestDefinition[]> {
    let params = new HttpParams();
    if (testDefinitionIds)
      params = params.append("testDefinitionIds", testDefinitionIds.join(","));
    return this.http
      .get<TestDefinitionApiModel[]>(this.getApiUrl(projectId), {
        params: params,
      })
      .pipe(
        map(TestDefinitionService.toTestDefinitions),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  create(
    projectId: string,
    request: CreateTestDefinitionRequest
  ): Observable<string> {
    return this.http
      .post(this.getApiUrl(projectId), request, { responseType: "text" })
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  edit(
    projectId: string,
    testId: string,
    request: EditTestDefinitionRequest
  ): Observable<TestDefinition> {
    const trimmedRequest = {
      name: request.name,
      path: request.path,
      description: request.description.trim(),
      repoId: request.repoId,
      timeoutDuration: {
        days: request.timeoutDuration.days,
        hours: request.timeoutDuration.hours,
        minutes: request.timeoutDuration.minutes,
      },
    } as EditTestDefinitionRequest;
    return this.http
      .put<TestDefinitionApiModel>(
        this.getApiUrl(projectId) + `/${testId}`,
        trimmedRequest
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  fetch(testId: string, projectId: string): Observable<TestDefinition> {
    return this.http
      .get<TestDefinitionApiModel>(this.getApiUrl(projectId) + `/${testId}`)
      .pipe(
        map(TestDefinitionService.toTestDefinition),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  addTestSelectionToTestDefinition(
    projectId: string,
    testDefinitionId: string,
    testSelection: CreateTestSelectionRequest
  ): Observable<TestSelection> {
    return this.http
      .post<TestSelectionApiModel>(
        this.getApiUrl(projectId) + `/${testDefinitionId}` + "/test-selection",
        testSelection
      )
      .pipe(
        map(TestDefinitionService.toTestSelection),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  editTestSelectionInTestDefinition(
    projectId: string,
    testSelectionId: string,
    editTestSelectionRequest: EditTestSelectionRequest
  ): Observable<TestSelection> {
    return this.http
      .put<TestSelectionApiModel>(
        this.getApiUrl(projectId) + "/test-selection/" + testSelectionId,
        editTestSelectionRequest
      )
      .pipe(
        map(TestDefinitionService.toTestSelection),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  private static toTestSelection(testSelectionApiModel: TestSelectionApiModel) {
    return {
      id: testSelectionApiModel.id,
      name: testSelectionApiModel.name,
      path: testSelectionApiModel.path,
      tags: testSelectionApiModel.tags,
    };
  }

  removeTestSelectionFromTestDefinition(
    projectId: string,
    testSelectionId: string
  ): Observable<void> {
    return this.http
      .delete<void>(
        this.getApiUrl(projectId) + "/test-selection/" + `${testSelectionId}`
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  deleteAllTestSelections(
    projectId: string,
    testDefinitionId: string
  ): Observable<void> {
    return this.http
      .delete<void>(
        `${this.getApiUrl(projectId)}/${testDefinitionId}/test-selections`
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  fetchTestSelectionsFromContextConfig(
    testDefinitionId: string,
    projectId: string,
    defaultBranch: string
  ): Observable<PreconfiguredTestSelection[]> {
    const queryParams = new HttpParams().append("branch", defaultBranch);
    return this.http
      .get<PreconfiguredTestSelectionApiModel[]>(
        `${this.getApiUrl(
          projectId
        )}/${testDefinitionId}/preconfigured-test-selections`,
        {
          params: queryParams,
        }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          const errorMessage =
            error.status === 500
              ? "Unable to retrieve tagged test selections"
              : error.error;

          return throwError(() => new Error(errorMessage));
        })
      );
  }

  bulkAddTestSelections(
    projectId: string,
    testDefinitionId: string,
    testSelections: PreconfiguredTestSelection[]
  ): Observable<TestSelection[]> {
    return this.http
      .post<{ testSelections: TestSelectionApiModel[] }>(
        `${this.getApiUrl(projectId)}/${testDefinitionId}/test-selections`,
        {
          testSelections,
        }
      )
      .pipe(
        catchError((error) => throwError(() => new Error(error.error))),
        map((res) => res.testSelections)
      );
  }

  private getApiUrl(projectId: string): string {
    return this.config.gatewayUrl + `projects/${projectId}/test-definition`;
  }
}
