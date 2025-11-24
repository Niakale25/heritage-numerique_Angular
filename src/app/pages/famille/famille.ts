import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { DashboardService } from '../../sevices/dashboard-service';
import { FamilleSuperAdminDTO } from '../../interfaces/famille-super-admin-dto.interface';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-famille',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './famille.html',
  styleUrls: ['./famille.css'] // Attention: c'est 'styleUrls' au pluriel
})
export class Famille implements OnInit { 

  // Injection des services via inject() (plus moderne) ou constructeur
  private dashboardService = inject(DashboardService);
  private authService = inject(Auth);

  familles: FamilleSuperAdminDTO[] = [];
  famillesFiltrees: FamilleSuperAdminDTO[] = [];
  
  isLoading: boolean = true;
  errorMessage: string | null = null;
  adminName: string = "Super Admin";

  // Variables de filtrage
  searchTerm: string = '';
  filterPeriod: string = 'all'; 

  ngOnInit(): void {
    const name = this.authService.getUserFullName();
    if (name) {
        this.adminName = name;
    }
    this.loadAllFamilles();
  }

  loadAllFamilles(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.dashboardService.getAllFamilles().subscribe({
      next: (data) => {
        this.familles = data;
        this.isLoading = false;
        // On applique les filtres dès le chargement pour remplir 'famillesFiltrees'
        this.applyFilters();
      },
      error: (err) => {
        this.errorMessage = err.message || "Erreur lors du chargement des familles.";
        this.isLoading = false;
        console.error("Erreur:", err);
      }
    });
  }

  /**
   * Cœur de la logique de recherche
   */
  applyFilters(): void {
    let temp = [...this.familles];
    const search = this.searchTerm.toLowerCase().trim(); // .trim() enlève les espaces inutiles

    // 1. Filtre Texte (Nom, Admin prénom, Admin nom)
    if (search) {
      temp = temp.filter(f => 
        (f.nom ?? '').toLowerCase().includes(search) ||
        (f.nomAdmin ?? '').toLowerCase().includes(search) ||
        (f.prenomAdmin ?? '').toLowerCase().includes(search)
      );
    }
    
    // 2. Filtre Période
    if (this.filterPeriod !== 'all') {
      const now = new Date();
      let limitDate = new Date();

      if (this.filterPeriod === 'last_week') {
        limitDate.setDate(now.getDate() - 7); 
      } else if (this.filterPeriod === 'last_month') {
        limitDate.setDate(now.getDate() - 30);
      }

      temp = temp.filter(f => {
        if (!f.dateCreation) return false;
        const d = new Date(f.dateCreation);
        return !isNaN(d.getTime()) && d >= limitDate;
      });
    }

    this.famillesFiltrees = temp;
  }
  
  getStatusLabel(isActive: boolean | null): string {
    return (isActive === true) ? 'Actif' : 'Inactif';
  }
}