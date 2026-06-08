import { AppConfig } from "@mxflow/config";
import { buildWorkItemWebsocketUrl } from "./work-item-websocket-url.builder";

describe("buildWorkItemWebsocketUrl", () => {
  const GATEWAY_URL = "http://localhost:8080/";
  const EXPECTED_WS_PATH = "work-item-management/ws";

  const createMockAppConfig = (gatewayUrl: string): AppConfig => ({
    gatewayUrl,
    projectMfeUrl: "",
    testMfeUrl: "",
    binaryUpgradeMfeUrl: "",
    emUrl: "",
  });

  it("should concatenate gateway URL with work item WebSocket path when config is provided", () => {
    const mockConfig = createMockAppConfig(GATEWAY_URL);

    const result = buildWorkItemWebsocketUrl(mockConfig);

    expect(result).toBe(`ws://localhost:8080/${EXPECTED_WS_PATH}`);
  });

  it("should return correct URL when gateway URL has no trailing slash", () => {
    const gatewayUrlWithoutSlash = "http://localhost:8080";
    const mockConfig = createMockAppConfig(gatewayUrlWithoutSlash);

    const result = buildWorkItemWebsocketUrl(mockConfig);

    expect(result).toBe(`ws://localhost:8080/${EXPECTED_WS_PATH}`);
  });

  it("should convert HTTPS to WSS protocol when gateway URL uses HTTPS", () => {
    const httpsGatewayUrl = "https://example.com/";
    const mockConfig = createMockAppConfig(httpsGatewayUrl);

    const result = buildWorkItemWebsocketUrl(mockConfig);

    expect(result).toBe(`wss://example.com/${EXPECTED_WS_PATH}`);
    expect(result).toContain("wss://");
  });
});
