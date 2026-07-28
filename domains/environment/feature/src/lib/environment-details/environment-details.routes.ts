import { Route } from "@angular/router";
import { EnvironmentDetailsComponent } from "./environment-details.component";
import {
  EnvironmentService,
  ManagementRequestService,
} from "@mxevolve/domains/environment/data-access";

export const ENVIRONMENT_DETAILS_ROUTES: Route[] = [
  {
    path: "",
    pathMatch: "full",
    component: EnvironmentDetailsComponent,
    providers: [EnvironmentService, ManagementRequestService],
  },
];
