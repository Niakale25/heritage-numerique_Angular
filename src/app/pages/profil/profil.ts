import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user-service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './profil.html',
  styleUrl: './profil.css'
})
export class Profil implements OnInit {
  
  profil: any = {};

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  isEditing = false;
  showPassword = false;
  isLoading = false;
  message: string = ''; 

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.userService.getProfil().subscribe({
      next: (value) => {
        this.profil = value;
      },
      error: (err) => {
        console.error('Erreur chargement profil:', err);
        this.message = "Impossible de charger le profil.";
      },
    });
  }

  toggleEditMode(enable: boolean): void {
    this.isEditing = enable;
    this.message = '';
    if (!enable) {
      // Réinitialisation complète du formulaire mot de passe
      this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
      this.loadProfile(); 
    }
  }

  saveProfile(): void {
    this.message = '';

    // --- LOGIQUE DE VALIDATION MOT DE PASSE ---
    
    // Si l'utilisateur a commencé à remplir un champ de nouveau mot de passe
    const hasNewPassword = this.passwordForm.newPassword || this.passwordForm.confirmPassword;

    if (hasNewPassword) {
        // 1. OBLIGATION : Le mot de passe actuel doit être saisi
        if (!this.passwordForm.currentPassword) {
            this.message = "Erreur : Vous devez saisir votre mot de passe actuel pour valider le changement.";
            return;
        }

        // 2. VALIDATION : Les nouveaux mots de passe doivent correspondre
        if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
            this.message = "Erreur : Les nouveaux mots de passe ne correspondent pas.";
            return;
        }
    }

    this.isLoading = true;

    // Préparation du payload
    const payload: any = {
      nom: this.profil.nom,
      prenom: this.profil.prenom,
      email: this.profil.email
    };

    // Ajout des mots de passe au payload seulement si modifiés
    if (hasNewPassword) {
      payload.motDePasse = this.passwordForm.newPassword;
      // On envoie aussi l'ancien pour vérification côté backend (nom du champ à adapter selon ton API Java, ex: ancienMotDePasse)
      payload.ancienMotDePasse = this.passwordForm.currentPassword; 
    }

    const userId = this.userService.userID;
    
    this.userService.updateProfil(userId, payload).subscribe({
      next: (updatedUser) => {
        this.profil = updatedUser;
        this.isEditing = false;
        this.isLoading = false;
        this.message = "Profil mis à jour avec succès !";
        // Vider le formulaire mot de passe pour sécurité
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: (err) => {
        console.error('Erreur mise à jour:', err);
        this.isLoading = false;
        this.message = "Erreur lors de la mise à jour. Vérifiez votre mot de passe actuel.";
      }
    });
  }
}