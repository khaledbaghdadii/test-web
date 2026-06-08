import { TestBed } from "@angular/core/testing";
import { MockComponent } from "ng-mocks";
import { BuildAndTestTestSectionComponent } from "./build-and-test-test-section.component";
import { BuildAndTestRunScenarioComponent } from "./build-and-test-run-scenario/build-and-test-run-scenario.component";
import { BuildAndTestScenarioExecutionsComponent } from "./build-and-test-scenario-executions/build-and-test-scenario-executions.component";
import { BusinessProcessDefinitionService } from "@mxflow/features/business-process";

describe("BuildAndTestTestSectionComponent", () => {
  let component: BuildAndTestTestSectionComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BuildAndTestTestSectionComponent,
        MockComponent(BuildAndTestRunScenarioComponent),
        MockComponent(BuildAndTestScenarioExecutionsComponent),
      ],
      providers: [
        {
          provide: BusinessProcessDefinitionService,
          useValue: {},
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(BuildAndTestTestSectionComponent);
    component = fixture.componentInstance;
    component.projectId = "projectId";
  });

  it("on initialize the component should be created", () => {
    expect(component).toBeTruthy();
  });
});
