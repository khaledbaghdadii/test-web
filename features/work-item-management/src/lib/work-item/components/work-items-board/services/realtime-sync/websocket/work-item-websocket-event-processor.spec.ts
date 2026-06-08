import { IMessage } from "@stomp/stompjs";
import { WorkItemWebsocketEventProcessor } from "./work-item-websocket-event-processor";
import { WorkItemBoardStateService } from "../../state/work-item-board-state.service";
import {
  WorkItemAction,
  WorkItemWebSocketEvent,
} from "./models/work-item-websocket-event.model";
import {
  WorkItemChangeAction,
  WorkItemCreateChange,
  WorkItemUpdateChange,
} from "../../../model/work-item-change.model";
import {
  WorkItem,
  WorkItemType,
  WorkItemStatus,
  WorkItemPriority,
} from "../../../../../model/work-item";

const MOCK_WORK_ITEM: WorkItem = {
  id: "work-item-1",
  projectId: "project-1",
  name: "Test Item",
  description: "Test Description",
  workItemCategory: "TASK",
  domain: "TEST",
  workItemType: WorkItemType.UNITARY,
  workItemStatus: WorkItemStatus.OPEN,
  workItemPriority: WorkItemPriority.MEDIUM,
  metadata: {},
  businessProcesses: [{ id: "bp-1" }],
  createdOn: new Date(),
  projectName: "Test Project",
};

const MOCK_WORK_ITEM_ID = "work-item-to-delete";

describe("WorkItemWebsocketEventProcessor", () => {
  let processor: WorkItemWebsocketEventProcessor;
  let mockStateService: jest.Mocked<WorkItemBoardStateService>;

  beforeEach(() => {
    mockStateService = {
      applyWorkItemChanges: jest.fn(),
    } as unknown as jest.Mocked<WorkItemBoardStateService>;

    processor = new WorkItemWebsocketEventProcessor(mockStateService);
  });

  describe("process", () => {
    it("should apply create event when action is CREATED", () => {
      const event: WorkItemWebSocketEvent = {
        action: WorkItemAction.CREATED,
        workItem: MOCK_WORK_ITEM,
      };
      const message: IMessage = {
        body: JSON.stringify(event),
      } as IMessage;

      processor.process(message);

      const calls = mockStateService.applyWorkItemChanges.mock.calls[0][0];
      expect(calls).toHaveLength(1);
      expect(calls[0].action).toBe(WorkItemChangeAction.CREATE);
      const createChange = calls[0] as WorkItemCreateChange;
      expect(createChange.workItem).toMatchObject({
        id: MOCK_WORK_ITEM.id,
        projectId: MOCK_WORK_ITEM.projectId,
        name: MOCK_WORK_ITEM.name,
      });
      expect(mockStateService.applyWorkItemChanges).toHaveBeenCalledTimes(1);
    });

    it("should apply update event when action is UPDATED", () => {
      const event: WorkItemWebSocketEvent = {
        action: WorkItemAction.UPDATED,
        workItem: MOCK_WORK_ITEM,
      };
      const message: IMessage = {
        body: JSON.stringify(event),
      } as IMessage;

      processor.process(message);

      const calls = mockStateService.applyWorkItemChanges.mock.calls[0][0];
      expect(calls).toHaveLength(1);
      expect(calls[0].action).toBe(WorkItemChangeAction.UPDATE);
      const updateChange = calls[0] as WorkItemUpdateChange;
      expect(updateChange.workItem).toMatchObject({
        id: MOCK_WORK_ITEM.id,
        projectId: MOCK_WORK_ITEM.projectId,
        name: MOCK_WORK_ITEM.name,
      });
      expect(mockStateService.applyWorkItemChanges).toHaveBeenCalledTimes(1);
    });

    it("should apply delete event when action is DELETED", () => {
      const event: WorkItemWebSocketEvent = {
        action: WorkItemAction.DELETED,
        workItemId: MOCK_WORK_ITEM_ID,
      };
      const message: IMessage = {
        body: JSON.stringify(event),
      } as IMessage;

      processor.process(message);

      expect(mockStateService.applyWorkItemChanges).toHaveBeenCalledWith([
        {
          action: WorkItemChangeAction.DELETE,
          workItemId: MOCK_WORK_ITEM_ID,
        },
      ]);
      expect(mockStateService.applyWorkItemChanges).toHaveBeenCalledTimes(1);
    });

    it("should not apply event when action is missing", () => {
      const event: WorkItemWebSocketEvent = {} as WorkItemWebSocketEvent;
      const message: IMessage = {
        body: JSON.stringify(event),
      } as IMessage;

      processor.process(message);

      expect(mockStateService.applyWorkItemChanges).not.toHaveBeenCalled();
    });

    it("should not throw when message body is malformed JSON", () => {
      const message: IMessage = {
        body: "invalid-json{",
      } as IMessage;

      expect(() => processor.process(message)).not.toThrow();

      expect(mockStateService.applyWorkItemChanges).not.toHaveBeenCalled();
    });

    it("should not throw when message body is empty", () => {
      const message: IMessage = {
        body: "",
      } as IMessage;

      expect(() => processor.process(message)).not.toThrow();

      expect(mockStateService.applyWorkItemChanges).not.toHaveBeenCalled();
    });
  });
});
