// src/app/interfaces/demande-publication-dto.ts

/** * Statuts de la demande (Mappé sur le Backend Java) 
 */
export type StatutDemande = 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE' | 'PUBLIEE';
export type TypeContenu = 'Conte' | 'Proverbe' | 'Devinette' | 'Artisanat' | 'Autre';

/**
 * Interface correspondant au DTO EXACT reçu du Backend Java.
 */
export interface DemandePublicationDto {
    id: number;
    idContenu: number;
    titreContenu: string;
    idDemandeur: number;
    nomDemandeur: string;
    idValideur: number | null; 
    nomValideur: string | null; 
    statut: StatutDemande;
    commentaire: string | null;
    dateDemande: string; 
    dateTraitement: string | null;
}

/**
 * Interface utilisée dans le composant pour l'affichage (Tableau).
 * Elle étend le DTO et ajoute la propriété 'typeContenu' manquante du backend.
 */
export interface DemandePublicationAffichee extends DemandePublicationDto {
    typeContenu: TypeContenu; 
}