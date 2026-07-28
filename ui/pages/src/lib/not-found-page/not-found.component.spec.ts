import { NotFoundComponent } from "@mxflow/ui/pages";
import { Router } from "@angular/router";
import { of } from "rxjs";
import { NavigationService } from "@mxflow/features/business-process";

describe("testing not found component", () => {
  let component: NotFoundComponent;
  let router: Router;
  let navigationService: NavigationService;

  beforeEach(() => {
    router = {
      navigateByUrl: jest.fn(() => of()),
    } as unknown as Router;
    navigationService = {
      back: jest.fn(),
    } as unknown as NavigationService;

    component = new NotFoundComponent(router, navigationService);
  });

  it("should navigate back to the previous page on clicking back button", function () {
    component.navigateBack();
    expect(navigationService.back).toHaveBeenCalledTimes(1);
  });

  it("should navigate to the home page on clicking Go To Home button", function () {
    component.navigateHome();
    expect(router.navigateByUrl).toHaveBeenCalledWith("/");
  });
});
