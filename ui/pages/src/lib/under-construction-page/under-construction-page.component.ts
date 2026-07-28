import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { NavigationService } from "@mxflow/features/business-process";

@Component({
  selector: "mxevolve-under-construction-page",
  templateUrl: "./under-construction-page.component.html",
  standalone: false,
})
export class UnderConstructionPageComponent {
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
