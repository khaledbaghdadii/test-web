import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { APP_CONFIG } from "@mxflow/config";
import { ProjectService } from "./project.service";
import { Project } from "./project";
import { ProjectResponse } from "./response/project-response";
import { FeatureToggleResponse } from "./response/feature-toggle-response";

const MOCK_GATEWAY_URL = "https://mock-gateway-url.com/";
const PROJECT_ID1 = "PROJECT_ID1";
const PROJECT_ID2 = "PROJECT_ID2";
const PROJECT_NAME = "PROJECT_NAME";
const PROJECT_DESCRIPTION = "PROJECT_DESCRIPTION";
const CREATION_DATE = "2023-01-01T11:58:39.924290Z";
const PROJECT1: Project = {
  id: PROJECT_ID1,
  name: PROJECT_NAME,
  description: PROJECT_DESCRIPTION,
  creationDate: CREATION_DATE,
};
const PROJECT2: Project = {
  id: PROJECT_ID2,
  name: PROJECT_NAME,
  description: PROJECT_DESCRIPTION,
  creationDate: CREATION_DATE,
};
const PROJECT_RESPONSE1: ProjectResponse = {
  id: PROJECT_ID1,
  name: PROJECT_NAME,
  description: PROJECT_DESCRIPTION,
  creationDate: CREATION_DATE,
};
const PROJECT_RESPONSE2: ProjectResponse = {
  id: PROJECT_ID2,
  name: PROJECT_NAME,
  description: PROJECT_DESCRIPTION,
  creationDate: CREATION_DATE,
};
const PROJECTS_RESPONSE: ProjectResponse[] = [
  PROJECT_RESPONSE1,
  PROJECT_RESPONSE2,
];
const PROJECTS: Project[] = [PROJECT1, PROJECT2];
const FEATURE_ID = "FEATURE_ID";
const FEATURE_TOGGLE_RESPONSE: FeatureToggleResponse = {
  id: FEATURE_ID,
  toggledOn: true,
};

describe("Service: ProjectService", () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;
  const appConfig = {
    gatewayUrl: MOCK_GATEWAY_URL,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectService, { provide: APP_CONFIG, useValue: appConfig }],
    });
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe("Init", () => {
    it("should create project service", () => {
      expect(service).toBeTruthy();
    });
  });

  describe("Get all projects", () => {
    it("should get all projects", () => {
      service.getAllProjects().subscribe((result) => {
        expect(result).toEqual(PROJECTS);
      });

      const request = httpMock.expectOne(MOCK_GATEWAY_URL + "projects");
      expect(request.request.method).toBe("GET");
      request.flush(PROJECTS_RESPONSE);
    });

    it("should handle errors from get all projects", () => {
      service.getAllProjects().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const request = httpMock.expectOne(MOCK_GATEWAY_URL + "projects");
      expect(request.request.method).toBe("GET");
      request.flush("Error", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });

  describe("Get view projects", () => {
    it("should get view projects", () => {
      service.getViewProjects().subscribe((result) => {
        expect(result).toEqual(PROJECTS);
      });

      const request = httpMock.expectOne(MOCK_GATEWAY_URL + "projects/view");
      expect(request.request.method).toBe("GET");
      request.flush(PROJECTS_RESPONSE);
    });

    it("should handle errors from get view projects", () => {
      service.getViewProjects().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const request = httpMock.expectOne(MOCK_GATEWAY_URL + "projects/view");
      expect(request.request.method).toBe("GET");
      request.flush("Error", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });

  describe("Get project by id", () => {
    it("should get project by id", () => {
      service.getProjectById(PROJECT_ID1).subscribe((result) => {
        expect(result).toEqual(PROJECT1);
      });

      const request = httpMock.expectOne(
        MOCK_GATEWAY_URL + "projects/" + PROJECT_ID1
      );
      expect(request.request.method).toBe("GET");
      request.flush(PROJECT_RESPONSE1);
    });

    it("should handle errors from get project by id", () => {
      service.getProjectById(PROJECT_ID1).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const request = httpMock.expectOne(
        MOCK_GATEWAY_URL + "projects/" + PROJECT_ID1
      );
      expect(request.request.method).toBe("GET");
      request.flush("Error", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });

  describe("Edit project", () => {
    it("should edit project", () => {
      service.editProject(PROJECT1).subscribe((result) => {
        expect(result).toEqual(PROJECT1);
      });

      const request = httpMock.expectOne(
        MOCK_GATEWAY_URL + "projects/" + PROJECT_ID1
      );
      expect(request.request.method).toBe("PUT");
      expect(request.request.body).toBe(PROJECT1);
      request.flush(PROJECT_RESPONSE1);
    });

    it("should handle errors from edit project", () => {
      service.editProject(PROJECT1).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const request = httpMock.expectOne(
        MOCK_GATEWAY_URL + "projects/" + PROJECT_ID1
      );
      expect(request.request.method).toBe("PUT");
      expect(request.request.body).toBe(PROJECT1);
      request.flush("Error", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });

  describe("Get feature toggle", () => {
    it("should get feature toggle", () => {
      service.getFeatureToggle(PROJECT_ID1, FEATURE_ID).subscribe((result) => {
        expect(result).toEqual(FEATURE_TOGGLE_RESPONSE);
      });

      const request = httpMock.expectOne(
        MOCK_GATEWAY_URL +
          "projects/" +
          PROJECT_ID1 +
          "/feature-toggles/" +
          FEATURE_ID
      );
      expect(request.request.method).toBe("GET");
      request.flush(FEATURE_TOGGLE_RESPONSE);
    });

    it("should handle errors from get feature toggle", () => {
      service.getFeatureToggle(PROJECT_ID1, FEATURE_ID).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const request = httpMock.expectOne(
        MOCK_GATEWAY_URL +
          "projects/" +
          PROJECT_ID1 +
          "/feature-toggles/" +
          FEATURE_ID
      );
      expect(request.request.method).toBe("GET");
      request.flush("Error", {
        status: 500,
        statusText: "Server Error",
      });
    });
  });
});
