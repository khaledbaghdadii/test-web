import { render, screen, waitFor } from "@testing-library/angular";
import type { ICellRendererParams } from "ag-grid-community";
import { BuildAndTestBackportLinkCellRendererComponent } from "./build-and-test-backport-link-cell-renderer.component";

type LinkRow = { readonly href?: string };

describe("BuildAndTestBackportLinkCellRendererComponent", () => {
  it("renders a link with the label and href from the cell params", async () => {
    const { fixture } = await render(
      BuildAndTestBackportLinkCellRendererComponent
    );
    fixture.componentInstance.agInit({
      value: "VAL-123",
      data: { href: "https://example.com/backport/VAL-123" },
    } as ICellRendererParams<LinkRow>);
    fixture.detectChanges();

    await waitFor(() => {
      const link = screen.getByRole("link", { name: "VAL-123" });
      expect(link).toHaveAttribute(
        "href",
        "https://example.com/backport/VAL-123"
      );
    });
  });

  it("opens the link in a new tab safely", async () => {
    const { fixture } = await render(
      BuildAndTestBackportLinkCellRendererComponent
    );
    fixture.componentInstance.agInit({
      value: "VAL-123",
      data: { href: "https://example.com/backport/VAL-123" },
    } as ICellRendererParams<LinkRow>);
    fixture.detectChanges();

    await waitFor(() => {
      const link = screen.getByRole("link", { name: "VAL-123" });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("renders an empty label when the cell value is missing", async () => {
    const { fixture } = await render(
      BuildAndTestBackportLinkCellRendererComponent
    );
    fixture.componentInstance.agInit({
      value: undefined,
      data: { href: "https://example.com/backport" },
    } as ICellRendererParams<LinkRow>);
    fixture.detectChanges();

    await waitFor(() => {
      const link = screen.getByRole("link");
      expect(link).toHaveTextContent("");
      expect(link).toHaveAttribute("href", "https://example.com/backport");
    });
  });

  it("renders plain text when the row data is missing", async () => {
    const { fixture } = await render(
      BuildAndTestBackportLinkCellRendererComponent
    );

    fixture.componentInstance.agInit({
      value: "VAL-456",
    } as ICellRendererParams<LinkRow>);
    fixture.detectChanges();

    expect(screen.getByText("VAL-456")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "VAL-456" })
    ).not.toBeInTheDocument();
  });

  it("updates the rendered link when the cell is refreshed", async () => {
    const { fixture } = await render(
      BuildAndTestBackportLinkCellRendererComponent
    );
    fixture.componentInstance.agInit({
      value: "VAL-123",
      data: { href: "https://example.com/backport/VAL-123" },
    } as ICellRendererParams<LinkRow>);
    fixture.detectChanges();

    fixture.componentInstance.refresh({
      value: "VAL-789",
      data: { href: "https://example.com/backport/VAL-789" },
    } as ICellRendererParams<LinkRow>);
    fixture.detectChanges();

    await waitFor(() => {
      const link = screen.getByRole("link", { name: "VAL-789" });
      expect(link).toHaveAttribute(
        "href",
        "https://example.com/backport/VAL-789"
      );
    });
  });
});
