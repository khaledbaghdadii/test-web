import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { shareReplay } from "rxjs/operators";
import { JiraDetails } from "./jira-details";
import { JiraDetailsService } from "./jira-details.service";

/**
 * De-duplicating wrapper around {@link JiraDetailsService}. The legacy landing
 * tables issued one `project-details` request per row (N+1); this helper caches
 * a single `shareReplay`d stream per project so every consumer on a page shares
 * the same in-flight/resolved request instead of triggering a new HTTP call.
 */
@Injectable({ providedIn: "root" })
export class SharedJiraDetailsService {
  private readonly jiraDetailsService = inject(JiraDetailsService);
  private readonly cache = new Map<string, Observable<JiraDetails>>();

  getJiraDetails(projectId: string): Observable<JiraDetails> {
    const cached = this.cache.get(projectId);
    if (cached) {
      return cached;
    }

    const shared = this.jiraDetailsService
      .getJiraDetails(projectId)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.cache.set(projectId, shared);
    return shared;
  }
}
