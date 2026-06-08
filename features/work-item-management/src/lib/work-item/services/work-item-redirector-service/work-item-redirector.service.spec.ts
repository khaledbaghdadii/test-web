import { WorkItemRedirectorService } from "./work-item-redirector.service";
import { WorkItemRedirectionRegistryService } from "../work-item-redirection-registry/work-item-redirection-registry.service";
import { WorkItemRedirector } from "../../handler/redirect/work-item-redirector";

const domain = "domain";
const workItemCategory = "workItemCategory";
describe("WorkItemRedirectorService", () => {
  let registry: jest.Mocked<WorkItemRedirectionRegistryService>;
  let service: WorkItemRedirectorService;

  const workItem = {
    domain: domain,
    workItemCategory: workItemCategory,
  } as any;

  beforeEach(() => {
    registry = {
      getHandler: jest.fn(),
    } as any;
    service = new WorkItemRedirectorService(registry);
  });

  it("should call redirect on handler if found", () => {
    const handler: WorkItemRedirector = { redirect: jest.fn() };
    registry.getHandler.mockReturnValue(handler);

    service.redirect(workItem);

    expect(registry.getHandler).toHaveBeenCalledWith(domain, workItemCategory);
    expect(handler.redirect).toHaveBeenCalledWith(workItem);
  });

  it("should log error if no handler found", () => {
    registry.getHandler.mockReturnValue(undefined);
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    service.redirect(workItem);

    expect(registry.getHandler).toHaveBeenCalledWith(domain, workItemCategory);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "No redirection handler found for",
      workItem
    );

    consoleErrorSpy.mockRestore();
  });
});
