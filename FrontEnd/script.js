/****************************************************
   CONFIG API
****************************************************/
const WORKS_URL = "http://localhost:5678/api/works";
let allWorks = []; 

/****************************************************
   FETCH : RÉCUPÉRATION / SUPPRESSION
****************************************************/
async function fetchWorks() {
  try {
    const response = await fetch(WORKS_URL);
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des travaux");
    }
    return await response.json(); 
  } catch (error) {
    console.error("fetchWorks ->", error);
    return [];
  }
}

async function deleteWork(id) {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Utilisateur non connecté");
  }
  const deleteUrl = `${WORKS_URL}/${id}`;

  const response = await fetch(deleteUrl, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Erreur lors de la suppression du travail");
  }
}

/****************************************************
   AFFICHAGE DES TRAVAUX (GALERIE PRINCIPALE)
****************************************************/
function displayWorks(works) {
  const gallery = document.querySelector(".gallery");
  gallery.innerHTML = "";

  works.forEach((work) => {
    const figure = document.createElement("figure");
    const img = document.createElement("img");
    const figcaption = document.createElement("figcaption");

    img.src = work.imageUrl;
    img.alt = work.title;
    figcaption.innerText = work.title;

    figure.appendChild(img);
    figure.appendChild(figcaption);
    gallery.appendChild(figure);
  });
}

/****************************************************
   FILTRES
****************************************************/
let activeFilter = "Tous";

function generateFilters(works) {
  const filtersContainer = document.getElementById("filters");
  filtersContainer.innerHTML = "";

  // Bouton "Tous"
  const btnAll = createFilterButton("Tous");
  filtersContainer.appendChild(btnAll);

  // Catégories uniques
  const categoriesSet = new Set();
  works.forEach((w) => {
    if (w.category) {
      categoriesSet.add(w.category.name);
    }
  });

  categoriesSet.forEach((catName) => {
    const btn = createFilterButton(catName);
    filtersContainer.appendChild(btn);
  });

  updateActiveFilterButton();
}

function createFilterButton(label) {
  const button = document.createElement("button");
  button.textContent = label;

  button.addEventListener("click", () => {
    activeFilter = label;
    updateActiveFilterButton();
    applyFilter();
  });

  return button;
}

function updateActiveFilterButton() {
  const filtersContainer = document.getElementById("filters");
  const buttons = filtersContainer.querySelectorAll("button");
  buttons.forEach((btn) => {
    if (btn.textContent === activeFilter) {
      btn.classList.add("active-filter");
    } else {
      btn.classList.remove("active-filter");
    }
  });
}

function applyFilter() {
  if (activeFilter === "Tous") {
    displayWorks(allWorks);
  } else {
    const filtered = allWorks.filter(
      (w) => w.category && w.category.name === activeFilter
    );
    displayWorks(filtered);
  }
}

/****************************************************
   LOGIN/LOGOUT + BANNIÈRE ADMIN
****************************************************/
function handleLoginLogout() {
  const loginLogoutLink = document.getElementById("login-logout");
  const editButton = document.getElementById("edit-button");
  const adminBanner = document.getElementById("admin-banner");
  const filtersContainer = document.getElementById("filters");

  const token = localStorage.getItem("token");

  if (token) {
    // Connecté
    loginLogoutLink.textContent = "logout";
    loginLogoutLink.href = "#";

    // Afficher la bannière + bouton "modifier"
    adminBanner.classList.remove("hidden");
    editButton.classList.remove("hidden");

    // Cacher les filtres
    filtersContainer.classList.add("hidden");

    // Déconnexion
    loginLogoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      window.location.reload();
    });
  } else {
    loginLogoutLink.textContent = "login";
    loginLogoutLink.href = "./login.html";

    adminBanner.classList.add("hidden");
    editButton.classList.add("hidden");

    // Afficher les filtres
    filtersContainer.classList.remove("hidden");
  }
}

/****************************************************
   MODALE : OUVERTURE / FERMETURE (1re modale)
****************************************************/
function setupModal() {
  const editButton = document.getElementById("edit-button");
  const modal = document.getElementById("modal");
  const closeModalBtn = document.getElementById("close-modal");
  const addPhotoBtn = document.getElementById("add-photo-btn");

  // Ouverture de la première modale "Galerie photo"
  editButton.addEventListener("click", () => {
    buildModalGallery(allWorks);
    modal.classList.remove("hidden");
  });

  // Fermeture via la croix
  closeModalBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Fermer si clic en dehors
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  // Passage à la 2e modale "Ajout de photo"
  addPhotoBtn.addEventListener("click", () => {
    // Fermer la 1re modale
    modal.classList.add("hidden");
    // Ouvrir la 2e modale
    addPhotoModal.classList.remove("hidden");
  });
}

/****************************************************
   MODALE : BUILD MINI-GALERIE
****************************************************/
function buildModalGallery(works) {
  const modalGallery = document.querySelector(".modal-gallery");
  modalGallery.innerHTML = "";

  works.forEach((work) => {
    const figure = document.createElement("figure");
    figure.classList.add("modal-figure");

    const img = document.createElement("img");
    img.src = work.imageUrl;
    img.alt = work.title;

    img.addEventListener("click", () => {
      alert(`Ouvrir l'écran de modification pour : ${work.title}`);
    });

    const trashIcon = document.createElement("img");
    trashIcon.src = "./assets/icons/poubelle_icone.svg";
    trashIcon.classList.add("trash-icon");

    trashIcon.addEventListener("click", async (e) => {
      e.stopPropagation();
      try {
        await deleteWork(work.id);
        figure.remove();
        removeWorkFromMainGallery(work.id);
      } catch (err) {
        console.error(err);
        alert("Impossible de supprimer ce projet !");
      }
    });

    figure.appendChild(img);
    figure.appendChild(trashIcon);
    modalGallery.appendChild(figure);
  });
}

function removeWorkFromMainGallery(id) {
  allWorks = allWorks.filter((w) => w.id !== id);
  applyFilter(); 

/****************************************************
   INIT
****************************************************/
async function init() {
  // 1. Récupérer la liste
  allWorks = await fetchWorks();

  // 2. Affiche la galerie
  displayWorks(allWorks);

  // 3. Génère les filtres
  generateFilters(allWorks);

  // 4. Gère login/logout + bannière
  handleLoginLogout();

  // 5. Prépare la modale "Galerie photo"
  setupModal();
}

// Lancement
init();

/****************************************************
   MODALE D'AJOUT DE PHOTO (2e modale)
****************************************************/
const addPhotoModal = document.getElementById("add-photo-modal");
const backToGalleryBtn = document.getElementById("back-to-gallery");
const closeAddPhotoModal = document.getElementById("close-add-photo-modal");
const uploadInput = document.getElementById("upload-input");
const previewImage = document.getElementById("preview-image");
const uploadLabel = document.getElementById("upload-label");
const photoTitle = document.getElementById("photo-title");
const photoCategory = document.getElementById("photo-category");
const validatePhotoButton = document.getElementById("validate-photo");

// FERMER LA MODALE D'AJOUT & REVENIR À LA GALERIE
backToGalleryBtn.addEventListener("click", () => {
  addPhotoModal.classList.add("hidden");
  const modal = document.getElementById("modal");
  modal.classList.remove("hidden");
});

// FERMER LA MODALE D'AJOUT VIA LA CROIX
closeAddPhotoModal.addEventListener("click", () => {
  addPhotoModal.classList.add("hidden");
  resetAddPhotoForm();
});

// CLIQUE DEHORS POUR FERMER (optionnel)
window.addEventListener("click", (e) => {
  if (e.target === addPhotoModal) {
    addPhotoModal.classList.add("hidden");
    resetAddPhotoForm();
  }
});

// AFFICHER L’IMAGE CHOISIE EN APERÇU
uploadInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (
    file &&
    (file.type === "image/jpeg" || file.type === "image/png") &&
    file.size <= 4 * 1024 * 1024
  ) {
    const reader = new FileReader();
    reader.onload = () => {
      previewImage.src = reader.result;
      previewImage.classList.remove("hidden");
      uploadLabel.style.display = "none";
    };
    reader.readAsDataURL(file);
  } else {
    alert("Format ou taille invalide ! (jpg/png, max 4 Mo)");
    uploadInput.value = "";
    previewImage.classList.add("hidden");
    uploadLabel.style.display = "flex";
  }
});

// RÉCUPÉRER LES CATÉGORIES DEPUIS L’API
async function loadCategories() {
  try {
    const response = await fetch("http://localhost:5678/api/categories");
    if (!response.ok) {
      throw new Error("Erreur lors du chargement des catégories");
    }
    const categories = await response.json();
    photoCategory.innerHTML = "";
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      photoCategory.appendChild(option);
    });
  } catch (error) {
    console.error("Erreur lors du chargement des catégories:", error);
  }
}

// ACTIVER/DÉSACTIVER LE BOUTON "VALIDER"
function updateValidateButton() {
  if (
    photoTitle.value.trim() !== "" &&
    previewImage.src !== "" &&
    photoCategory.value !== ""
  ) {
    validatePhotoButton.removeAttribute("disabled");
  } else {
    validatePhotoButton.setAttribute("disabled", true);
  }
}

photoTitle.addEventListener("input", updateValidateButton);
photoCategory.addEventListener("change", updateValidateButton);

// ENVOYER LES DONNÉES À L'API
validatePhotoButton.addEventListener("click", async () => {
  const file = uploadInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);
  formData.append("title", photoTitle.value.trim());
  formData.append("category", photoCategory.value);

  try {
    const response = await fetch("http://localhost:5678/api/works", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error("Erreur lors de l’ajout");

    alert("Photo ajoutée !");
    addPhotoModal.classList.add("hidden");
    resetAddPhotoForm();
    location.reload(); // Rafraîchir la galerie
  } catch (error) {
    console.error("Erreur :", error);
    alert("Une erreur est survenue.");
  }
});

// RÉINITIALISER LE FORMULAIRE APRÈS VALIDATION
function resetAddPhotoForm() {
  uploadInput.value = "";
  previewImage.src = "";
  previewImage.classList.add("hidden");
  uploadLabel.style.display = "flex";

  photoTitle.value = "";
  photoCategory.value = "";
  validatePhotoButton.setAttribute("disabled", true);
}

// INITIALISATION AU CHARGEMENT
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
})
}
