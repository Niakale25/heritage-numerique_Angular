import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-accueil',
  // Ajout de 'Auth' dans providers si non fourni au niveau du root
   imports: [RouterOutlet, RouterLink, RouterLinkActive], // Si vous utilisez les standalone components
  templateUrl: './accueil.html',
  styleUrl: './accueil.css'
})
export class Accueil {

  // ⭐️ Injection du service Auth et du Router
  constructor(private authService: Auth, private router: Router) {}

  /**
   * ⭐️ Gère la déconnexion de l'utilisateur.
   * Supprime les informations de session (token, nom utilisateur)
   * et redirige vers la page de connexion.
   */
  deconnexion(): void {
    this.authService.logout();
    
    // ⭐️ Redirige l'utilisateur vers la page de connexion ou la page d'accueil
    // Assurez-vous que le chemin '/login' correspond à votre route de connexion
    this.router.navigate(['/login']); 
  }
}