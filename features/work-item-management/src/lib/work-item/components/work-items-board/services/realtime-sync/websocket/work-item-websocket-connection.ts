import { BehaviorSubject, Observable, Subject } from "rxjs";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";

const DEFAULT_RECONNECT_DELAY = 5000;
const DEFAULT_HEARTBEAT_INCOMING = 10000;
const DEFAULT_HEARTBEAT_OUTGOING = 10000;

export type WorkItemWebsocketConnectionOptions = {
  urlFactory: () => string;
};

export class WorkItemWebsocketConnection {
  private readonly client: Client;
  private readonly connectionStateSubject = new BehaviorSubject<boolean>(false);
  private readonly connectSubject = new Subject<void>();
  private readonly disconnectSubject = new Subject<void>();
  private suppressNextDisconnect = false;

  readonly connectionState$: Observable<boolean> =
    this.connectionStateSubject.asObservable();
  readonly connect$: Observable<void> = this.connectSubject.asObservable();
  readonly disconnect$: Observable<void> =
    this.disconnectSubject.asObservable();

  constructor(options: WorkItemWebsocketConnectionOptions) {
    this.client = new Client({
      brokerURL: options.urlFactory(),
      reconnectDelay: DEFAULT_RECONNECT_DELAY,
      heartbeatIncoming: DEFAULT_HEARTBEAT_INCOMING,
      heartbeatOutgoing: DEFAULT_HEARTBEAT_OUTGOING,
    });

    this.client.onConnect = () => {
      this.connectionStateSubject.next(true);
      this.connectSubject.next();
    };

    const handleDisconnect = () => {
      if (this.connectionStateSubject.value) {
        this.connectionStateSubject.next(false);
      }

      if (this.suppressNextDisconnect) {
        this.suppressNextDisconnect = false;
        return;
      }

      this.disconnectSubject.next();
    };

    this.client.onDisconnect = handleDisconnect;
    this.client.onWebSocketClose = handleDisconnect;
    this.client.onStompError = handleDisconnect;
  }

  connect(): void {
    if (this.client.active) return;
    this.client.activate();
  }

  disconnect(): void {
    if (!this.client.active || !this.client.connected) return;
    this.suppressNextDisconnect = true;
    this.client.deactivate();
  }

  isConnected(): boolean {
    return this.client.connected;
  }

  subscribe(
    destination: string,
    callback: (message: IMessage) => void
  ): StompSubscription {
    if (!this.isConnected()) {
      throw new Error("Cannot subscribe before connection is established");
    }

    return this.client.subscribe(destination, callback);
  }

  publish(destination: string, body: string): void {
    if (!this.isConnected()) return;

    this.client.publish({
      destination,
      body,
    });
  }
}
