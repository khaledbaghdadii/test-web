import { TestBed } from "@angular/core/testing";
import { of, Subject } from "rxjs";
import { MenuItem } from "primeng/api";
import {
  ConfigAuditArtifactMenuBuilder,
  EnvironmentConfigAuditButtonComponent,
  EnvironmentConfigAuditService,
  RequestResultType,
  RequestStatus,
  SystematicConfigAuditOperationsResponse,
} from "@mxflow/features/environment";

const PROJECT_ID = "project-1";
const ENV_ID = "env-1";

describe("Environment Config Audit Button Component", () => {
  let component: EnvironmentConfigAuditButtonComponent;
  let auditService: jest.Mocked<EnvironmentConfigAuditService>;

  beforeEach(() => {
    auditService = {
      retrieveSystematicConfigAudits: jest.fn(),
    } as unknown as jest.Mocked<EnvironmentConfigAuditService>;

    TestBed.configureTestingModule({
      providers: [
        EnvironmentConfigAuditButtonComponent,
        { provide: EnvironmentConfigAuditService, useValue: auditService },
      ],
    });

    component = TestBed.inject(EnvironmentConfigAuditButtonComponent);
    component.projectId = PROJECT_ID;
    component.environmentId = ENV_ID;
  });

  afterEach(() => jest.restoreAllMocks());

  describe("Service call", () => {
    it("should call the service to retrieve systematic config audits correctly", () => {
      auditService.retrieveSystematicConfigAudits.mockReturnValue(
        of(buildResponse({ requestStatus: RequestStatus.PENDING }))
      );
      component.ngOnInit();
      expect(auditService.retrieveSystematicConfigAudits).toHaveBeenCalledWith(
        PROJECT_ID,
        ENV_ID
      );
    });

    it("should set loading to true while the service request is on-going", () => {
      const subject = new Subject<SystematicConfigAuditOperationsResponse>();
      auditService.retrieveSystematicConfigAudits.mockReturnValue(
        subject.asObservable()
      );

      component.ngOnInit();

      expect(component.loading).toBe(true);
    });

    it("should set loading to false after the response completes", () => {
      auditService.retrieveSystematicConfigAudits.mockReturnValue(
        of(buildResponse({ requestStatus: RequestStatus.PENDING }))
      );

      component.ngOnInit();

      expect(component.loading).toBe(false);
    });
  });

  describe("Management request not completed", () => {
    it("should keep primary severity, hide dropdown and show in-progress tooltip if the management request is pending", () => {
      auditService.retrieveSystematicConfigAudits.mockReturnValue(
        of(buildResponse({ requestStatus: RequestStatus.PENDING }))
      );

      component.ngOnInit();

      expect(component.buttonSeverity).toBe("primary");
      expect(component.showDropdown).toBe(false);
      expect(component.tooltipMessage).toBe("This audit is in progress");
    });

    it("should keep primary severity, hide dropdown and show in-progress tooltip if the management request is started", () => {
      auditService.retrieveSystematicConfigAudits.mockReturnValue(
        of(buildResponse({ requestStatus: RequestStatus.STARTED }))
      );

      component.ngOnInit();

      expect(component.buttonSeverity).toBe("primary");
      expect(component.showDropdown).toBe(false);
      expect(component.tooltipMessage).toBe("This audit is in progress");
    });
  });

  describe("Management request completed", () => {
    it("should set danger severity, hide dropdown and display the status message as tooltip if the management request is invalid", () => {
      auditService.retrieveSystematicConfigAudits.mockReturnValue(
        of(
          buildResponse({
            requestStatus: RequestStatus.INVALID,
            requestStatusMessage: "Invalid configuration",
          })
        )
      );

      component.ngOnInit();

      expect(component.buttonSeverity).toBe("danger");
      expect(component.showDropdown).toBe(false);
      expect(component.tooltipMessage).toBe(
        "This audit failed : Invalid configuration"
      );
    });

    describe("Result is not SUCCESS", () => {
      it.each([
        RequestResultType.FAILURE,
        RequestResultType.TIMEOUT,
        RequestResultType.ABORTED,
      ])("should set danger severity for result type %s", (resultType) => {
        auditService.retrieveSystematicConfigAudits.mockReturnValue(
          of(
            buildResponse({
              requestStatus: RequestStatus.ENDED,
              requestResultStatus: resultType,
              requestResultMessage: "Execution problem",
            })
          )
        );

        component.ngOnInit();

        expect(component.buttonSeverity).toBe("danger");
        expect(component.tooltipMessage).toBe(
          "This audit failed : Execution problem"
        );
      });

      it("should hide dropdown when no artifacts are present on failure", () => {
        auditService.retrieveSystematicConfigAudits.mockReturnValue(
          of(
            buildResponse({
              requestStatus: RequestStatus.ENDED,
              requestResultStatus: RequestResultType.FAILURE,
            })
          )
        );

        component.ngOnInit();

        expect(component.showDropdown).toBe(false);
      });
    });

    describe("Result is SUCCESS", () => {
      it("Linting PASS: should set success severity and display passed tooltip", () => {
        auditService.retrieveSystematicConfigAudits.mockReturnValue(
          of(
            buildResponse({
              requestStatus: RequestStatus.ENDED,
              requestResultStatus: RequestResultType.SUCCESS,
              lintingResultStatus: "PASS",
            })
          )
        );

        component.ngOnInit();

        expect(component.showDropdown).toBeFalsy();
        expect(component.buttonSeverity).toBe("success");
        expect(component.tooltipMessage).toBe(
          "This audit passed without violations."
        );
      });

      it("Linting WARNING: should set warn severity and display warning tooltip", () => {
        auditService.retrieveSystematicConfigAudits.mockReturnValue(
          of(
            buildResponse({
              requestStatus: RequestStatus.ENDED,
              requestResultStatus: RequestResultType.SUCCESS,
              lintingResultStatus: "WARNING",
              artifacts: ["https://host/report.html"],
            })
          )
        );

        component.ngOnInit();

        expect(component.buttonSeverity).toBe("warn");
        expect(component.tooltipMessage).toBe(
          "This audit passed with warnings. Click to access reports"
        );
      });

      it("Linting FAILED: should set danger severity and display failed linting tooltip", () => {
        auditService.retrieveSystematicConfigAudits.mockReturnValue(
          of(
            buildResponse({
              requestStatus: RequestStatus.ENDED,
              requestResultStatus: RequestResultType.SUCCESS,
              lintingResultStatus: "FAIL",
              artifacts: ["https://host/report.html"],
            })
          )
        );

        component.ngOnInit();
        expect(component.buttonSeverity).toBe("danger");
        expect(component.tooltipMessage).toBe(
          "This audit failed. Click to access reports"
        );
      });

      it("should show dropdown and delegate to builder when artifacts are present", () => {
        const artifacts = [
          "https://host/reports/result.csv",
          "https://host/reports/report.html",
        ];
        const stubbedItems: MenuItem[] = [{ label: "CSV", items: [] }];
        const buildSpy = jest
          .spyOn(ConfigAuditArtifactMenuBuilder, "buildMenuItems")
          .mockReturnValue(stubbedItems);

        auditService.retrieveSystematicConfigAudits.mockReturnValue(
          of(
            buildResponse({
              requestStatus: RequestStatus.ENDED,
              requestResultStatus: RequestResultType.SUCCESS,
              lintingResultStatus: "PASS",
              artifacts,
            })
          )
        );

        component.ngOnInit();

        expect(component.showDropdown).toBe(true);
        expect(buildSpy).toHaveBeenCalledWith(artifacts);
        expect(component.dropdownItems).toBe(stubbedItems);
      });

      it("should hide dropdown when artifacts list is empty", () => {
        auditService.retrieveSystematicConfigAudits.mockReturnValue(
          of(
            buildResponse({
              requestStatus: RequestStatus.ENDED,
              requestResultStatus: RequestResultType.SUCCESS,
              lintingResultStatus: "PASS",
              artifacts: [],
            })
          )
        );

        component.ngOnInit();
        expect(component.showDropdown).toBe(false);
      });
    });
  });

  describe("Cleanup", () => {
    it("should unsubscribe from in-flight requests on destroy", () => {
      const subject = new Subject<SystematicConfigAuditOperationsResponse>();
      auditService.retrieveSystematicConfigAudits.mockReturnValue(
        subject.asObservable()
      );

      component.ngOnInit();
      component.ngOnDestroy();

      subject.next(
        buildResponse({
          requestStatus: RequestStatus.ENDED,
          requestResultStatus: RequestResultType.SUCCESS,
          lintingResultStatus: "FAIL",
          artifacts: ["https://host/r.html"],
        })
      );

      expect(component.buttonSeverity).toBe("primary");
    });
  });

  function buildResponse(
    overrides: Partial<
      SystematicConfigAuditOperationsResponse & {
        lintingResultStatus?: string;
        artifacts?: string[];
      }
    >
  ): SystematicConfigAuditOperationsResponse {
    const { lintingResultStatus, artifacts, ...rest } = overrides as {
      lintingResultStatus?: "PASS" | "WARNING" | "FAIL";
      artifacts?: string[];
    } & Partial<SystematicConfigAuditOperationsResponse>;

    return {
      operationId: "op-1",
      environmentId: ENV_ID,
      targetCommitId: "abc123",
      requestStatus: RequestStatus.PENDING,
      ...rest,
      configurationLintingResult:
        lintingResultStatus !== undefined || artifacts !== undefined
          ? {
              mode: "FULL",
              resultStatus: lintingResultStatus ?? "PASS",
              artifacts,
            }
          : undefined,
    };
  }
});
