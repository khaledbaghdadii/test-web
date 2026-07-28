import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { NavigationService } from "@mxflow/features/business-process";

@Component({
  selector: "mxevolve-unauthorized-page",
  templateUrl: "./unauthorized-page.component.html",
  standalone: false,
})
export class UnauthorizedPageComponent {
  constructor(
    private router: Router,
    private navigationService: NavigationService
  ) {}

  navigateHome() {
    this.router.navigateByUrl("/");
  }

  navigateBack() {
    this.navigationService.back();
  }
}
