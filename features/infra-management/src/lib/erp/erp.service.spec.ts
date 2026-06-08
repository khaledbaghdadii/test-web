import { ErpAllocation, ErpService } from "@mxflow/features/infra-management";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";

const MOCK_GATEWAY_URL = "https://mock-gateway-url.com";
const MOCK_ERP_ALLOCATION_ID = "erpAllocationId1";
const MOCK_ERP_PROJECT_ID = "erpProjectId1";
const MOCK_ERP_ALLOCATION_NAME = "Allocation Name";
const PROJECT_ID = "projectId1";
const MOCK_ERP_ALLOCATION: ErpAllocation = {
  id: MOCK_ERP_ALLOCATION_ID,
  projectId: PROJECT_ID,
  erpProjectId: MOCK_ERP_PROJECT_ID,
  allocationName: MOCK_ERP_ALLOCATION_NAME,
};

describe("ErpService", () => {
  let service: ErpService;
  let httpMock: HttpTestingController;
  const mockAppConfig = {
    gatewayUrl: MOCK_GATEWAY_URL,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ErpService, { provide: APP_CONFIG, useValue: mockAppConfig }],
    });
    service = TestBed.inject(ErpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call getAllErpAllocations and return list of erp allocations", (done) => {
    const mockErpAllocations = [MOCK_ERP_ALLOCATION];
    service.getAllErpAllocations(PROJECT_ID).subscribe((res) => {
      expect(res).toEqual(mockErpAllocations);
      done();
    });
    const req = httpMock.expectOne(
      `${MOCK_GATEWAY_URL}projects/${PROJECT_ID}/infra/erp-allocations`
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockErpAllocations);
  });

  it("should handle errors from getAllErpAllocations", (done) => {
    service.getAllErpAllocations(PROJECT_ID).subscribe({
      error: (error) => {
        expect(error.status).toBe(500);
        done();
      },
    });

    const req = httpMock.expectOne(
      `${MOCK_GATEWAY_URL}projects/${PROJECT_ID}/infra/erp-allocations`
    );
    req.flush("Something went wrong", {
      status: 500,
      statusText: "Server Error",
    });
  });
});
