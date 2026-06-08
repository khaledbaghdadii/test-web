import { GitFileStatusCode } from "../../remote-cloned-repository/model";
import {
  ChangedFile,
  toChangedFileDisplay,
  toChangedFileDisplays,
} from "./changed-file";

describe("toChangedFileDisplay", () => {
  it("should extract fileName and directory from nested path", () => {
    const file: ChangedFile = {
      filePath: "src/app/component.ts",
      statusCode: GitFileStatusCode.WORKTREE_MODIFIED,
    };

    const result = toChangedFileDisplay(file);

    expect(result.fileName).toBe("component.ts");
    expect(result.directory).toBe("src/app");
  });

  it("should set empty directory for root-level file", () => {
    const file: ChangedFile = {
      filePath: "README.md",
      statusCode: GitFileStatusCode.INDEX_ADDED,
    };

    const result = toChangedFileDisplay(file);

    expect(result.fileName).toBe("README.md");
    expect(result.directory).toBe("");
  });

  it("should map modified status to M with orange color", () => {
    const file: ChangedFile = {
      filePath: "file.ts",
      statusCode: GitFileStatusCode.INDEX_MODIFIED,
    };

    const result = toChangedFileDisplay(file);

    expect(result.label).toBe("M");
    expect(result.colorClass).toBe("text-orange-400");
  });

  it("should map worktree modified status to M with orange color", () => {
    const file: ChangedFile = {
      filePath: "file.ts",
      statusCode: GitFileStatusCode.WORKTREE_MODIFIED,
    };

    const result = toChangedFileDisplay(file);

    expect(result.label).toBe("M");
    expect(result.colorClass).toBe("text-orange-400");
  });

  it("should map added status to A with green color", () => {
    const file: ChangedFile = {
      filePath: "file.ts",
      statusCode: GitFileStatusCode.INDEX_ADDED,
    };

    const result = toChangedFileDisplay(file);

    expect(result.label).toBe("A");
    expect(result.colorClass).toBe("text-green-400");
  });

  it("should map deleted status to D with red color", () => {
    const file: ChangedFile = {
      filePath: "file.ts",
      statusCode: GitFileStatusCode.INDEX_DELETED,
    };

    const result = toChangedFileDisplay(file);

    expect(result.label).toBe("D");
    expect(result.colorClass).toBe("text-red-400");
  });

  it("should map renamed status to R with blue color", () => {
    const file: ChangedFile = {
      filePath: "file.ts",
      statusCode: GitFileStatusCode.INDEX_RENAMED,
    };

    const result = toChangedFileDisplay(file);

    expect(result.label).toBe("R");
    expect(result.colorClass).toBe("text-blue-400");
  });

  it("should map untracked status to U with green color", () => {
    const file: ChangedFile = {
      filePath: "file.ts",
      statusCode: GitFileStatusCode.UNTRACKED,
    };

    const result = toChangedFileDisplay(file);

    expect(result.label).toBe("U");
    expect(result.colorClass).toBe("text-green-400");
  });

  it("should map conflicted status to exclamation with red color", () => {
    const file: ChangedFile = {
      filePath: "file.ts",
      statusCode: GitFileStatusCode.BOTH_MODIFIED,
    };

    const result = toChangedFileDisplay(file);

    expect(result.label).toBe("!");
    expect(result.colorClass).toBe("text-red-500");
  });

  it("should map unknown status to question mark with gray color", () => {
    const file: ChangedFile = {
      filePath: "file.ts",
      statusCode: GitFileStatusCode.UNKNOWN,
    };

    const result = toChangedFileDisplay(file);

    expect(result.label).toBe("?");
    expect(result.colorClass).toBe("text-gray-400");
  });

  it("should preserve full filePath in result", () => {
    const file: ChangedFile = {
      filePath: "deep/nested/path/file.ts",
      statusCode: GitFileStatusCode.INDEX_ADDED,
    };

    const result = toChangedFileDisplay(file);

    expect(result.filePath).toBe("deep/nested/path/file.ts");
  });
});

describe("toChangedFileDisplays", () => {
  it("should exclude files with unknown status", () => {
    const files: ChangedFile[] = [
      { filePath: "unknown.ts", statusCode: GitFileStatusCode.UNKNOWN },
      {
        filePath: "modified.ts",
        statusCode: GitFileStatusCode.WORKTREE_MODIFIED,
      },
    ];

    const result = toChangedFileDisplays(files);

    expect(result).toHaveLength(1);
    expect(result[0].filePath).toBe("modified.ts");
  });

  it("should return empty array when all files have unknown status", () => {
    const files: ChangedFile[] = [
      { filePath: "a.ts", statusCode: GitFileStatusCode.UNKNOWN },
      { filePath: "b.ts", statusCode: GitFileStatusCode.UNKNOWN },
    ];

    expect(toChangedFileDisplays(files)).toEqual([]);
  });

  it("should map all changed files to displays preserving order", () => {
    const files: ChangedFile[] = [
      {
        filePath: "src/deleted.ts",
        statusCode: GitFileStatusCode.INDEX_DELETED,
      },
      { filePath: "src/added.ts", statusCode: GitFileStatusCode.INDEX_ADDED },
      {
        filePath: "src/modified.ts",
        statusCode: GitFileStatusCode.WORKTREE_MODIFIED,
      },
    ];

    const result = toChangedFileDisplays(files);

    expect(result).toHaveLength(3);
    expect(result[0].label).toBe("D");
    expect(result[1].label).toBe("A");
    expect(result[2].label).toBe("M");
  });

  it("should return empty array for empty input", () => {
    expect(toChangedFileDisplays([])).toEqual([]);
  });
});
