import { MenuItem } from "primeng/api";

type ArtifactType = "CSV" | "HTML";

const ARTIFACT_TYPE_MAP: Record<string, ArtifactType> = {
  ".csv": "CSV",
  ".html": "HTML",
};

const ARTIFACT_ICON_MAP: Record<ArtifactType, string> = {
  CSV: "pi pi-file-excel",
  HTML: "pi pi-globe",
};

export class ConfigAuditArtifactMenuBuilder {
  static buildMenuItems(artifacts: string[]): MenuItem[] {
    const groups = new Map<ArtifactType, MenuItem[]>();

    for (const url of artifacts) {
      const decoded = decodeURIComponent(url);
      const fileName = decoded.split("/").pop() ?? "";
      const type = ConfigAuditArtifactMenuBuilder.resolveType(fileName);

      if (!type) {
        continue;
      }

      if (!groups.has(type)) {
        groups.set(type, []);
      }

      groups.get(type)!.push({
        label: fileName,
        command: () => window.open(url, "_blank"),
      });
    }

    return Array.from(groups.entries()).map(([type, items]) => ({
      label: type,
      icon: ARTIFACT_ICON_MAP[type],
      items,
    }));
  }

  private static resolveType(fileName: string): ArtifactType | null {
    const lower = fileName.toLowerCase();
    for (const [ext, type] of Object.entries(ARTIFACT_TYPE_MAP)) {
      if (lower.endsWith(ext)) {
        return type;
      }
    }
    return null;
  }
}
