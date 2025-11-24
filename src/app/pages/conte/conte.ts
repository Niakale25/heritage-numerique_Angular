import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  Signal,
  computed,
  signal,
  WritableSignal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ContenuGlobalDto } from './contenu-global.dto';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-conte',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './conte.html',
  styleUrls: ['./conte.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Conte implements OnInit {

  // ---------- SIGNALS ----------
  contes: WritableSignal<ContenuGlobalDto[]> = signal([]);
  searchTerm = signal('');
  selectedRegion = signal<string | null>(null);
  isFilterMenuOpen = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);

  userFullName = signal<string>('Admin');

  // ---------- SERVICES ----------
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(Auth);

  // ---------- API ----------
  private apiBase = 'http://localhost:8080/api/superadmin/dashboard';
  private superAdminApiBase = 'http://localhost:8080/api/superadmin';

  // Base pour reconstruire les chemins images & PDF
  private resourceBaseUrl = 'http://localhost:8080';

  // ---------- REGIONS UNIQUES ----------
  uniqueRegions: Signal<string[]> = computed(() => {
    const set = new Set<string>();
    this.contes().forEach(c => {
      if (c.regionFamille) set.add(c.regionFamille);
    });
    return Array.from(set).sort();
  });

  // ---------- CONTES FILTRÉS ----------
  filteredContes: Signal<ContenuGlobalDto[]> = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const region = this.selectedRegion();

    return this.contes().filter(c => {
      const matchesSearch =
        !term ||
        (c.titre && c.titre.toLowerCase().includes(term)) ||
        (c.nomCreateur && c.nomCreateur.toLowerCase().includes(term)) ||
        (c.prenomCreateur && c.prenomCreateur.toLowerCase().includes(term)) ||
        (c.nomFamille && c.nomFamille.toLowerCase().includes(term)) ||
        (c.regionFamille && c.regionFamille.toLowerCase().includes(term));

      const matchesRegion = !region || c.regionFamille === region;

      return matchesSearch && matchesRegion;
    });
  });

  // ---------- INIT ----------
  ngOnInit(): void {
    const name = this.authService.getUserFullName();
    if (name) this.userFullName.set(name);

    this.fetchContes();
  }

  // ---------- GET CONTES ----------
  fetchContes(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<ContenuGlobalDto[]>(`${this.apiBase}/contes`)
      .pipe(
        catchError(err => {
          console.error('Erreur API contes', err);
          this.error.set('Impossible de charger les contes.');
          this.isLoading.set(false);
          return of([]);
        })
      )
      .subscribe(data => {
        this.contes.set(data ?? []);
        this.isLoading.set(false);
      });
  }

  // ---------- NAVIGATION ----------
  viewConteDetails(id: number): void {
    this.router.navigate(['/accueil/conte', id]);
  }

  // NAVIGUER VERS MODIFICATION
  modifierConte(conte: ContenuGlobalDto): void {
    this.router.navigate(['/accueil/conte/edition', conte.id]);
  }

  // ---------- SUPPRESSION ----------
  supprimerConte(conte: ContenuGlobalDto): void {
    const confirmation = confirm(`Voulez-vous supprimer "${conte.titre}" ?`);
    if (!confirmation) return;

    this.http.delete(
      `${this.superAdminApiBase}/contenus-publics/conte/${conte.id}`,
      { responseType: 'text' }
    )
      .pipe(
        catchError(err => {
          console.error('Erreur suppression', err);
          alert("Erreur lors de la suppression du conte.");
          return of(null);
        })
      )
      .subscribe(res => {
        if (res) {
          this.contes.update(list => list.filter(c => c.id !== conte.id));
          alert("Conte supprimé avec succès.");
        }
      });
  }

  // -------------------------------------------------
  // ----------- MÉTHODES UTILITAIRES ---------------
  // -------------------------------------------------

  updateSearchTerm(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  toggleFilterMenu(): void {
    this.isFilterMenuOpen.update(v => !v);
  }

  selectRegion(region: string | null): void {
    this.selectedRegion.set(region);
    this.isFilterMenuOpen.set(false);
  }

  countContesByRegion(region: string): number {
    return this.contes().filter(c => c.regionFamille === region).length;
  }

  // RECONSTRUCTION DES URL POUR LES IMAGES
  getThumbnailUrl(url?: string): string {
    if (!url) {
      return 'https://placehold.co/70x70/967B56/FFFFFF?text=Conte';
    }

    if (url.startsWith('/')) {
      return this.resourceBaseUrl + url;
    }

    return url;
  }

  // FORMAT DATE
  formatCreationDate(dateString?: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }
}
