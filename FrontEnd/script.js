/****************************************************
   CONFIG API
****************************************************/
const WORKS_URL = "http://localhost:5678/api/works";
let allWorks = []; // contiendra la liste de tous les projets

/****************************************************
   FETCH : RÉCUPÉRATION / SUPPRESSION
****************************************************/
async function fetchWorks() {
  try {
    const response = await fetch(WORKS_URL);
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des travaux");
    }
    return await response.json(); // renvoie un tableau d'objets
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
    // Non connecté
    loginLogoutLink.textContent = "login";
    loginLogoutLink.href = "./login.html";

    // Cacher la bannière + bouton "modifier"
    adminBanner.classList.add("hidden");
    editButton.classList.add("hidden");

    // Afficher les filtres
    filtersContainer.classList.remove("hidden");
  }
}

/****************************************************
   MODALE 1 : GESTION DE GALERIE
****************************************************/
function setupModal() {
  const editButton = document.getElementById("edit-button");
  const modal = document.getElementById("modal");
  const closeModalBtn = document.getElementById("close-modal");
  const addPhotoBtn = document.getElementById("add-photo-btn");

  // Ouvrir la 1re modale "Galerie photo"
  editButton.addEventListener("click", () => {
    buildModalGallery(allWorks);
    modal.classList.remove("hidden");
  });

  // Fermer via la croix
  closeModalBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Fermer si clic en dehors
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  // Bouton "Ajouter une photo" => ouvre la 2e modale
  addPhotoBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    addPhotoModal.classList.remove("hidden");
  });
}

function buildModalGallery(works) {
  const modalGallery = document.querySelector(".modal-gallery");
  modalGallery.innerHTML = "";

  works.forEach((work) => {
    const figure = document.createElement("figure");
    figure.classList.add("modal-figure");

    // Image => clic => ouvre la 3e modale "Modifier"
    const img = document.createElement("img");
    img.src = work.imageUrl;
    img.alt = work.title;
    
    // Au clic, on ouvre la 3e modale
    img.addEventListener("click", () => {
      // Stocker l'ID du work dans une variable
      window.currentEditWorkId = work.id;
      openEditModal(work);
    });

    // Icône poubelle => suppression
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
}

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
   MODALE 2 : AJOUT DE PHOTO
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

// Retour à la 1re modale
backToGalleryBtn.addEventListener("click", () => {
  addPhotoModal.classList.add("hidden");
  // rouvre la modale "Galerie photo"
  const modal = document.getElementById("modal");
  modal.classList.remove("hidden");
});

// Fermer la 2e modale via croix
closeAddPhotoModal.addEventListener("click", () => {
  addPhotoModal.classList.add("hidden");
  resetAddPhotoForm();
});

// Fermer si clic en dehors
window.addEventListener("click", (e) => {
  if (e.target === addPhotoModal) {
    addPhotoModal.classList.add("hidden");
    resetAddPhotoForm();
  }
});

// Sélection d'image => aperçu
uploadInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file && (file.type === "image/jpeg" || file.type === "image/png") && file.size <= 4 * 1024 * 1024) {
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

// Charger les catégories pour la 2e modale
async function loadCategories() {
  try {
    const response = await fetch("http://localhost:5678/api/categories");
    if (!response.ok) {
      throw new Error("Erreur lors du chargement des catégories");
    }
    const categories = await response.json();
    photoCategory.innerHTML = "";
    // Aucune option sélectionnée par défaut
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.name;
      photoCategory.appendChild(option);
    });
  } catch (error) {
    console.error("Erreur lors du chargement des catégories:", error);
  }
}

// Activer/désactiver bouton "Valider" ajout
function updateValidateButton() {
  if (photoTitle.value.trim() !== "" && previewImage.src !== "" && photoCategory.value !== "") {
    validatePhotoButton.removeAttribute("disabled");
  } else {
    validatePhotoButton.setAttribute("disabled", true);
  }
}
photoTitle.addEventListener("input", updateValidateButton);
photoCategory.addEventListener("change", updateValidateButton);

// Envoyer les données (2e modale => création de projet)
validatePhotoButton.addEventListener("click", async () => {
  const file = uploadInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);
  formData.append("title", photoTitle.value.trim());
  formData.append("category", photoCategory.value);

  try {
    const response = await fetch(WORKS_URL, {
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

function resetAddPhotoForm() {
  uploadInput.value = "";
  previewImage.src = "";
  previewImage.classList.add("hidden");
  uploadLabel.style.display = "flex";
  photoTitle.value = "";
  photoCategory.value = "";
  validatePhotoButton.setAttribute("disabled", true);
}

// Charger les catégories au chargement pour la 2e modale
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
});

/****************************************************
   MODALE 3 : MODIFIER UN PROJET
****************************************************/
const editPhotoModal = document.getElementById("edit-photo-modal"); // Dans votre HTML, id="edit-photo-modal"
const closeEditModalBtn = document.getElementById("close-edit-modal"); // La croix
const editTitleInput = document.getElementById("edit-title"); // Le champ titre
const editCategorySelect = document.getElementById("edit-category"); // La liste catégories
const editPreviewImage = document.getElementById("edit-preview-image");
const editValidateBtn = document.getElementById("edit-validate-btn");

// Fonction pour ouvrir la 3e modale, préremplir les champs
function openEditModal(work) {
  // Stocker l'ID pour la mise à jour
  window.currentEditWorkId = work.id;
  
  // Préremplir le champ titre
  editTitleInput.value = work.title;
  
  // Catégorie existante
  editCategorySelect.value = work.category?.id || "";
  
  // Image existante
  editPreviewImage.src = work.imageUrl;
  editPreviewImage.classList.remove("hidden");
  
  // Afficher la modale
  editPhotoModal.classList.remove("hidden");
  
  // Activer/désactiver le bouton
  updateEditValidateButton();
}

// Fermer la 3e modale
closeEditModalBtn.addEventListener("click", () => {
  editPhotoModal.classList.add("hidden");
});

// Fermer si clic en dehors
window.addEventListener("click", (e) => {
  if (e.target === editPhotoModal) {
    editPhotoModal.classList.add("hidden");
  }
});

// Activer/désactiver le bouton “Enregistrer”
function updateEditValidateButton() {
  if (editTitleInput.value.trim() !== "" && editCategorySelect.value !== "") {
    editValidateBtn.removeAttribute("disabled");
  } else {
    editValidateBtn.setAttribute("disabled", true);
  }
}
editTitleInput.addEventListener("input", updateEditValidateButton);
editCategorySelect.addEventListener("change", updateEditValidateButton);

// Enregistrer la modif (3e modale)
editValidateBtn.addEventListener("click", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Vous n’êtes pas connecté.");
    return;
  }
  
  const currentWorkId = window.currentEditWorkId;
  if (!currentWorkId) {
    alert("Aucun projet à modifier");
    return;
  }
  
  const newTitle = editTitleInput.value.trim();
  const newCatId = editCategorySelect.value;
  
  // Appel PUT/PATCH
  try {
    const response = await fetch(`${WORKS_URL}/${currentWorkId}`, {
      method: "PUT", // ou PATCH selon votre API
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: newTitle,
        category: newCatId
      })
    });
    
    if (!response.ok) throw new Error("Erreur lors de la mise à jour");
    
    alert("Modifications enregistrées !");
    editPhotoModal.classList.add("hidden");
    
    // Recharger la galerie
    location.reload();
  } catch (error) {
    console.error(error);
    alert("Impossible de modifier ce projet.");
  }
});

// Charger les catégories pour la 3e modale ? 
// Soit la même fonction “loadCategories()” 
// Ou un loadEditCategories() identique qui remplit #edit-category
// (Selon la structure de votre API).
