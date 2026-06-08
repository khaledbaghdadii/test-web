import { ViewEnvironmentDetailsButtonComponent } from "./view-environment-details-button.component";
import { Router } from "@angular/router";

const ENVIRONMENT_ID = "environmentId";
const PROJECT_ID = "projectId";

describe("View environment details button", () => {
  let component: ViewEnvironmentDetailsButtonComponent;
  let router: Router;

  beforeEach(() => {
    router = {
      navigate: jest.fn(),
    } as unknown as Router;
    component = new ViewEnvironmentDetailsButtonComponent(router);
    component.projectId = PROJECT_ID;
    component.environmentId = ENVIRONMENT_ID;
  });

  it("should navigate to the environment details page correctly", () => {
    component.viewEnvironmentDetails();
    expect(router.navigate).toHaveBeenCalledWith([
      `/app/${PROJECT_ID}/environments/${ENVIRONMENT_ID}`,
    ]);
  });
});
