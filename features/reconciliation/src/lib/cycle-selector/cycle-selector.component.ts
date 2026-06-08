import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { CycleSelectorService } from "./cycle-selector.service";
import { CardContainerModule } from "@mxflow/ui/container";
import { Table, TableModule } from "primeng/table";
import { DatePipe } from "@angular/common";
import { CheckboxModule } from "primeng/checkbox";
import { RadioButtonModule } from "primeng/radiobutton";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { TooltipModule } from "primeng/tooltip";

export interface Cycle {
  id: string;
  name: string;
  description: string;
  sourceVersion: string;
  targetVersion: string;
  createdAt: string;
  status: string;
  creatorEmail: string;
}

@Component({
  selector: "mxevolve-cycle-selector",
  templateUrl: "./cycle-selector.component.html",
  styleUrls: ["./cycle-selector.component.scss"],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  providers: [CycleSelectorService],
  imports: [
    CardContainerModule,
    TableModule,
    DatePipe,
    CheckboxModule,
    RadioButtonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
  ],
})
export class CycleSelectorComponent implements OnInit {
  @ViewChild("cycleTable") cycleTable!: Table;

  @Input() projectId!: string;
  @Input() multiSelect = true;
  @Input() pageSize = 5;
  @Input() preselectedCycleIds: string[] = [];
  @Input() showSearch = true;
  @Input() pageOnlySelect = false;

  @Output() selectionChange = new EventEmitter<Cycle[]>();

  private readonly cycleSelectorService = inject(CycleSelectorService);
  private readonly route = inject(ActivatedRoute);

  cycles: Cycle[] = [];
  selectedCycles: Cycle[] = [];
  selectedCycle: Cycle | null = null;
  searchValue: string = "";
  loading: boolean = false;

  ngOnInit(): void {
    this.loadCycles();
  }

  private loadCycles(): void {
    const projectId = this.projectId || this.route.snapshot.params["projectId"];

    if (!projectId) {
      console.error(
        "CycleSelectorComponent: projectId is required (either as input or from URL)"
      );
      return;
    }

    this.loading = true;
    this.cycleSelectorService.getCycles(projectId).subscribe({
      next: (cycles) => {
        this.cycles = cycles;
        this.applyPreselection();
        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading cycles:", err);
        this.loading = false;
      },
    });
  }

  private applyPreselection(): void {
    if (this.preselectedCycleIds.length > 0) {
      this.selectedCycles = this.cycles.filter((c) =>
        this.preselectedCycleIds.includes(c.id)
      );
      if (!this.multiSelect && this.selectedCycles.length > 0) {
        this.selectedCycle = this.selectedCycles[0];
        this.selectedCycles = [this.selectedCycle];
      }
      if (this.selectedCycles.length > 0) {
        this.emitSelectionChange();
      }
    }
  }

  get allSelected(): boolean {
    if (this.pageOnlySelect) {
      const pageCycles = this.getCurrentPageCycles();
      return (
        pageCycles.length > 0 &&
        pageCycles.every((c) => this.isCycleSelected(c))
      );
    }
    return (
      this.cycles?.length > 0 &&
      this.selectedCycles?.length === this.cycles?.length
    );
  }

  private getCurrentPageCycles(): Cycle[] {
    if (!this.cycleTable) {
      return [];
    }
    const data =
      (this.cycleTable.filteredValue as Cycle[]) || this.cycleTable.value || [];
    const first = this.cycleTable.first ?? 0;
    const rows = this.cycleTable.rows ?? this.pageSize;
    return data.slice(first, first + rows);
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.cycleTable.filterGlobal(target.value, "contains");
  }

  clearSearch(): void {
    this.searchValue = "";
    this.cycleTable.filterGlobal("", "contains");
  }

  isCycleSelected(cycle: Cycle): boolean {
    return this.selectedCycles.some((c) => c.id === cycle.id);
  }

  onCheckboxChange(cycle: Cycle, checked: boolean): void {
    if (checked) {
      if (!this.isCycleSelected(cycle)) {
        this.selectedCycles = [...this.selectedCycles, cycle];
      }
    } else {
      this.selectedCycles = this.selectedCycles.filter(
        (c) => c.id !== cycle.id
      );
    }
    this.emitSelectionChange();
  }

  onRadioChange(cycle: Cycle): void {
    this.selectedCycle = cycle;
    this.selectedCycles = [cycle];
    this.emitSelectionChange();
  }

  selectAll(): void {
    if (this.pageOnlySelect) {
      const pageCycles = this.getCurrentPageCycles();
      const currentIds = new Set(this.selectedCycles.map((c) => c.id));
      const newCycles = pageCycles.filter((c) => !currentIds.has(c.id));
      this.selectedCycles = [...this.selectedCycles, ...newCycles];
    } else {
      this.selectedCycles = [...this.cycles];
    }
    this.emitSelectionChange();
  }

  unselectAll(): void {
    if (this.pageOnlySelect) {
      const pageIds = new Set(this.getCurrentPageCycles().map((c) => c.id));
      this.selectedCycles = this.selectedCycles.filter(
        (c) => !pageIds.has(c.id)
      );
    } else {
      this.selectedCycles = [];
    }
    this.emitSelectionChange();
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.unselectAll();
    } else {
      this.selectAll();
    }
  }

  private emitSelectionChange(): void {
    this.selectionChange.emit([...this.selectedCycles]);
  }
}
