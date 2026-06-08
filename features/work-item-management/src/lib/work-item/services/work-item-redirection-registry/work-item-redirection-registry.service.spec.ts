import { WorkItemRedirectionRegistryService } from "./work-item-redirection-registry.service";
import { WorkItemRedirector } from "../../handler/redirect/work-item-redirector";

const domain = "domain";
const workItemCategory = "workItemCategory";
describe("WorkItemRedirectionRegistryService", () => {
  let service: WorkItemRedirectionRegistryService;

  beforeEach(() => {
    service = new WorkItemRedirectionRegistryService();
  });

  it("should register and retrieve a handler", () => {
    const handler: WorkItemRedirector = { redirect: jest.fn() };
    service.registerHandler(domain, workItemCategory, handler);

    const retrieved = service.getHandler(domain, workItemCategory);
    expect(retrieved).toBe(handler);
  });

  it("should return undefined for unregistered handler", () => {
    const result = service.getHandler("domainB", "workItemCategoryB");
    expect(result).toBeUndefined();
  });

  it("should overwrite handler for same domain and type", () => {
    const handler1: WorkItemRedirector = { redirect: jest.fn() };
    const handler2: WorkItemRedirector = { redirect: jest.fn() };
    service.registerHandler(domain, workItemCategory, handler1);
    service.registerHandler(domain, workItemCategory, handler2);

    const retrieved = service.getHandler(domain, workItemCategory);
    expect(retrieved).toBe(handler2);
  });
});
