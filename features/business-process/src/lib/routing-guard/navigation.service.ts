import { Injectable } from "@angular/core";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { Location } from "@angular/common";

@Injectable({
  providedIn: "root",
})
export class NavigationService {
  MAX_HISTORY_LEN = 10;
  history: string[] = [];

  constructor(private router: Router, private location: Location) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.history.push(event.urlAfterRedirects);
        if (this.history.length > this.MAX_HISTORY_LEN) {
          this.history.shift();
        }
      }
    });
  }

  back(fallback?: { route: string; activatedRoute: ActivatedRoute }): void {
    this.history.pop();
    if (this.history.length > 0) {
      this.location.back();
    } else {
      if (fallback) {
        this.router.navigate([fallback.route], {
          relativeTo: fallback.activatedRoute,
        });
      } else {
        this.router.navigateByUrl("/");
      }
    }
  }
}
