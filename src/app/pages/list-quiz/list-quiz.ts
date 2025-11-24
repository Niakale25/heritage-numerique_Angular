import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { QuizDTO, QuizService } from '../../quiz/quiz';
import { Auth } from '../../services/auth';

@Component({
 selector: 'app-list-quiz',
 standalone: true,
 imports: [CommonModule, RouterLink],
 templateUrl: './list-quiz.html',
 styleUrl: './list-quiz.css'
})
export class ListQuiz implements OnInit {
 // Injection des services
 private quizService: QuizService = inject(QuizService);
 private authService: Auth = inject(Auth); // Injection du service Auth

 quizList: QuizDTO[] = [];
 adminFullName: string = 'Admin'; // Propriété pour le nom complet de l'administrateur

 ngOnInit(): void {
 //  LOGIQUE : Récupérer le nom de l'utilisateur pour l'en-tête
 const name = this.authService.getUserFullName();
 if (name) {
 this.adminFullName = name;
 }
 
 this.loadQuizzes();
 }

//  Chargement des quiz depuis le backend
 loadQuizzes(): void {
 this.quizService.getAllQuizzes().subscribe({
 next: (data: QuizDTO[]) => {
 this.quizList = data;
 console.log(' Liste des quiz chargée :', data);
 },
 error: (err: any) => {
 console.error(' Erreur lors du chargement des quiz', err);
 }
 });
 }
}