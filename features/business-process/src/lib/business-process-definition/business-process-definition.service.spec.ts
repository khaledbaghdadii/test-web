import {
  BusinessProcessDefinitionService,
  CreateBusinessProcessDefinitionRequest,
} from "@mxflow/features/business-process";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { lastValueFrom, of, throwError } from "rxjs";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { DoneFn } from "@angular-architects/module-federation/src/server/task-queue";

const bpDefinitionId = "bpDefinitionId";
const projectId = "projectId";
const bpDefinition = {
  id: bpDefinitionId,
  projectId: "project id",
  templateId: "template id",
  processName: "processName",
  name: "definition name",
  description: "definition description",
  providedInputs: [
    {
      inputId: "input id",
      value: "value",
    },
    {
      inputId: "otherInputId",
      value: {
        x: 5,
        string: "value",
      },
    },
  ],
  sourceDefinitionId: "sourceDefinitionId",
};
describe("Business Process Definition Service Test", () => {
  let service: BusinessProcessDefinitionService;
  let httpClient: HttpClient;
  let appConfig = {
    gatewayUrl: "gateway/",
  } as unknown as AppConfig;

  it("should create a bp definition correctly", async () => {
    httpClient = {
      post: jest.fn(() => {
        return of(bpDefinition);
      }),
    } as unknown as HttpClient;
    service = new BusinessProcessDefinitionService(appConfig, httpClient);

    const request: CreateBusinessProcessDefinitionRequest = {
      name: bpDefinition.name,
      description: bpDefinition.description,
      sourceDefinition: {
        definitionId: bpDefinition.id,
        familyId: "familyId",
      },
      inputs: {
        "input id": "value",
      },
    };
    await lastValueFrom(
      service.createBusinessProcessDefinition(projectId, request)
    );

    expect(httpClient.post).toHaveBeenCalledWith(
      getApiUrl(projectId) + "/definitions",
      {
        name: bpDefinition.name,
        description: bpDefinition.description,
        sourceDefinitionId: bpDefinition.id,
        providedInputs: [{ inputId: "input id", value: "value" }],
      }
    );
  });

  it("should not include null and undefined inputs when creating a bp definition", async () => {
    httpClient = {
      post: jest.fn(() => {
        return of(bpDefinition);
      }),
    } as unknown as HttpClient;
    service = new BusinessProcessDefinitionService(appConfig, httpClient);

    const request: CreateBusinessProcessDefinitionRequest = {
      name: bpDefinition.name,
      description: bpDefinition.description,
      sourceDefinition: {
        definitionId: bpDefinition.id,
        familyId: "familyId",
      },
      inputs: {
        "input id 1": null,
        "input id 2": undefined,
      },
    };
    await lastValueFrom(
      service.createBusinessProcessDefinition(projectId, request)
    );

    expect(httpClient.post).toHaveBeenCalledWith(
      getApiUrl(projectId) + "/definitions",
      {
        name: bpDefinition.name,
        description: bpDefinition.description,
        sourceDefinitionId: bpDefinition.id,
        providedInputs: [],
      }
    );
  });

  it("should not include empty string input values when creating a bp definition", async () => {
    httpClient = {
      post: jest.fn(() => {
        return of(bpDefinition);
      }),
    } as unknown as HttpClient;
    service = new BusinessProcessDefinitionService(appConfig, httpClient);

    const request: CreateBusinessProcessDefinitionRequest = {
      name: bpDefinition.name,
      description: bpDefinition.description,
      sourceDefinition: {
        definitionId: bpDefinition.id,
        familyId: "familyId",
      },
      inputs: {
        "input id 1": "",
      },
    };
    await lastValueFrom(
      service.createBusinessProcessDefinition(projectId, request)
    );

    expect(httpClient.post).toHaveBeenCalledWith(
      getApiUrl(projectId) + "/definitions",
      {
        name: bpDefinition.name,
        description: bpDefinition.description,
        sourceDefinitionId: bpDefinition.id,
        providedInputs: [],
      }
    );
  });

  it("should not include empty arrays input values when creating a bp definition", async () => {
    httpClient = {
      post: jest.fn(() => {
        return of(bpDefinition);
      }),
    } as unknown as HttpClient;
    service = new BusinessProcessDefinitionService(appConfig, httpClient);

    const request: CreateBusinessProcessDefinitionRequest = {
      name: bpDefinition.name,
      description: bpDefinition.description,
      sourceDefinition: {
        definitionId: bpDefinition.id,
        familyId: "familyId",
      },
      inputs: {
        "input id 1": [],
      },
    };
    await lastValueFrom(
      service.createBusinessProcessDefinition(projectId, request)
    );

    expect(httpClient.post).toHaveBeenCalledWith(
      getApiUrl(projectId) + "/definitions",
      {
        name: bpDefinition.name,
        description: bpDefinition.description,
        sourceDefinitionId: bpDefinition.id,
        providedInputs: [],
      }
    );
  });

  it("given an error occurred when creating a bp definition then return error message", async () => {
    const errorMessage = "Error";

    httpClient = {
      post: jest.fn(() =>
        throwError(
          (): HttpErrorResponse =>
            ({ error: { message: errorMessage } } as HttpErrorResponse)
        )
      ),
    } as unknown as HttpClient;
    service = new BusinessProcessDefinitionService(appConfig, httpClient);

    const request: CreateBusinessProcessDefinitionRequest = {
      name: bpDefinition.name,
      description: bpDefinition.description,
      sourceDefinition: {
        definitionId: bpDefinition.id,
        familyId: "familyId",
      },
      inputs: {
        "input id 1": [],
      },
    };

    await expect(
      lastValueFrom(service.createBusinessProcessDefinition(projectId, request))
    ).rejects.toEqual(expect.objectContaining({ message: "Error" }));
  });

  it("should get bp definition by id correctly", async () => {
    httpClient = {
      get: jest.fn(() => {
        return of([bpDefinition]);
      }),
    } as unknown as HttpClient;
    service = new BusinessProcessDefinitionService(appConfig, httpClient);

    const businessProcessDefinitions = await lastValueFrom(
      service.getBusinessProcessDefinition(projectId, bpDefinitionId)
    );
    expect(businessProcessDefinitions).toEqual([bpDefinition]);
    expect(httpClient.get).toHaveBeenCalledWith(
      getApiUrl(projectId) + "/definitions/" + bpDefinitionId
    );
  });

  it("shoud return error status if an error occured when getting definition by id", (done: DoneFn) => {
    httpClient = {
      get: jest.fn(() =>
        throwError(
          (): HttpErrorResponse =>
            ({ error: { status: 400 } } as HttpErrorResponse)
        )
      ),
    } as unknown as HttpClient;

    service = new BusinessProcessDefinitionService(appConfig, httpClient);

    service.getBusinessProcessDefinition(projectId, bpDefinitionId).subscribe({
      error: (error) => {
        expect(error.status).toEqual(400);
        done();
      },
    });
  });

  it("shoud return error message if an error occured when getting definition by id", (done: DoneFn) => {
    const errorMessage = "errorMessage";
    httpClient = {
      get: jest.fn(() =>
        throwError(
          (): HttpErrorResponse =>
            ({ error: errorMessage } as HttpErrorResponse)
        )
      ),
    } as unknown as HttpClient;

    service = new BusinessProcessDefinitionService(appConfig, httpClient);

    service.getBusinessProcessDefinition(projectId, bpDefinitionId).subscribe({
      error: (error) => {
        expect(error.message).toEqual(errorMessage);
        done();
      },
    });
  });

  it("should edit bp definition correctly", async () => {
    httpClient = {
      put: jest.fn(() => {
        return of(bpDefinition);
      }),
    } as unknown as HttpClient;
    service = new BusinessProcessDefinitionService(appConfig, httpClient);

    const request = {
      name: bpDefinition.name,
      description: bpDefinition.description,
      inputs: {
        "input id": "value",
      },
    };
    const businessProcessDefinitions = await lastValueFrom(
      service.editBusinessProcessDefinition(projectId, bpDefinitionId, request)
    );
    expect(businessProcessDefinitions).toEqual(bpDefinition);
    expect(httpClient.put).toHaveBeenCalledWith(
      getApiUrl(projectId) + "/definitions/" + bpDefinitionId,
      {
        name: bpDefinition.name,
        description: bpDefinition.description,
        providedInputs: [{ inputId: "input id", value: "value" }],
      }
    );
  });

  it("given an error occurred when editing definition then return error message", async () => {
    const errorMessage = "Error";

    httpClient = {
      put: jest.fn(() =>
        throwError(
          (): HttpErrorResponse =>
            ({ error: { message: errorMessage } } as HttpErrorResponse)
        )
      ),
    } as unknown as HttpClient;
    service = new BusinessProcessDefinitionService(appConfig, httpClient);

    const request = {
      name: bpDefinition.name,
      description: bpDefinition.description,
      inputs: {
        "input id": "value",
      },
    };

    await expect(
      lastValueFrom(
        service.editBusinessProcessDefinition(
          projectId,
          bpDefinitionId,
          request
        )
      )
    ).rejects.toEqual(expect.objectContaining({ message: "Error" }));
  });

  it("should delete bp definition correctly", async () => {
    httpClient = {
      delete: jest.fn(() => {
        return of({});
      }),
    } as unknown as HttpClient;
    service = new BusinessProcessDefinitionService(appConfig, httpClient);

    await lastValueFrom(
      service.deleteBusinessProcessDefinition(projectId, bpDefinitionId)
    );
    expect(httpClient.delete).toHaveBeenCalledWith(
      getApiUrl(projectId) + "/definitions/" + bpDefinitionId
    );
  });

  it("given an error occurred when deleting definition then return error message", async () => {
    const errorMessage = "Error";

    httpClient = {
      delete: jest.fn(() =>
        throwError(
          (): HttpErrorResponse =>
            ({ error: { message: errorMessage } } as HttpErrorResponse)
        )
      ),
    } as unknown as HttpClient;
    service = new BusinessProcessDefinitionService(appConfig, httpClient);

    await expect(
      lastValueFrom(
        service.deleteBusinessProcessDefinition(projectId, bpDefinitionId)
      )
    ).rejects.toEqual(expect.objectContaining({ message: "Error" }));
  });

  it("should check if business process definition exists", async () => {
    httpClient = {
      get: jest.fn(() => {
        return of([bpDefinition]);
      }),
    } as unknown as HttpClient;

    service = new BusinessProcessDefinitionService(appConfig, httpClient);

    service
      .businessProcessDefinitionExists(projectId, bpDefinitionId)
      .subscribe((value) => {
        expect(value).toEqual(true);
      });
  });

  it("should check if business process definition does not exist with status 404 from backend", () => {
    httpClient = {
      get: jest.fn(() =>
        throwError(() => of({ status: 404, message: "error message" }))
      ),
    } as unknown as HttpClient;

    service = new BusinessProcessDefinitionService(appConfig, httpClient);

    service
      .businessProcessDefinitionExists(projectId, bpDefinitionId)
      .subscribe((value) => {
        expect(value).toEqual(false);
      });
  });

  function getApiUrl(projectId: string) {
    return "gateway/projects/" + projectId + "/business-process";
  }
});

describe("Business Process Definition Service Integration Test", () => {
  let service: BusinessProcessDefinitionService;
  const gatewayUrl = "http://gatewayUrl/";

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BusinessProcessDefinitionService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: gatewayUrl } },
      ],
    });

    service = TestBed.inject(BusinessProcessDefinitionService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call the server correctly when fetching all the definitions in a project", () => {
    let server = TestBed.inject(HttpTestingController);

    service
      .getBusinessProcessDefinitions({ projectId: projectId })
      .subscribe((data) => {
        expect(data).toStrictEqual([bpDefinition]);
      });

    let testRequest = server.expectOne(
      `${gatewayUrl}projects/${projectId}/business-process/definitions`
    );

    expect(testRequest.request.method).toStrictEqual("GET");
    testRequest.flush([bpDefinition]);

    server.verify();
  });

  it("should handle the errors correctly when fetching all definitions in a project", () => {
    let server = TestBed.inject(HttpTestingController);

    service.getBusinessProcessDefinitions({ projectId: projectId }).subscribe({
      next: () => {
        fail("Should have failed with an error");
      },
      error: (error) => {
        expect(error).toBeTruthy();
        expect(error.status).toBe(500);
      },
    });

    const mockErrorResponse = {
      status: 500,
      statusText: "Internal Server Error",
    };
    const data = "Error occurred while fetching dashboard information";
    const req = server.expectOne(
      `${gatewayUrl}projects/${projectId}/business-process/definitions`
    );

    req.flush(data, mockErrorResponse);

    server.verify();
  });

  it("should call the server correctly when fetching the extendable definitions in a project", () => {
    let server = TestBed.inject(HttpTestingController);

    let extendable = randomBoolean();
    service
      .getBusinessProcessDefinitions({
        projectId: projectId,
        extendable: extendable,
      })
      .subscribe((data) => {
        expect(data).toStrictEqual([bpDefinition]);
      });

    let testRequest = server.expectOne(
      `${gatewayUrl}projects/${projectId}/business-process/definitions?extendable=${extendable}`
    );

    expect(testRequest.request.method).toStrictEqual("GET");

    testRequest.flush([bpDefinition]);

    server.verify();
  });

  it("should call the server correctly when fetching the executable definitions in a project", () => {
    let server = TestBed.inject(HttpTestingController);

    let executable = randomBoolean();
    service
      .getBusinessProcessDefinitions({
        projectId: projectId,
        executable: executable,
      })
      .subscribe((data) => {
        expect(data).toStrictEqual([bpDefinition]);
      });

    let testRequest = server.expectOne(
      `${gatewayUrl}projects/${projectId}/business-process/definitions?executable=${executable}`
    );

    expect(testRequest.request.method).toStrictEqual("GET");

    testRequest.flush([bpDefinition]);

    server.verify();
  });

  function randomBoolean() {
    return Math.random() < 0.5;
  }
});
