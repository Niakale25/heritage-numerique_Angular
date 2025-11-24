import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

// J'ai besoin de définir API_BASE_URL comme constante ou l'importer si elle existe ailleurs
const API_BASE_URL = 'http://localhost:8080/api'; 

@Injectable({ providedIn: 'root' })
export class Auth {
  private apiUrl = `${API_BASE_URL}/auth`;
  private readonly TOKEN_KEY = 'token'; // Clé utilisée dans votre implémentation
  private readonly USER_NAME_KEY = 'userName';
  
 constructor(private http: HttpClient) {}

  login(credentials: { email: string; motDePasse: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        if (res.accessToken) {
          localStorage.setItem(this.TOKEN_KEY, res.accessToken);
          
          // ⭐️ Récupération et stockage du nom complet (logique déjà correcte)
          if (res.nom) {
              const prenom = res.prenom || ''; 
              const fullName = `${prenom} ${res.nom}`.trim();
              localStorage.setItem(this.USER_NAME_KEY, fullName); 
          }
        }
      })
    );
  }

  // ⭐️ Méthode pour récupérer le nom complet (méthode essentielle)
  getUserFullName(): string | null {
    return localStorage.getItem(this.USER_NAME_KEY);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_NAME_KEY); // Nettoyer le nom
  }

  register(data: {
    nom: string;
    prenom?: string;
    email: string;
    motDePasse: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

 
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}