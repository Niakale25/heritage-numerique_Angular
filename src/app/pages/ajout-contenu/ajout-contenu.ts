import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { Auth } from '../../services/auth';
import { ContenuApiService, ContenuDTO } from './contenu-api-service';

@Component({
  selector: 'app-ajout-contenu',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ajout-contenu.html',
  styleUrl: './ajout-contenu.css'
})
export class AjoutContenu {
  contenuForm: FormGroup;
  typeSelectionne = signal<string>(''); // type du contenu choisi
  message = signal<string>(''); // message d’état (succès/erreur)
  
  private selectedFiles: { [key: string]: File | null } = {};

  private apiService = inject(ContenuApiService);
  private authService = inject(Auth);

  constructor(private fb: FormBuilder) {
    this.contenuForm = this.fb.group({
      // --- CHAMPS COMMUNS ---
      type: ['', Validators.required],
      region: ['', Validators.required],
      lieu: ['', Validators.required], // ✅ AJOUTÉ (Lieu général)

      // ✅ CHAMP PARTAGÉ (Pour Conte et Proverbe)
      title: [''], 

      // --- CONTE (Champs spécifiques) ---
      author: [''],
      content: [''],
      thumbnailUrl: [null],
      fichierConte: [null],

      // --- PROVERBE (Champs spécifiques) ---
      // Note: 'title' est déjà déclaré plus haut, on ne le remet pas ici.
      text: [''], // Le texte même du proverbe
      origin: [''],
      signification: [''],
      imageUrl: [null],

      // --- DEVINETTE (Champs spécifiques) ---
      question: [''],
      answer: [''],

      // --- ARTISANAT (Champs spécifiques) ---
      titre: [''], // Artisanat garde son champ 'titre' distinct pour ne pas casser la logique existante
      description: [''],
      auteur: [''],
      image: [null],
      video: [null]
    });
  }

  // 🎯 Lorsqu’on change de type (conte, proverbe, etc.)
  onTypeChange(event: any): void {
    this.typeSelectionne.set(event.target.value);
  }

  // 📁 Gestion des fichiers
  onFileSelected(event: Event, formControlName: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.selectedFiles[formControlName] = file;
      this.contenuForm.get(formControlName)?.setValue(file.name);
    } else {
      this.selectedFiles[formControlName] = null;
      this.contenuForm.get(formControlName)?.setValue(null);
    }
  }

  getFileName(formControlName: string): string {
    return this.selectedFiles[formControlName]?.name || '';
  }

  // 🚀 Soumission du formulaire
  onSubmit(): void {
    if (this.contenuForm.invalid) {
      this.message.set("❌ Veuillez remplir tous les champs obligatoires (Type, Région, Lieu).");
      return;
    }

    // Vérifie si l’utilisateur est authentifié (Admin)
    if (!this.authService.getToken()) {
      this.message.set("⛔ Accès refusé. Veuillez vous connecter avec un compte administrateur.");
      return;
    }

    const type = this.typeSelectionne();
    const formValue = this.contenuForm.value;
    const formData = new FormData();

    // ✅ Champs communs envoyés pour tous les types
    formData.append('region', formValue.region || '');
    formData.append('lieu', formValue.lieu || '');

    // --- 🎭 MAPPING CORRECT avec les noms attendus par le backend ---
    switch (type) {
      // 🟠 CONTE
      case 'conte':
        formData.append('titre', formValue.title || ''); // Utilise le champ 'title' partagé
        formData.append('description', formValue.content || '');
        formData.append('texteConte', formValue.content || '');
        formData.append('auteur', formValue.author || ''); 
        
        if (this.selectedFiles['thumbnailUrl']) {
          formData.append('photoConte', this.selectedFiles['thumbnailUrl']!, this.selectedFiles['thumbnailUrl']!.name);
        }
        if (this.selectedFiles['fichierConte']) { 
            formData.append('fichierConte', this.selectedFiles['fichierConte']!, this.selectedFiles['fichierConte']!.name);
        }
        break;

      // 🟣 PROVERBE
      case 'proverbe':
        formData.append('titre', formValue.title || ''); // Utilise le champ 'title' partagé
        formData.append('texteProverbe', formValue.text || ''); // Utilise le champ 'text'
        formData.append('origineProverbe', formValue.origin || '');
        formData.append('significationProverbe', formValue.signification || '');
        
        if (this.selectedFiles['imageUrl']) {
          formData.append('photoProverbe', this.selectedFiles['imageUrl']!, this.selectedFiles['imageUrl']!.name);
        }
        break;

      // 🟢 DEVINETTE
      case 'devinette':
        formData.append('titre', formValue.question || '');
        formData.append('texteDevinette', formValue.question || '');
        formData.append('reponseDevinette', formValue.answer || '');
        break;

      // 🟡 ARTISANAT
      case 'artisanat':
        formData.append('titre', formValue.titre || ''); // Utilise le champ 'titre' spécifique artisanat
        formData.append('description', formValue.description || '');
        formData.append('auteur', formValue.auteur || '');
        
        if (this.selectedFiles['image']) {
          formData.append('photoArtisanat', this.selectedFiles['image']!, this.selectedFiles['image']!.name);
        }
        if (this.selectedFiles['video']) { 
          formData.append('videoArtisanat', this.selectedFiles['video']!, this.selectedFiles['video']!.name);
        }
        break;

      default:
        this.message.set("⚠️ Type de contenu non reconnu.");
        return;
    }

    // --- 📡 Envoi de la requête ---
    this.apiService.ajouterContenuPublic(type, formData).subscribe({
      next: (response: ContenuDTO) => {
        console.log(`✅ Contenu ${type} créé sur le backend:`, response);
        this.message.set(`✅ ${type} ajouté avec succès (ID: ${response.id}) !`);
        this.contenuForm.reset();
        this.typeSelectionne.set('');
        this.selectedFiles = {};
      },
      error: (error: HttpErrorResponse | Error) => {
        console.error(`❌ Erreur lors de l'ajout du contenu ${type}:`, error);

        let errorMessage: string;
        if (error instanceof HttpErrorResponse) {
          errorMessage = error.error?.message || error.statusText || `Erreur statut: ${error.status}`;
        } else {
          errorMessage = error.message || "Erreur de connexion inconnue.";
        }

        this.message.set(`❌ Erreur: ${errorMessage}`);
      }
    });
  }
}