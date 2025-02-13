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

  const btnAll = createFilterButton("Tous");
  filtersContainer.appendChild(btnAll);

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

    adminBanner.classList.remove("hidden");
    editButton.classList.remove("hidden");

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

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

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

    const img = document.createElement("img");
    img.src = work.imageUrl;
    img.alt = work.title;
    
    img.addEventListener("click", () => {
      window.currentEditWorkId = work.id;
      openEditModal(work);
    });
    
    // --- Création du conteneur pour l'icône poubelle ---
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "5px";
    container.style.right = "5px";
    container.style.width = "20px";
    container.style.height = "20px";
    container.style.backgroundColor = "black"; 
    container.style.cursor = "pointer";

    const trashIcon = document.createElement("img");
    trashIcon.src = "./assets/icons/poubelle_icone.svg";
    trashIcon.style.width = "100%";
    trashIcon.style.height = "100%";
    trashIcon.style.filter = "brightness(0) invert(1)";
    trashIcon.style.backgroundColor = "transparent"; 

    container.addEventListener("click", async (e) => {
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

    container.appendChild(trashIcon);
    figure.appendChild(img);
    figure.appendChild(container);
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

  // 6. Charge les catégories
  await loadCategories(); // **Ajouté ici**
}

// Lancement
init();

async function loadCategories() {
    try {
        const response = await fetch("http://localhost:5678/api/categories");
        if (!response.ok) {
            throw new Error("Erreur lors du chargement des catégories");
        }
        const categories = await response.json();
        
        const photoCategory = document.getElementById("photo-category");
        const editCategorySelect = document.getElementById("edit-photo-category");

        if (!photoCategory || !editCategorySelect) {
            console.error("Erreur : Un ou plusieurs éléments <select> n'ont pas été trouvés.");
            return; 
        }

        photoCategory.innerHTML = "";
        editCategorySelect.innerHTML = ""; 

        categories.forEach((cat) => {
            const option1 = document.createElement("option");
            option1.value = cat.id;
            option1.textContent = cat.name;
            photoCategory.appendChild(option1);

            const option2 = document.createElement("option");
            option2.value = cat.id;
            option2.textContent = cat.name;
            editCategorySelect.appendChild(option2);
        });

    } catch (error) {
        console.error("Erreur lors du chargement des catégories:", error);
    }
}
/****************************************************
 * MODALE 2 : AJOUT DE PHOTO
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
const modal = document.getElementById("modal");

backToGalleryBtn.addEventListener("click", () => {
    addPhotoModal.classList.add("hidden");
    modal.classList.remove("hidden");
});

closeAddPhotoModal.addEventListener("click", () => {
    addPhotoModal.classList.add("hidden");
    resetAddPhotoForm();
    modal.classList.remove("hidden");
});

window.addEventListener("click", (e) => {
    if (e.target === addPhotoModal) {
        addPhotoModal.classList.add("hidden");
        resetAddPhotoForm();
        modal.classList.remove("hidden");
    }
});

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

async function loadCategories() {
    try {
        const response = await fetch("http://localhost:5678/api/categories");
        if (!response.ok) {
            throw new Error("Erreur lors du chargement des catégories");
        }
        const categories = await response.json();
        photoCategory.innerHTML = "";

        categories.forEach((cat) => {
            const option = document.createElement("option");
            option.value = cat.id;
            option.textContent = cat.name;
            photoCategory.appendChild(option);
        });
        editCategorySelect.innerHTML = photoCategory.innerHTML;

    } catch (error) {
        console.error("Erreur lors du chargement des catégories:", error);
    }
}

function updateValidateButton() {
    if (photoTitle.value.trim() !== "" && previewImage.src !== "" && photoCategory.value !== "") {
        validatePhotoButton.removeAttribute("disabled");
    } else {
        validatePhotoButton.setAttribute("disabled", true);
    }
}

photoTitle.addEventListener("input", updateValidateButton);
photoCategory.addEventListener("change", updateValidateButton);

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

        const newWork = await response.json(); 

        alert("Photo ajoutée !");
        addPhotoModal.classList.add("hidden");
        modal.classList.remove("hidden");

        allWorks.push(newWork); 
        displayWorks(allWorks); 
        buildModalGallery(allWorks);

        resetAddPhotoForm();

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

function openEditModal(work) {
  console.log("openEditModal, work:", work); 
  window.currentEditWorkId = work.id;
  console.log("openEditModal, currentEditWorkId:",  window.currentEditWorkId);


  editTitleInput.value = work.title;
  editCategorySelect.value = work.category?.id || "";
  if (work.imageUrl) {
      editPreviewImage.src = work.imageUrl;
      editPreviewImage.classList.remove("hidden");
      editUploadLabel.style.display = "none";
  } else {
      editPreviewImage.classList.add("hidden");
      editUploadLabel.style.display = "flex";
  }

  editPhotoModal.classList.remove("hidden");
  modal.classList.add("hidden");

  updateEditValidateButton();
}


/****************************************************
 * MODALE 3 : MODIFIER UN PROJET
 ****************************************************/
const editPhotoModal = document.getElementById("edit-photo-modal");
const closeEditModalBtn = document.getElementById("close-edit-modal");
const backToGalleryEditBtn = document.getElementById("back-to-gallery-edit");
const editUploadInput = document.getElementById("upload-input-edit");
const editUploadLabel = document.getElementById("upload-label-edit");
const editPreviewImage = document.getElementById("edit-preview-image");
const editTitleInput = document.getElementById("edit-photo-title");
const editCategorySelect = document.getElementById("edit-photo-category");
const editValidateBtn = document.getElementById("validate-photo-edit");

function openEditModal(work) {
  window.currentEditWorkId = work.id;

  editTitleInput.value = work.title;
  editCategorySelect.value = work.category?.id || "";
  if (work.imageUrl) {
    editPreviewImage.src = work.imageUrl;
    editPreviewImage.classList.remove("hidden");
    editUploadLabel.style.display = "none";
  } else {
    editPreviewImage.classList.add("hidden");
    editUploadLabel.style.display = "flex";
  }

  editPhotoModal.classList.remove("hidden");
  modal.classList.add("hidden");
  
backToGalleryEditBtn.addEventListener("click", () => {
    editPhotoModal.classList.add("hidden");
    modal.classList.remove("hidden");
    resetEditPhotoForm();
});

window.addEventListener("click", (e) => {
    if (e.target === editPhotoModal) {
        editPhotoModal.classList.add("hidden");
        modal.classList.remove("hidden");
        resetEditPhotoForm();
    }
});

function updateEditValidateButton() {
  if (editTitleInput.value.trim() !== "" && editCategorySelect.value !== "") {
      editValidateBtn.removeAttribute("disabled");
  } else {
      editValidateBtn.setAttribute("disabled", true);
  }
}

editTitleInput.addEventListener("input", updateEditValidateButton);
editCategorySelect.addEventListener("change", updateEditValidateButton);

editUploadInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png") && file.size <= 4 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
            editPreviewImage.src = reader.result;
            editPreviewImage.classList.remove("hidden");
            editUploadLabel.style.display = "none";
            updateEditValidateButton();
        };
        reader.readAsDataURL(file);
    } else {
        alert("Format ou taille invalide ! (jpg/png, max 4 Mo)");
        editUploadInput.value = "";
        editPreviewImage.classList.add("hidden");
        editUploadLabel.style.display = "flex";
        updateEditValidateButton();
    }
});

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
  const newCatId = parseInt(editCategorySelect.value, 10);
  const file = editUploadInput.files[0]; 
  const existingImageUrl = editPreviewImage.src; 

  try {
      if (!newTitle || !newCatId) {
          alert("Veuillez remplir tous les champs.");
          return;
      }

      if (!file) {
          alert("Veuillez sélectionner une nouvelle image.");
          return;
      }

      const deleteResponse = await fetch(`${WORKS_URL}/${currentWorkId}`, {
          method: "DELETE",
          headers: {
              Authorization: `Bearer ${token}`,
          },
      });

      if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          throw new Error(`Erreur lors de la suppression: ${deleteResponse.status} - ${errorText}`);
      }


      const formData = new FormData();
      formData.append("title", newTitle);
      formData.append("category", newCatId);
      formData.append("image", file); 

      const createResponse = await fetch(WORKS_URL, {
          method: "POST",
          headers: {
              Authorization: `Bearer ${token}`,
          },
          body: formData,
      });

      if (!createResponse.ok) {
          const errorText = await createResponse.text();
          throw new Error(`Erreur lors de la création: ${createResponse.status} - ${errorText}`);
      }

      const newWork = await createResponse.json();

      alert("Modifications enregistrées !");
      editPhotoModal.classList.add("hidden");

      allWorks = allWorks.filter(work => work.id !== currentWorkId); 
      allWorks.push(newWork); 
      displayWorks(allWorks);
      buildModalGallery(allWorks);

  } catch (error) {
      console.error(error);
      alert("Impossible de modifier ce projet.");
  }
});

function resetEditPhotoForm() {
  editUploadInput.value = "";
  editPreviewImage.src = "";
  editPreviewImage.classList.add("hidden");
  editUploadLabel.style.display = "flex";
  editTitleInput.value = "";
  editCategorySelect.value = "";
  editValidateBtn.setAttribute("disabled", true);
  }
};  