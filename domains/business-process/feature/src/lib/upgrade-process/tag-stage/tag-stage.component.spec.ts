import { render, screen } from "@testing-library/angular";
import { MockComponent } from "ng-mocks";
import { Divider } from "primeng/divider";
import { Card } from "primeng/card";
import { TagStageComponent } from "./tag-stage.component";
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import { MxevolveIllustrationComponent } from "@mxevolve/shared/ui/primitive";

const MOCK_IMPORTS = [
  StageContainerComponent,
  BusinessProcessContentContainerComponent,
  MockComponent(MxevolveIllustrationComponent),
  Divider,
  Card,
];

const REQUIRED_INPUTS = {
  tagName: "v1.0.0",
  taggedCommitId: "abc123def456",
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(TagStageComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
  });
}

describe("TagStageComponent", () => {
  it("displays the tag name", async () => {
    await renderComponent({ tagName: "release-2.5.0" });

    expect(screen.getByText("release-2.5.0")).toBeTruthy();
  });

  it("displays the tagged commit ID", async () => {
    await renderComponent({ taggedCommitId: "deadbeef1234" });

    expect(screen.getByText("deadbeef1234")).toBeTruthy();
  });
});
