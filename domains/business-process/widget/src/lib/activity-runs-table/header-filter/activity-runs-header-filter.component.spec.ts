import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import type { Column, IHeaderParams } from "ag-grid-enterprise";
import { ActivityRunsHeaderFilterComponent } from "./activity-runs-header-filter.component";
import type {
  ActivityRunsHeaderFilterParams,
  ActivityRunsTableContext,
} from "../activity-runs-table.types";

function buildColumn(sort: "asc" | "desc" | null = null): Column {
  return {
    getSort: () => sort,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  } as unknown as Column;
}

function buildParams(
  overrides: Partial<ActivityRunsHeaderFilterParams> = {},
  context?: Partial<ActivityRunsTableContext>,
  headerOverrides: Partial<IHeaderParams> = {}
): IHeaderParams &
  ActivityRunsHeaderFilterParams & {
    context: ActivityRunsTableContext;
  } {
  const ctx: ActivityRunsTableContext = {
    getFilterValue:
      context?.getFilterValue ?? jest.fn().mockReturnValue(undefined),
    setFilterValue: context?.setFilterValue ?? jest.fn(),
  };
  return {
    displayName: "Name",
    enableSorting: false,
    progressSort: jest.fn(),
    column: buildColumn(),
    context: ctx,
    filterKey: "namePhrase",
    filterType: "text",
    ...headerOverrides,
    ...overrides,
  } as unknown as IHeaderParams &
    ActivityRunsHeaderFilterParams & { context: ActivityRunsTableContext };
}

async function renderHeader(
  params: ReturnType<typeof buildParams>
): Promise<void> {
  const result = await render(ActivityRunsHeaderFilterComponent);
  result.fixture.componentInstance.agInit(params);
  result.fixture.detectChanges();
}

async function openFilterPopover(): Promise<void> {
  await userEvent.click(screen.getByRole("button", { name: "Filter Name" }));
}

describe("ActivityRunsHeaderFilterComponent", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }),
    });
  });

  afterEach(() => {
    document
      .querySelectorAll(
        ".p-popover, .p-multiselect-overlay, .p-datepicker-panel, .p-overlay, .p-connected-overlay"
      )
      .forEach((el) => el.remove());
  });

  it("renders the column display name", async () => {
    await renderHeader(buildParams());

    expect(screen.getByText("Name")).toBeTruthy();
  });

  it("restores the existing text filter value into the input", async () => {
    await renderHeader(
      buildParams(
        { filterType: "text" },
        { getFilterValue: jest.fn().mockReturnValue("existing") }
      )
    );

    await openFilterPopover();

    expect(await screen.findByRole("textbox")).toHaveValue("existing");
  });

  it("publishes the trimmed text value on apply", async () => {
    const setFilterValue = jest.fn();
    await renderHeader(buildParams({ filterType: "text" }, { setFilterValue }));

    await openFilterPopover();
    await userEvent.type(await screen.findByRole("textbox"), "  hello  ");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(setFilterValue).toHaveBeenCalledWith("namePhrase", "hello");
  });

  it("publishes undefined when the text value is blank", async () => {
    const setFilterValue = jest.fn();
    await renderHeader(buildParams({ filterType: "text" }, { setFilterValue }));

    await openFilterPopover();
    await userEvent.type(await screen.findByRole("textbox"), "   ");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(setFilterValue).toHaveBeenCalledWith("namePhrase", undefined);
  });

  it("clears the text input and publishes undefined on clear", async () => {
    const setFilterValue = jest.fn();
    await renderHeader(buildParams({ filterType: "text" }, { setFilterValue }));

    await openFilterPopover();
    await userEvent.type(await screen.findByRole("textbox"), "hello");
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(setFilterValue).toHaveBeenCalledWith("namePhrase", undefined);

    await openFilterPopover();
    const inputs = await screen.findAllByRole("textbox");
    const lastInput = inputs.at(-1);
    if (!lastInput) {
      throw new Error("Expected the filter input to be visible");
    }
    expect(lastInput).toHaveValue("");
  });

  it("publishes the selected values for a multiselect filter", async () => {
    const setFilterValue = jest.fn();
    await renderHeader(
      buildParams(
        {
          filterKey: "statuses",
          filterType: "multiselect",
          options: [
            { label: "Running", value: "RUNNING" },
            { label: "Passed", value: "PASSED" },
          ],
        },
        { setFilterValue }
      )
    );

    await openFilterPopover();
    await userEvent.click(
      document.querySelector(".p-multiselect") as HTMLElement
    );
    const runningOption = await screen.findByRole("option", {
      name: "Running",
    });
    await userEvent.click(runningOption);
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(setFilterValue).toHaveBeenCalledWith("statuses", ["RUNNING"]);
  });

  it("does not publish a date range until both bounds are picked", async () => {
    const setFilterValue = jest.fn();
    await renderHeader(
      buildParams(
        { filterKey: "startDateRange", filterType: "dateRange" },
        { setFilterValue }
      )
    );

    await openFilterPopover();
    await userEvent.click(
      document.querySelector(".p-datepicker-input") as HTMLElement
    );
    await pickCalendarDay(5);
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(setFilterValue).toHaveBeenCalledWith("startDateRange", undefined);
  });

  it("publishes the date range when both bounds are picked", async () => {
    const setFilterValue = jest.fn();
    await renderHeader(
      buildParams(
        { filterKey: "startDateRange", filterType: "dateRange" },
        { setFilterValue }
      )
    );

    await openFilterPopover();
    await userEvent.click(
      document.querySelector(".p-datepicker-input") as HTMLElement
    );
    await pickCalendarDay(5);
    await pickCalendarDay(15);
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    const [key, value] = setFilterValue.mock.calls.at(-1) ?? [];
    expect(key).toBe("startDateRange");
    expect(Array.isArray(value)).toBe(true);
    expect(value).toHaveLength(2);
  });

  it("progresses the sort when the label is clicked and sorting is enabled", async () => {
    const progressSort = jest.fn();
    await renderHeader(
      buildParams({}, undefined, { enableSorting: true, progressSort })
    );

    await userEvent.click(screen.getByRole("button", { name: "Name" }));

    expect(progressSort).toHaveBeenCalledWith(false);
  });

  it("does not progress the sort when sorting is disabled", async () => {
    const progressSort = jest.fn();
    await renderHeader(
      buildParams({}, undefined, { enableSorting: false, progressSort })
    );

    await userEvent.click(screen.getByText("Name"));

    expect(progressSort).not.toHaveBeenCalled();
  });
});

async function pickCalendarDay(index: number): Promise<void> {
  const days = Array.from(
    document.querySelectorAll("span.p-datepicker-day:not(.p-disabled)")
  );
  const day = days[index];
  if (!day) {
    throw new Error(`Calendar day at index ${index} not found`);
  }
  await userEvent.click(day);
}
