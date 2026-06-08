import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient } from "@angular/common/http";
import { catchError, Observable, throwError } from "rxjs";
import { ErpAllocation } from "./model/erp-allocation";

@Injectable({ providedIn: "root" })
export class ErpService {
  private readonly apiUrl: string;

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl;
  }

  getAllErpAllocations(projectId: string): Observable<ErpAllocation[]> {
    return this.http
      .get<ErpAllocation[]>(this.getErpAllocationsUrl(projectId))
      .pipe(catchError((error) => throwError(() => error)));
  }

  private getErpAllocationsUrl(projectId: string) {
    return this.apiUrl + "projects/" + projectId + "/infra/erp-allocations";
  }
}
