import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { BusinessProcessDefinitionService } from "./business-process-definition.service";

describe("BusinessProcessDefinitionService", () => {
  const GATEWAY_URL = "https://api.test/";
  const PROJECT_ID = "project-1";
  const BASE_URL = `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/definitions`;

  let service: BusinessProcessDefinitionService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        BusinessProcessDefinitionService,
      ],
    });

    service = TestBed.inject(BusinessProcessDefinitionService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("fetches business process definitions with legacy filters", () => {
    service
      .getBusinessProcessDefinitions({
        projectId: PROJECT_ID,
        executable: true,
        extendable: false,
      })
      .subscribe();

    const request = httpTestingController.expectOne(
      (req) => req.url === BASE_URL
    );

    expect(request.request.method).toBe("GET");
    expect(request.request.params.get("executable")).toBe("true");
    expect(request.request.params.get("extendable")).toBe("false");
  });

  it("fetches one business process definition", () => {
    service.getBusinessProcessDefinition(PROJECT_ID, "definition-1").subscribe();

    httpTestingController.expectOne({
      method: "GET",
      url: `${BASE_URL}/definition-1`,
    });
  });

  it("returns false when a definition does not exist", () => {
    let result: boolean | undefined;

    service
      .businessProcessDefinitionExists(PROJECT_ID, "missing-definition")
      .subscribe((exists) => (result = exists));

    httpTestingController
      .expectOne(`${BASE_URL}/missing-definition`)
      .flush({}, { status: 404, statusText: "Not Found" });

    expect(result).toBe(false);
  });
});
