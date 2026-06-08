import {
  Component,
  inject,
  Input,
  Output,
  EventEmitter,
  OnChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MultiSelectModule } from "primeng/multiselect";
import { Project } from "../project";
import { ProjectService } from "../project.service";
import { Observable, BehaviorSubject, of } from "rxjs";
import { map, catchError, tap, shareReplay } from "rxjs/operators";

@Component({
  selector: "mxevolve-project-multiselect",
  standalone: true,
  imports: [CommonModule, FormsModule, MultiSelectModule],
  template: `
    <p-multiSelect
      [showClear]="true"
      [options]="(projectOptions$ | async) ?? []"
      placeholder="Select Projects"
      [disabled]="disabled || !!(loading$ | async)"
      [loading]="!!(loading$ | async)"
      [(ngModel)]="internalSelectedIds"
      (onChange)="onSelectionChange($event.value)"
      (onClear)="onClear()"
      [filter]="true"
      class="w-full"
      appendTo="body"
      filterPlaceHolder="Search"
    />
  `,
})
export class ProjectMultiselectComponent implements OnChanges {
  @Input() disabled = false;
  @Input() selectedProjects: string[] = [];
  @Output() selectedProjectsChange = new EventEmitter<Project[]>();

  private readonly projectService = inject(ProjectService);

  internalSelectedIds: string[] = [];

  readonly loading$ = new BehaviorSubject<boolean>(true);

  readonly projects$: Observable<Project[]> = this.projectService
    .getAllProjects()
    .pipe(
      tap(() => this.loading$.next(true)),
      catchError(() => {
        console.error("Failed to load projects");
        this.loading$.next(false);
        return of([]);
      }),
      tap(() => this.loading$.next(false)),
      shareReplay(1)
    );

  readonly projectOptions$ = this.projects$.pipe(
    map((projects) =>
      projects.map((project) => ({
        label: project.name,
        value: project.id,
      }))
    )
  );

  ngOnChanges(): void {
    this.internalSelectedIds = this.selectedProjects;
  }

  private getSelectedProjects(selectedIds: string[]): Observable<Project[]> {
    return this.projects$.pipe(
      map((projects) =>
        projects.filter((project) => selectedIds.includes(project.id))
      )
    );
  }

  onSelectionChange(selectedIds: string[]): void {
    this.getSelectedProjects(selectedIds || []).subscribe(
      (selectedProjects) => {
        this.selectedProjectsChange.emit(selectedProjects);
      }
    );
  }

  onClear(): void {
    this.selectedProjectsChange.emit([]);
  }
}
