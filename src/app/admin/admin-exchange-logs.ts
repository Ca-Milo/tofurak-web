import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  AdminExchangeLogItem,
  AdminExchangeLogObject,
  AdminExchangeLogPagination,
  AdminExchangeLogSearchState,
  AdminService,
} from '../services/admin.service';

interface ParsedItemStat {
  text: string;
  tone: 'positive' | 'negative' | 'neutral' | 'dice';
}

const DOFUS_STAT_LABELS: Record<number, string> = {
  77: 'Roba PM',
  78: '+ PM',
  81: 'Curas',
  84: 'Roba PA',
  91: 'Robar Vida (Agua)',
  92: 'Robar Vida (Tierra)',
  93: 'Robar Vida (Aire)',
  94: 'Robar Vida (Fuego)',
  95: 'Robar Vida (Neutral)',
  96: 'Danos (Agua)',
  97: 'Danos (Tierra)',
  98: 'Danos (Aire)',
  99: 'Danos (Fuego)',
  100: 'Danos (Neutral)',
  101: '- PA',
  105: '+ Danos Reducidos',
  106: 'Reenvia Hechizo',
  107: 'Danos Devueltos',
  108: 'Curar',
  110: '+ Vida',
  111: '+ PA',
  112: '+ Danos',
  114: 'Multiplica Danos',
  115: '+ Golpes Criticos',
  116: '- Alcance',
  117: '+ Alcance',
  118: '+ Fuerza',
  119: '+ Agilidad',
  120: '+ PA',
  121: '+ Danos',
  122: '+ Fallos Criticos',
  123: '+ Suerte',
  124: '+ Sabiduria',
  125: '+ Vitalidad',
  126: '+ Inteligencia',
  127: '- PM',
  128: '+ PM',
  138: '+ % Danos',
  142: '+ Dano Fisico',
  145: '- Danos',
  149: 'Cambia Apariencia',
  152: '- Suerte',
  153: '- Vitalidad',
  154: '- Agilidad',
  155: '- Inteligencia',
  156: '- Sabiduria',
  157: '- Fuerza',
  158: '+ Pods',
  159: '- Pods',
  160: '+ Esquiva PA',
  161: '+ Esquiva PM',
  162: '- Esquiva PA',
  163: '- Esquiva PM',
  164: '- Danos Reducidos',
  165: '+ Dominio',
  168: '- PA',
  169: '- PM',
  171: '- Golpes Criticos',
  174: '+ Iniciativa',
  175: '- Iniciativa',
  176: '+ Prospeccion',
  177: '- Prospeccion',
  178: '+ Curas',
  179: '- Curas',
  182: '+ Criaturas Invocables',
  183: 'Reduccion Magica',
  184: 'Reduccion Fisica',
  186: '- % Danos',
  194: 'Ganar Kamas',
  210: '+ % Res. Tierra',
  211: '+ % Res. Agua',
  212: '+ % Res. Aire',
  213: '+ % Res. Fuego',
  214: '+ % Res. Neutral',
  215: '- % Res. Tierra',
  216: '- % Res. Agua',
  217: '- % Res. Aire',
  218: '- % Res. Fuego',
  219: '- % Res. Neutral',
  220: 'Reenvia Danos',
  225: '+ Danos Trampa',
  226: '+ % Danos Trampa',
  240: '+ Res. Fija Tierra',
  241: '+ Res. Fija Agua',
  242: '+ Res. Fija Aire',
  243: '+ Res. Fija Fuego',
  244: '+ Res. Fija Neutral',
  245: '- Res. Fija Tierra',
  246: '- Res. Fija Agua',
  247: '- Res. Fija Aire',
  248: '- Res. Fija Fuego',
  249: '- Res. Fija Neutral',
  250: '+ % Res. PvP Tierra',
  251: '+ % Res. PvP Agua',
  252: '+ % Res. PvP Aire',
  253: '+ % Res. PvP Fuego',
  254: '+ % Res. PvP Neutral',
  255: '- % Res. PvP Tierra',
  256: '- % Res. PvP Agua',
  257: '- % Res. PvP Aire',
  258: '- % Res. PvP Fuego',
  259: '- % Res. PvP Neutral',
  260: '+ Res. Fija PvP Tierra',
  261: '+ Res. Fija PvP Agua',
  262: '+ Res. Fija PvP Aire',
  263: '+ Res. Fija PvP Fuego',
  264: '+ Res. Fija PvP Neutral',
  265: '+ Danos Reducidos Armadura',
  281: 'Aumenta Alcance Hechizo',
  282: 'Alcance Modificable',
  283: '+ Danos Hechizo',
  284: '+ Curas Hechizo',
  285: 'Reduce Costo PA',
  286: 'Reduce CD',
  287: '+ GC Hechizo',
  288: 'Desactiva Linea Recta',
  289: 'Desactiva Linea de Vision',
  290: '+ Lanzamientos por Turno',
  291: '+ Lanzamientos por Objetivo',
  292: 'Fijar CD',
  320: 'Roba Alcance',
  334: 'Desaparece Buff al Mover',
  335: 'Cambia Apariencia',
  410: '+ Huida',
  411: '- Huida',
  413: '+ Placaje',
  414: '- Placaje',
  415: '+ Danos (Agua)',
  416: '+ Danos (Tierra)',
  417: '+ Danos (Aire)',
  418: '+ Danos (Fuego)',
  419: '+ Danos (Neutral)',
  420: 'Quita Efectos',
  421: 'Retrocede Casillas',
  422: '+ % Escudo',
  423: 'Avanzar Casillas',
  424: '- % PDV Temporal',
  425: '+ Danos Empuje',
  426: '+ Velocidad',
  427: 'Detonar Bomba',
  428: 'Invoca Bomba',
  429: '+ Danos Criticos',
  430: '+ Reduccion Criticos',
  431: '+ Retiro PA',
  432: '+ Retiro PM',
  433: '- Retiro PA',
  434: '- Retiro PM',
  435: '+ Reduccion Empuje',
  436: '- Danos (Agua)',
  437: '- Danos (Tierra)',
  438: '- Danos (Aire)',
  439: '- Danos (Fuego)',
  440: '- Danos (Neutral)',
  441: '- Danos Criticos',
  442: '- Reduccion Criticos',
  443: '- Danos Empuje',
  444: '- Reduccion Empuje',
  446: '+ % Escudo Fijo',
  500: 'Dar Objeto',
  501: '+ Companero',
  550: 'Dar Ogrinas',
  551: 'Dar Creditos',
  604: 'Aprende Hechizo',
  605: 'Ganar Experiencia',
  623: 'Invoca Mob',
  628: 'Invoca Mob',
  669: 'Encarnacion Nivel',
  700: 'Cambio Elemento',
  701: 'Potencia Runa',
  705: 'Potencia Captura Alma',
  706: 'Domesticar Montura',
  717: 'Nombre Mob',
  724: 'Titulo',
  725: 'Ornamento',
  731: 'Agresion Automatica',
  743: 'Bonus Drop',
  750: 'Bonus Captura',
  800: 'Puntos de Vida',
  805: 'Recibido el',
  806: 'Corpulencia',
  807: 'Ultima Comida',
  808: 'Se ha comido el',
  810: 'Tamano',
  811: 'Turnos',
  812: 'Resistencia',
  814: 'Llave Mazmorra',
  815: 'Llave Mazmorra (Oculto)',
  850: 'Aura',
  900: 'Color Nombre',
  901: 'Cambiar GFX',
  902: 'Cambiar Nombre',
  905: 'Lanza Combate',
  910: '+ % Exp',
  911: '+ % Exp Oficio',
  915: 'Apariencia Objeto',
  930: '+ Serenidad',
  931: '+ Agresividad',
  932: '+ Resistencia (Montura)',
  933: '- Resistencia (Montura)',
  934: '+ Amor',
  935: '- Amor',
  936: 'Acelera Madurez',
  937: 'Ralentiza Madurez',
  939: '+ Capacidades',
  940: 'Capacidades Mejoradas',
  946: 'Quita Objeto',
  947: 'Recuperar Objeto Cercado',
  948: 'Objeto Cercado',
  949: 'Subir/Bajar Montura',
  950: 'Dar Estado',
  951: 'Quitar Estado',
  960: 'Alineacion',
  961: 'Rango',
  962: 'Nivel',
  963: 'Creada hace (Dias)',
  964: 'Apellidos',
  970: 'Real GFX',
  971: 'Humor Objevivo',
  972: 'Skin Objevivo',
  973: 'Real Tipo',
  974: 'Exp Objevivo',
  982: 'Lanzar Hechizo Cond.',
  983: 'Intercambiable Desde',
  984: 'Lanzar Hechizo',
  985: 'Modificado por',
  986: 'Prepara Pergaminos',
  987: 'Pertenece a',
  988: 'Fabricado por',
  989: 'Mision',
  990: 'Numero Comidas',
  991: 'Pozo Residual',
  992: 'Ligado a Cuenta',
  993: 'Borrar Desde',
  994: 'Certificado Invalido',
  995: 'Consultar Montura',
  996: 'Pertenece a',
  997: 'Nombre',
  998: 'Validez',
  999: 'Personaje Seguidor',
  1000: 'Objeto Oculto 1',
  1001: 'Objeto Oculto 2',
  1002: 'Objeto Fabrushio',
  1003: 'Objeto VIP',
  1004: 'Traje Montura',
  1005: 'Ligado a Personaje',
  2008: '+ Dano',
  2009: 'Reduccion Dano',
  2010: 'Dano Hechizo',
  2011: 'Dano Arma',
  2012: 'Reduccion Hechizo',
  2013: 'Reduccion Arma',
  2014: 'Dano Distancia',
  2015: 'Dano Cerca',
  2016: 'Reduccion Distancia',
  2017: 'Reduccion Cerca',
  2018: 'Dano Elemental',
  2019: 'Dano Robo Elemental',
  2020: 'Aleatorio Elemental',
  2021: 'Pasiva Marfil',
  2022: 'Gema No Repite',
  2023: '+ Vida Porcentual',
  2024: 'Disminuir Dano',
  2025: '+ Resistencia Dano',
  2026: '- Dano Hechizo',
  2027: '- Dano Arma',
  2028: '+ Aumento Hechizo',
  2029: '+ Aumento Arma',
  2030: '- Dano Distancia',
  2031: '- Dano Cerca',
  2032: '+ Aumento Distancia',
  2033: '+ Aumento Cerca',
};

@Component({
  selector: 'app-admin-exchange-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe, DecimalPipe],
  templateUrl: './admin-exchange-logs.html',
  styleUrl: './admin-exchange-logs.scss',
})
export class AdminExchangeLogs implements OnInit, OnDestroy {
  loading = true;
  errorMessage = '';

  filters = {
    tiposExchange: [] as string[],
    eventos: [] as string[],
    acciones: [] as string[],
    ips: [] as string[],
  };

  form: AdminExchangeLogSearchState = this.createEmptyForm();
  pagination: AdminExchangeLogPagination = {
    page: 1,
    perPage: 40,
    totalRows: 0,
    totalPages: 0,
    runSearch: false,
  };
  rows: AdminExchangeLogItem[] = [];
  expandedRows = new Set<number>();
  openDropdown: 'tipoExchange' | 'evento' | 'accion' | 'ip' | null = null;
  dropdownSearch = {
    tipoExchange: '',
    evento: '',
    accion: '',
    ip: '',
  };
  private readonly statsCache = new Map<string, ParsedItemStat[]>();

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

  get runSearch(): boolean {
    return this.pagination.runSearch;
  }

  get searchValueLabel(): string {
    if (this.form.searchTarget === 'cuenta') {
      return 'Nombre o ID de la Cuenta';
    }

    return 'Nombre o ID del Personaje';
  }

  onSearchTargetChange(): void {
    if (this.form.searchTarget === 'todos') {
      this.form.searchValue = '';
    }
  }

  toggleDropdown(name: 'tipoExchange' | 'evento' | 'accion' | 'ip'): void {
    this.openDropdown = this.openDropdown === name ? null : name;
    if (this.openDropdown === name) {
      this.dropdownSearch[name] = '';
    }
  }

  closeDropdown(): void {
    this.openDropdown = null;
  }

  selectDropdownOption(name: 'tipoExchange' | 'evento' | 'accion' | 'ip', value: string): void {
    this.form[name] = value;
    this.dropdownSearch[name] = '';
    this.openDropdown = null;
  }

  clearDropdownValue(name: 'tipoExchange' | 'evento' | 'accion' | 'ip'): void {
    this.form[name] = '';
    this.dropdownSearch[name] = '';
  }

  getFilteredDropdownOptions(name: 'tipoExchange' | 'evento' | 'accion' | 'ip'): string[] {
    const sourceMap = {
      tipoExchange: this.filters.tiposExchange,
      evento: this.filters.eventos,
      accion: this.filters.acciones,
      ip: this.filters.ips,
    };

    const term = this.dropdownSearch[name].trim().toUpperCase();
    const source = sourceMap[name] ?? [];

    if (!term) {
      return source;
    }

    return source.filter(item => item.toUpperCase().includes(term));
  }

  submitFilters(): void {
    if (!this.form.searchTarget) {
      this.errorMessage = 'Por favor, selecciona qué deseas buscar.';
      this.refreshView();
      return;
    }

    if (this.form.searchTarget !== 'todos' && !this.form.searchValue.trim()) {
      this.errorMessage = 'Por favor, escribe el nombre o ID a buscar.';
      this.refreshView();
      return;
    }

    this.errorMessage = '';
    this.loadLogs(this.buildPayload(1));
  }

  clearFilters(): void {
    this.expandedRows.clear();
    this.form = this.createEmptyForm();
    this.pagination = {
      page: 1,
      perPage: 40,
      totalRows: 0,
      totalPages: 0,
      runSearch: false,
    };
    this.rows = [];
    this.errorMessage = '';
    this.loadLogs();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination.totalPages || page === this.pagination.page) {
      return;
    }

    this.loadLogs(this.buildPayload(page));
  }

  toggleDetails(rowId: number): void {
    if (this.expandedRows.has(rowId)) {
      this.expandedRows.delete(rowId);
    } else {
      this.expandedRows.add(rowId);
    }
  }

  isExpanded(rowId: number): boolean {
    return this.expandedRows.has(rowId);
  }

  formatTimestamp(timestamp: number): string {
    if (!timestamp) {
      return '--/--/---- --:--';
    }

    return this.datePipe.transform(timestamp, 'dd/MM/yyyy HH:mm') || '--/--/---- --:--';
  }

  formatNumber(value: number, digits = '1.0-0'): string {
    return this.decimalPipe.transform(value, digits) ?? '0';
  }

  trackByRow(_index: number, row: AdminExchangeLogItem): number {
    return row.id;
  }

  getParsedStats(item: AdminExchangeLogObject): ParsedItemStat[] {
    const rawStats = String(item.stats ?? '').trim();

    if (!rawStats) {
      return [];
    }

    const cached = this.statsCache.get(rawStats);
    if (cached) {
      return cached;
    }

    const parsedStats = rawStats
      .split(',')
      .map(effect => this.parseStatEffect(effect))
      .filter((effect): effect is ParsedItemStat => effect !== null);

    this.statsCache.set(rawStats, parsedStats);
    return parsedStats;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openDropdown = null;
  }

  private loadLogs(query: Record<string, string | number | boolean | undefined> = {}): void {
    this.loading = true;
    this.errorMessage = '';
    this.refreshView();

    this.adminService
      .getExchangeLogs(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.filters = response.filters;
          this.form = { ...response.search };
          this.pagination = response.pagination;
          this.rows = response.rows;
          this.loading = false;
          this.refreshView();
        },
        error: error => {
          this.loading = false;
          this.rows = [];
          this.pagination = {
            page: 1,
            perPage: 40,
            totalRows: 0,
            totalPages: 0,
            runSearch: false,
          };
          this.errorMessage =
            error?.error?.message || error?.message || 'No se pudo cargar el modulo de logs de intercambios.';
          this.refreshView();
        },
      });
  }

  private buildPayload(page: number): Record<string, string | number> {
    const params: Record<string, string | number> = {
      search_target: this.form.searchTarget,
      p: page,
    };

    if (this.form.searchTarget !== 'todos' && this.form.searchValue.trim()) {
      params['search_value'] = this.form.searchValue.trim();
    }

    if (this.form.tipoExchange) {
      params['tipo_exchange'] = this.form.tipoExchange;
    }

    if (this.form.evento) {
      params['evento'] = this.form.evento;
    }

    if (this.form.accion) {
      params['accion'] = this.form.accion;
    }

    if (this.form.ip) {
      params['ip'] = this.form.ip;
    }

    if (this.form.fechaInicio) {
      params['fecha_inicio'] = this.form.fechaInicio;
    }

    if (this.form.fechaFin) {
      params['fecha_fin'] = this.form.fechaFin;
    }

    if (this.form.hasKamas) {
      params['has_kamas'] = 1;
    }

    if (this.form.hasOgrinas) {
      params['has_ogrinas'] = 1;
    }

    if (this.form.sameIp) {
      params['same_ip'] = 1;
    }

    if (this.form.itemIds.trim()) {
      params['item_ids'] = this.form.itemIds.trim();
    }

    if (this.form.freeText.trim()) {
      params['free_text'] = this.form.freeText.trim();
    }

    return params;
  }

  private createEmptyForm(): AdminExchangeLogSearchState {
    return {
      searchTarget: '',
      searchValue: '',
      tipoExchange: '',
      evento: '',
      accion: '',
      ip: '',
      fechaInicio: '',
      fechaFin: '',
      hasKamas: false,
      hasOgrinas: false,
      sameIp: false,
      itemIds: '',
      freeText: '',
    };
  }

  private refreshView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }

  private parseStatEffect(effect: string): ParsedItemStat | null {
    const parts = effect.split('#');
    if (parts.length < 2) {
      return null;
    }

    const statId = parseInt(parts[0], 16);
    if (!Number.isFinite(statId)) {
      return null;
    }

    const value = parseInt(parts[1] || '0', 16) || 0;
    const statName = DOFUS_STAT_LABELS[statId] ?? `Efecto Desconocido [ID: ${statId}]`;
    const diceValue = parts[4] || '';

    if ((value === 0 || [97, 98, 99, 100, 101, 81].includes(statId)) && diceValue.includes('d')) {
      return {
        text: `${statName} ${diceValue}`,
        tone: 'dice',
      };
    }

    if (statName.startsWith('+ ')) {
      return {
        text: `+${value} ${statName.slice(2)}`,
        tone: 'positive',
      };
    }

    if (statName.startsWith('- ')) {
      return {
        text: `-${value} ${statName.slice(2)}`,
        tone: 'negative',
      };
    }

    return {
      text: `${value} ${statName}`.trim(),
      tone: 'neutral',
    };
  }
}
