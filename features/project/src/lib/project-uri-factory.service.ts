import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ProjectUriFactoryService {
  constructProjectBaseUri(projectId: string): string {
    return `/app/${projectId}`;
  }
}
