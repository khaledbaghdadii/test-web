import { Component, inject, input, OnInit } from "@angular/core";
import { DatePipe } from "@angular/common";

import { Button } from "primeng/button";
import { Message } from "primeng/message";
import { Tooltip } from "primeng/tooltip";

import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import { ScmManagementService } from "../scm-management.service";
import { RebaseWorkspaceStateService } from "./rebase-workspace-state.service";
import { ConflictResolverComponent } from "../remote-cloned-repository/conflict-resolver/conflict-resolver.component";
import { TechnicalConflictResolverComponent } from "../remote-cloned-repository/technical-conflict-resolver/technical-conflict-resolver.component";

@Component({
  selector: "mxevolve-rebase-workspace-container",
  standalone: true,
  imports: [
    DatePipe,
    Button,
    Message,
    Tooltip,
    ConflictResolverComponent,
    TechnicalConflictResolverComponent,
  ],
  providers: [
    RemoteClonedRepositoryService,
    ScmManagementService,
    RebaseWorkspaceStateService,
  ],
  templateUrl: "./rebase-workspace-container.component.html",
})
export class RebaseWorkspaceContainerComponent implements OnInit {
  readonly stateService = inject(RebaseWorkspaceStateService);

  readonly projectId = input.required<string>();
  readonly clonedRepositoryId = input.required<string>();
  readonly projectRepositoryId = input.required<string>();
  readonly sourceBranchName = input.required<string>();
  readonly disabled = input(false);

  ngOnInit(): void {
    this.stateService.initialize({
      projectId: this.projectId(),
      clonedRepositoryId: this.clonedRepositoryId(),
      projectRepositoryId: this.projectRepositoryId(),
      sourceBranchName: this.sourceBranchName(),
    });
  }

  startRebase(): void {
    this.stateService.startRebase();
  }

  refreshState(): void {
    this.stateService.refreshState();
  }
}
