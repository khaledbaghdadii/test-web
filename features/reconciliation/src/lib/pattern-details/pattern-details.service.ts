import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { PatternDetails } from "./pattern-details.model";
@Injectable()
export class PatternDetailsService {
  private readonly gatewayUrl: string;
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  constructor() {
    this.gatewayUrl = this.config.gatewayUrl;
  }

  getPatternDetailsByPatternInstanceId(
    patternInstanceId: string,
    projectId?: string
  ): Observable<PatternDetails> {
    let params = new HttpParams();
    if (projectId) {
      params = params.set("projectId", projectId);
    }
    return this.httpClient.get<PatternDetails>(
      `${this.gatewayUrl}reconciliation/patterns/pattern-instances/${patternInstanceId}/details`,
      { params }
    );
  }
}
