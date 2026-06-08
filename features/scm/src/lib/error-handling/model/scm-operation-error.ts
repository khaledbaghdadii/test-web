import { ScmFailureReason } from "./scm-failure-reason";

export class ScmOperationError extends Error {
  readonly failureReason: ScmFailureReason | null;

  constructor(message: string, failureReason: ScmFailureReason | null) {
    super(message);
    this.name = "ScmOperationError";
    this.failureReason = failureReason;
  }
}
