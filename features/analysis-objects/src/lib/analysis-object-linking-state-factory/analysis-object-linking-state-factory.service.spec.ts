import { AnalysisObjectLinkingStateFactoryService } from "./analysis-object-linking-state-factory.service";
import { BinaryImpactLinkingStateService } from "./binary-impact-linking-state.service";
import { ConfigurationRegressionLinkingStateService } from "./configuration-regression-linking-state.service";
import {
  AnalysisObjectLinkingStateService,
  AnalysisObjectType,
  BinaryRegressionLinkingStateService,
  ConfigurationImpactLinkingStateService,
  IncidentLinkingStateService,
} from "@mxflow/features/analysis-objects";
import { FailureReasonLinkingStateService } from "./failure-reason-linking-state.service";
import { TestBed } from "@angular/core/testing";

describe("AnalysisObjectLinkingStateFactoryService", () => {
  let service: AnalysisObjectLinkingStateFactoryService;
  const binaryImpactLinkingStateService =
    {} as unknown as jest.Mocked<BinaryImpactLinkingStateService>;
  const configurationImpactLinkingStateService =
    {} as unknown as jest.Mocked<ConfigurationImpactLinkingStateService>;
  const configurationRegressionLinkingStateService =
    {} as unknown as jest.Mocked<ConfigurationRegressionLinkingStateService>;
  const binaryRegressionLinkingStateService =
    {} as unknown as jest.Mocked<BinaryRegressionLinkingStateService>;
  const incidentLinkingStateService =
    {} as unknown as jest.Mocked<IncidentLinkingStateService>;
  const failureReasonLinkingStateService =
    {} as unknown as jest.Mocked<FailureReasonLinkingStateService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BinaryImpactLinkingStateService,
          useValue: binaryImpactLinkingStateService,
        },
        {
          provide: ConfigurationImpactLinkingStateService,
          useValue: configurationImpactLinkingStateService,
        },
        {
          provide: ConfigurationRegressionLinkingStateService,
          useValue: configurationRegressionLinkingStateService,
        },
        {
          provide: BinaryRegressionLinkingStateService,
          useValue: binaryRegressionLinkingStateService,
        },
        {
          provide: IncidentLinkingStateService,
          useValue: incidentLinkingStateService,
        },
        {
          provide: FailureReasonLinkingStateService,
          useValue: failureReasonLinkingStateService,
        },
      ],
    });
    service = TestBed.inject(AnalysisObjectLinkingStateFactoryService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should throw an error for unknown analysis object type", () => {
    expect(() =>
      service.getAnalysisObjectLinkingStateService("UNKNOWN_TYPE")
    ).toThrow(
      "No linking state service found for analysis object type: UNKNOWN_TYPE"
    );
  });

  it.each([
    [
      AnalysisObjectType.CONFIGURATION_IMPACT,
      configurationImpactLinkingStateService,
    ],
    [AnalysisObjectType.BINARY_IMPACT, binaryImpactLinkingStateService],
    [
      AnalysisObjectType.CONFIGURATION_REGRESSION,
      configurationRegressionLinkingStateService,
    ],
    [AnalysisObjectType.BINARY_REGRESSION, binaryRegressionLinkingStateService],
    [AnalysisObjectType.INCIDENT, incidentLinkingStateService],
    [AnalysisObjectType.FAILURE_REASON, failureReasonLinkingStateService],
  ])(
    "should return LinkingStateService for %s",
    (
      analysisObjectType: string,
      expectedLinkingStateService: AnalysisObjectLinkingStateService
    ) => {
      const linkingStateService =
        service.getAnalysisObjectLinkingStateService(analysisObjectType);
      expect(linkingStateService).toBe(expectedLinkingStateService);
    }
  );
});
