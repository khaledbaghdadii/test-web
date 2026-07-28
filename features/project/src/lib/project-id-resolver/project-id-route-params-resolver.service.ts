import { inject, Injectable, Signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { distinctUntilChanged, filter, map } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ProjectIdRouteParamsResolverService {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /**
   * The projectId of the deepest activated route, recomputed after every
   * completed navigation. Exposed as a signal so pages can react to project
   * changes without managing subscriptions. Empty string until a project route
   * is active.
   */
  readonly projectId: Signal<string> = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.tryResolve()),
      filter((projectId): projectId is string => projectId !== null),
      distinctUntilChanged()
    ),
    { initialValue: this.tryResolve() ?? "" }
  );

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

  private tryResolve(): string | null {
    try {
      return this.resolve();
    } catch {
      return null;
    }
  }
}
