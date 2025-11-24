// src/app/services/demande-publication.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DemandePublicationDto } from '../interfaces/demande-publication-dto'; 
// Note: Le service n'a besoin que du DTO de base

@Injectable({
    providedIn: 'root'
})
export class DemandePublication {
    
    private apiUrl = 'http://localhost:8080/api/superadmin'; 
    private http = inject(HttpClient);

    // Les propriétés inutiles (idContenu, etc.) ont été retirées du service.

    /**
     * Récupère toutes les demandes de publication en attente.
     */
    getDemandesEnAttente(): Observable<DemandePublicationDto[]> {
        return this.http.get<DemandePublicationDto[]>(`${this.apiUrl}/demandes-publication`);
    }

    /**
     * Valide une demande de publication.
     */
    validerPublication(demandeId: number): Observable<string> {
        const url = `${this.apiUrl}/demandes-publication/${demandeId}/valider`;
        // CORRECTION: Enlèvement du générique <string> et du casting inutile.
        return this.http.post(url, {}, { responseType: 'text' }); 
    }

    /**
     * Rejette une demande de publication.
     */
    rejeterPublication(demandeId: number, commentaire: string): Observable<string> {
        const url = `${this.apiUrl}/demandes-publication/${demandeId}/rejeter`;
        // CORRECTION: Enlèvement du générique <string> et du casting inutile.
        return this.http.post(url, {}, { 
            params: { commentaire: commentaire },
            responseType: 'text' 
        });
    }
}