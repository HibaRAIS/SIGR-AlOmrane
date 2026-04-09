const API = "http://localhost:8081/api"

export const api = {
  login: (email: string, password: string) =>
    fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    }).then(r => r.json()),

  getMesDemandes: (token: string) =>
    fetch(`${API}/demandes/mes-demandes`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()),

  creerDemande: (data: any, token: string) =>
    fetch(`${API}/demandes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  approuver: (id: number, token: string) =>
    fetch(`${API}/demandes/${id}/approuver`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()),

  rejeter: (id: number, motif: string, token: string) =>
    fetch(`${API}/demandes/${id}/rejeter`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ motifRefus: motif })
    }).then(r => r.json()),

  getProduits: (token: string) =>
    fetch(`${API}/produits`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()),

  getDemandesAValider: (token: string) =>
    fetch(`${API}/demandes/a-valider`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()),
}