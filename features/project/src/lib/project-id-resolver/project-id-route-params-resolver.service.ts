import { Injectable } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

@Injectable({
  providedIn: "root",
})
export class ProjectIdRouteParamsResolverService {
  constructor(private route: ActivatedRoute) {}

  resolve(): string {
    let route: ActivatedRoute | null = this.route.root;

    while (route) {
      if (route.snapshot.params?.["projectId"]) {
        return route.snapshot.params["projectId"];
      }
      route = route.firstChild;
    }
    throw new Error("No Project Found");
  }
}
