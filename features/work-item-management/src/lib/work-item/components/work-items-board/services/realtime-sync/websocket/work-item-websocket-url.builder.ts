import { AppConfig } from "@mxflow/config";

const WORK_ITEM_WS_PATH = "work-item-management/ws";

export function buildWorkItemWebsocketUrl(config: AppConfig): string {
  const baseUrl = config.gatewayUrl.endsWith("/")
    ? config.gatewayUrl
    : config.gatewayUrl + "/";
  let wsUrl = baseUrl + WORK_ITEM_WS_PATH;
  wsUrl = wsUrl.replace("http://", "ws://");
  wsUrl = wsUrl.replace("https://", "wss://");
  return wsUrl;
}
