import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { RouterLink } from '@angular/router';
import { SuperAdminDashboardDTO, ContenuRecentDTO } from '../../interfaces/dashboard-dto.interface';
import { DashboardService } from '../../sevices/dashboard-service';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule], 
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  dashboardData: SuperAdminDashboardDTO | null = null;
  
  // Listes filtrées
  filteredContenus: ContenuRecentDTO[] = [];
  filteredFamilles: any[] = []; 
  
  // Critères de recherche
  searchTerm: string = ''; 
  selectedDate: string = ''; // ⭐️ NOUVEAU : date au format 'YYYY-MM-DD'

  isLoading: boolean = true;
  errorMessage: string | null = null;
  adminName: string = "Super Admin";
  
  constructor(
    private dashboardService: DashboardService,
    private authService: Auth
  ) {}

  ngOnInit(): void {
    const name = this.authService.getUserFullName();
    if (name) {
      this.adminName = name;
    }
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.dashboardService.getDashboardComplet().subscribe({
      next: (data: SuperAdminDashboardDTO) => {
        this.dashboardData = data;
        
        // Initialisation des listes
        this.filteredContenus = data.contenusRecents || [];
        this.filteredFamilles = data.famillesRecentes || [];
        
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || "Échec de la récupération.";
        this.isLoading = false;
        console.error("Erreur:", err);
      }
    });
  }

  // ⭐️ FONCTION DE RECHERCHE MISE À JOUR (Texte + Date)
  onSearch(): void {
    if (!this.dashboardData) return;

    const term = this.searchTerm.toLowerCase().trim();
    const dateFilter = this.selectedDate; // Format "2023-11-24"

    // Fonction utilitaire pour vérifier la date
    const checkDate = (dateString: string | undefined): boolean => {
        if (!dateFilter) return true; // Si pas de filtre date, on accepte tout
        if (!dateString) return false;
        // On compare le début de la chaîne ISO (ex: "2023-11-24T10:00...") avec le filtre
        return dateString.startsWith(dateFilter);
    };

    // 1. Filtrer les Contenus
    this.filteredContenus = (this.dashboardData.contenusRecents || []).filter(c => {
      const matchesText = !term || (
        c.titre.toLowerCase().includes(term) || 
        c.nomCreateur.toLowerCase().includes(term) ||
        c.prenomCreateur.toLowerCase().includes(term)
      );
      const matchesDate = checkDate(c.dateCreation);
      
      return matchesText && matchesDate;
    });

    // 2. Filtrer les Familles
    this.filteredFamilles = (this.dashboardData.famillesRecentes || []).filter((f: any) => {
      const matchesText = !term || (
        f.nom.toLowerCase().includes(term) || 
        f.nomAdmin.toLowerCase().includes(term) ||
        f.prenomAdmin.toLowerCase().includes(term)
      );
      const matchesDate = checkDate(f.dateCreation);

      return matchesText && matchesDate;
    });
  }

  getMaterialIconName(type: ContenuRecentDTO['typeContenu']): string {
    switch (type) {
      case 'CONTE': return 'book';
      case 'ARTISANAT': return 'brush';
      case 'PROVERBE': return 'format_quote';
      case 'DEVINETTE': return 'quiz';
      case 'PHOTO': return 'photo_library';
      default: return 'list_alt';
    }
  }

  getIconClass(type: ContenuRecentDTO['typeContenu']): string {
    switch (type) {
      case 'CONTE': return 'item-icon-book';
      case 'ARTISANAT': return 'item-icon-artisanat';
      case 'PROVERBE': return 'item-icon-proverbe';
      case 'DEVINETTE': return 'item-icon-devinette';
      case 'PHOTO': return 'item-icon-photo';
      default: return 'item-icon-default';
    }
  }
}