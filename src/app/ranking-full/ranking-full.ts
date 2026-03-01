import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { Hart, RankingEntry, RankingResponse } from '../services/hart';

@Component({
  selector: 'app-ranking-full',
  standalone: true,
  imports: [CommonModule, Header, Footer],
  templateUrl: './ranking-full.html',
  styleUrl: './ranking-full.scss',
})
export class RankingFull implements OnInit {
  activeTab: 'pvm' | 'pvp' | 'koliseo' = 'pvm';

  isLoading = false;
  errorMessage = '';

  rankings: Record<'pvm' | 'pvp' | 'koliseo', RankingEntry[]> = {
    pvm: [],
    pvp: [],
    koliseo: [],
  };

  private loadedTabs = new Set<'pvm' | 'pvp' | 'koliseo'>();

  constructor(
    private hartService: Hart,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadTabData('pvm');
  }

  selectTab(tab: 'pvm' | 'pvp' | 'koliseo'): void {
    this.activeTab = tab;
    if (!this.loadedTabs.has(tab)) {
      this.loadTabData(tab);
    }
  }

  getRows(): RankingEntry[] {
    return this.rankings[this.activeTab] || [];
  }

  getColumnLabels(): string[] {
    if (this.activeTab === 'pvm') return ['#', 'Personaje', 'Nivel', 'Experiencia'];
    if (this.activeTab === 'pvp') return ['#', 'Personaje', 'Grado', 'Honor', 'Victorias', 'Derrotas'];
    return ['#', 'Personaje', 'Rating', 'Victorias', 'Derrotas'];
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

  getExperience(row: RankingEntry): number | string {
    return row.experiencia ?? row.exp ?? row.puntos ?? '—';
  }

  getGradoAlas(row: RankingEntry): number | string {
    return row.gradoalas?? '—';
  }

  getHonor(row: RankingEntry): number | string {
    return row.honor?? '—';
  }

  getWins(row: RankingEntry): number | string {
    return row.victorias ?? row.wins ?? '—';
  }

  getLosses(row: RankingEntry): number | string {
    return row.derrotas ?? row.losses ?? '—';
  }

  getRating(row: RankingEntry): number | string {
    if(this.activeTab === 'koliseo') {
      const wins = Number(this.getWins(row)) || 0;
      const losses = Number(this.getLosses(row)) || 0;
      const totalGames = wins + losses;
      if(totalGames === 0) return '—';
      const winRate = (wins / totalGames) * 100;
      return `${winRate.toFixed(2)}%`;
    }
    return row.rating ?? row.puntos ?? '—';
  }

  private loadTabData(tab: 'pvm' | 'pvp' | 'koliseo'): void {
    this.isLoading = true;
    this.errorMessage = '';

    const request$ =
      tab === 'pvm'
        ? this.hartService.getPvmRanking()
        : tab === 'pvp'
          ? this.hartService.getPvpRanking()
          : this.hartService.getKoliseoRanking();

    request$.subscribe({
      next: (response: RankingResponse) => {
        this.rankings[tab] = this.normalizeRankingResponse(response);
        this.loadedTabs.add(tab);
        this.isLoading = false;
        this.refreshView();
      },
      error: (error) => {
        this.rankings[tab] = [];
        this.errorMessage = error?.message || 'No se pudo cargar el ranking.';
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
