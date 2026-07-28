import { MenuItem } from "primeng/api";
import { AuthorizationInput, AuthorizationService } from "@mxflow/core/auth";
import { forkJoin, Observable, of } from "rxjs";
import { map, switchMap, take } from "rxjs/operators";

/**
 * Resolves the authorization state for a menu item. A single
 * `authorizationInput` is checked directly; an array of inputs requires every
 * permission to pass (logical AND), so a relocated item can keep every gate it
 * had before.
 */
function isMenuItemAuthorized(
  authInput: AuthorizationInput | AuthorizationInput[] | undefined,
  authService: AuthorizationService
): Observable<boolean> {
  if (!authInput) {
    return of(true);
  }

  const inputs = Array.isArray(authInput) ? authInput : [authInput];
  if (inputs.length === 0) {
    return of(true);
  }

  return forkJoin(
    inputs.map((input) => authService.isAuthorized(input).pipe(take(1)))
  ).pipe(map((results) => results.every(Boolean)));
}

export function filterMenuItemsByAuthorization(
  items: MenuItem[],
  authService: AuthorizationService
): Observable<MenuItem[]> {
  if (items.length === 0) {
    return of([]);
  }

  const itemChecks$ = items.map((item) => {
    const authInput: AuthorizationInput | AuthorizationInput[] | undefined =
      item.state?.["authorizationInput"];

    const authorized$: Observable<boolean> = isMenuItemAuthorized(
      authInput,
      authService
    );

    return authorized$.pipe(
      switchMap((authorized) => {
        if (!authorized) {
          return of(null);
        }

        if (item.items && item.items.length > 0) {
          return filterMenuItemsByAuthorization(item.items, authService).pipe(
            map((filteredChildren) => {
              if (filteredChildren.length === 0 && !item.routerLink) {
                return null;
              }

              return { ...item, items: filteredChildren };
            })
          );
        }

        return of(item);
      })
    );
  });

  return forkJoin(itemChecks$).pipe(
    map((results) => results.filter((item): item is MenuItem => item !== null))
  );
}
