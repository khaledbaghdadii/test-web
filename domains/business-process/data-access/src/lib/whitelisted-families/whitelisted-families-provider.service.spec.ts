import { AuthorizationService } from "@mxflow/core/auth";
import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { v4 as uuid } from "uuid";
import { WhitelistedFamiliesProvider } from "./whitelisted-families-provider.service";

describe("Whitelisted Families Provider", () => {
  const projectId = uuid();
  const policyError$ = throwError(() => new Error());

  let authorizationService: AuthorizationService;
  let provider: WhitelistedFamiliesProvider;

  beforeEach(() => {
    authorizationService = {
      evaluatePolicy: jest.fn(() => of({ whiteListedFamiliesIds: [] })),
    } as unknown as AuthorizationService;

    TestBed.configureTestingModule({
      providers: [
        WhitelistedFamiliesProvider,
        { provide: AuthorizationService, useValue: authorizationService },
      ],
    });

    provider = TestBed.inject(WhitelistedFamiliesProvider);
    authorizationService = TestBed.inject(AuthorizationService);
  });

  it("given the user's evaluated whitelisted families, then the system should grant the user access to these families", () => {
    const whitelistedFamilies = ["family-id-1", "family-id-2"];
    jest
      .spyOn(authorizationService, "evaluatePolicy")
      .mockReturnValue(of({ whiteListedFamiliesIds: whitelistedFamilies }));

    provider.getWhitelistedFamilies(projectId).subscribe((result) => {
      expect(result).toStrictEqual(whitelistedFamilies);
    });
  });

  it("given there was a failure in evaluating the user's whitelisted families, then the system should not grant the user access to any family", () => {
    jest
      .spyOn(authorizationService, "evaluatePolicy")
      .mockReturnValue(of(undefined));

    provider.getWhitelistedFamilies(projectId).subscribe((result) => {
      expect(result).toStrictEqual([]);
    });
  });

  it("given an error occurs when evaluating the user's whitelisted families, then the system should not grant the user access to any family", () => {
    jest
      .spyOn(authorizationService, "evaluatePolicy")
      .mockReturnValue(policyError$);

    provider.getWhitelistedFamilies(projectId).subscribe((result) => {
      expect(result).toStrictEqual([]);
    });
  });
});
