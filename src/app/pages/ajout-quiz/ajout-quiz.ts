import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Important pour ngModel
import { Router } from '@angular/router';
import { QuizService, Conte, QuizContenuRequest } from '../../quiz/quiz'; 
import { Auth } from '../../services/auth'; 

// Interfaces locales pour le formulaire
type TypeReponse = 'QCM' | 'VRAI_FAUX';

interface LocalProposition {
  texteProposition: string;
  estCorrecte: boolean;
  ordre: number;
}

interface LocalQuestion {
  texteQuestion: string;
  typeReponse: TypeReponse;
  ordre: number;
  points: number;
  propositions: LocalProposition[];
}

@Component({
  selector: 'app-ajout-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  // CORRECTION ICI : Les noms correspondent à vos fichiers
  templateUrl: './ajout-quiz.html',
  styleUrls: ['./ajout-quiz.css']
})
// CORRECTION ICI : Nom de la classe "AjoutQuiz" pour correspondre à votre route
export class AjoutQuiz implements OnInit {
  
  // Injection des services
  private quizService = inject(QuizService);
  private authService = inject(Auth);
  private router = inject(Router);

  // Données
  contes: Conte[] = [];
  selectedConteId: number | null = null;
  adminFullName: string = 'Admin';

  // Modèle du formulaire
  currentQuiz: {
    titre: string;
    description: string;
    questions: LocalQuestion[];
  } = {
    titre: '',
    description: '',
    questions: []
  };

  ngOnInit(): void {
    const name = this.authService.getUserFullName();
    if (name) this.adminFullName = name;
    this.loadContes();
    this.addQuestion();
  }

  loadContes() {
    this.quizService.getContesPublics().subscribe({
      next: (data) => this.contes = data,
      error: (err) => console.error(err)
    });
  }

  // --- GESTION DES QUESTIONS ---

  addQuestion() {
    const newQ: LocalQuestion = {
      texteQuestion: '',
      typeReponse: 'QCM',
      ordre: this.currentQuiz.questions.length + 1,
      points: 1,
      propositions: [
        { texteProposition: '', estCorrecte: true, ordre: 1 },
        { texteProposition: '', estCorrecte: false, ordre: 2 }
      ]
    };
    this.currentQuiz.questions.push(newQ);
  }

  removeQuestion(index: number) {
    this.currentQuiz.questions.splice(index, 1);
    this.currentQuiz.questions.forEach((q, i) => q.ordre = i + 1);
  }

  // --- LOGIQUE METIER (Toggle Types) ---

  setQuestionType(type: TypeReponse, question: LocalQuestion) {
    if (question.typeReponse === type) return;

    question.typeReponse = type;

    if (type === 'VRAI_FAUX') {
      question.propositions = [
        { texteProposition: 'Vrai', estCorrecte: true, ordre: 1 },
        { texteProposition: 'Faux', estCorrecte: false, ordre: 2 }
      ];
    } else {
      question.propositions = [
        { texteProposition: '', estCorrecte: true, ordre: 1 },
        { texteProposition: '', estCorrecte: false, ordre: 2 }
      ];
    }
  }

  // --- GESTION DES PROPOSITIONS ---

  addProposition(question: LocalQuestion) {
    question.propositions.push({
      texteProposition: '',
      estCorrecte: false,
      ordre: question.propositions.length + 1
    });
  }

  removeProposition(question: LocalQuestion, index: number) {
    question.propositions.splice(index, 1);
  }

  toggleCorrect(question: LocalQuestion, prop: LocalProposition) {
    if (question.typeReponse === 'VRAI_FAUX') {
      question.propositions.forEach(p => p.estCorrecte = false);
      prop.estCorrecte = true;
    } else {
      question.propositions.forEach(p => p.estCorrecte = false); 
      prop.estCorrecte = true; 
    }
  }

  // --- VALIDATION ---

  validateQuiz() {
    if (!this.selectedConteId) {
      alert("Veuillez choisir un conte.");
      return;
    }
    if (!this.currentQuiz.titre) {
        this.currentQuiz.titre = "Nouveau Quiz";
    }

    const payload: QuizContenuRequest = {
      idContenu: this.selectedConteId,
      titre: this.currentQuiz.titre,
      description: this.currentQuiz.description,
      questions: this.currentQuiz.questions.map((q, i) => ({
        question: q.texteQuestion,
        typeReponse: q.typeReponse,
        ordre: i + 1,
        points: q.points,
        reponseVraiFaux: false,
        propositions: q.propositions.map((p, j) => ({
          texte: p.texteProposition,
          estCorrecte: p.estCorrecte,
          ordre: j + 1
        }))
      }))
    };

    console.log("Envoi au back:", payload);

    this.quizService.creerQuizPublic(payload).subscribe({
      next: (res) => {
        console.log("Succès", res);
        this.router.navigate(['/quiz']);
      },
      error: (err) => {
        console.error("Erreur", err);
        alert("Erreur lors de la création");
      }
    });
  }
}