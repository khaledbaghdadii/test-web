import { RepushTooltipEvaluatorPipe } from "./repush-tooltip-evaluator.pipe";
import {
  RejectionReasonMapperService,
  ScenarioExecutionGroupActionPermissionApiModel,
} from "@mxflow/test-management";
import { TestBed } from "@angular/core/testing";

const SCENARIO_ID = "scenario-id";

const MESSAGE = "Message";
describe("RepushTooltipEvaluatorPipe", () => {
  let eligibilityMap: Map<
    string,
    ScenarioExecutionGroupActionPermissionApiModel
  >;
  let pipe: RepushTooltipEvaluatorPipe;
  let rejectionReasonMapper: RejectionReasonMapperService;

  beforeEach(() => {
    eligibilityMap = new Map<
      string,
      ScenarioExecutionGroupActionPermissionApiModel
    >();
    rejectionReasonMapper = {
      map: jest.fn(() => {
        return MESSAGE;
      }),
    };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: RejectionReasonMapperService,
          useValue: rejectionReasonMapper,
        },
        RepushTooltipEvaluatorPipe,
      ],
    });
    pipe = TestBed.inject(RepushTooltipEvaluatorPipe);
  });

  it("should return Repush if scenario repush is allowed", () => {
    expect(
      pipe.transform(SCENARIO_ID, {
        actionAllowed: true,
        rejectionReasons: [""],
        warnings: [""],
      })
    ).toBe("Repush");
  });

  it("should not throw exception if repush eligibility is undefined", () => {
    pipe.transform(SCENARIO_ID, undefined);
    expect(rejectionReasonMapper.map).toHaveBeenCalledWith(undefined);
  });

  it("should return rejection reason message in case action is not allowed", () => {
    expect(
      pipe.transform(SCENARIO_ID, {
        actionAllowed: false,
        rejectionReasons: ["LIMIT_REACHED"],
        warnings: [""],
      })
    ).toBe(MESSAGE);
  });
});
