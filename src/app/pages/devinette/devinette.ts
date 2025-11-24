import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContenuGlobalDto } from '../conte/contenu-global.dto';
import { ContenuService } from '../../services/contenu-service';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-devinette',
  standalone: true, // Ajoutez standalone: true si ce n'était pas le cas
  imports: [CommonModule, ReactiveFormsModule], 
  templateUrl: './devinette.html',
  styleUrl: './devinette.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Devinette implements OnInit {

  Riddles: WritableSignal<(ContenuGlobalDto & { isAnswerVisible?: boolean })[]> = signal([]);
  showModal = signal(false);
  addForm: FormGroup;
  
  // ⭐️ Signal pour le nom de l'utilisateur
  userFullName: WritableSignal<string> = signal('Admin'); 

  constructor(
    private fb: FormBuilder,
    private contenuService: ContenuService,
    // ⭐️ INJECTION du service Auth
    private authService: Auth 
  ) {
    this.addForm = this.fb.group({
      titre: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    console.log('✅ DevinetteComponent initialisé');
    
    // ⭐️ LOGIQUE DE RÉCUPÉRATION DU NOM
    const name = this.authService.getUserFullName();
    if (name) {
      this.userFullName.set(name);
    }

    this.loadRiddles();
  }

  /** Charger les devinettes depuis le backend */
  loadRiddles(): void {
    this.contenuService.getAllDevinettes().subscribe({
      next: (data: any[]) => {
        // ajoute une propriété temporaire pour l’affichage
        this.Riddles.set(data.map(d => ({ ...d, isAnswerVisible: false })));
      },
      error: (err: any) => console.error('Erreur chargement devinettes', err)
    });
  }

  /** Ouvre ou ferme le modal */
  toggleModal(show: boolean): void {
    this.showModal.set(show);
    if (!show) this.addForm.reset();
  }

  /** Ajoute une nouvelle devinette */
  onSubmit(): void {
    if (this.addForm.invalid) return;

    const formData = new FormData();
    
    // MAPPING VERS SPRING
    formData.append('titre', this.addForm.value.titre);
    formData.append('texteDevinette', this.addForm.value.titre); 
    formData.append('reponseDevinette', this.addForm.value.description); 
    
    // Utiliser la méthode corrigée addDevinette (qui prend FormData et retourne Observable)
    this.contenuService.addDevinette(formData as any).subscribe({
      next: (r: any) => {
        // Ajout réussi : on insère le nouvel élément dans la liste affichée
        this.Riddles.update(list => [{ ...r, isAnswerVisible: false }, ...list]);
        this.toggleModal(false);
      },
      error: (err: any) => console.error('Erreur ajout devinette', err)
    });
  }

  /** Affiche ou masque la réponse */
  toggleAnswer(id: number): void {
    this.Riddles.update(list =>
      list.map(r => (r.id === id ? { ...r, isAnswerVisible: !r.isAnswerVisible } : r))
    );
  }

  /** Supprime une devinette */
  deleteRiddle(id: number): void {
    if (confirm('Supprimer cette devinette ?')) {
      this.contenuService.deleteContenu(id).subscribe({
        next: () => this.Riddles.update(list => list.filter(r => r.id !== id)),
        error: (err: any) => console.error('Erreur suppression', err)
      });
    }
  }

  trackById(index: number, riddle: ContenuGlobalDto): number {
    return riddle.id;
  }
}