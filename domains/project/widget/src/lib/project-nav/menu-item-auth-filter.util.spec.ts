import { firstValueFrom, of, Subject } from "rxjs";
import { MenuItem } from "primeng/api";
import { AuthorizationInput, AuthorizationService } from "@mxflow/core/auth";
import { filterMenuItemsByAuthorization } from "./menu-item-auth-filter.util";

function createAuthInput(
  overrides: Partial<AuthorizationInput> = {}
): AuthorizationInput {
  return {
    action: "read",
    package: "pkg",
    attributes: {},
    resource: "res",
    ...overrides,
  };
}

function createMockAuthService(
  isAuthorizedFn: jest.Mock = jest.fn()
): jest.Mocked<AuthorizationService> {
  return {
    isAuthorized: isAuthorizedFn,
  } as unknown as jest.Mocked<AuthorizationService>;
}

describe("filterMenuItemsByAuthorization", () => {
  it("should return empty array when items is empty", async () => {
    const authService = createMockAuthService();
    const result = await firstValueFrom(
      filterMenuItemsByAuthorization([], authService)
    );

    expect(result).toEqual([]);
    expect(authService.isAuthorized).not.toHaveBeenCalled();
  });

  it("should include items without authorizationInput", async () => {
    const authService = createMockAuthService();
    const items: MenuItem[] = [
      { label: "Home", routerLink: ["/home"] },
      { label: "About", routerLink: ["/about"] },
    ];
    const result = await firstValueFrom(
      filterMenuItemsByAuthorization(items, authService)
    );

    expect(result).toEqual(items);
    expect(authService.isAuthorized).not.toHaveBeenCalled();
  });

  it("should include items where isAuthorized returns true", async () => {
    const authInput = createAuthInput();
    const authService = createMockAuthService(
      jest.fn().mockReturnValue(of(true))
    );
    const items: MenuItem[] = [
      { label: "Protected", state: { authorizationInput: authInput } },
    ];
    const result = await firstValueFrom(
      filterMenuItemsByAuthorization(items, authService)
    );

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Protected");
    expect(authService.isAuthorized).toHaveBeenCalledWith(authInput);
  });

  it("should exclude items where isAuthorized returns false", async () => {
    const authInput = createAuthInput();
    const authService = createMockAuthService(
      jest.fn().mockReturnValue(of(false))
    );
    const items: MenuItem[] = [
      { label: "Forbidden", state: { authorizationInput: authInput } },
    ];
    const result = await firstValueFrom(
      filterMenuItemsByAuthorization(items, authService)
    );

    expect(result).toEqual([]);
    expect(authService.isAuthorized).toHaveBeenCalledWith(authInput);
  });

  it("should filter children recursively", async () => {
    const allowedAuthInput = createAuthInput({ action: "allowed" });
    const deniedAuthInput = createAuthInput({ action: "denied" });
    const authService = createMockAuthService(
      jest
        .fn()
        .mockImplementation((input: AuthorizationInput) =>
          of(input.action === "allowed")
        )
    );
    const items: MenuItem[] = [
      {
        label: "Parent",
        items: [
          {
            label: "Allowed Child",
            state: { authorizationInput: allowedAuthInput },
          },
          {
            label: "Denied Child",
            state: { authorizationInput: deniedAuthInput },
          },
        ],
      },
    ];
    const result = await firstValueFrom(
      filterMenuItemsByAuthorization(items, authService)
    );

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Parent");
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items![0].label).toBe("Allowed Child");
  });

  it("should drop a parent when all children are filtered out and it has no route", async () => {
    const authInput = createAuthInput();
    const authService = createMockAuthService(
      jest.fn().mockReturnValue(of(false))
    );
    const items: MenuItem[] = [
      {
        label: "Parent",
        items: [
          {
            label: "Denied Child",
            state: { authorizationInput: authInput },
          },
        ],
      },
    ];
    const result = await firstValueFrom(
      filterMenuItemsByAuthorization(items, authService)
    );

    expect(result).toEqual([]);
  });

  it("should keep a parent route when all children are filtered out", async () => {
    const authInput = createAuthInput();
    const authService = createMockAuthService(
      jest.fn().mockReturnValue(of(false))
    );
    const items: MenuItem[] = [
      {
        label: "Parent",
        routerLink: ["/parent"],
        items: [
          {
            label: "Denied Child",
            state: { authorizationInput: authInput },
          },
        ],
      },
    ];
    const result = await firstValueFrom(
      filterMenuItemsByAuthorization(items, authService)
    );

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Parent");
    expect(result[0].items).toEqual([]);
  });

  it("should handle mix of authorized and unauthorized items", async () => {
    const allowedAuthInput = createAuthInput({ action: "allowed" });
    const deniedAuthInput = createAuthInput({ action: "denied" });
    const authService = createMockAuthService(
      jest
        .fn()
        .mockImplementation((input: AuthorizationInput) =>
          of(input.action === "allowed")
        )
    );
    const items: MenuItem[] = [
      { label: "No Auth" },
      {
        label: "Allowed",
        state: { authorizationInput: allowedAuthInput },
      },
      {
        label: "Denied",
        state: { authorizationInput: deniedAuthInput },
      },
      { label: "Another No Auth" },
    ];
    const result = await firstValueFrom(
      filterMenuItemsByAuthorization(items, authService)
    );

    expect(result).toHaveLength(3);
    expect(result.map((i) => i.label)).toEqual([
      "No Auth",
      "Allowed",
      "Another No Auth",
    ]);
  });

  it("should include an item only when every authorization input passes", async () => {
    const allowedAuthInput = createAuthInput({ resource: "allowed" });
    const deniedAuthInput = createAuthInput({ resource: "denied" });
    const authService = createMockAuthService(
      jest
        .fn()
        .mockImplementation((input: AuthorizationInput) =>
          of(input.resource === "allowed")
        )
    );
    const items: MenuItem[] = [
      {
        label: "Needs Both",
        state: { authorizationInput: [allowedAuthInput, deniedAuthInput] },
      },
    ];
    const result = await firstValueFrom(
      filterMenuItemsByAuthorization(items, authService)
    );

    expect(result).toEqual([]);
  });

  it("should include an item when all authorization inputs in the array pass", async () => {
    const firstAuthInput = createAuthInput({ resource: "first" });
    const secondAuthInput = createAuthInput({ resource: "second" });
    const authService = createMockAuthService(
      jest.fn().mockReturnValue(of(true))
    );
    const items: MenuItem[] = [
      {
        label: "Needs Both",
        state: { authorizationInput: [firstAuthInput, secondAuthInput] },
      },
    ];
    const result = await firstValueFrom(
      filterMenuItemsByAuthorization(items, authService)
    );

    expect(result).toHaveLength(1);
  });

  it("should emit even when isAuthorized observable does not complete", async () => {
    const authInput = createAuthInput();
    const subject = new Subject<boolean>();
    const authService = createMockAuthService(
      jest.fn().mockReturnValue(subject.asObservable())
    );
    const items: MenuItem[] = [
      { label: "Protected", state: { authorizationInput: authInput } },
    ];
    const resultPromise = firstValueFrom(
      filterMenuItemsByAuthorization(items, authService)
    );

    subject.next(true);

    const result = await resultPromise;
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Protected");
  });
});
