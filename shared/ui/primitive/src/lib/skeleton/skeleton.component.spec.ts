import { render } from "@testing-library/angular";
import { Skeleton } from "primeng/skeleton";
import { SkeletonComponent } from "./skeleton.component";

async function renderSkeleton(rows?: number, columns?: number) {
  const inputs: Record<string, number> = {};
  if (rows != null) {
    inputs["rows"] = rows;
  }
  if (columns != null) {
    inputs["columns"] = columns;
  }
  return render(SkeletonComponent, {
    inputs,
    componentImports: [Skeleton],
  });
}

describe("SkeletonComponent", () => {
  it("renders a single cell by default", async () => {
    const { container } = await renderSkeleton();
    expect(container.querySelectorAll("p-skeleton").length).toBe(1);
  });

  it("renders rows x columns skeleton cells", async () => {
    const { container } = await renderSkeleton(3, 2);
    expect(container.querySelectorAll("p-skeleton").length).toBe(6);
  });

  it("renders no cells when rows is 0", async () => {
    const { container } = await renderSkeleton(0, 4);
    expect(container.querySelectorAll("p-skeleton").length).toBe(0);
  });
});
