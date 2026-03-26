import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { Hart, RankingEntry, RankingResponse } from '../services/hart';

interface EventoTabConfig {
  id: string;
  mobId: number;
  start: number;
  end: number;
}

@Component({
  selector: 'app-evento',
  standalone: true,
  imports: [CommonModule, Header, Footer],
  templateUrl: './evento.html',
  styleUrl: './evento.scss',
})
export class Evento implements OnInit {
  readonly tabs: EventoTabConfig[] = [
    { id: 'rangoInicial', mobId: 940, start: 1, end: 169 },
    { id: 'rangoFinal', mobId: 1072, start: 170, end: 200 },
  ];

  activeTabId = this.tabs[0].id;

  isLoading = false;
  errorMessage = '';

  rankings: Record<string, RankingEntry[]> = {};

  private loadedTabs = new Set<string>();

  constructor(
    private hartService: Hart,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    for (const tab of this.tabs) {
      this.rankings[tab.id] = [];
    }
    this.loadTabData(this.activeTabId);
  }

  selectTab(tabId: string): void {
    this.activeTabId = tabId;
    if (!this.loadedTabs.has(tabId)) {
      this.loadTabData(tabId);
    }
  }

  getRows(): RankingEntry[] {
    return this.rankings[this.activeTabId] || [];
  }

  getTabLabel(tab: EventoTabConfig): string {
    return `${tab.start} - ${tab.end}`;
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

  private loadTabData(tabId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    const tab = this.tabs.find((item) => item.id === tabId);
    if (!tab) {
      this.isLoading = false;
      this.errorMessage = 'No se encontro la configuracion del tab.';
      return;
    }

    this.hartService.getMobRanking(tab.mobId, tab.start, tab.end).subscribe({
      next: (response: RankingResponse) => {
        this.rankings[tabId] = this.normalizeRankingResponse(response);
        this.loadedTabs.add(tabId);
        this.isLoading = false;
        this.refreshView();
      },
      error: (error) => {
        this.rankings[tabId] = [];
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
}
