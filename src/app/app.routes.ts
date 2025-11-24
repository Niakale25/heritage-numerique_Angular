import { Routes } from '@angular/router';

import { Accueil } from './pages/accueil/accueil';
import { Dashboard } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';
import { AjoutContenu } from './pages/ajout-contenu/ajout-contenu';
import { Famille } from './pages/famille/famille';
import { Musique } from './pages/musique/musique';
import { Utilisateur } from './pages/utilisateur/utilisateur';
import { ListQuiz } from './pages/list-quiz/list-quiz';
import { IndexQuiz } from './pages/index-quiz/index-quiz';
import { AjoutQuiz } from './pages/ajout-quiz/ajout-quiz';
import { Conte } from './pages/conte/conte';
import { ContenusArtisanal } from './pages/contenus-artisanal/contenus-artisanal';
import { DetailConte } from './pages/detail-conte/detail-conte';
import { Profil } from './pages/profil/profil';
import { Proverbe } from './pages/proverbe/proverbe';
import { Devinette } from './pages/devinette/devinette';
import { ProverbDetailsComponent } from './pages/proverb-details-component/proverb-details-component';
import { adminGuard } from './guards/admin-guard';
import { DemandePublicationComponent } from './pages/demande-publication/demande-publication';

export const routes: Routes = [
 { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: Login },

  {
    path: 'accueil',
    component: Accueil,
    children: [
      { path: '', component: Dashboard },
      { path: 'dashboard', component: Dashboard },
      { path: 'famille', component: Famille },
      { path: 'devinette', component: Devinette },
      { path: 'utilisateur', component: Utilisateur },
      { path: 'parametre', component: Profil },
      { path: 'proverbe', component: Proverbe },
      { path: 'proverbeDetail/:id', component: ProverbDetailsComponent },

      // : La route 'conte' pointe directement vers la liste
      { path: 'conte', component: Conte },

      // : Nouvelle route paramétrée pour afficher les détails d'un conte spécifique
      { path: 'conte/:id', component: DetailConte }, 
      
      { path: 'photo', component: ContenusArtisanal },
      { path: 'demande', component: DemandePublicationComponent },

      {
        path: 'quiz',
        component: IndexQuiz,
        children: [
          { path: '', component: ListQuiz },
          { path: 'list', component: ListQuiz },
          { path: 'new', component: AjoutQuiz },
          { path: 'new/qcm', component: AjoutQuiz }
        ],
      },

      { path: 'ajouterContenu', component: AjoutContenu, canActivate: [adminGuard] },
    ],
  },

  
];
