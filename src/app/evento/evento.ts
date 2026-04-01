import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { Hart, MobRankingOrderBy, RankingEntry, RankingResponse } from '../services/hart';

interface EventoTabConfig {
  id: string;
  mobId: number;
  start: number;
  end: number;
  label: string;
  orderBy: MobRankingOrderBy;
}

@Component({
  selector: 'app-evento',
  standalone: true,
  imports: [CommonModule, Header, Footer],
  templateUrl: './evento.html',
  styleUrl: './evento.scss',
})
export class Evento implements OnInit {

  // Configuración de las pestañas del evento
  // Cada pestaña representa un rango de niveles y un mob específico, con un criterio de ordenamiento (victorias o mejor tiempo)
  readonly tabs: EventoTabConfig[] = [
 
  {
    id: 'rangoFinalTiempo',
    mobId: 854,
    start: 1,
    end: 200,
    label: 'Crocabulia Tiempo',
    orderBy: 'mejorTiempo',
  },
];

  activeTabId = this.tabs[0].id;

  isLoading = false;
  errorMessage = '';

  rankings: Record<string, RankingEntry[]> = {};
  appliedOrderBy: Partial<Record<string, MobRankingOrderBy>> = {};

  private loadedTabs = new Set<string>();

  constructor(
    private hartService: Hart,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    for (const tab of this.tabs) {
      this.rankings[this.getRankingKey(tab.id, tab.orderBy)] = [];
    }
    this.loadTabData(this.activeTabId);
  }

  selectTab(tabId: string): void {
    this.activeTabId = tabId;
    const tab = this.tabs.find((item) => item.id === tabId);
    if (!tab) {
      return;
    }

    const tabKey = this.getRankingKey(tab.id, tab.orderBy);
    if (!this.loadedTabs.has(tabKey)) {
      this.loadTabData(tabId);
    }
  }

  getRows(): RankingEntry[] {
    const activeTab = this.getActiveTabConfig();
    return this.rankings[this.getRankingKey(activeTab.id, activeTab.orderBy)] || [];
  }

  getTabLabel(tab: EventoTabConfig): string {
  return tab.label;
}

  getClassName(row: RankingEntry): string {
    const classId = Number(row.clase);
    const classMap: Record<number, string> = {
      1: 'Feca',
      2: 'Osamodas',
      3: 'Anutrof',
      4: 'Sram',
      5: 'Xelor',
      6: 'Zurcarak',
      7: 'Aniripsa',
      8: 'Yopuka',
      9: 'Ocra',
      10: 'Sadida',
      11: 'Sacrogrito',
      12: 'Pandawa',
      13: 'Steamer',
      14: 'Tymador',
      15: 'Zobal',
      16: 'Selotrop',
      17: 'Anutropia',
      18: 'Hipermago',
    };

    return classMap[classId] || `Clase ${row.clase ?? '—'}`;
  }

  getClassIcon(row: RankingEntry): string {
    const classId = Number(row.clase ?? 0);
    const sex = Number(row.sexo ?? 0);
    return `/assets/clases/${classId}_${sex}.png`;
  }

  getName(row: RankingEntry): string {
    return row.nombre || row.name || '—';
  }

  getLevel(row: RankingEntry): number | string {
    return row.nivel ?? '—';
  }

  getMobName(row: RankingEntry): string {
    return String((row as any).mobs ?? '—');
  }

  getWins(row: RankingEntry): number | string {
    return row.victorias ?? row.wins ?? '—';
  }

  getFirstKill(row: RankingEntry): string {
    return this.formatDateTime(row.primeraMuerte);
  }

  getLastKill(row: RankingEntry): string {
    return this.formatDateTime(row.ultimaMuerte);
  }

  getBestTime(row: RankingEntry): string {
    const totalMs = Number(row.mejor_tiempo_ms);
    if (!Number.isFinite(totalMs) || totalMs <= 0) {
      return '—';
    }

    const totalSeconds = Math.floor(totalMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getBestTimeDate(row: RankingEntry): string {
    return this.formatDateTime(row.fecha_mejor_tiempo);
  }

  showVictoriesColumns(): boolean {
    return this.getActiveTabConfig().orderBy === 'victorias';
  }

  showBestTimeColumns(): boolean {
    return this.getActiveTabConfig().orderBy === 'mejorTiempo';
  }

  getAppliedOrderLabel(): string {
    const activeTab = this.getActiveTabConfig();
    const rankingKey = this.getRankingKey(activeTab.id, activeTab.orderBy);
    const appliedOrder = this.appliedOrderBy[rankingKey] ?? activeTab.orderBy;
    return appliedOrder === 'mejorTiempo' ? 'Por mejor tiempo' : 'Por victorias';
  }

  private loadTabData(tabId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    const tab = this.tabs.find((item) => item.id === tabId);
    if (!tab) {
      this.isLoading = false;
      this.errorMessage = 'No se encontro la configuracion del tab.';
      return;
    }

    const rankingKey = this.getRankingKey(tabId, tab.orderBy);

    this.hartService.getMobRanking(tab.mobId, tab.start, tab.end, tab.orderBy).subscribe({
      next: (response: RankingResponse) => {
        this.rankings[rankingKey] = this.normalizeRankingResponse(response);
        this.appliedOrderBy[rankingKey] = response?.orderBy ?? tab.orderBy;
        this.loadedTabs.add(rankingKey);
        this.isLoading = false;
        this.refreshView();
      },
      error: (error) => {
        this.rankings[rankingKey] = [];
        this.errorMessage = error?.message || 'No se pudo cargar el ranking del evento.';
        this.isLoading = false;
        this.refreshView();
      },
    });
  }

  private normalizeRankingResponse(response: RankingResponse | RankingEntry[] | any): RankingEntry[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.rows)) {
      return response.rows;
    }

    return [];
  }

  private refreshView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }

  private getActiveTabConfig(): EventoTabConfig {
    return this.tabs.find((tab) => tab.id === this.activeTabId) ?? this.tabs[0];
  }

  private getRankingKey(tabId: string, orderBy: MobRankingOrderBy): string {
    return `${tabId}::${orderBy}`;
  }

  private formatDateTime(value?: string): string {
    if (!value) {
      return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(parsed);
  }
}
