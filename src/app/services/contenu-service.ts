// src/app/services/contenu.service.ts (CORRIGÉ)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContenuGlobalDto } from '../pages/conte/contenu-global.dto';

@Injectable({ providedIn: 'root' })
export class ContenuService {
  getById(id: number) {
    throw new Error('Method not implemented.');
  }
 // Utilisez l'URL de base pour la gestion (SuperAdminController)
 private apiUrl = 'http://localhost:8080/api/superadmin'; 
 
// URL du dashboard pour les listes (SuperAdminDashboardController)
 private dashboardUrl = 'http://localhost:8080/api/superadmin/dashboard';

 constructor(private http: HttpClient) {}

 /** Récupère toutes les devinettes (via le Dashboard Controller) */
 // L'appel est GET /api/superadmin/dashboard/devinettes
 getAllDevinettes(): Observable<ContenuGlobalDto[]> {
 // Utilisation du Dashboard Controller pour la lecture
 return this.http.get<ContenuGlobalDto[]>(`${this.dashboardUrl}/devinettes`); 
 }

 /** Supprime un contenu (via le Dashboard Controller) */
 // L'appel est DELETE /api/superadmin/dashboard/devinettes/{id}
 deleteContenu(id: number): Observable<void> {
 // Utilisation du Dashboard Controller pour la suppression
 return this.http.delete<void>(`${this.dashboardUrl}/devinettes/${id}`);
 }
 
 /**    * Ajoute une nouvelle devinette (via le SuperAdmin Controller)
   * Doit accepter FormData car le backend Spring attend des @RequestParam (multipart/form-data)
   */
// L'appel est POST /api/superadmin/contenus-publics/devinette
 addDevinette(dto: FormData): Observable<ContenuGlobalDto> {
 // Utilisation du SuperAdmin Controller pour l'ajout
 return this.http.post<ContenuGlobalDto>(`${this.apiUrl}/contenus-publics/devinette`, dto); 
 }
}