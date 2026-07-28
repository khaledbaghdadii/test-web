import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ManagementRequest } from "@mxevolve/domains/environment/data-access";
import {
  RequestTypeCellRendererComponent,
  RequestTypeCellRendererParams,
} from "./request-type-cell-renderer.component";

const REQUEST: ManagementRequest = {
  id: "req-1",
  type: "Deployment",
  status: "ENDED",
  createdOn: "2023-01-01T00:00:00Z",
};

function buildParams(
  overrides: Partial<RequestTypeCellRendererParams> = {}
): RequestTypeCellRendererParams {
  return {
    data: REQUEST,
    projectId: "proj-1",
    environmentId: "env-1",
    ...overrides,
  } as RequestTypeCellRendererParams;
}

describe("RequestTypeCellRendererComponent", () => {
  let component: RequestTypeCellRendererComponent;
  let fixture: ComponentFixture<RequestTypeCellRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RequestTypeCellRendererComponent],
      providers: [provideRouter([])],
    });

    fixture = TestBed.createComponent(RequestTypeCellRendererComponent);
    component = fixture.componentInstance;
  });

  it("computes the management request details link", () => {
    component.agInit(buildParams());

    expect(component.link()).toBe(
      "/app/proj-1/environments/env-1/requests/req-1/events"
    );
  });

  it("renders the request type text", () => {
    component.agInit(buildParams());
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("Deployment");
  });

  it("returns false from refresh", () => {
    expect(component.refresh()).toBe(false);
  });
});
