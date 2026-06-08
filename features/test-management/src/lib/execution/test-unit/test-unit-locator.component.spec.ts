import { TestBed } from "@angular/core/testing";
import { TestUnitLocatorComponent } from "./test-unit-locator.component";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import {
  ScenarioExecutionUriFactoryPipe,
  TestUnitService,
} from "@mxflow/test-management";

const projectId = "p1";
const testUnitId = "t1";
const headScenarioExecutionId = "sc1";

describe("TestUnitLocatorComponent", () => {
  let component: TestUnitLocatorComponent;
  let router: Router;
  let testUnitService: TestUnitService;
  let scenarioExecutionUriFactoryPipe: ScenarioExecutionUriFactoryPipe;

  const requestParams = { projectId: projectId, testUnitId: testUnitId };
  const testUnit = { headScenarioExecution: { id: headScenarioExecutionId } };
  const headScenarioExecutionUrl = "/some/url";

  beforeEach(async () => {
    testUnitService = {
      fetchById: jest.fn().mockReturnValue(of(testUnit)),
    } as unknown as TestUnitService;
    scenarioExecutionUriFactoryPipe = {
      transform: jest.fn(() => headScenarioExecutionUrl),
    } as unknown as ScenarioExecutionUriFactoryPipe;
    router = { navigateByUrl: jest.fn() } as unknown as Router;
    await TestBed.configureTestingModule({
      imports: [TestUnitLocatorComponent],
    })
      .overrideComponent(TestUnitLocatorComponent, {
        set: {
          providers: [
            {
              provide: TestUnitService,
              useValue: testUnitService,
            },
            {
              provide: ScenarioExecutionUriFactoryPipe,
              useValue: scenarioExecutionUriFactoryPipe,
            },
            { provide: Router, useValue: router },
            {
              provide: ActivatedRoute,
              useValue: { params: of(requestParams) },
            },
          ],
        },
      })
      .compileComponents();
    component = TestBed.createComponent(
      TestUnitLocatorComponent
    ).componentInstance;
  });

  it("should fetch the test unit", () => {
    component.ngOnInit();
    expect(testUnitService.fetchById).toHaveBeenCalledWith(
      projectId,
      testUnitId
    );
  });

  it("should build uri for the head scenario execution of the test unit", () => {
    component.ngOnInit();

    expect(scenarioExecutionUriFactoryPipe.transform).toHaveBeenCalledWith(
      headScenarioExecutionId,
      projectId
    );
  });

  it("should navigate to the head scenario execution uri on init", () => {
    component.ngOnInit();
    expect(router.navigateByUrl).toHaveBeenCalledWith(headScenarioExecutionUrl);
  });
});
