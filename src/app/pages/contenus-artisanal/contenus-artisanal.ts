import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { ContenuGlobalDto } from '../conte/contenu-global.dto';
import { FamilleSuperAdminDTO } from '../../interfaces/famille-super-admin-dto.interface';
import { Auth } from '../../services/auth';
// ⭐️ IMPORT du service Auth

const DASHBOARD_API = 'http://localhost:8080/api/superadmin/dashboard'; // pour les GET existants
const ARTISANAT_API_BASE = 'http://localhost:8080/api/superadmin/contenus-publics/artisanat'; // PUT / DELETE

@Component({
  selector: 'app-contenus-artisanal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contenus-artisanal.html',
  styleUrls: ['./contenus-artisanal.css']
})
export class ContenusArtisanal implements OnInit {

  backendOrigin = 'http://localhost:8080';

  allPhotos: ContenuGlobalDto[] = [];
  photos: ContenuGlobalDto[] = [];
  familles: FamilleSuperAdminDTO[] = [];

  searchTerm = '';
  selectedFamilleId = 0;

  selectedPhoto: ContenuGlobalDto | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  
  // ⭐️ PROPRIÉTÉ pour le nom de l'utilisateur (valeur par défaut)
  userFullName: string = 'Admin'; 

  // édition
  showEditModal = false;
  editModel: any = {};             
  editPhotoFile?: File;
  editVideoFile?: File;
  uploadProgress = 0;

  // ⭐️ INJECTION du service Auth dans le constructeur
  constructor(private http: HttpClient, private authService: Auth) {}

  ngOnInit(): void {
    // ⭐️ LOGIQUE DE RÉCUPÉRATION DU NOM
    const name = this.authService.getUserFullName();
    if (name) {
      this.userFullName = name;
    }

    this.loadArtisanats();
    this.loadFamilles();
  }

  /* ---------- Helpers ---------- */

  getPhotoUrl(item: ContenuGlobalDto | null): string {
    if (!item) return 'assets/placeholder.jpg';
    let path = (item as any).urlPhoto || (item as any).thumbnailUrl;
    if (!path) return 'assets/placeholder.jpg';
    if (path.startsWith('/')) path = path.substring(1);
    if (!path.includes('uploads/')) path = `uploads/images/${path}`;
    return `${this.backendOrigin}/${path}`;
  }

  /* ---------- Chargement ---------- */

  loadArtisanats() {
    this.isLoading = true;
    this.errorMessage = null;
    this.http.get<ContenuGlobalDto[]>(`${DASHBOARD_API}/artisanats`).subscribe({
      next: data => {
        this.allPhotos = data || [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: err => {
        console.error('Erreur chargement artisanats', err);
        this.errorMessage = 'Erreur lors du chargement des artisanats.';
        this.isLoading = false;
      }
    });
  }

  loadFamilles() {
    this.http.get<FamilleSuperAdminDTO[]>(`${DASHBOARD_API}/familles`).subscribe({
      next: data => this.familles = data || [],
      error: err => console.error('Erreur chargement familles', err)
    });
  }

  /* ---------- Filtre / Recherche ---------- */

  applyFilters() {
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

    if (this.selectedFamilleId !== 0) {
    const famille = this.familles.find(f => f.id === this.selectedFamilleId);
    if (famille) {
      list = list.filter(item => (item.nomFamille || '').toLowerCase() === famille.nomFamille.toLowerCase());
    }
  }

  this.photos = list;
}

  /* ---------- Modale affichage ---------- */

  openModal(photo: ContenuGlobalDto) {
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
    // appelé par bouton dans la modale
    this.confirmAndDelete(id);
  }

  private confirmAndDelete(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet artisanat ?')) return;

    this.http.delete(`${ARTISANAT_API_BASE}/${id}`, { responseType: 'text' }).subscribe({
      next: () => {
        alert('Artisanat supprimé avec succès.');
        this.closeModal();
        this.loadArtisanats();
      },
      error: err => {
        console.error('Erreur suppression', err);
        alert('Impossible de supprimer. Vérifie les droits / console backend.');
      }
    });
  }

  /* ---------- Edition ---------- */

  // Ouvre le formulaire d'édition (depuis la carte ou la modale)
  startEdit(item: ContenuGlobalDto, event?: Event) {
    if (event) event.stopPropagation();
    this.showEditModal = true;
    this.editModel = { ...item }; // copie superficielle
    this.editPhotoFile = undefined;
    this.editVideoFile = undefined;
    this.uploadProgress = 0;
  }

  // Fermeture du formulaire d'édition
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

    // Champs textes
    if (this.editModel.titre !== undefined) form.append('titre', this.editModel.titre || '');
    if (this.editModel.description !== undefined) form.append('description', this.editModel.description || '');
    if (this.editModel.lieu !== undefined) form.append('lieu', this.editModel.lieu || '');
    if (this.editModel.region !== undefined) form.append('region', this.editModel.region || '');

    // Fichiers (optionnels)
    if (this.editPhotoFile) form.append('photoArtisanat', this.editPhotoFile);
    if (this.editVideoFile) form.append('videoArtisanat', this.editVideoFile);

    // Requête PUT avec suivi progress (optionnel)
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
          this.loadArtisanats();
        }
      },
      error: err => {
        console.error('Erreur modification', err);
        alert('Échec de la modification. Vérifie la console et le backend.');
      }
    });
  }
}