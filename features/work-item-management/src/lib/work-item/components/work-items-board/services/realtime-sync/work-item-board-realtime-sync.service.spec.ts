import { TestBed } from "@angular/core/testing";
import { Subject } from "rxjs";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { AuthenticationService } from "@mxflow/core/auth";
import { WorkItemBoardStateService } from "../state/work-item-board-state.service";
import { NotificationService } from "@mxflow/ui/alert";
import { WorkItemBoardRealtimeSyncService } from "./work-item-board-realtime-sync.service";
import { WorkItemWebsocketEventProcessor } from "./websocket/work-item-websocket-event-processor";
import { WorkItemWebsocketRegistrationManager } from "./websocket/work-item-websocket-registration.manager";
import { WorkItem } from "../../../../model/work-item";
import { WorkItemWebsocketConnection } from "./websocket/work-item-websocket-connection";

jest.mock("./websocket/work-item-websocket-connection");
jest.mock("./websocket/work-item-websocket-event-processor");
jest.mock("./websocket/work-item-websocket-registration.manager");

describe("WorkItemBoardRealtimeSyncService", () => {
  const TEST_GATEWAY_URL = "http://localhost:8080/";
  const TEST_WORK_ITEMS: WorkItem[] = [
    { id: "item-1" } as WorkItem,
    { id: "item-2" } as WorkItem,
  ];
  const TEST_REGISTRATION_FAILURE_MESSAGE = "Registration failed";
  const TEST_ERROR_MESSAGE_REGISTRATION_FAILURE =
    "Real-time updates are not available. Please try again. If the problem persists, please contact our support team for assistance.";
  const TEST_ERROR_MESSAGE_DISCONNECTION =
    "Real-time updates are temporarily unavailable. Attempting to reconnect...";
  const TEST_SUCCESS_MESSAGE_RECONNECTION =
    "Real-time updates are back online.";

  let service: WorkItemBoardRealtimeSyncService;
  let mockConfig: AppConfig;
  let mockAuthService: jest.Mocked<AuthenticationService>;
  let mockStateService: jest.Mocked<WorkItemBoardStateService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockConnection: jest.Mocked<WorkItemWebsocketConnection>;
  let mockEventProcessor: jest.Mocked<WorkItemWebsocketEventProcessor>;
  let mockRegistrationManager: jest.Mocked<WorkItemWebsocketRegistrationManager>;
  let mockStompSubscription: jest.Mocked<{ unsubscribe: jest.Mock }>;
  let connectionStateSubject: Subject<boolean>;
  let connectSubject: Subject<void>;
  let disconnectSubject: Subject<void>;
  let registrationFailureSubject: Subject<string>;

  beforeEach(() => {
    connectionStateSubject = new Subject<boolean>();
    connectSubject = new Subject<void>();
    disconnectSubject = new Subject<void>();
    registrationFailureSubject = new Subject<string>();
    mockStompSubscription = { unsubscribe: jest.fn() };

    mockConfig = { gatewayUrl: TEST_GATEWAY_URL } as AppConfig;
    mockAuthService = {
      getToken: jest.fn(),
    } as unknown as jest.Mocked<AuthenticationService>;
    mockStateService = {
      visibleWorkItems: jest.fn().mockReturnValue([]),
      fullBoardRefresh: jest.fn(),
    } as unknown as jest.Mocked<WorkItemBoardStateService>;
    mockNotificationService = {
      showError: jest.fn(),
      clearErrors: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    mockConnection = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      isConnected: jest.fn().mockReturnValue(false),
      subscribe: jest.fn().mockReturnValue(mockStompSubscription),
      connectionState$: connectionStateSubject.asObservable(),
      connect$: connectSubject.asObservable(),
      disconnect$: disconnectSubject.asObservable(),
    } as unknown as jest.Mocked<WorkItemWebsocketConnection>;

    mockEventProcessor = {
      process: jest.fn(),
    } as unknown as jest.Mocked<WorkItemWebsocketEventProcessor>;

    mockRegistrationManager = {
      register: jest.fn(),
      clear: jest.fn(),
      subscribeToRegistrationResponses: jest.fn(),
      unsubscribeFromRegistrationResponses: jest.fn(),
      registrationFailure$: registrationFailureSubject.asObservable(),
    } as unknown as jest.Mocked<WorkItemWebsocketRegistrationManager>;

    (WorkItemWebsocketConnection as unknown as jest.Mock).mockReturnValue(
      mockConnection
    );
    (WorkItemWebsocketEventProcessor as unknown as jest.Mock).mockReturnValue(
      mockEventProcessor
    );
    (
      WorkItemWebsocketRegistrationManager as unknown as jest.Mock
    ).mockReturnValue(mockRegistrationManager);

    TestBed.configureTestingModule({
      providers: [
        WorkItemBoardRealtimeSyncService,
        { provide: APP_CONFIG, useValue: mockConfig },
        { provide: AuthenticationService, useValue: mockAuthService },
        { provide: WorkItemBoardStateService, useValue: mockStateService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    });

    service = TestBed.inject(WorkItemBoardRealtimeSyncService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create connection with url factory", () => {
      expect(WorkItemWebsocketConnection).toHaveBeenCalledWith({
        urlFactory: expect.any(Function),
      });
    });

    it("should create event processor with state service", () => {
      expect(WorkItemWebsocketEventProcessor).toHaveBeenCalledWith(
        mockStateService
      );
    });

    it("should create registration manager with connection and auth service", () => {
      expect(WorkItemWebsocketRegistrationManager).toHaveBeenCalledWith(
        mockConnection
      );
    });

    it("should subscribe to connection state changes", () => {
      connectionStateSubject.next(true);

      expect(service.isConnected()).toBe(true);
    });
  });

  describe("connect", () => {
    it("should call connection connect when not connected", () => {
      mockConnection.isConnected.mockReturnValue(false);

      service.connect();

      expect(mockConnection.connect).toHaveBeenCalled();
    });

    it("should not call connection connect when already connected", () => {
      connectionStateSubject.next(true);
      mockConnection.isConnected.mockReturnValue(true);

      service.connect();

      expect(mockConnection.connect).not.toHaveBeenCalled();
    });
  });

  describe("handleConnection", () => {
    beforeEach(() => {
      mockConnection.isConnected.mockReturnValue(true);
      connectionStateSubject.next(true);
    });

    it("should subscribe to work items queue when connected", () => {
      connectSubject.next();

      expect(mockConnection.subscribe).toHaveBeenCalledWith(
        "/user/queue/workitems",
        expect.any(Function)
      );
    });

    it("should subscribe to registration responses when connected", () => {
      connectSubject.next();

      expect(
        mockRegistrationManager.subscribeToRegistrationResponses
      ).toHaveBeenCalled();
    });

    it("should clear error and show success notification when connection recovers", () => {
      disconnectSubject.next();
      mockNotificationService.clearErrors.mockClear();
      mockNotificationService.showSuccess.mockClear();

      connectSubject.next();

      expect(mockNotificationService.clearErrors).toHaveBeenCalled();
      expect(mockNotificationService.showSuccess).toHaveBeenCalledWith(
        TEST_SUCCESS_MESSAGE_RECONNECTION
      );
    });

    it("should not show success notification when no previous error", () => {
      connectSubject.next();

      expect(mockNotificationService.showSuccess).not.toHaveBeenCalled();
    });

    it("should register visible work items on first connection", () => {
      mockStateService.visibleWorkItems.mockReturnValue(TEST_WORK_ITEMS);

      connectSubject.next();

      expect(mockRegistrationManager.register).toHaveBeenCalledWith(
        TEST_WORK_ITEMS
      );
    });

    it("should trigger full board refresh on reconnection", () => {
      connectSubject.next();
      mockStateService.fullBoardRefresh.mockClear();

      connectSubject.next();

      expect(mockStateService.fullBoardRefresh).toHaveBeenCalled();
    });

    it("should register work items on reconnection", () => {
      mockStateService.visibleWorkItems.mockReturnValue(TEST_WORK_ITEMS);
      connectSubject.next();
      mockRegistrationManager.register.mockClear();

      connectSubject.next();

      expect(mockRegistrationManager.register).toHaveBeenCalledWith(
        TEST_WORK_ITEMS
      );
    });
  });

  describe("handleDisconnection", () => {
    it("should show error notification on first disconnection", () => {
      disconnectSubject.next();

      expect(mockNotificationService.showError).toHaveBeenCalledWith(
        TEST_ERROR_MESSAGE_DISCONNECTION
      );
    });

    it("should not show error notification on subsequent disconnections", () => {
      disconnectSubject.next();
      mockNotificationService.showError.mockClear();

      disconnectSubject.next();

      expect(mockNotificationService.showError).not.toHaveBeenCalled();
    });

    it("should update connection state signal to false", () => {
      connectionStateSubject.next(true);

      disconnectSubject.next();
      connectionStateSubject.next(false);

      expect(service.isConnected()).toBe(false);
    });

    it("should clear registration manager on disconnection", () => {
      disconnectSubject.next();

      expect(mockRegistrationManager.clear).toHaveBeenCalled();
    });
  });

  describe("handleRegistrationFailure", () => {
    it("should show error notification when registration fails", () => {
      registrationFailureSubject.next(TEST_REGISTRATION_FAILURE_MESSAGE);

      expect(mockNotificationService.showError).toHaveBeenCalledWith(
        TEST_ERROR_MESSAGE_REGISTRATION_FAILURE
      );
    });

    it("should disconnect connection when registration fails", () => {
      registrationFailureSubject.next(TEST_REGISTRATION_FAILURE_MESSAGE);

      expect(mockConnection.disconnect).toHaveBeenCalled();
    });

    it("should clear registration manager when registration fails", () => {
      registrationFailureSubject.next(TEST_REGISTRATION_FAILURE_MESSAGE);

      expect(mockRegistrationManager.clear).toHaveBeenCalled();
    });

    it("should not show reconnect message after registration failure", () => {
      registrationFailureSubject.next(TEST_REGISTRATION_FAILURE_MESSAGE);
      mockNotificationService.showError.mockClear();

      disconnectSubject.next();

      expect(mockNotificationService.showError).not.toHaveBeenCalled();
    });
  });

  describe("visible work items effect", () => {
    it("should register work items when visible and connected", () => {
      mockStateService.visibleWorkItems.mockReturnValue(TEST_WORK_ITEMS);
      mockConnection.isConnected.mockReturnValue(true);
      connectionStateSubject.next(true);

      TestBed.tick();

      expect(mockRegistrationManager.register).toHaveBeenCalledWith(
        TEST_WORK_ITEMS
      );
    });

    it("should not register when no visible work items", () => {
      mockStateService.visibleWorkItems.mockReturnValue([]);
      mockConnection.isConnected.mockReturnValue(true);
      connectionStateSubject.next(true);

      TestBed.tick();

      expect(mockRegistrationManager.register).not.toHaveBeenCalled();
    });

    it("should not register when not connected", () => {
      mockStateService.visibleWorkItems.mockReturnValue(TEST_WORK_ITEMS);
      mockConnection.isConnected.mockReturnValue(false);

      TestBed.tick();

      expect(mockRegistrationManager.register).not.toHaveBeenCalled();
    });
  });

  describe("ngOnDestroy", () => {
    it("should unsubscribe from queue", () => {
      mockConnection.isConnected.mockReturnValue(true);
      connectionStateSubject.next(true);
      connectSubject.next();

      service.ngOnDestroy();

      expect(mockStompSubscription.unsubscribe).toHaveBeenCalled();
    });

    it("should clear registration manager", () => {
      service.ngOnDestroy();

      expect(mockRegistrationManager.clear).toHaveBeenCalled();
    });

    it("should disconnect connection", () => {
      service.ngOnDestroy();

      expect(mockConnection.disconnect).toHaveBeenCalled();
    });

    it("should unsubscribe from all connection subscriptions", () => {
      const unsubscribeSpy = jest.spyOn(
        service["connectionSubscriptions"],
        "unsubscribe"
      );

      service.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe("event processing", () => {
    it("should process messages through event processor when subscribed", () => {
      const mockMessage = { body: '{"action":"UPDATED"}' } as Parameters<
        typeof mockEventProcessor.process
      >[0];
      mockConnection.isConnected.mockReturnValue(true);
      connectionStateSubject.next(true);
      connectSubject.next();
      const subscribeCallback = mockConnection.subscribe.mock.calls[0][1];

      subscribeCallback(mockMessage);

      expect(mockEventProcessor.process).toHaveBeenCalledWith(mockMessage);
    });
  });
});
