import {
  Injectable,
  OnDestroy,
  effect,
  computed,
  signal,
  inject,
  EffectRef,
} from "@angular/core";
import { StompSubscription } from "@stomp/stompjs";
import { Subscription } from "rxjs";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { WorkItemBoardStateService } from "../state/work-item-board-state.service";
import { NotificationService } from "@mxflow/ui/alert";
import { WorkItemWebsocketConnection } from "./websocket/work-item-websocket-connection";
import { WorkItemWebsocketEventProcessor } from "./websocket/work-item-websocket-event-processor";
import { WorkItemWebsocketRegistrationManager } from "./websocket/work-item-websocket-registration.manager";
import { buildWorkItemWebsocketUrl } from "./websocket/work-item-websocket-url.builder";

@Injectable()
export class WorkItemBoardRealtimeSyncService implements OnDestroy {
  private static readonly WORK_ITEM_WEBSOCKET_QUEUE_DESTINATION =
    "/user/queue/workitems";
  private static readonly RECONNECTING_MESSAGE =
    "Real-time updates are temporarily unavailable. Attempting to reconnect...";
  private static readonly RECONNECTED_MESSAGE =
    "Real-time updates are back online.";
  private static readonly REGISTRATION_FAILURE_MESSAGE =
    "Real-time updates are not available. Please try again. If the problem persists, please contact our support team for assistance.";

  private readonly config = inject<AppConfig>(APP_CONFIG);
  private readonly stateService = inject(WorkItemBoardStateService);
  private readonly notificationService = inject(NotificationService);

  private readonly connection: WorkItemWebsocketConnection;
  private readonly eventProcessor: WorkItemWebsocketEventProcessor;
  private readonly registrationManager: WorkItemWebsocketRegistrationManager;
  private subscription: StompSubscription | null = null;
  private hasConnectedBefore = false;
  private isDisconnectionErrorShown = false;
  private isRegistrationFailure = false;
  private readonly connectionState = signal(false);
  private readonly connectionSubscriptions = new Subscription();
  private readonly visibleItemsEffect: EffectRef;

  readonly isConnected = computed(() => this.connectionState());

  constructor() {
    this.connection = new WorkItemWebsocketConnection({
      urlFactory: () => buildWorkItemWebsocketUrl(this.config),
    });
    this.eventProcessor = new WorkItemWebsocketEventProcessor(
      this.stateService
    );
    this.registrationManager = new WorkItemWebsocketRegistrationManager(
      this.connection
    );
    this.connectionSubscriptions.add(
      this.connection.connectionState$.subscribe((connected) =>
        this.connectionState.set(connected)
      )
    );
    this.connectionSubscriptions.add(
      this.connection.connect$.subscribe(() => this.handleConnection())
    );
    this.connectionSubscriptions.add(
      this.connection.disconnect$.subscribe(() => this.handleDisconnection())
    );
    this.connectionSubscriptions.add(
      this.registrationManager.registrationFailure$.subscribe(() => {
        this.handleRegistrationFailure();
      })
    );

    this.visibleItemsEffect = effect(() => {
      const visibleItems = this.stateService.visibleWorkItems();
      if (visibleItems.length > 0 && this.isConnected()) {
        this.registrationManager.register(visibleItems);
      }
    });
  }

  connect(): void {
    if (this.isConnected()) return;
    this.connection.connect();
  }

  ngOnDestroy(): void {
    this.unsubscribeFromWorkItemUpdates();
    this.unsubscribeFromRegistrationResponses();
    this.registrationManager.clear();
    this.hasConnectedBefore = false;
    this.connection.disconnect();
    this.connectionSubscriptions.unsubscribe();
    this.visibleItemsEffect.destroy();
  }

  private handleConnection(): void {
    this.clearErrorNotificationIfRecovering();
    this.subscribeToQueues();
    this.refreshBoardIfReconnecting();
    this.isRegistrationFailure = false;
    this.registerVisibleItems();
    this.hasConnectedBefore = true;
  }

  private handleDisconnection(): void {
    this.registrationManager.clear();
    this.showDisconnectionErrorIfNeeded();
  }

  private handleRegistrationFailure(): void {
    this.isRegistrationFailure = true;
    this.notificationService.showError(
      WorkItemBoardRealtimeSyncService.REGISTRATION_FAILURE_MESSAGE
    );
    this.isDisconnectionErrorShown = true;
    this.disconnect();
  }

  private clearErrorNotificationIfRecovering(): void {
    if (this.isDisconnectionErrorShown && !this.isRegistrationFailure) {
      this.isDisconnectionErrorShown = false;
      this.notificationService.clearErrors();
      this.notificationService.showSuccess(
        WorkItemBoardRealtimeSyncService.RECONNECTED_MESSAGE
      );
    }
  }

  private subscribeToQueues(): void {
    this.subscribeToWorkItemUpdates();
    this.subscribeToRegistrationResponses();
  }

  private refreshBoardIfReconnecting(): void {
    if (this.hasConnectedBefore) {
      this.stateService.fullBoardRefresh();
    }
  }

  private registerVisibleItems(): void {
    const visibleItems = this.stateService.visibleWorkItems();
    if (visibleItems.length) {
      this.registrationManager.register(visibleItems);
    }
  }

  private showDisconnectionErrorIfNeeded(): void {
    if (!this.isDisconnectionErrorShown && !this.isRegistrationFailure) {
      this.isDisconnectionErrorShown = true;
      this.notificationService.showError(
        WorkItemBoardRealtimeSyncService.RECONNECTING_MESSAGE
      );
    }
  }

  private disconnect(): void {
    this.unsubscribeFromWorkItemUpdates();
    this.unsubscribeFromRegistrationResponses();
    this.registrationManager.clear();
    this.connection.disconnect();
  }

  private subscribeToWorkItemUpdates(): void {
    if (!this.isConnected()) return;

    this.subscription = this.connection.subscribe(
      WorkItemBoardRealtimeSyncService.WORK_ITEM_WEBSOCKET_QUEUE_DESTINATION,
      (message) => this.eventProcessor.process(message)
    );
  }

  private subscribeToRegistrationResponses(): void {
    if (!this.isConnected()) return;

    this.registrationManager.subscribeToRegistrationResponses();
  }

  private unsubscribeFromWorkItemUpdates(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  private unsubscribeFromRegistrationResponses(): void {
    this.registrationManager.unsubscribeFromRegistrationResponses();
  }
}
