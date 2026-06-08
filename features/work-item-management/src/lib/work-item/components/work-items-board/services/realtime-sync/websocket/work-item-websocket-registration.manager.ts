import { WorkItemRegistrationRequest } from "./models/work-item-registration-request.model";
import { WorkItemRegistrationResponse } from "./models/work-item-registration-response.model";
import { WorkItem } from "../../../../../model/work-item";
import { WorkItemWebsocketConnection } from "./work-item-websocket-connection";
import { Subject } from "rxjs";
import { StompSubscription } from "@stomp/stompjs";

export class WorkItemWebsocketRegistrationManager {
  private registeredWorkItemIds = new Set<string>();
  private static readonly REGISTER_DESTINATION = "/workitem/register";
  private static readonly REGISTRATION_RESPONSE_DESTINATION =
    "/user/queue/registration";
  private registrationSubscription: StompSubscription | null = null;

  private readonly registrationFailureSubject = new Subject<string>();
  readonly registrationFailure$ =
    this.registrationFailureSubject.asObservable();

  constructor(private readonly connection: WorkItemWebsocketConnection) {}

  subscribeToRegistrationResponses(): void {
    if (!this.connection.isConnected()) return;

    try {
      this.registrationSubscription?.unsubscribe();
    } catch {}

    this.registrationSubscription = this.connection.subscribe(
      WorkItemWebsocketRegistrationManager.REGISTRATION_RESPONSE_DESTINATION,
      (message) => {
        const response: WorkItemRegistrationResponse = JSON.parse(message.body);
        if (!response.success) {
          this.registrationFailureSubject.next(response.message);
        }
      }
    );
  }

  unsubscribeFromRegistrationResponses(): void {
    if (!this.registrationSubscription) return;

    try {
      this.registrationSubscription.unsubscribe();
    } catch {}

    this.registrationSubscription = null;
  }

  register(workItems: WorkItem[]): void {
    const workItemIds = workItems.map((item) => item.id);

    if (!this.connection.isConnected()) return;
    if (!this.hasRegistrationChanged(workItemIds)) return;

    const request: WorkItemRegistrationRequest = { workItemIds };

    this.connection.publish(
      WorkItemWebsocketRegistrationManager.REGISTER_DESTINATION,
      JSON.stringify(request)
    );

    this.registeredWorkItemIds = new Set(workItemIds);
  }

  clear(): void {
    this.registeredWorkItemIds.clear();
    this.unsubscribeFromRegistrationResponses();
  }

  private hasRegistrationChanged(newIds: string[]): boolean {
    const currentIds = Array.from(this.registeredWorkItemIds)
      .sort((a, b) => a.localeCompare(b))
      .join(",");
    const updatedIds = [...newIds].sort((a, b) => a.localeCompare(b)).join(",");
    return currentIds !== updatedIds;
  }
}
