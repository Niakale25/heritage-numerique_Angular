import {
 ChangeDetectionStrategy,
Component,
OnInit,
signal,
WritableSignal,
 inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ContenuGlobalDto } from '../conte/contenu-global.dto';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
// ⭐️ IMPORT du service Auth

@Component({
 selector: 'app-proverbe',
 standalone: true,
 imports: [CommonModule, FormsModule],
 templateUrl: './proverbe.html',
 styleUrls: ['./proverbe.css'],
 changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Proverbe implements OnInit {
 private http = inject(HttpClient);
 // ⭐️ INJECTION du service Auth
 private authService = inject(Auth);

 Proverbs: WritableSignal<ContenuGlobalDto[]> = signal([]);
 showAddModal: WritableSignal<boolean> = signal(false);
 showEditModal: WritableSignal<boolean> = signal(false);

 // ⭐️ Signal pour le nom de l'utilisateur dans l'en-tête
 adminFullName: WritableSignal<string> = signal('Admin');

 //  Data pour la création
 newProverbData = {
 titre: '',
 origineProverbe: '',
 significationProverbe: '',
 texteProverbe: 'Non applicable',
 photoProverbe: null as File | null
 };

 //  Data pour la modification
 selectedProverb: ContenuGlobalDto | null = null;
 editProverbData = {
 titre: '',
 origineProverbe: '',
 significationProverbe: '',
 texteProverbe: '',
 photoProverbe: null as File | null
 };

 // URLs backend
 private backendOrigin = 'http://localhost:8080';
 private apiUrl = 'http://localhost:8080/api/superadmin/contenus-publics';
 private apiDeleteUrl = 'http://localhost:8080/api/superadmin/dashboard/proverbes';
 private router = inject(Router);

 ngOnInit(): void {
    // ⭐️ LOGIQUE : Récupérer le nom de l'utilisateur et mettre à jour le signal
    const name = this.authService.getUserFullName();
    if (name) {
      this.adminFullName.set(name);
    }
    
    this.loadProverbs();
 }

 /**  Charger tous les proverbes depuis le backend */
 loadProverbs(): void {
 this.http.get<ContenuGlobalDto[]>(this.apiUrl).subscribe({
 next: (contenus) => {
 const proverbes = contenus.filter(c => c.typeContenu?.toUpperCase() === 'PROVERBE');
 this.Proverbs.set(proverbes);
 console.log(' Proverbes chargés:', proverbes);
 },
 error: (err) => console.error(' Erreur chargement proverbes:', err)
 });
 }

 /**  Ouvrir la modale d’ajout */
 addProverb(): void {
 this.newProverbData = {
 titre: '',
 origineProverbe: '',
 significationProverbe: '',
 texteProverbe: '',
 photoProverbe: null
 };
 this.showAddModal.set(true);
 }

 /**  Fermer la modale d’ajout */
 closeAddModal(): void {
 this.showAddModal.set(false);
 }

 /**  Fermer la modale d’édition */
 closeEditModal(): void {
 this.showEditModal.set(false);
 this.selectedProverb = null;
 this.editProverbData.photoProverbe = null;
 }

 /**  Gérer le choix du fichier image (ajout) */
 onPhotoSelected(event: any): void {
 const file = event.target.files[0];
 if (file) this.newProverbData.photoProverbe = file;
 }

 /**  Gérer le choix du fichier image (édition) */
 onEditPhotoSelected(event: any): void {
 const file = event.target.files[0];
 if (file) this.editProverbData.photoProverbe = file;
 }

 /**  Envoi du nouveau proverbe */
 submitNewProverb(event: Event): void {
 event.preventDefault();

 const formData = new FormData();
 formData.append('titre', this.newProverbData.titre);
 formData.append('origineProverbe', this.newProverbData.origineProverbe);
 formData.append('significationProverbe', this.newProverbData.significationProverbe);
 formData.append('texteProverbe', this.newProverbData.texteProverbe);

 if (this.newProverbData.photoProverbe) {
 formData.append('photoProverbe', this.newProverbData.photoProverbe);
 }

 this.http.post(`${this.apiUrl}/proverbe`, formData).subscribe({
 next: (res) => {
 console.log(' Proverbe ajouté:', res);
 this.loadProverbs();
 this.closeAddModal();
 },
 error: (err) => console.error(' Erreur ajout proverbe:', err)
 });
 }

 /**  Ouvrir la modale d’édition */
 editProverb(proverb: ContenuGlobalDto): void {
 this.selectedProverb = proverb;
 this.editProverbData = {
 titre: proverb.titre || '',
 origineProverbe: proverb.origineProverbe || '',
 significationProverbe: proverb.significationProverbe || '',
texteProverbe: proverb.texteProverbe || '',
 photoProverbe: null
 };
 this.showEditModal.set(true);
 }

 /**  Soumettre la modification */
 submitEditProverb(event: Event): void {
 event.preventDefault();
 if (!this.selectedProverb?.id) return;

 const formData = new FormData();
 formData.append('titre', this.editProverbData.titre);
 formData.append('origineProverbe', this.editProverbData.origineProverbe);
 formData.append('significationProverbe', this.editProverbData.significationProverbe);
 formData.append('texteProverbe', this.editProverbData.texteProverbe);

 if (this.editProverbData.photoProverbe) {
 formData.append('photoProverbe', this.editProverbData.photoProverbe);
 }

 this.http.put(`${this.apiUrl}/proverbe/${this.selectedProverb.id}`, formData).subscribe({
 next: (res) => {
 console.log(' Proverbe modifié:', res);
 this.loadProverbs();
 this.closeEditModal();
 },
 error: (err) => console.error(' Erreur modification proverbe:', err)
 });
 }

 /**  Supprimer un proverbe */
 deleteProverb(id: number | undefined): void {
 if (!id) return;
 if (confirm('Voulez-vous vraiment supprimer ce proverbe ?')) {
 this.http.delete(`${this.apiDeleteUrl}/${id}`).subscribe({
 next: () => {
 console.log(` Proverbe ID ${id} supprimé.`);
 this.loadProverbs();
 },
 error: (err) => console.error(` Erreur suppression proverbe ID ${id}:`, err)
 });
 }
 }

 /**  Retourne l’URL d’image correcte */
  getPhotoUrl(proverb: ContenuGlobalDto): string {
    // On priorise l'urlPhoto comme vous l'avez indiqué
    let path = proverb.urlPhoto || proverb.photoProverbe || proverb.urlFichier;

    if (!path) {
        // Image par défaut si aucun chemin n'est trouvé
        return 'https://placehold.co/267x120/E8D6B7/333333?text=Proverbe';
    }
    
    // Si c'est déjà une URL absolue, la retourner (ex: commence par http)
    if (path.startsWith('http')) {
        return path;
    }

    //  CORRECTION DE LA DOUBLE BARRE OBLIQUE 
    // Retirer le slash initial si présent pour éviter http://localhost:8080//uploads/...
    if (path.startsWith('/')) {
        path = path.substring(1);
    }

    // Retourner l'URL complète et corrigée (ex: http://localhost:8080/uploads/...)
    return `${this.backendOrigin}/${path}`;
  }

 /**  Visualiser un proverbe (debug / futur modal détail) */
 viewProverb(proverb: ContenuGlobalDto): void {
  if (proverb.id) {
   this.router.navigate(['/accueil/proverbeDetail', proverb.id]);

  }
}

}