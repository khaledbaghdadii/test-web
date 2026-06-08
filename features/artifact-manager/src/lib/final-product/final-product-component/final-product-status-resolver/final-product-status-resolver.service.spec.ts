import { FinalProductStatusResolverService } from "./final-product-status-resolver.service";

describe("StatusResolverService", () => {
  let service: FinalProductStatusResolverService;

  beforeEach(() => {
    service = new FinalProductStatusResolverService();
  });

  it('should return "Available" status for "available" state', () => {
    const result = service.resolveStatus("available");
    expect(result).toEqual({
      severity: "success",
      label: "Available",
      icon: "pi pi-check",
    });
  });

  it('should return "Failed" status for "failed" state', () => {
    const result = service.resolveStatus("failed");
    expect(result).toEqual({
      severity: "danger",
      label: "Failed",
      icon: "pi pi-times",
    });
  });

  it('should return "Creating" status for "creating" state', () => {
    const result = service.resolveStatus("creating");
    expect(result).toEqual({
      severity: "info",
      label: "Creating",
      icon: "pi pi-info-circle",
    });
  });

  it('should return "Purged" status for "purged" state', () => {
    const result = service.resolveStatus("purged");
    expect(result).toEqual({
      severity: "contrast",
      label: "Purged",
      icon: "pi pi-trash",
    });
  });

  it('should return "Purging" status for "purging" state', () => {
    const result = service.resolveStatus("purging");
    expect(result).toEqual({
      severity: "warn",
      label: "Purging",
      icon: "pi pi-trash",
    });
  });

  it('should return "Purge Failed" status for "purge_failed" state', () => {
    const result = service.resolveStatus("purge_failed");
    expect(result).toEqual({
      severity: "danger",
      label: "Purge Failed",
      icon: "pi pi-trash",
    });
  });

  it('should return "Unknown Status" for any unknown state', () => {
    const result = service.resolveStatus("unknown_state");
    expect(result).toEqual({
      severity: "contrast",
      label: "Unknown Status",
      icon: "pi pi-question-circle",
    });
  });
});
