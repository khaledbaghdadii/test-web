# Testing component rendering

Assert visible text, roles, and element presence to verify what the user actually sees. Use `getByText` for text content, `getByRole` for interactive elements, and `queryBy*` when asserting absence.

```typescript
it("shows the execution name in the header", async () => {
  await renderComponent({ executionName: "my-execution" });

  expect(screen.getByText("Run - my-execution")).toBeTruthy();
});

it("renders the abort button", async () => {
  await renderComponent();

  expect(screen.getByRole("button", { name: "Abort business process" })).toBeTruthy();
});

it("is disabled when the process status is PASSED", async () => {
  await renderComponent({ status: ExecutionStatus.PASSED });

  expect(screen.getByRole("button", { name: "Abort business process" })).toBeDisabled();
});

it("does not show the branch failure message when branch creation succeeded", async () => {
  const user = userEvent.setup();
  await renderComponent({ branchCreation: { developmentId: "dev-1", failed: false } });

  await user.click(screen.getByText("Branch Details"));

  expect(screen.queryByText(/Branch creation failed/)).toBeNull();
});
```
