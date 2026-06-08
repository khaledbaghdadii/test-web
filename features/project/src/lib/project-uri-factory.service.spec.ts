import { TestBed } from "@angular/core/testing";

import { ProjectUriFactoryService } from "./project-uri-factory.service";

describe("ProjectUriFactoryService", () => {
  let service: ProjectUriFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectUriFactoryService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return the url of a project correctly", () => {
    const url = service.constructProjectBaseUri("projectId");
    expect(url).toEqual("/app/projectId");
  });
});
