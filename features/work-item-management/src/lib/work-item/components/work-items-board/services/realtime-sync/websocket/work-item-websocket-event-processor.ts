import { IMessage } from "@stomp/stompjs";
import { WorkItemBoardStateService } from "../../state/work-item-board-state.service";
import {
  WorkItemAction,
  WorkItemWebSocketEvent,
} from "./models/work-item-websocket-event.model";
import { WorkItemChangeAction } from "../../../model/work-item-change.model";

export class WorkItemWebsocketEventProcessor {
  constructor(private readonly stateService: WorkItemBoardStateService) {}

  process(message: IMessage): void {
    try {
      const event = JSON.parse(message.body) as WorkItemWebSocketEvent;
      if (event.action) {
        this.applyEvent(event);
      }
    } catch {}
  }

  private applyEvent(event: WorkItemWebSocketEvent): void {
    switch (event.action) {
      case WorkItemAction.CREATED:
        this.stateService.applyWorkItemChanges([
          { action: WorkItemChangeAction.CREATE, workItem: event.workItem },
        ]);
        break;
      case WorkItemAction.UPDATED:
        this.stateService.applyWorkItemChanges([
          { action: WorkItemChangeAction.UPDATE, workItem: event.workItem },
        ]);
        break;
      case WorkItemAction.DELETED:
        this.stateService.applyWorkItemChanges([
          {
            action: WorkItemChangeAction.DELETE,
            workItemId: event.workItemId,
          },
        ]);
        break;
    }
  }
}
