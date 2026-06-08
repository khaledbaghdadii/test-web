import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { catchError, map, Observable, of, throwError } from "rxjs";
import { BusinessProcessDefinition } from "./business-process-definition";
import { CreateBusinessProcessDefinitionApiRequest } from "./requests/create-business-process-definition-api-request";
import { CreateBusinessProcessDefinitionRequest } from "./requests/create-business-process-definition-request";
import { ProvideInputRequest } from "./requests/provide-input-request";
import { EditBusinessProcessDefinitionRequest } from "./requests/edit-business-process-definition-request";
import { EditBusinessProcessDefinitionApiRequest } from "./requests/edit-business-process-definition-api-request";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { GetBusinessProcessDefinitionRequest } from "./requests/get-business-process-definition-request";
import { handleError } from "../../../../../core/error-handler/src/lib/error-utils";

@Injectable({ providedIn: "root" })
export class BusinessProcessDefinitionService {
  apiUrl: string;

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl;
  }

  getBusinessProcessDefinitions(
    request: GetBusinessProcessDefinitionRequest
  ): Observable<BusinessProcessDefinition[]> {
    let params = new HttpParams();
    if (request.extendable != undefined) {
      params = params.set("extendable", request.extendable);
    }

    if (request.executable != undefined) {
      params = params.set("executable", request.executable);
    }

    return this.http
      .get<BusinessProcessDefinition[]>(
        this.getApiUrl(request.projectId) + "/definitions",
        { params: params }
      )
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(handleError(error)))
        )
      );
  }

  getBusinessProcessDefinition(
    projectId: string,
    processDefinitionId: string
  ): Observable<BusinessProcessDefinition> {
    return this.http
      .get<BusinessProcessDefinition>(
        this.getApiUrl(projectId) + "/definitions/" + processDefinitionId
      )
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => ({
            message: handleError(error),
            status: error.error.status,
          }))
        )
      );
  }

  businessProcessDefinitionExists(
    projectId: string,
    processDefinitionId: string
  ): Observable<boolean> {
    return this.http
      .get<BusinessProcessDefinition>(
        this.getApiUrl(projectId) + "/definitions/" + processDefinitionId
      )
      .pipe(
        map(() => true),
        catchError((error: HttpErrorResponse) => of(error.status !== 404))
      );
  }

  createBusinessProcessDefinition(
    projectId: string,
    businessProcessDefinitionObject: CreateBusinessProcessDefinitionRequest
  ): Observable<BusinessProcessDefinition> {
    const request = this.mapToCreateBusinessProcessDefinitionRequest(
      businessProcessDefinitionObject
    );
    return this.http
      .post<BusinessProcessDefinition>(
        this.getApiUrl(projectId) + "/definitions",
        request
      )
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(handleError(error)))
        )
      );
  }

  editBusinessProcessDefinition(
    projectId: string,
    processDefinitionId: string,
    businessProcessDefinitionObject: EditBusinessProcessDefinitionRequest
  ): Observable<BusinessProcessDefinition> {
    const request = this.mapToEditBusinessProcessDefinitionRequest(
      businessProcessDefinitionObject
    );
    return this.http
      .put<BusinessProcessDefinition>(
        this.getApiUrl(projectId) + "/definitions/" + processDefinitionId,
        request
      )
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(handleError(error)))
        )
      );
  }

  deleteBusinessProcessDefinition(
    projectId: string,
    processDefinitionId: string
  ): Observable<any> {
    return this.http
      .delete(this.getApiUrl(projectId) + "/definitions/" + processDefinitionId)
      .pipe(
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(handleError(err)))
        )
      );
  }

  private getApiUrl(projectId: string) {
    return this.apiUrl + "projects/" + projectId + "/business-process";
  }

  private mapToCreateBusinessProcessDefinitionRequest(
    businessProcessDefinitionObject: CreateBusinessProcessDefinitionRequest
  ): CreateBusinessProcessDefinitionApiRequest {
    return {
      name: businessProcessDefinitionObject.name,
      description: businessProcessDefinitionObject.description,
      sourceDefinitionId:
        businessProcessDefinitionObject.sourceDefinition.definitionId,
      providedInputs: this.mapProvidedInputs(
        businessProcessDefinitionObject.inputs
      ),
    };
  }

  private mapProvidedInputs(inputs: {
    [key: string]: any;
  }): ProvideInputRequest[] {
    return Object.entries(inputs)
      .filter((entry) => this.isValidInputValue(entry[1]))
      .map((entry) => {
        return { inputId: entry[0], value: entry[1] } as ProvideInputRequest;
      });
  }

  private isValidInputValue(inputValue: unknown) {
    return (
      inputValue !== null &&
      inputValue !== undefined &&
      inputValue !== "" &&
      this.isNotEmptyArray(inputValue)
    );
  }

  private isNotEmptyArray(inputValue: unknown) {
    return !(Array.isArray(inputValue) && inputValue.length == 0);
  }

  private mapToEditBusinessProcessDefinitionRequest(
    businessProcessDefinitionObject: EditBusinessProcessDefinitionRequest
  ): EditBusinessProcessDefinitionApiRequest {
    return {
      name: businessProcessDefinitionObject.name,
      description: businessProcessDefinitionObject.description,
      providedInputs: this.mapProvidedInputs(
        businessProcessDefinitionObject.inputs
      ),
    };
  }
}
