import {
  Component,
  OnInit,
  inject,
  signal,
  WritableSignal,
  ViewChild,
  ElementRef
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ContenuGlobalDto } from '../conte/contenu-global.dto';

// PDF.js
import * as pdfjsLib from 'pdfjs-dist';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';



@Component({
  selector: 'app-detail-conte',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-conte.html',
  styleUrls: ['./detail-conte.css']
})
export class DetailConte implements OnInit {

  @ViewChild('pdfCanvas', { static: false })
  pdfCanvas!: ElementRef<HTMLCanvasElement>;

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private apiBase = 'http://localhost:8080/api/superadmin/dashboard';
  private resourceBaseUrl = 'http://localhost:8080';

  conteDetails: WritableSignal<ContenuGlobalDto | null> = signal(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  // 1. Injection du service DomSanitizer
  private sanitizer = inject(DomSanitizer);

  // Player audio
  isPlaying = false;
  currentTime = 0;
  duration = 0;

  fichierPDF:any;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage.set('Aucun identifiant de conte fourni.');
      return;
    }
    this.fetchConteDetails(id);
  }

  fetchConteDetails(id: number): void {
    this.isLoading.set(true);

    this.http.get<ContenuGlobalDto>(`${this.apiBase}/contes/${id}`)
      .pipe(
        catchError(err => {
          console.error("Erreur API :", err);
          this.errorMessage.set("Impossible de charger les détails du conte.");
          this.isLoading.set(false);
          return of(null);
        })
      )
      .subscribe(data => {
        if (data) {
          this.conteDetails.set(data);
          // Rendu auto PDF
          if (this.isPdf(data.urlFichier)) {
            setTimeout(() => {
              const fileUrl = this.getFileUrl(data.urlFichier);
              if (fileUrl) this.renderPdf(fileUrl);
            }, 50);
          }
          console.log(data);

        } else {
          this.errorMessage.set('Ce conte est introuvable.');
        }
        this.isLoading.set(false);
      });
  }

  // J'utilise ici votre fonction getFileUrl comme base
  getTrustedResourceUrl(url?: string): SafeResourceUrl | null {
    const finalUrl = this.getFileUrls(url); 
    
    if (!finalUrl) {
      return null;
    }

    // L'instruction clé : On dit à Angular que cette URL est sûre en tant que ressource.
    return this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
  }
  
  // getFileUrl() reste la même, elle retourne un string
  getFileUrls(url?: string): string | null {
    if (!url) return null;
    if (url.startsWith('/')) return this.resourceBaseUrl + url;
    return url;
  }



  // =============================
  // URL HELPERS
  // =============================
  getThumbnailUrl(url?: string): string {
    if (url && url.startsWith('/')) return this.resourceBaseUrl + url;
    return url ?? 'https://placehold.co/70x70';
  }

  getFileUrl(url?: string): string | null {
    if (!url) return null;
    if (url.startsWith('/')) return this.resourceBaseUrl + url;
    return url;
  }

  // =============================
  // TYPE CHECK
  // =============================
  isPdf(url?: string | null): boolean {
    console.log('le lien du fichier est : '+url)
    return !!url && url.toLowerCase().endsWith('.pdf');
  }

  isAudio(url?: string | null): boolean {
    if (!url) return false;
    const ext = url.toLowerCase();
    return ext.endsWith('.mp3') || ext.endsWith('.wav') || ext.endsWith('.ogg') || ext.endsWith('.m4a');
  }

  // =============================
  // PDF RENDER
  // =============================
 async renderPdf(url: string) {
  try{
    pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + '/assets/pdfjs/pdf.worker.min.js';

    // 2. Charger le Document PDF
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;

    // 3. Obtenir la première page (vous pouvez boucler pour afficher toutes les pages)
    const page = await pdf.getPage(1);
    const scale = 1.5; // Définir un facteur d'échelle
    const viewport = page.getViewport({ scale });

    // 4. Préparer le Canvas
    const canvas = this.pdfCanvas.nativeElement;
    const context = canvas.getContext('2d')!;

    // Ajuster la taille du canvas à la taille de la page
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // 5. Rendre la Page sur le Canvas
    await page.render({
      canvasContext: context,
      viewport,
      canvas
    }).promise;
    
    // Le PDF est maintenant visible dans l'élément <canvas>

  } catch (err) {
    console.error("Erreur de rendu PDF :", err);
    // Gérer l'erreur d'affichage
    this.errorMessage.set("Impossible d’afficher le PDF.");
  }
}
  // =============================
  // AUDIO PLAYER
  // =============================
  toggleAudio(player: HTMLAudioElement) {
    if (this.isPlaying) player.pause();
    else player.play();
    this.isPlaying = !this.isPlaying;
  }

  formatTime(seconds: number): string {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  seekAudio(event: MouseEvent, player: HTMLAudioElement) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const newTime = (clickX / rect.width) * this.duration;
    player.currentTime = newTime;
  }
}
