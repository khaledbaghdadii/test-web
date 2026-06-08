import {
  Component,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { TreeNode } from "primeng/api";
import { TreeModule, TreeNodeSelectEvent } from "primeng/tree";
import { concatMap, finalize } from "rxjs";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { Skeleton } from "primeng/skeleton";
import { TestSequenceService } from "@mxevolve/domains/test/data-access";
import { TestSelectionTreeNode } from "@mxevolve/domains/test/model";
import { ToastMessageService } from "@mxflow/ui/alert";
import { RepositoryService } from "@mxflow/features/repository";

@Component({
  selector: "mxevolve-test-selection-browser",
  templateUrl: "./test-selection-browser.component.html",
  imports: [CommonModule, TreeModule, MxevolveIconComponent, Skeleton],
  providers: [TestSequenceService],
})
export class TestSelectionBrowserComponent implements OnInit {
  private readonly testSequenceService = inject(TestSequenceService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly repositoryService = inject(RepositoryService);

  projectId = input.required<string>();
  testSequenceName = input.required<string>();
  repositoryId = input.required<string>();
  testSelectionTree = signal<TreeNode[]>([]);
  isLoading = signal(false);

  @Output()
  testSelectionPathEmitter = new EventEmitter<string>();

  selectedTestSelectionNode: TreeNode | null = null;

  mapToTreeNode(testSelectionTreeNode: TestSelectionTreeNode): TreeNode {
    return {
      label: testSelectionTreeNode.name,
      expanded: false,
      data: testSelectionTreeNode,
      children: testSelectionTreeNode.children.map((child) => {
        return this.mapToTreeNode(child);
      }),
    };
  }

  getNodePath(node: TreeNode | undefined): string {
    const path: string[] = [];
    let current = node;
    while (current) {
      path.unshift(current.label!);
      current = current.parent;
    }
    return path.join("/");
  }

  onSelectTestSelectionNode(event: TreeNodeSelectEvent): void {
    this.testSelectionPathEmitter.emit(this.getNodePath(event?.node));
  }

  onUnselectTestSelectionNode(): void {
    this.testSelectionPathEmitter.emit(undefined);
  }

  ngOnInit(): void {
    this.isLoading.set(true);
    this.repositoryService
      .getRepoById(this.projectId(), this.repositoryId())
      .pipe(
        concatMap((repository) =>
          this.testSequenceService.fetchTestSelections({
            projectId: this.projectId(),
            testSequenceName: this.testSequenceName(),
            repositoryId: this.repositoryId(),
            source: repository.defaultBranch,
          })
        ),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: (rootNode) => {
          this.testSelectionTree.set([this.mapToTreeNode(rootNode)]);
        },
        error: (error) => {
          this.toastMessageService.showError(error.message);
        },
      });
  }

  protected readonly Array = Array;
}
