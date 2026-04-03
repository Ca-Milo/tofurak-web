import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  AdminServerLogItem,
  AdminServerLogPagination,
  AdminServerLogSearchState,
  AdminService,
} from '../services/admin.service';

type SortColumn = 'fecha_hora' | 'tipo' | 'accion' | 'personaje_nombre' | 'cuenta_nombre' | 'objeto_id';

@Component({
  selector: 'app-admin-server-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe, DecimalPipe],
  templateUrl: './admin-server-logs.html',
  styleUrl: './admin-server-logs.scss',
})
export class AdminServerLogs implements OnInit, OnDestroy {
  readonly typeOptions = ['OBJETO', 'KAMAS', 'OGRINAS', 'PERSONAJE', 'CUENTA', 'COMERCIO', 'SISTEMA', 'OTRO'];

  loading = true;
  errorMessage = '';
  totalRows = 0;
  form: AdminServerLogSearchState = this.createEmptyForm();
  pagination: AdminServerLogPagination = {
    page: 1,
    perPage: 50,
    totalRows: 0,
    totalPages: 0,
  };
  rows: AdminServerLogItem[] = [];
  expandedRows = new Set<number>();

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly adminService: AdminService,
    private readonly cdr: ChangeDetectorRef,
    private readonly datePipe: DatePipe,
    private readonly decimalPipe: DecimalPipe,
  ) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submitFilters(): void {
    this.loadLogs(this.buildPayload(1));
  }

  clearFilters(): void {
    this.form = this.createEmptyForm();
    this.rows = [];
    this.expandedRows.clear();
    this.loadLogs();
  }

  setDatePreset(preset: 'hoy' | '7dias' | 'mes'): void {
    const today = new Date();
    const end = this.toDateInputValue(today);
    let start = end;

    if (preset === '7dias') {
      const past = new Date(today);
      past.setDate(today.getDate() - 7);
      start = this.toDateInputValue(past);
    } else if (preset === 'mes') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      start = this.toDateInputValue(first);
    }

    this.form.fechaInicio = start;
    this.form.fechaFin = end;
  }

  toggleSort(column: SortColumn): void {
    if (this.form.sort === column) {
      this.form.dir = this.form.dir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.form.sort = column;
      this.form.dir = column === 'fecha_hora' ? 'DESC' : 'ASC';
    }

    this.loadLogs(this.buildPayload(1));
  }

  getSortIcon(column: SortColumn): string {
    if (this.form.sort !== column) {
      return '↕';
    }

    return this.form.dir === 'ASC' ? '↑' : '↓';
  }

  getTypeClass(type: string): string {
    if (type === 'OBJETO') return 'badge bg-obj';
    if (type === 'KAMAS') return 'badge bg-kam';
    if (type === 'OGRINAS') return 'badge bg-ogr';
    if (type === 'SISTEMA') return 'badge bg-sys';
    return 'badge bg-def';
  }

  toggleDetails(id: number): void {
    if (this.expandedRows.has(id)) {
      this.expandedRows.delete(id);
    } else {
      this.expandedRows.add(id);
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedRows.has(id);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination.totalPages || page === this.pagination.page) {
      return;
    }

    this.loadLogs(this.buildPayload(page));
  }

  formatTimestamp(timestamp: number): string {
    return this.datePipe.transform(timestamp, 'yyyy-MM-dd HH:mm:ss') || '--';
  }

  formatNumber(value: number): string {
    return this.decimalPipe.transform(value, '1.0-0') ?? '0';
  }

  trackByRow(_index: number, row: AdminServerLogItem): number {
    return row.id;
  }

  private loadLogs(payload: Record<string, string | number> = {}): void {
    this.loading = true;
    this.errorMessage = '';
    this.refreshView();

    this.adminService
      .getServerLogs(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.form = { ...response.search };
          this.pagination = response.pagination;
          this.totalRows = response.summary.totalRows;
          this.rows = response.rows;
          this.loading = false;
          this.refreshView();
        },
        error: error => {
          this.loading = false;
          this.rows = [];
          this.errorMessage =
            error?.error?.message || error?.message || 'No se pudo cargar el modulo de logs del servidor.';
          this.refreshView();
        },
      });
  }

  private buildPayload(page: number): Record<string, string | number> {
    const payload: Record<string, string | number> = {
      p: page,
      sort: this.form.sort,
      dir: this.form.dir,
    };

    if (this.form.tipo) payload['tipo'] = this.form.tipo;
    if (this.form.accion.trim()) payload['accion'] = this.form.accion.trim();
    if (this.form.personaje.trim()) payload['personaje'] = this.form.personaje.trim();
    if (this.form.cuenta.trim()) payload['cuenta'] = this.form.cuenta.trim();
    if (this.form.objeto.trim()) payload['objeto'] = this.form.objeto.trim();
    if (this.form.ip.trim()) payload['ip'] = this.form.ip.trim();
    if (this.form.fechaInicio) payload['fecha_inicio'] = this.form.fechaInicio;
    if (this.form.fechaFin) payload['fecha_fin'] = this.form.fechaFin;

    return payload;
  }

  private createEmptyForm(): AdminServerLogSearchState {
    return {
      tipo: '',
      accion: '',
      personaje: '',
      cuenta: '',
      objeto: '',
      ip: '',
      fechaInicio: '',
      fechaFin: '',
      sort: 'fecha_hora',
      dir: 'DESC',
    };
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private refreshView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }
}
