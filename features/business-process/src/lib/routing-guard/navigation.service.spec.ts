import { NavigationService } from "./navigation.service";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { Location } from "@angular/common";
import { of } from "rxjs";

describe("NavigationService", () => {
  const fallback = "fallback";

  let navigationService: NavigationService;
  let routerMock: Router;
  let locationMock: Location;
  let activatedRouteMock: ActivatedRoute;

  beforeEach(() => {
    routerMock = {
      events: of(new NavigationEnd(0, "/login", "/home")),
      navigateByUrl: jest.fn(),
      navigate: jest.fn(),
    } as unknown as Router;
    locationMock = {
      back: jest.fn(),
    } as unknown as Location;
    activatedRouteMock = {} as unknown as ActivatedRoute;
    navigationService = new NavigationService(routerMock, locationMock);
  });

  afterEach(() => {
    navigationService.history = [];
  });

  it("navigate to previous page if it exists", () => {
    navigationService.history.push("/new-url");
    navigationService.back();
    expect(locationMock.back).toHaveBeenCalledTimes(1);
  });

  it("should navigate to the fallback if there is no history and a fallback is provided", () => {
    navigationService.back({
      route: fallback,
      activatedRoute: activatedRouteMock,
    });
    expect(routerMock.navigate).toHaveBeenCalledWith([fallback], {
      relativeTo: activatedRouteMock,
    });
  });

  it("should navigate to root page when there is no page in history and fallback is not provided", () => {
    navigationService.back();
    expect(routerMock.navigateByUrl).toHaveBeenCalledTimes(1);
  });

  it("should shift history if it is more than maximum", () => {
    let events = of(
      new NavigationEnd(0, "/1", "/1-new"),
      new NavigationEnd(0, "/2", "/2-new"),
      new NavigationEnd(0, "/3", "/3-new"),
      new NavigationEnd(0, "/4", "/4-new"),
      new NavigationEnd(0, "/5", "/5-new"),
      new NavigationEnd(0, "/6", "/6-new"),
      new NavigationEnd(0, "/7", "/7-new"),
      new NavigationEnd(0, "/8", "/8-new"),
      new NavigationEnd(0, "/9", "/9-new"),
      new NavigationEnd(0, "/10", "/10-new"),
      new NavigationEnd(0, "/11", "/11-new")
    );
    routerMock = {
      events: events,
    } as unknown as Router;
    navigationService = new NavigationService(routerMock, locationMock);
    console.log(navigationService.history);
    expect(navigationService.history).toEqual([
      "/2-new",
      "/3-new",
      "/4-new",
      "/5-new",
      "/6-new",
      "/7-new",
      "/8-new",
      "/9-new",
      "/10-new",
      "/11-new",
    ]);
  });
});
