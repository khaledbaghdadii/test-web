import { WorkItemWebsocketRegistrationManager } from "./work-item-websocket-registration.manager";
import { WorkItemWebsocketConnection } from "./work-item-websocket-connection";
import {
  WorkItem,
  WorkItemType,
  WorkItemStatus,
  WorkItemPriority,
} from "../../../../../model/work-item";
import { IMessage, StompSubscription } from "@stomp/stompjs";

describe("WorkItemWebsocketRegistrationManager", () => {
  const MOCK_TOKEN = "mock-jwt-token";
  const REGISTER_DESTINATION = "/workitem/register";
  const REGISTRATION_RESPONSE_DESTINATION = "/user/queue/registration";
  const TEST_SUCCESS_MESSAGE = "Successfully registered for real-time updates";
  const TEST_FAILURE_MESSAGE = "Failed to register for real-time updates";

  let manager: WorkItemWebsocketRegistrationManager;
  let mockConnection: jest.Mocked<WorkItemWebsocketConnection>;

  const MOCK_WORK_ITEM: WorkItem = {
    id: "wi-1",
    projectId: "proj-1",
    name: "Test Work Item",
    description: "Test Description",
    workItemCategory: "Development",
    domain: "Backend",
    projectName: "projectName",
    workItemType: WorkItemType.UNITARY,
    workItemStatus: WorkItemStatus.UNDERWAY,
    workItemPriority: WorkItemPriority.HIGH,
    metadata: {},
    businessProcesses: [{ id: "BP-1" }],
    createdOn: new Date("2025-11-22T16:28:00.697Z"),
  };

  const MOCK_WORK_ITEM_2: WorkItem = {
    ...MOCK_WORK_ITEM,
    id: "wi-2",
    name: "Second Work Item",
  };

  beforeEach(() => {
    mockConnection = {
      isConnected: jest.fn(),
      publish: jest.fn(),
      subscribe: jest.fn(),
    } as unknown as jest.Mocked<WorkItemWebsocketConnection>;

    manager = new WorkItemWebsocketRegistrationManager(mockConnection);
  });

  describe("register", () => {
    it("should not register when connection is not established", () => {
      mockConnection.isConnected.mockReturnValue(false);

      manager.register([MOCK_WORK_ITEM]);

      expect(mockConnection.publish).not.toHaveBeenCalled();
    });

    it("should register work items with auth token when connected", () => {
      mockConnection.isConnected.mockReturnValue(true);

      manager.register([MOCK_WORK_ITEM, MOCK_WORK_ITEM_2]);

      expect(mockConnection.publish).toHaveBeenCalledTimes(1);
      expect(mockConnection.publish).toHaveBeenCalledWith(
        REGISTER_DESTINATION,
        JSON.stringify({ workItemIds: ["wi-1", "wi-2"] })
      );
    });

    it("should register work items", () => {
      mockConnection.isConnected.mockReturnValue(true);

      manager.register([MOCK_WORK_ITEM]);

      expect(mockConnection.publish).toHaveBeenCalledWith(
        REGISTER_DESTINATION,
        JSON.stringify({ workItemIds: ["wi-1"] })
      );
    });

    it("should not register when work item IDs have not changed", () => {
      mockConnection.isConnected.mockReturnValue(true);

      manager.register([MOCK_WORK_ITEM]);
      manager.register([MOCK_WORK_ITEM]);

      expect(mockConnection.publish).toHaveBeenCalledTimes(1);
    });

    it("should register when work item IDs have changed", () => {
      mockConnection.isConnected.mockReturnValue(true);

      manager.register([MOCK_WORK_ITEM]);
      manager.register([MOCK_WORK_ITEM, MOCK_WORK_ITEM_2]);

      expect(mockConnection.publish).toHaveBeenCalledTimes(2);
    });

    it("should detect changes when work item order differs but IDs are same", () => {
      mockConnection.isConnected.mockReturnValue(true);

      manager.register([MOCK_WORK_ITEM, MOCK_WORK_ITEM_2]);
      manager.register([MOCK_WORK_ITEM_2, MOCK_WORK_ITEM]);

      expect(mockConnection.publish).toHaveBeenCalledTimes(1);
    });
  });

  describe("clear", () => {
    it("should clear registered work item IDs", () => {
      mockConnection.isConnected.mockReturnValue(true);

      manager.register([MOCK_WORK_ITEM]);
      manager.clear();
      manager.register([MOCK_WORK_ITEM]);

      expect(mockConnection.publish).toHaveBeenCalledTimes(2);
    });

    it("should allow new registration after clear", () => {
      mockConnection.isConnected.mockReturnValue(true);

      manager.register([MOCK_WORK_ITEM]);
      manager.clear();
      manager.register([MOCK_WORK_ITEM_2]);

      expect(mockConnection.publish).toHaveBeenCalledTimes(2);
      const lastCall = mockConnection.publish.mock.calls[1];
      expect(lastCall[1]).toBe(JSON.stringify({ workItemIds: ["wi-2"] }));
    });

    it("should unsubscribe from registration responses", () => {
      mockConnection.isConnected.mockReturnValue(true);
      const mockSubscription = {
        unsubscribe: jest.fn(),
      } as unknown as StompSubscription;
      mockConnection.subscribe.mockReturnValue(mockSubscription);

      manager.subscribeToRegistrationResponses();
      manager.clear();

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe("subscribeToRegistrationResponses", () => {
    it("should not subscribe when connection is not established", () => {
      mockConnection.isConnected.mockReturnValue(false);

      manager.subscribeToRegistrationResponses();

      expect(mockConnection.subscribe).not.toHaveBeenCalled();
    });

    it("should subscribe to registration response queue when connected", () => {
      mockConnection.isConnected.mockReturnValue(true);

      manager.subscribeToRegistrationResponses();

      expect(mockConnection.subscribe).toHaveBeenCalledWith(
        REGISTRATION_RESPONSE_DESTINATION,
        expect.any(Function)
      );
    });

    it("should emit failure when response indicates failure", async () => {
      mockConnection.isConnected.mockReturnValue(true);
      const failureResponse = {
        success: false,
        message: TEST_FAILURE_MESSAGE,
        registeredCount: 0,
      };

      const failurePromise = new Promise<string>((resolve) => {
        manager.registrationFailure$.subscribe(resolve);
      });

      manager.subscribeToRegistrationResponses();
      const subscribeCallback = mockConnection.subscribe.mock.calls[0][1];
      const mockMessage: IMessage = {
        body: JSON.stringify(failureResponse),
      } as IMessage;

      subscribeCallback(mockMessage);

      await expect(failurePromise).resolves.toBe(TEST_FAILURE_MESSAGE);
    });

    it("should not emit when response indicates success", () => {
      mockConnection.isConnected.mockReturnValue(true);
      const successResponse = {
        success: true,
        message: TEST_SUCCESS_MESSAGE,
        registeredCount: 2,
      };
      const failureHandler = jest.fn();

      manager.registrationFailure$.subscribe(failureHandler);

      manager.subscribeToRegistrationResponses();
      const subscribeCallback = mockConnection.subscribe.mock.calls[0][1];
      const mockMessage: IMessage = {
        body: JSON.stringify(successResponse),
      } as IMessage;

      subscribeCallback(mockMessage);

      expect(failureHandler).not.toHaveBeenCalled();
    });
  });

  describe("unsubscribeFromRegistrationResponses", () => {
    it("should no-op when no subscription exists", () => {
      expect(() =>
        manager.unsubscribeFromRegistrationResponses()
      ).not.toThrow();
    });

    it("should unsubscribe and clear active subscription", () => {
      mockConnection.isConnected.mockReturnValue(true);
      const mockSubscription = {
        unsubscribe: jest.fn(),
      } as unknown as StompSubscription;
      mockConnection.subscribe.mockReturnValue(mockSubscription);

      manager.subscribeToRegistrationResponses();
      manager.unsubscribeFromRegistrationResponses();

      expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(1);

      manager.unsubscribeFromRegistrationResponses();

      expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});
