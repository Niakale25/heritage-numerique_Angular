import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
// Assurez-vous d'importer les bons DTO/Interfaces si disponibles
// import { UtilisateurSuperAdminDTO } from '../interfaces/user'; 

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Base URL pour les opérations utilisateur standard (basé sur ton Controller Java)
  private baseUrl = 'http://localhost:8080/api/utilisateurs';
  
  // URL pour le dashboard superadmin
  private adminUrl = 'http://localhost:8080/api/superadmin/dashboard/utilisateurs';

  userID = localStorage.getItem("user_id");

  constructor(private http: HttpClient) { }

  /**
   * Récupère le profil de l'utilisateur connecté
   */
  getProfil() {
    return this.http.get(`${this.baseUrl}/${this.userID}`);
  }

  /**
   * Met à jour les infos de l'utilisateur (y compris le mot de passe)
   * Appelle PUT /api/utilisateurs/{id}
   */
  updateProfil(id: any, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  // --- Méthodes Super Admin ---

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.adminUrl);
  }

  toggleUserActivation(userId: number, actif: boolean): Observable<void> {
    const url = `${this.adminUrl}/${userId}/activation`;
    let params = new HttpParams().set('actif', actif.toString()); 
    return this.http.patch<void>(url, null, { params });
  }
}