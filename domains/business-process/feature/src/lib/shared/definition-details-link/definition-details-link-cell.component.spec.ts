import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular";
import {
  DefinitionDetailsLinkCellComponent,
  type DefinitionDetailsLinkCellParams,
} from "./definition-details-link-cell.component";

async function renderCell(params: Partial<DefinitionDetailsLinkCellParams>) {
  const result = await render(DefinitionDetailsLinkCellComponent, {
    providers: [provideRouter([])],
  });
  result.fixture.componentInstance.agInit(
    params as DefinitionDetailsLinkCellParams
  );
  result.fixture.detectChanges();
  return result;
}

describe("DefinitionDetailsLinkCellComponent", () => {
  it("builds the details link from the row definition id", async () => {
    await renderCell({
      value: "Master Validation",
      data: { definitionId: "def-42" } as never,
      projectId: "project-1",
    });

    expect(
      screen.getByRole("link", { name: "Master Validation" })
    ).toHaveAttribute(
      "href",
      "/app/project-1/business-process/definition/details/def-42"
    );
  });

  it("renders plain text when a row has no definition id", async () => {
    await renderCell({
      value: "Unavailable definition",
      data: {} as never,
      projectId: "project-1",
    });

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Unavailable definition")).toBeInTheDocument();
  });
});
