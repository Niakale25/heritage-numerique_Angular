import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { ContenuGlobalDto } from '../conte/contenu-global.dto';
import { FamilleSuperAdminDTO } from '../../interfaces/famille-super-admin-dto.interface';
import { Auth } from '../../services/auth';
import { ArtisanatDTO } from '../../interfaces/artisanat-dto';

const DASHBOARD_API = 'http://localhost:8080/api/superadmin/dashboard';
const ARTISANAT_API_BASE = 'http://localhost:8080/api/superadmin/contenus-publics/artisanat';
const API_RECHERCHE_FAMILLE = 'http://localhost:8080/api/artisanats'; // ⭐ Nouvelle API

@Component({
  selector: 'app-contenus-artisanal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contenus-artisanal.html',
  styleUrls: ['./contenus-artisanal.css']
})
export class ContenusArtisanal implements OnInit {

  backendOrigin = 'http://localhost:8080';

  allPhotos: any[] = []; // On utilise 'any' pour accepter les deux formats DTO temporairement
  photos: any[] = [];
  familles: FamilleSuperAdminDTO[] = [];

  searchTerm = '';
  selectedFamilleId = 0;

  selectedPhoto: any | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  
  userFullName: string = 'Admin'; 

  // édition
  showEditModal = false;
  editModel: any = {};              
  editPhotoFile?: File;
  editVideoFile?: File;
  uploadProgress = 0;

  constructor(private http: HttpClient, private authService: Auth) {}

  ngOnInit(): void {
    const name = this.authService.getUserFullName();
    if (name) {
      this.userFullName = name;
    }

    this.loadFamilles();
    this.loadContent(); // ⭐ Appel initial unifié
  }

  /* ---------- Helpers ---------- */

  getPhotoUrl(item: any | null): string {
    if (!item) return 'assets/placeholder.jpg';
    
    // ⭐ Gestion intelligente : soit urlPhoto (ancien), soit urlPhotos[0] (nouveau)
    let path = item.urlPhoto || item.thumbnailUrl;
    if (!path && item.urlPhotos && item.urlPhotos.length > 0) {
        path = item.urlPhotos[0];
    }

    if (!path) return 'assets/placeholder.jpg';
    if (path.startsWith('/')) path = path.substring(1);
    if (!path.includes('uploads/')) path = `uploads/images/${path}`;
    return `${this.backendOrigin}/${path}`;
  }

  /* ---------- Chargement Intelligent ---------- */

  // ⭐ Cette fonction décide quelle API appeler
  loadContent() {
    this.isLoading = true;
    this.errorMessage = null;
    this.photos = []; 
    this.allPhotos = [];

    if (this.selectedFamilleId === 0) {
        // CAS 1 : TOUTES LES FAMILLES (Ancienne API Dashboard)
        this.http.get<ContenuGlobalDto[]>(`${DASHBOARD_API}/artisanats`).subscribe({
            next: data => {
                this.allPhotos = data || [];
                this.applyLocalFilters(); // Filtre texte uniquement
                this.isLoading = false;
            },
            error: err => this.handleError(err)
        });
    } else {
        // CAS 2 : PAR FAMILLE (Nouvelle API ArtisanatController)
        const url = `${API_RECHERCHE_FAMILLE}/famille/${this.selectedFamilleId}`;
        this.http.get<ArtisanatDTO[]>(url).subscribe({
            next: data => {
                // ⭐ MAPPING : On transforme les données pour qu'elles ressemblent au format attendu par le HTML
                const mappedData = (data || []).map(dto => ({
                    ...dto,
                    // Adaptation des champs
                    nomCreateur: dto.nomAuteur,
                    prenomCreateur: dto.prenomAuteur,
                    urlPhoto: (dto.urlPhotos && dto.urlPhotos.length > 0) ? dto.urlPhotos[0] : null,
                    dateCreation: dto.dateCreation,
                    // On garde les autres champs (titre, description, id...)
                }));

                this.allPhotos = mappedData;
                this.applyLocalFilters();
                this.isLoading = false;
            },
            error: err => this.handleError(err)
        });
    }
  }

  handleError(err: any) {
    console.error('Erreur chargement', err);
    this.errorMessage = 'Erreur lors du chargement des données.';
    this.isLoading = false;
  }

  loadFamilles() {
    this.http.get<FamilleSuperAdminDTO[]>(`${DASHBOARD_API}/familles`).subscribe({
      next: data => this.familles = data || [],
      error: err => console.error('Erreur chargement familles', err)
    });
  }

  /* ---------- Filtre Texte Local ---------- */

  //  Appelé quand on tape dans la barre de recherche ou après chargement
  applyLocalFilters() {
    let list = [...this.allPhotos];
    const term = (this.searchTerm || '').toLowerCase().trim();

    if (term) {
      list = list.filter(item =>
        (item.titre || '').toLowerCase().includes(term) ||
        (item.description || '').toLowerCase().includes(term) ||
        (item.nomCreateur || '').toLowerCase().includes(term) ||
        (item.prenomCreateur || '').toLowerCase().includes(term)
      );
    }
    
    // Note : Le filtre par famille est déjà fait par le serveur dans loadContent()
    this.photos = list;
  }

  /* ---------- Modale affichage ---------- */

  openModal(photo: any) {
    this.selectedPhoto = photo;
  }

  closeModal() {
    this.selectedPhoto = null;
  }

  /* ---------- Suppression ---------- */

  deleteFromCard(id: number, event: Event) {
    event.stopPropagation();
    this.confirmAndDelete(id);
  }

  deleteFromModal(id: number) {
    this.confirmAndDelete(id);
  }

  private confirmAndDelete(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet artisanat ?')) return;

    this.http.delete(`${ARTISANAT_API_BASE}/${id}`, { responseType: 'text' }).subscribe({
      next: () => {
        alert('Artisanat supprimé avec succès.');
        this.closeModal();
        this.loadContent(); // Recharger la liste actuelle
      },
      error: err => {
        console.error('Erreur suppression', err);
        alert('Impossible de supprimer. Vérifie les droits / console backend.');
      }
    });
  }

  /* ---------- Edition ---------- */

  startEdit(item: any, event?: Event) {
    if (event) event.stopPropagation();
    this.showEditModal = true;
    this.editModel = { ...item };
    this.editPhotoFile = undefined;
    this.editVideoFile = undefined;
    this.uploadProgress = 0;
  }

  cancelEdit() {
    this.showEditModal = false;
    this.editModel = {};
    this.editPhotoFile = undefined;
    this.editVideoFile = undefined;
    this.uploadProgress = 0;
  }

  onPhotoSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.editPhotoFile = input.files[0];
    }
  }

  onVideoSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.editVideoFile = input.files[0];
    }
  }

  submitEdit() {
    if (!this.editModel || !this.editModel.id) {
      alert('Aucun élément sélectionné pour l\'édition.');
      return;
    }

    const id = (this.editModel.id as number);
    const form = new FormData();

    if (this.editModel.titre !== undefined) form.append('titre', this.editModel.titre || '');
    if (this.editModel.description !== undefined) form.append('description', this.editModel.description || '');
    if (this.editModel.lieu !== undefined) form.append('lieu', this.editModel.lieu || '');
    if (this.editModel.region !== undefined) form.append('region', this.editModel.region || '');

    if (this.editPhotoFile) form.append('photoArtisanat', this.editPhotoFile);
    if (this.editVideoFile) form.append('videoArtisanat', this.editVideoFile);

    this.http.put(`${ARTISANAT_API_BASE}/${id}`, form, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * (event.loaded / event.total));
        } else if (event.type === HttpEventType.Response) {
          alert('Artisanat modifié avec succès.');
          this.cancelEdit();
          this.closeModal();
          this.loadContent(); // Recharger la liste
        }
      },
      error: err => {
        console.error('Erreur modification', err);
        alert('Échec de la modification. Vérifie la console et le backend.');
      }
    });
  }
}