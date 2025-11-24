import { Component, signal, WritableSignal, OnInit, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { UtilisateurSuperAdminDTO } from '../../interfaces/user';
import { UserService } from '../../services/user-service';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';

// La propriété 'family' a été retirée de la définition de User
type User = UtilisateurSuperAdminDTO & { image: string, name: string };

@Component({
  selector: 'app-utilisateur',
  standalone: true,
  imports: [CommonModule, DatePipe,FormsModule],
  templateUrl: './utilisateur.html',
  styleUrls: ['./utilisateur.css']
})
export class Utilisateur implements OnInit {

 private userService = inject(UserService);
 // ⭐️ INJECTION du service Auth
 private authService = inject(Auth);

  users: WritableSignal<User[]> = signal([]);
  isLoading: WritableSignal<boolean> = signal(true);
  
  // ⭐️ Signal pour le nom de l'utilisateur dans l'en-tête
  adminFullName: WritableSignal<string> = signal('Admin');

  // 🔹 Champ de recherche
  searchTerm: WritableSignal<string> = signal('');

  // 🔹 Liste filtrée automatiquement selon la recherche
  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.users();

    return this.users().filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.role?.toLowerCase().includes(term) ||
      user.telephone?.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    // ⭐️ LOGIQUE : Récupérer le nom de l'utilisateur et mettre à jour le signal
    const name = this.authService.getUserFullName();
    if (name) {
      this.adminFullName.set(name);
    }
    
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getAllUsers().subscribe({
      next: (dtos: UtilisateurSuperAdminDTO[]) => {
        const mappedUsers: User[] = dtos.map(dto => ({
          ...dto,
          name: dto.nomComplet,
          actif: dto.actif,
          telephone: dto.telephone,
          dateAjout: dto.dateAjout,
          image: this.generateAvatarUrl(dto.nomComplet)
        }));
        this.users.set(mappedUsers);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        this.isLoading.set(false);
        this.users.set([]);
      }
    });
  }

  // 🔹 Quand on tape dans la barre de recherche
  applyFilters() {
    // Rien à faire ici car filteredUsers est auto-calculé
    console.log('Recherche:', this.searchTerm());
  }

  toggleUserStatus(user: User): void {
    const newStatus = !user.actif;
    this.userService.toggleUserActivation(user.id, newStatus).subscribe({
      next: () => {
        this.users.update(currentUsers =>
          currentUsers.map(u =>
            u.id === user.id ? { ...u, actif: newStatus } : u
          )
        );
      },
      error: (err) => {
        console.error(`Erreur lors de la mise à jour de ${user.nomComplet}`, err);
      }
    });
  }

  private generateAvatarUrl(fullName: string): string {
    const parts = fullName.split(' ');
    if (parts.length < 2) return 'https://placehold.co/35x35/967B56/ffffff?text=U';
    const initiales = `${fullName.charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    return `https://placehold.co/35x35/967B56/ffffff?text=${initiales}`;
  }
}