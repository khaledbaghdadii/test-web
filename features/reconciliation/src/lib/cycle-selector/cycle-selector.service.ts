import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Cycle } from "./cycle-selector.component";
import { APP_CONFIG, AppConfig } from "@mxflow/config";

@Injectable()
export class CycleSelectorService {
  private readonly gatewayUrl: string;
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  constructor() {
    this.gatewayUrl = this.config.gatewayUrl;
  }

  getCycles(projectId: string): Observable<Cycle[]> {
    return this.httpClient.get<Cycle[]>(
      `${this.gatewayUrl}reconciliation/projects/${projectId}/cycles/`
    );
  }
}
