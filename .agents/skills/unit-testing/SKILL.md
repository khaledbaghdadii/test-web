---
name: unit-testing 
description: This skill is for writing unit tests that verify the behavior of UI components in isolation. Unit tests should be focused on testing the functionality of a single component, without relying on external dependencies or the overall application state. They should be fast, reliable, and easy to maintain.
---

# Unit Testing Skill

## What is unit testing
A unit test is a repeatable way to verify the behavior of a single UI component in isolation.

## Hard Rules
- Use Angular Testing Library to write unit tests for UI components.
- Every behavior of a component should be covered by a test. EVERY detail should be covered: button states, error messages, tooltips, etc.
- One test per behavior. Do NOT group multiple behaviors in a single test.
- Tests should be derived from specficiations. Each specification should have a corresponding test that verifies the expected behavior.
- Test should be decoupled from implementation details. Tests should verify the "what" not the "how".
- Avoid the usage of NO_ERRORS_SCHEMA.
- When mocking dependencies, do not mock PrimeNg components, instead import them directly in the test setup.
- When mocking dependencies do not mock AG Grid components, instead import them directly in the test setup.
- Use user-event instead of fireEvent to simulate user interactions.
- Prefer querying elements that the user would interact with by role.
- Only use `document.querySelector` with the component's selector to assert that a mocked child component is rendered.
- Only query primeNg components and their attributes when there is no other way to assert the expected behavior.
- Do not test `should call serviceX when actionY happens`. Instead, test `should doZ when actionY happens` and verify the expected behavior (doZ) not the implementation details (call serviceX).
- Never rely on `data-testid`.

## Test setup
- Create a `renderComponent` function that sets up the test environment and renders the component under test. This function should set default values for required inputs and alllow overriding them when necessary.
- Use the `renderComponent` function in all tests to ensure consistency and reduce boilerplate code.
- Create a `MOCK_IMPORTS` array that contains all mocked dependencies of the component. This array should be passed to the `renderComponent` function to set up the test environment and allow overriding mocks when necessary.

## Test names
- Test names should describe the expected behavior.
- Do not use "should call serviceX when actionY happens" as a test name. Instead, use "should doZ when actionY happens". The test should verify the expected behavior (doZ) not the implementation details (call serviceX).

## Mocking child components with ng-mocks
- Always use `MockComponent(ActualComponent)` from `ng-mocks` to mock child components. Never write manual `@Component` stub classes.
- Import the actual component class and pass it to `MockComponent`. Add the result to `MOCK_IMPORTS`.
- To verify that a child component is rendered, use `document.querySelector` with the component's selector (e.g. `document.querySelector('mxevolve-environments-table')`).
- To verify inputs passed to a mocked child component, use `ngMocks.find(fixture, ActualComponent).componentInstance`.
- Avoid tests that only verify that an input was passed to a mocked component. Instead, verify that the component is rendered and assert all its inputs in the same test.
- To verify the behavior of a child component emitting an event, use `ngMocks.find(fixture, ActualComponent).componentInstance.someEvent.emit(someValue)`. Then assert the expected behavior in the parent component
- Do not use `detectChanges()`, instead use `waitFor()` to wait for the expected behavior to be reflected in the DOM.

## Testing components that use `rxResource`

- `rxResource` resolves asynchronously even when the loader returns a synchronous `of(...)`. In tests, always use `waitFor()` from `@testing-library/angular` when asserting data loaded from a resource or UI state that depends on it (e.g. a button being enabled after loading).

## Preventing test hangs

Tests that hang indefinitely are usually caused by missing animation providers or unmocked child components that trigger unresolvable dependency injection.

- **Always add `provideNoopAnimations()`** in the `providers` array when the component (or any of its imports) uses PrimeNG components with animations (`DialogModule`, `ConfirmDialog`, `ConfirmPopup`, `Overlay`, etc.). Without this, Angular's animation system can cause tests to hang forever.
- **Always mock ALL child components** that appear in the component's template using `MockComponent(ActualComponent)` in `MOCK_IMPORTS`. If a child component is imported by the component-under-test but not included in `MOCK_IMPORTS`, Angular may attempt to resolve its dependency tree (e.g. `HttpClient`, `GATEWAY_CONFIG`), which can cause injection errors or silent hangs.
- **Use `--forceExit`** when running tests via `npx nx test` to prevent Jest from hanging after all tests complete due to open handles (timers, subscriptions).
- **Use `--runTestsByPath` with direct jest** instead of `--testPathPattern` or `--testFile`. Jest 30 renamed `--testPathPattern` to `--testPathPatterns`, and neither works reliably through Nx. See the `web-unit-test-runner` skill for the reliable command.
- **Avoid `@if` conditional rendering with async state inside PrimeNG Dialog** — When content is conditionally rendered based on `rxResource` loading state inside a `<p-dialog>`, `render()` from `@testing-library/angular` may hang. Always render the component and let it handle its own loading state (e.g., ag-grid's `[loading]` prop).
- **Order side effects in Angular `effect()` carefully** — If an effect writes to a signal that transitively changes a signal it reads, Angular may reschedule the effect before subsequent lines execute. Do all non-signal side effects (toast messages, API calls) BEFORE signal writes that affect the effect's dependencies.

## Testing Ag Grid components
- Do not mock cell renders or value formatters. Instead, query the rendered DOM to verify their behavior.

## Examples

For detailed examples, see the files under the `examples/` directory:

- [examples/mocking-subcomponents.md](examples/mocking-subcomponents.md) — Setting up `MOCK_IMPORTS` with `MockComponent` and PrimeNG components.
- [examples/mocking-services.md](examples/mocking-services.md) — Defining mock services, providing them, and resetting in `beforeEach`.
- [examples/subcomponent-rendering.md](examples/subcomponent-rendering.md) — Asserting child component presence and inputs.
- [examples/subcomponent-interaction.md](examples/subcomponent-interaction.md) — Triggering output events on mocked children.
- [examples/component-interaction.md](examples/component-interaction.md) — Simulating user actions with `userEvent`.
- [examples/loading-state.md](examples/loading-state.md) — Using `Subject` to test loading states.
- [examples/tooltips.md](examples/tooltips.md) — Testing PrimeNG tooltips with `user.hover()`.
- [examples/component-rendering.md](examples/component-rendering.md) — Asserting visible text, roles, and element presence.
- [examples/tables.md](examples/tables.md) — General table testing patterns (headers, rows, cells, empty/loading states, links).
- [examples/ag-grid.md](examples/ag-grid.md) — AG Grid-specific setup and testing.
- [examples/routes.md](examples/routes.md) — Route-specific setup and testing.