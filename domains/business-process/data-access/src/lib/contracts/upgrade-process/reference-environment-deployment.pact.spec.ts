import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { lastValueFrom } from "rxjs";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { ReferenceEnvironmentService } from "../../upgrade-process/reference-environments.service";

describe("business process contract tests", () => {
  const provider = new Pact({
    consumer: "web-business-process",
    provider: "business-process-execution-service",
  });

  const projectId = "projectId";
  const executionId = "executionId";
  const environmentIdToClean = "environmentIdToClean";

  let referenceEnvironmentService: ReferenceEnvironmentService;

  beforeAll(async () => {
    await provider.setup();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        {
          provide: GATEWAY_CONFIG,
          useValue: {
            gatewayUrl: `http://127.0.0.1:${provider.opts.port}/`,
          },
        },
        ReferenceEnvironmentService,
      ],
    });

    referenceEnvironmentService = TestBed.inject(ReferenceEnvironmentService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("validates contract for deploying a reference environment", async () => {
    await provider.addInteraction({
      state:
        "an upgrade process waiting for a deploy reference environment input",
      uponReceiving: "a request to deploy a reference environment",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/business-process/executions/binary-upgrade/${executionId}/user-input/deploy-reference-environment`,
        headers: {
          "Content-Type": "text/plain",
        },
        body: "",
      },
      willRespondWith: {
        status: 204,
      },
    });

    await expect(
      lastValueFrom(
        referenceEnvironmentService.deployReferenceEnvironment(
          projectId,
          executionId
        )
      )
    ).resolves.not.toThrow();
  });

  test("validates contract for cleaning and deploying a reference environment", async () => {
    await provider.addInteraction({
      state:
        "an upgrade process waiting for a clean and deploy reference environment input",
      uponReceiving: "a request to clean and deploy a reference environment",
      withRequest: {
        method: "POST",
        path: `/projects/${projectId}/business-process/executions/binary-upgrade/${executionId}/user-input/clean-and-deploy-reference-environment`,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          environmentIdToClean: Matchers.string(environmentIdToClean),
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    await expect(
      lastValueFrom(
        referenceEnvironmentService.cleanAndDeployReferenceEnvironment(
          projectId,
          executionId,
          environmentIdToClean
        )
      )
    ).resolves.not.toThrow();
  });
});
