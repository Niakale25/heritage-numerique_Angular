// src/app/interfaces/dashboard-dto.interface.ts (Ajout ou Modification)

// ... (vos interfaces existantes)

/**
 * Interface pour la liste complète des familles (utilisée pour le super-admin).
 * (Basée sur le FamilleSuperAdminDTO de votre backend Java)
 * Toutes les propriétés sont définies comme requises (non optionnelles)
 * pour éviter les erreurs TS18048, sauf 'isActive' qui pourrait être null.
 */
export interface FamilleSuperAdminDTO {
    nomFamille: any;
    id: number;
    nom: string; // Non-nullable
    description: string;
    ethnie: string;
    region: string;
    dateCreation: string; // Non-nullable (correction TS2769 dans le composant)
    nombreMembres: number;
    nomAdmin: string; // Non-nullable
    prenomAdmin: string; // Non-nullable
    emailAdmin: string; 
    isActive: boolean | null; // Peut être null si non initialisé, géré dans le composant
}

export const API_BASE_URL = 'http://localhost:8080/api';