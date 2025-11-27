export interface ArtisanatDTO {
  id: number;
  titre: string;
  description: string;
  nomAuteur: string;        // Différent de nomCreateur
  prenomAuteur: string;     // Différent de prenomCreateur
  emailAuteur: string;
  roleAuteur: string;
  lienParenteAuteur: string;
  dateCreation: string;
  statut: string;
  urlPhotos: string[];      // C'est un tableau (List<String>)
  urlVideo: string;
  lieu: string;
  region: string;
  idFamille: number;
  nomFamille: string;
}