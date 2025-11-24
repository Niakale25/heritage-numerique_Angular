// src/app/pages/demande-publication/demande-publication.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Important pour la recherche
import { DemandePublicationDto, DemandePublicationAffichee, TypeContenu } from '../../interfaces/demande-publication-dto';
import { DemandePublication } from '../../services/demande-publication';

@Component({
    selector: 'app-demande-publication',
    standalone: true,
    imports: [CommonModule, DatePipe, FormsModule], 
    templateUrl: './demande-publication.html', 
    styleUrls: ['./demande-publication.css'],
})
export class DemandePublicationComponent implements OnInit {
    
    private demandeService = inject(DemandePublication); 

    demandes: DemandePublicationAffichee[] = [];
    loading = true;
    
    // Filtres et Recherche
    filtreStatut: 'TOUS' | 'EN_ATTENTE' | 'TRAITEE' = 'TOUS';
    rechercheTexte: string = '';

    ngOnInit(): void {
        this.loadDemandes();
    }

    loadDemandes(): void {
        this.loading = true;
        this.demandeService.getDemandesEnAttente().subscribe({
            next: (data) => {
                this.demandes = data.map(d => ({ 
                    ...d, 
                    typeContenu: this.determineContentType(d.titreContenu)
                })); 
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    // C'est cette fonction qui gère l'affichage dynamique sans recharger
   get demandesFiltrees(): DemandePublicationAffichee[] {
    return this.demandes.filter(d => {
        // 1. Filtre TOUS : On montre tout (En attente, Approuvée, Rejetée)
        if (this.filtreStatut === 'TOUS') return true;

        // 2. Filtre EN_ATTENTE : Strictement ceux en attente
        if (this.filtreStatut === 'EN_ATTENTE') return d.statut === 'EN_ATTENTE';

        // 3. Filtre HISTORIQUE (Traitée) : Tout ce qui n'est PAS en attente
        if (this.filtreStatut === 'TRAITEE') return d.statut !== 'EN_ATTENTE';
        
        return true;
    }).filter(d => {
        // Recherche texte
        const search = this.rechercheTexte.toLowerCase();
        return (d.titreContenu?.toLowerCase() || '').includes(search) || 
               (d.nomDemandeur?.toLowerCase() || '').includes(search);
    });
}

   
   approuverDemande(demande: DemandePublicationAffichee): void {
    if (!confirm(`Confirmer la validation de "${demande.titreContenu}" ?`)) return;
    
    this.demandeService.validerPublication(demande.id).subscribe({
        next: () => {
            // 1. On met à jour le statut
            demande.statut = 'APPROUVEE'; 

            // 2. Si on est sur l'onglet "En attente", on bascule sur "Tout" 
            // pour ne pas que l'élément disparaisse sous nos yeux
            if (this.filtreStatut === 'EN_ATTENTE') {
                this.filtreStatut = 'TOUS';
            }

            // 3. LA LIGNE MANQUANTE (MAGIQUE) : 
            // On force Angular à comprendre que le tableau a été modifié 
            // en créant une nouvelle référence. Cela force le rafraichissement du HTML.
            this.demandes = [...this.demandes]; 
        },
        error: (err) => {
            console.error(err);
            alert("Erreur technique lors de la validation.");
        }
    });
}
    rejeterDemande(demande: DemandePublicationAffichee): void {
    const commentaire = prompt("Motif du rejet (obligatoire) :");
    if (!commentaire) return;

    this.demandeService.rejeterPublication(demande.id, commentaire).subscribe({
        next: () => {
            // 1. Mise à jour des données
            demande.statut = 'REJETEE';
            demande.commentaire = commentaire;

            // 2. Basculement automatique du filtre (comme pour valider)
            if (this.filtreStatut === 'EN_ATTENTE') {
                this.filtreStatut = 'TOUS';
            }

            // 3. Forcer le rafraichissement visuel
            this.demandes = [...this.demandes];
        },
        error: (err) => alert("Erreur lors du rejet")
    });
}

    private determineContentType(titre: string): TypeContenu {
        const t = titre.toLowerCase();
        if (t.includes('conte')) return 'Conte';
        if (t.includes('proverbe')) return 'Proverbe';
        if (t.includes('devinette')) return 'Devinette';
        if (t.includes('artisanat')) return 'Artisanat';
        return 'Autre';
    }
    
    getStatutClass(statut: string): string {
       return 'statut-' + statut.toLowerCase().replace('_', '-');
    }

    ouvrirContenu(demande: DemandePublicationAffichee) {
        console.log("Ouverture", demande);
    }
}