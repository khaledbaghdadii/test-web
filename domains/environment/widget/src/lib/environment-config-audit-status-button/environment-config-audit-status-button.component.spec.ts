import { TestBed } from "@angular/core/testing";
import { of, Subject, throwError } from "rxjs";
import { MenuItem } from "primeng/api";
import {
  EnvironmentConfigAuditService,
  RequestResultType,
  RequestStatus,
  SystematicConfigAuditOperationsResponse,
} from "@mxevolve/domains/environment/data-access";
import { EnvironmentConfigAuditStatusButtonComponent } from "./environment-config-audit-status-button.component";
import { ArtifactsMenuBuilder } from "@mxevolve/domains/environment/util";

const PROJECT_ID = "project-1";
const ENV_ID = "env-1";

describe("Environment Config Audit Status Button Component", () => {
  let component: EnvironmentConfigAuditStatusButtonComponent;
  let auditService: jest.Mocked<EnvironmentConfigAuditService>;

  beforeEach(() => {
    auditService = {
      retrieveSystematicConfigAudits: jest.fn(),
    } as unknown as jest.Mocked<EnvironmentConfigAuditService>;

    TestBed.configureTestingModule({
      providers: [
        EnvironmentConfigAuditStatusButtonComponent,
        { provide: EnvironmentConfigAuditService, useValue: auditService },
      ],
    });

    component = TestBed.inject(EnvironmentConfigAuditStatusButtonComponent);
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

  describe("No audit data", () => {
    it("should stay hidden and not throw when the response is null", () => {
      auditService.retrieveSystematicConfigAudits.mockReturnValue(
        of(null as unknown as SystematicConfigAuditOperationsResponse)
      );

      expect(() => component.ngOnInit()).not.toThrow();

      expect(component.visible).toBe(false);
      expect(component.showDropdown).toBe(false);
      expect(component.dropdownItems).toEqual([]);
    });

    it("should become visible when a config audit exists", () => {
      auditService.retrieveSystematicConfigAudits.mockReturnValue(
        of(buildResponse({ requestStatus: RequestStatus.PENDING }))
      );

      component.ngOnInit();

      expect(component.visible).toBe(true);
    });

    it("should stay hidden when the request errors", () => {
      auditService.retrieveSystematicConfigAudits.mockReturnValue(
        throwError(() => new Error("boom"))
      );

      component.ngOnInit();

      expect(component.visible).toBe(false);
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
    it("should set danger severity, hide dropdown and expose the status message for the dialog if the management request is invalid", () => {
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
      expect(component.tooltipMessage).toBeUndefined();
      expect(component.detailsMessage).toBe("Invalid configuration");
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
        expect(component.tooltipMessage).toBeUndefined();
        expect(component.detailsMessage).toBe("Execution problem");
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
          .spyOn(ArtifactsMenuBuilder, "buildMenuItems")
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

  describe("Presentation", () => {
    it.each([
      [RequestStatus.PENDING, "pi pi-clock"],
      [RequestStatus.INVALID, "pi pi-times-circle"],
    ] as const)("should expose the %s status icon", (requestStatus, icon) => {
      auditService.retrieveSystematicConfigAudits.mockReturnValue(
        of(buildResponse({ requestStatus }))
      );

      component.ngOnInit();

      expect(component.icon).toBe(icon);
    });

    it.each([
      ["PASS", "pi pi-check-circle"],
      ["WARNING", "pi pi-exclamation-triangle"],
      ["FAIL", "pi pi-times-circle"],
    ] as const)(
      "should expose the %s linting status icon",
      (lintingResultStatus, icon) => {
        auditService.retrieveSystematicConfigAudits.mockReturnValue(
          of(
            buildResponse({
              requestStatus: RequestStatus.ENDED,
              requestResultStatus: RequestResultType.SUCCESS,
              lintingResultStatus,
            })
          )
        );

        component.ngOnInit();

        expect(component.icon).toBe(icon);
      }
    );
  });

  describe("Details dialog", () => {
    it("should open the dialog and stop event propagation when clicked", () => {
      const event = { stopPropagation: jest.fn() } as unknown as Event;

      component.openDetailsDialog(event);

      expect(component.dialogVisible).toBe(true);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it("should open the dialog without an event", () => {
      component.openDetailsDialog();

      expect(component.dialogVisible).toBe(true);
    });

    it("should keep the dialog closed by default when a failure is loaded", () => {
      auditService.retrieveSystematicConfigAudits.mockReturnValue(
        of(
          buildResponse({
            requestStatus: RequestStatus.INVALID,
            requestStatusMessage: "Invalid configuration",
          })
        )
      );

      component.ngOnInit();

      expect(component.dialogVisible).toBe(false);
      expect(component.detailsMessage).toBe("Invalid configuration");
    });

    it("should expose the linting result message for SUCCESS/PASS", () => {
      auditService.retrieveSystematicConfigAudits.mockReturnValue(
        of(
          buildResponse({
            requestStatus: RequestStatus.ENDED,
            requestResultStatus: RequestResultType.SUCCESS,
            lintingResultStatus: "PASS",
            lintingResultMessage: "Passed with a minor note",
          })
        )
      );

      component.ngOnInit();

      expect(component.buttonSeverity).toBe("success");
      expect(component.detailsMessage).toBe("Passed with a minor note");
    });

    it("should expose the linting result message for WARNING", () => {
      auditService.retrieveSystematicConfigAudits.mockReturnValue(
        of(
          buildResponse({
            requestStatus: RequestStatus.ENDED,
            requestResultStatus: RequestResultType.SUCCESS,
            lintingResultStatus: "WARNING",
            lintingResultMessage: "Generated warnings",
          })
        )
      );

      component.ngOnInit();

      expect(component.buttonSeverity).toBe("warn");
      expect(component.detailsMessage).toBe("Generated warnings");
    });

    it("should leave the details message undefined when there is no linting message", () => {
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

      expect(component.detailsMessage).toBeUndefined();
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
        lintingResultMessage?: string;
        artifacts?: string[];
      }
    >
  ): SystematicConfigAuditOperationsResponse {
    const { lintingResultStatus, lintingResultMessage, artifacts, ...rest } =
      overrides as {
        lintingResultStatus?: "PASS" | "WARNING" | "FAIL";
        lintingResultMessage?: string;
        artifacts?: string[];
      } & Partial<SystematicConfigAuditOperationsResponse>;

    return {
      operationId: "op-1",
      environmentId: ENV_ID,
      targetCommitId: "abc123",
      requestStatus: RequestStatus.PENDING,
      ...rest,
      configurationLintingResult:
        lintingResultStatus !== undefined ||
        lintingResultMessage !== undefined ||
        artifacts !== undefined
          ? {
              mode: "FULL",
              resultStatus: lintingResultStatus ?? "PASS",
              resultMessage: lintingResultMessage,
              artifacts,
            }
          : undefined,
    };
  }
});
