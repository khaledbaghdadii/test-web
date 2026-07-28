import { Component } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { RippleModule } from "primeng/ripple";
import { NavigationService } from "@mxflow/features/business-process";
import { Router } from "@angular/router";

@Component({
  selector: "mxflow-not-found",
  templateUrl: "./not-found.component.html",
  imports: [ButtonModule, RippleModule],
})
export class NotFoundComponent {
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
