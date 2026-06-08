import { ConfigAuditArtifactMenuBuilder } from "@mxflow/features/environment";

describe("Config Audit Artifact Menu Builder", () => {
  it("should return an empty array when given no artifacts", () => {
    expect(ConfigAuditArtifactMenuBuilder.buildMenuItems([])).toEqual([]);
  });

  it("should ignore artifacts with unsupported file extensions", () => {
    const result = ConfigAuditArtifactMenuBuilder.buildMenuItems([
      "https://host/reports/skip.txt",
      "https://host/reports/skip.json",
      "https://host/reports/skip.xml",
    ]);

    expect(result).toEqual([]);
  });

  it("should create a CSV group for .csv artifacts", () => {
    const result = ConfigAuditArtifactMenuBuilder.buildMenuItems([
      "https://host/reports/report.csv",
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("CSV");
    expect(result[0].icon).toBe("pi pi-file-excel");
    expect(result[0].items).toHaveLength(1);
  });

  it("should create an HTML group for .html artifacts", () => {
    const result = ConfigAuditArtifactMenuBuilder.buildMenuItems([
      "https://host/reports/index.html",
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("HTML");
    expect(result[0].icon).toBe("pi pi-globe");
    expect(result[0].items).toHaveLength(1);
  });

  it("should create separate groups for CSV and HTML artifacts", () => {
    const result = ConfigAuditArtifactMenuBuilder.buildMenuItems([
      "https://host/reports/lint-report.csv",
      "https://host/reports/index.html",
    ]);

    expect(result).toHaveLength(2);
    expect(result.map((g) => g.label)).toEqual(["CSV", "HTML"]);
  });

  it("should group multiple files of the same type under one parent", () => {
    const result = ConfigAuditArtifactMenuBuilder.buildMenuItems([
      "https://host/reports/first.csv",
      "https://host/reports/second.csv",
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(2);
    expect(result[0].items?.map((i) => i.label)).toEqual([
      "first.csv",
      "second.csv",
    ]);
  });

  it("should use the decoded file name as the item label", () => {
    const result = ConfigAuditArtifactMenuBuilder.buildMenuItems([
      "https://host/reports/my%20report%20file.csv",
    ]);

    expect(result[0].items?.[0].label).toBe("my report file.csv");
  });

  it("should mix supported and unsupported types, only grouping supported ones", () => {
    const result = ConfigAuditArtifactMenuBuilder.buildMenuItems([
      "https://host/reports/lint-report.csv",
      "https://host/reports/index.html",
      "https://host/reports/ignored.json",
      "https://host/reports/also-ignored.txt",
    ]);

    expect(result).toHaveLength(2);
    expect(result.map((g) => g.label)).toEqual(["CSV", "HTML"]);
  });

  it("should set a command that opens the artifact URL in a new tab", () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);

    const url = "https://host/reports/report.csv";
    const result = ConfigAuditArtifactMenuBuilder.buildMenuItems([url]);

    result[0].items?.[0].command?.({} as never);

    expect(openSpy).toHaveBeenCalledWith(url, "_blank");
    openSpy.mockRestore();
  });

  it("should preserve insertion order: CSV before HTML", () => {
    const result = ConfigAuditArtifactMenuBuilder.buildMenuItems([
      "https://host/reports/a.csv",
      "https://host/reports/b.html",
    ]);

    expect(result[0].label).toBe("CSV");
    expect(result[1].label).toBe("HTML");
  });

  it("should preserve insertion order: HTML before CSV when HTML comes first", () => {
    const result = ConfigAuditArtifactMenuBuilder.buildMenuItems([
      "https://host/reports/b.html",
      "https://host/reports/a.csv",
    ]);

    expect(result[0].label).toBe("HTML");
    expect(result[1].label).toBe("CSV");
  });
});
