import { buildConfigAuditArtifactMenuItems } from "./config-audit-artifact-menu.builder";

describe("buildConfigAuditArtifactMenuItems", () => {
  it("groups CSV and HTML artifacts into separate menu groups", () => {
    const items = buildConfigAuditArtifactMenuItems([
      "https://storage/path/report.csv",
      "https://storage/path/report.html",
    ]);

    expect(items).toHaveLength(2);
    const csvGroup = items.find((item) => item.label === "CSV");
    const htmlGroup = items.find((item) => item.label === "HTML");
    expect(csvGroup?.icon).toBe("pi pi-file-excel");
    expect(htmlGroup?.icon).toBe("pi pi-globe");
    expect(csvGroup?.items?.[0].label).toBe("report.csv");
    expect(htmlGroup?.items?.[0].label).toBe("report.html");
  });

  it("ignores artifacts with unsupported extensions", () => {
    const items = buildConfigAuditArtifactMenuItems([
      "https://storage/path/report.txt",
    ]);

    expect(items).toHaveLength(0);
  });

  it("opens the artifact URL in a new tab when a menu item is invoked", () => {
    const openSpy = jest
      .spyOn(window, "open")
      .mockImplementation(() => null);

    const items = buildConfigAuditArtifactMenuItems([
      "https://storage/path/report.csv",
    ]);
    const command = items[0].items?.[0].command;
    command?.({} as never);

    expect(openSpy).toHaveBeenCalledWith(
      "https://storage/path/report.csv",
      "_blank"
    );
    openSpy.mockRestore();
  });
});
