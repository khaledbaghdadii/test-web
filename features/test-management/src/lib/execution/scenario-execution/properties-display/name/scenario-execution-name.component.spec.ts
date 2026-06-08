import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterLink } from "@angular/router";
import { ScenarioExecutionNameComponent } from "./scenario-execution-name.component";
import { MockDirectives } from "ng-mocks";
import { By } from "@angular/platform-browser";

const SCENARIO_EXECUTION_NAME = "Test Scenario Execution";
const PROJECT_ID = "test-project-123";
const SCENARIO_EXECUTION_ID = "test-execution-456";

describe("scenario execution name component", () => {
  let component: ScenarioExecutionNameComponent;
  let fixture: ComponentFixture<ScenarioExecutionNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioExecutionNameComponent, MockDirectives(RouterLink)],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioExecutionNameComponent);
    component = fixture.componentInstance;

    component.projectId = PROJECT_ID;
    component.scenarioExecutionId = SCENARIO_EXECUTION_ID;
    component.scenarioExecutionName = SCENARIO_EXECUTION_NAME;

    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should display the scenario execution name", () => {
    const linkElement = fixture.nativeElement.querySelector(
      "#scenario-execution-name"
    );

    expect(linkElement).toBeTruthy();
    expect(linkElement.textContent.trim()).toBe(SCENARIO_EXECUTION_NAME);
  });

  it("should have correct router link", () => {
    const linkElement = fixture.nativeElement.querySelector(
      "#scenario-execution-name"
    );
    const routerLink = fixture.debugElement
      .query(By.directive(RouterLink))
      .injector.get(RouterLink);

    expect(linkElement).toBeTruthy();
    expect(routerLink.routerLink).toBe(
      `/app/${PROJECT_ID}/test/execution/details/${SCENARIO_EXECUTION_ID}`
    );
  });
});
