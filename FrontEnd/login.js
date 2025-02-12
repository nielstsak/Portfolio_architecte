// login.js

// On pointe vers l'API de votre back-end
const LOGIN_URL = "http://localhost:5678/api/users/login"; 

// Récupération des éléments du DOM
const loginForm = document.getElementById("login-form");
const errorMessage = document.getElementById("error-message");

// Écoute de la soumission du formulaire
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault(); // empêcher rechargement de la page

  // Récupérer les valeurs du formulaire
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const userData = {
    email: emailInput.value,
    password: passwordInput.value,
  };

  // Appel fetch en méthode POST
  try {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    // Vérifier si la réponse est correcte (200, 201…)
    if (!response.ok) {
      // Mauvaise combinaison identifiant / mdp
      showError();
      return;
    }

    // Si ok, on récupère le token
    const data = await response.json(); 
    
    if (data.token) {
      window.localStorage.setItem("token", data.token);

      // Rediriger vers la page d’accueil (index.html par ex)
      window.location.href = "./index.html"; 
    } else {
      // Sinon, on affiche le message d'erreur
      showError();
    }

  } catch (error) {
    console.error("Erreur:", error);
    showError();
  }
});

/**
 * Affiche le message d'erreur dans le DOM.
 */
function showError() {
  errorMessage.classList.remove("hidden");
}
