import { Matchers, Pact } from "@pact-foundation/pact";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { lastValueFrom } from "rxjs";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { ShutdownPolicyService } from "./shutdown-policy/shutdown-policy.service";

describe("shutdown policy contract tests", () => {
  const provider = new Pact({
    consumer: "web-environment",
    provider: "infra-management-service",
  });
  const pactFilePath = resolve(
    provider.opts.dir ?? resolve(__dirname, "../../../../../../pacts"),
    `${provider.opts.consumer}-${provider.opts.provider}.json`
  );

  const projectId = "projectId";
  const allocationId = "allocationId";

  let shutdownPolicyService: ShutdownPolicyService;

  beforeAll(async () => {
    rmSync(pactFilePath, { force: true });
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
        ShutdownPolicyService,
      ],
    });

    shutdownPolicyService = TestBed.inject(ShutdownPolicyService);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  test("validates contract for fetching the allocation shutdown policy state", async () => {
    await provider.addInteraction({
      state: "allocation exists",
      uponReceiving: "a request to fetch the allocation details",
      withRequest: {
        method: "GET",
        path: `/projects/${projectId}/infra/management/allocations/${allocationId}`,
      },
      willRespondWith: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          state: Matchers.regex({
            generate: "active",
            matcher:
              "active|deallocated|allocating|failed|queued|idle|provisioning|deallocating|deallocation_failed",
          }),
          allocationShutdownPolicy: {
            includedInShutdown: Matchers.boolean(),
          },
        },
      },
    });

    const result = await lastValueFrom(
      shutdownPolicyService.getEnvironmentShutdownPolicyState(
        projectId,
        allocationId
      )
    );

    expect(result).not.toBeNull();
    expect(result.actionsAllowed).toBeDefined();
  });

  test("validates contract for including an allocation in the shutdown policy", async () => {
    await provider.addInteraction({
      state: "allocation exists",
      uponReceiving: "a request to include the allocation in a shutdown policy",
      withRequest: {
        method: "PUT",
        path: `/projects/${projectId}/infra/management/allocations/${allocationId}/include`,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          policyType: "MUREX",
        },
      },
      willRespondWith: {
        status: 202,
      },
    });

    await expect(
      lastValueFrom(
        shutdownPolicyService.includeEnvironmentInShutdownPolicy(
          projectId,
          allocationId
        )
      )
    ).resolves.toBeNull();
  });

  test("validates contract for excluding an allocation from the shutdown policy", async () => {
    await provider.addInteraction({
      state: "allocation exists",
      uponReceiving:
        "a request to exclude the allocation from a shutdown policy",
      withRequest: {
        method: "PUT",
        path: `/projects/${projectId}/infra/management/allocations/${allocationId}/exclude`,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          policyType: "MUREX",
        },
      },
      willRespondWith: {
        status: 202,
      },
    });

    await expect(
      lastValueFrom(
        shutdownPolicyService.excludeEnvironmentFromShutdownPolicy(
          projectId,
          allocationId
        )
      )
    ).resolves.toBeNull();
  });
});
