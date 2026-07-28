import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { of } from "rxjs";
import { NavigationService } from "@mxflow/features/business-process";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { By } from "@angular/platform-browser";
import { UnauthorizedPageComponent } from "./unauthorized-page.component";

describe("UnauthorizedPageComponent", () => {
  let fixture: ComponentFixture<UnauthorizedPageComponent>;
  let router: Router;
  let navigationService: NavigationService;

  beforeEach(() => {
    const routerMock = {
      navigateByUrl: jest.fn(() => of()),
    };

    const navigationServiceMock = {
      back: jest.fn(),
    };

    TestBed.configureTestingModule({
      declarations: [UnauthorizedPageComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: NavigationService, useValue: navigationServiceMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UnauthorizedPageComponent);
    router = TestBed.inject(Router);
    navigationService = TestBed.inject(NavigationService);
    fixture.detectChanges();
  });

  it("should navigate back to the previous page on clicking the Go Back button", () => {
    const backButton = fixture.debugElement.query(
      By.css('[data-testid="go-back-button"]')
    ).nativeElement;
    backButton.click();
    expect(navigationService.back).toHaveBeenCalledTimes(1);
  });

  it("should navigate to the home page on clicking the Home button", () => {
    const homeButton = fixture.debugElement.query(
      By.css('[data-testid="navigate-home-button"]')
    ).nativeElement;
    homeButton.click();
    expect(router.navigateByUrl).toHaveBeenCalledWith("/");
  });
});
