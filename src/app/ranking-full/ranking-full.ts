import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { Hart, RankingEntry, RankingResponse } from '../services/hart';

type RankingTab = 'pvm' | 'pvp' | 'koliseo' | 'gremios';

@Component({
  selector: 'app-ranking-full',
  standalone: true,
  imports: [CommonModule, Header, Footer],
  templateUrl: './ranking-full.html',
  styleUrl: './ranking-full.scss',
})
export class RankingFull implements OnInit {
  activeTab: RankingTab = 'pvm';

  isLoading = false;
  errorMessage = '';

  rankings: Record<RankingTab, RankingEntry[]> = {
    pvm: [],
    pvp: [],
    koliseo: [],
    gremios: [],
  };

  private loadedTabs = new Set<RankingTab>();
  private readonly guildEmblemFallback = '/assets/ladder/gremios.png';

  constructor(
    private hartService: Hart,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadTabData('pvm');
  }

  selectTab(tab: RankingTab): void {
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
    if (this.activeTab === 'gremios') return ['#', 'Gremio', 'Nivel', 'Experiencia'];
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

  getGuildName(row: RankingEntry): string {
    return row.gremio || row.guild || row.nombre || row.name || '—';
  }

  getGuildLevel(row: RankingEntry): number | string {
    return row.nivel ?? '—';
  }

  getGuildMembers(row: RankingEntry): number | string {
    return row.miembros ?? row.memberCount ?? '—';
  }

  getGuildEmblemUrl(row: RankingEntry): string {
    /*const raw = (row.emblema ?? '').toString().trim();

    if (!raw) return this.guildEmblemFallback;
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/assets/')) {
      return raw;
    }

    return this.guildEmblemFallback;*/
    return '';
  }

  getGuildEmblemAlt(row: RankingEntry): string {
    /*const raw = (row.emblema ?? '').toString().trim();
    const parsed = this.parseGuildEmblem(raw);

    if (!parsed) return 'Emblema de gremio';
    return `Emblema ${parsed.forma}, color símbolo ${parsed.colorSimbolo}, fondo ${parsed.fondo}, color fondo ${parsed.colorFondo}`;*/
    return '';
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

  private loadTabData(tab: RankingTab): void {
    this.isLoading = true;
    this.errorMessage = '';

    const request$ =
      tab === 'pvm'
        ? this.hartService.getPvmRanking()
        : tab === 'pvp'
          ? this.hartService.getPvpRanking()
          : tab === 'koliseo'
            ? this.hartService.getKoliseoRanking()
            : this.hartService.getGremiosRanking();

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

  private parseGuildEmblem(raw: string): {
    forma: string;
    colorSimbolo: string;
    fondo: string;
    colorFondo: string;
  } | null {
    if (!raw || !raw.startsWith('(') || !raw.endsWith(')')) {
      return null;
    }

    const values = raw.slice(1, -1).split(',').map((item) => item.trim());
    if (values.length !== 4) {
      return null;
    }

    return {
      forma: values[0],
      colorSimbolo: this.parseColorToken(values[1]),
      fondo: values[2],
      colorFondo: this.parseColorToken(values[3]),
    };
  }

  private parseColorToken(token: string): string {
    const parsed = Number.parseInt(token, 36);
    if (Number.isNaN(parsed)) {
      return token;
    }

    const hex = (parsed & 0xffffff).toString(16).padStart(6, '0');
    return `#${hex}`;
  }

}
