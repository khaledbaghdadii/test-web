import { Client, IFrame, StompSubscription } from "@stomp/stompjs";
import { WorkItemWebsocketConnection } from "./work-item-websocket-connection";

jest.mock("@stomp/stompjs", () => {
  const actual = jest.requireActual("@stomp/stompjs");
  return {
    ...actual,
    Client: jest.fn(),
  };
});

const MOCKED_CLIENT = Client as unknown as jest.MockedClass<typeof Client>;

const DEFAULT_URL = "wss://ws.mxflow.local/socket";
const DEFAULT_RECONNECT_DELAY = 5000;
const DEFAULT_HEARTBEAT_INTERVAL = 10000;

type ClientMock = {
  active: boolean;
  connected: boolean;
  activate: jest.Mock;
  deactivate: jest.Mock;
  subscribe: jest.Mock;
  publish: jest.Mock;
  onConnect?: (frame: IFrame) => void;
  onDisconnect?: (frame?: IFrame) => void;
  onWebSocketClose?: () => void;
  onStompError?: () => void;
};

const createClientMock = (): ClientMock => ({
  active: false,
  connected: false,
  activate: jest.fn(),
  deactivate: jest.fn(),
  subscribe: jest.fn(),
  publish: jest.fn(),
});

const createConnection = (): {
  connection: WorkItemWebsocketConnection;
  client: ClientMock;
  urlFactory: jest.Mock<string, []>;
} => {
  const client = createClientMock();
  MOCKED_CLIENT.mockImplementation(() => client as unknown as Client);
  const urlFactory = jest.fn(() => DEFAULT_URL);
  const connection = new WorkItemWebsocketConnection({
    urlFactory,
  });
  return { connection, client, urlFactory };
};

describe("WorkItemWebsocketConnection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should configure STOMP client with native WebSocket", () => {
    const { urlFactory } = createConnection();

    expect(MOCKED_CLIENT).toHaveBeenCalledWith(
      expect.objectContaining({
        brokerURL: DEFAULT_URL,
        reconnectDelay: DEFAULT_RECONNECT_DELAY,
        heartbeatIncoming: DEFAULT_HEARTBEAT_INTERVAL,
        heartbeatOutgoing: DEFAULT_HEARTBEAT_INTERVAL,
      })
    );
    expect(urlFactory).toHaveBeenCalledTimes(1);
  });

  it("should emit connection state and connect events when STOMP connects", () => {
    const { connection, client } = createConnection();
    const stateValues: boolean[] = [];
    const connectEvents: number[] = [];

    connection.connectionState$.subscribe((state) => stateValues.push(state));
    connection.connect$.subscribe(() => connectEvents.push(1));
    client.onConnect?.({} as IFrame);

    expect(stateValues).toEqual([false, true]);
    expect(connectEvents).toHaveLength(1);
  });

  it("should emit disconnect event when connection drops unexpectedly", () => {
    const { connection, client } = createConnection();
    const disconnectEvents: number[] = [];

    connection.disconnect$.subscribe(() => disconnectEvents.push(1));
    client.onConnect?.({} as IFrame);
    client.onDisconnect?.({} as IFrame);

    expect(disconnectEvents).toHaveLength(1);
  });

  it("should suppress disconnect notification after intentional disconnect", () => {
    const { connection, client } = createConnection();
    const disconnectEvents: number[] = [];

    connection.disconnect$.subscribe(() => disconnectEvents.push(1));
    client.active = true;
    client.connected = true;
    connection.disconnect();
    client.onDisconnect?.({} as IFrame);
    client.onDisconnect?.({} as IFrame);

    expect(client.deactivate).toHaveBeenCalledTimes(1);
    expect(disconnectEvents).toHaveLength(1);
  });

  it("should activate client only when inactive", () => {
    const { connection, client } = createConnection();

    connection.connect();
    client.active = true;
    connection.connect();

    expect(client.activate).toHaveBeenCalledTimes(1);
  });

  it("should throw when subscribing without an active connection", () => {
    const { connection } = createConnection();

    expect(() => connection.subscribe("/queue", jest.fn())).toThrow(
      "Cannot subscribe before connection is established"
    );
  });

  it("should delegate subscriptions and return STOMP subscription when connected", () => {
    const { connection, client } = createConnection();
    const destination = "/queue/workitems";
    const handler = jest.fn();
    const subscription = { id: "sub-1" } as StompSubscription;

    client.connected = true;
    client.subscribe.mockReturnValue(subscription);
    const result = connection.subscribe(destination, handler);

    expect(client.subscribe).toHaveBeenCalledWith(destination, handler);
    expect(result).toBe(subscription);
  });

  it("should publish messages only when connected", () => {
    const { connection, client } = createConnection();
    const destination = "/topic";
    const body = "payload";

    connection.publish(destination, body);
    client.connected = true;
    connection.publish(destination, body);

    expect(client.publish).toHaveBeenCalledTimes(1);
    expect(client.publish).toHaveBeenCalledWith({ destination, body });
  });
});
