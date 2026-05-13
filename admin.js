import { auth, db } from "./firebase-client.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { deleteRequestImages, getRequestImages } from "./local-db.js";

const authPanel = document.getElementById("authPanel");
const requestsPanel = document.getElementById("requestsPanel");
const authForm = document.getElementById("authForm");
const adminNameWrap = document.getElementById("adminNameWrap");
const adminName = document.getElementById("adminName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authTitle = document.getElementById("authTitle");
const authHint = document.getElementById("authHint");
const authSubmit = document.getElementById("authSubmit");
const authStatus = document.getElementById("authStatus");
const adminSwitchHint = document.getElementById("adminSwitchHint");
const logoutButton = document.getElementById("logoutButton");
const requestsList = document.getElementById("requestsList");
const requestCount = document.getElementById("requestCount");

const ADMIN_BOOTSTRAP_KEY = "artgarden_admin_bootstrap_v1";
const ADMIN_SESSION_KEY = "artgarden_admin_session_v1";
const STATUS_VALUES = ["under_consultation", "started", "late", "done"];
const STATUS_LABELS = {
  under_consultation: "Konzultacio alatt",
  started: "Elindult",
  late: "Csuszasban",
  done: "Befejezve"
};
let requestsUnsubscribe = null;

function setAuthStatus(message, isError = false) {
  authStatus.textContent = message;
  authStatus.style.color = isError ? "#9b2f2f" : "#2e5f3f";
}

function hasBootstrapAccount() {
  return localStorage.getItem(ADMIN_BOOTSTRAP_KEY) === "1";
}

function setBootstrapAccount(email) {
  localStorage.setItem(ADMIN_BOOTSTRAP_KEY, "1");
  localStorage.setItem("artgarden_admin_email_v1", email);
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function setSession(session) {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

function humanDate(value) {
  if (!value) {
    return "-";
  }

  try {
    if (typeof value?.toDate === "function") {
      return value.toDate().toLocaleString("hu-HU");
    }
    return new Date(value).toLocaleString("hu-HU");
  } catch {
    return String(value);
  }
}

function toMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function createTextNode(tag, className, text) {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  el.textContent = text;
  return el;
}

function renderAdminMode() {
  const bootstrapNeeded = !hasBootstrapAccount();

  if (bootstrapNeeded) {
    authTitle.textContent = "Elso admin letrehozasa";
    authHint.textContent = "Nincs admin fiok. Itt tudsz egyet letrehozni Firebase Auth-ban.";
    authSubmit.textContent = "Admin fiok letrehozasa";
    adminNameWrap.hidden = false;
    adminName.required = true;
    adminSwitchHint.textContent = "Az elso admin letrehozasa utan mar csak a bejelentkezes lathato.";
  } else {
    authTitle.textContent = "Admin bejelentkezes";
    authHint.textContent = "Adja meg az admin email es jelszo parost.";
    authSubmit.textContent = "Bejelentkezes";
    adminNameWrap.hidden = true;
    adminName.required = false;
    adminName.value = "";
    adminSwitchHint.textContent = "Az elso admin Firebase Auth-ban van letrehozva, utana csak a login lathato.";
  }
}

function renderStatusSelect(requestId, currentStatus) {
  const select = document.createElement("select");
  select.className = "inline-status";

  STATUS_VALUES.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = STATUS_LABELS[value];
    option.selected = value === currentStatus;
    select.appendChild(option);
  });

  select.addEventListener("change", async () => {
    try {
      await updateDoc(doc(db, "requests", requestId), {
        status: select.value,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      setAuthStatus(error?.message || "A statusz frissitese nem sikerult.", true);
    }
  });

  return select;
}

async function loadRequestImagesFromFirestore(requestId) {
  try {
    const snapshot = await getDocs(collection(db, "requests", requestId, "images"));
    return snapshot.docs
      .map((docSnap) => docSnap.data())
      .map((img) => ({
        url: img?.url || img?.dataUrl || "",
        name: img?.name || "feltoltott kep"
      }))
      .filter((img) => Boolean(img.url));
  } catch {
    return [];
  }
}

function renderImageGallery(images) {
  const imageWrap = document.createElement("div");
  imageWrap.className = "request-images";

  images.forEach((img, index) => {
    const url = img?.url || img?.dataUrl || "";
    if (!url) {
      return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";

    const image = document.createElement("img");
    image.src = url;
    image.alt = img?.name || `feltoltott kep ${index + 1}`;

    link.appendChild(image);
    imageWrap.appendChild(link);
  });

  return imageWrap;
}

function renderRequestActions(request) {
  const actions = document.createElement("div");
  actions.className = "request-actions";

  const archiveButton = document.createElement("button");
  archiveButton.type = "button";
  archiveButton.className = "ghost request-action";
  const isArchived = Boolean(request.archivedAt);
  archiveButton.textContent = isArchived ? "Visszaallit" : "Archiv";
  archiveButton.addEventListener("click", async () => {
    try {
      await updateDoc(doc(db, "requests", request.id), {
        archivedAt: isArchived ? null : serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setAuthStatus(isArchived ? "Keres aktiv statuszba visszaallitva." : "Keres archivba helyezve.");
    } catch (error) {
      setAuthStatus(error?.message || "Archiv muvelet sikertelen.", true);
    }
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "danger request-action";
  deleteButton.textContent = "Torles";
  deleteButton.addEventListener("click", async () => {
    const ok = window.confirm("Biztosan torolni szeretne ezt az ajanlatkerest?");
    if (!ok) {
      return;
    }

    try {
      const imageDocs = await getDocs(collection(db, "requests", request.id, "images"));
      await Promise.allSettled(imageDocs.docs.map((imageDoc) => deleteDoc(imageDoc.ref)));
      await deleteDoc(doc(db, "requests", request.id));
      deleteRequestImages(request.id);
      setAuthStatus("Ajanlatkeres torolve.");
    } catch (error) {
      setAuthStatus(error?.message || "Torles sikertelen.", true);
    }
  });

  actions.appendChild(archiveButton);
  actions.appendChild(deleteButton);
  return actions;
}

function renderRequests(requests) {
  requestCount.textContent = `${requests.length} ajanlatkeres`;
  requestsList.innerHTML = "";

  if (requests.length === 0) {
    requestsList.innerHTML = "<p>Nincs meg beerkezett ajanlatkeres.</p>";
    return;
  }

  requests.forEach((request) => {
    const card = document.createElement("article");
    card.className = "request-card";
    if (request.archivedAt) {
      card.classList.add("is-archived");
    }

    const top = document.createElement("div");
    top.className = "request-top";

    const info = document.createElement("div");
    const title = createTextNode("h3", "request-title", request.name || request.fullName || request.customerName || "Nev nelkul");
    const contact = createTextNode(
      "p",
      "request-meta",
      `${request.email || request.customerEmail || "-"} | ${request.phone || request.customerPhone || "-"}`
    );
    const created = createTextNode("p", "request-meta", `Erkezett: ${humanDate(request.createdAt)}`);
    info.appendChild(title);
    info.appendChild(contact);
    info.appendChild(created);

    top.appendChild(info);
    top.appendChild(renderStatusSelect(request.id, request.status || "under_consultation"));

    const desc = document.createElement("p");
    desc.className = "request-description";
    desc.textContent = request.description || request.message || "Nincs leiras";

    card.appendChild(top);
    card.appendChild(desc);
    card.appendChild(renderRequestActions(request));

    const cloudImages = Array.isArray(request.imageUrls)
      ? request.imageUrls.map((url) => ({ url }))
      : Array.isArray(request.images)
        ? request.images.map((img) => (typeof img === "string" ? { url: img } : img)).filter(Boolean)
        : [];
    const localImages = getRequestImages(request.id);

    if (cloudImages.length > 0) {
      card.appendChild(renderImageGallery(cloudImages));
    }

    const firestoreImageWrap = document.createElement("div");
    firestoreImageWrap.className = "request-images";
    card.appendChild(firestoreImageWrap);

    const noImageNote = document.createElement("p");
    noImageNote.className = "request-meta";
    noImageNote.textContent = "Nincs elerheto kep ennél a keresnel.";

    loadRequestImagesFromFirestore(request.id).then((images) => {
      if (images.length === 0 && cloudImages.length === 0 && localImages.length === 0) {
        card.appendChild(noImageNote);
        return;
      }

      firestoreImageWrap.replaceWith(renderImageGallery(images));
    });

    if (cloudImages.length === 0 && localImages.length > 0) {
      card.appendChild(renderImageGallery(localImages));
    }

    requestsList.appendChild(card);
  });
}

function subscribeRequests() {
  if (requestsUnsubscribe) {
    requestsUnsubscribe();
  }

  requestsUnsubscribe = onSnapshot(
    collection(db, "requests"),
    (snapshot) => {
      const requests = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }))
        .sort((a, b) => {
          const aValue = a.createdAtMs || toMillis(a.createdAt);
          const bValue = b.createdAtMs || toMillis(b.createdAt);
          return bValue - aValue;
        });
      renderRequests(requests);
    },
    (error) => {
      setAuthStatus(error?.message || "Nem sikerult betolteni a Firestore adatokat.", true);
      requestCount.textContent = "0 ajanlatkeres";
      requestsList.innerHTML = "<p>Az adatok betoltese sikertelen.</p>";
    }
  );
}

function showDashboard() {
  authPanel.hidden = true;
  requestsPanel.hidden = false;
  logoutButton.hidden = false;
  subscribeRequests();
}

function showLogin() {
  if (requestsUnsubscribe) {
    requestsUnsubscribe();
    requestsUnsubscribe = null;
  }
  authPanel.hidden = false;
  requestsPanel.hidden = true;
  logoutButton.hidden = true;
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setAuthStatus("Feldolgozas...");

  const email = authEmail.value.trim();
  const password = authPassword.value;
  const bootstrapNeeded = !hasBootstrapAccount();

  try {
    if (bootstrapNeeded) {
      const name = adminName.value.trim();

      if (!name) {
        setAuthStatus("Az admin nev kotelezo.", true);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      setBootstrapAccount(email);
      localStorage.setItem(
        "artgarden_admin_profile_v1",
        JSON.stringify({
          name,
          email: cred.user.email,
          createdAt: new Date().toISOString()
        })
      );
      setSession({ email, loggedInAt: new Date().toISOString() });
      setAuthStatus("Admin fiok letrehozva. Most mar csak a bejelentkezes lathato.");
      adminName.value = "";
      authPassword.value = "";
      renderAdminMode();
      showDashboard();
      return;
    }

    await signInWithEmailAndPassword(auth, email, password);
    setSession({ email, loggedInAt: new Date().toISOString() });
    setAuthStatus("Sikeres bejelentkezes.");
    showDashboard();
  } catch (error) {
    setAuthStatus(error?.message || "Sikertelen muvelet.", true);
  }
});

logoutButton.addEventListener("click", async () => {
  clearSession();
  authPassword.value = "";
  setAuthStatus("");
  await signOut(auth).catch(() => {});
  showLogin();
});

onAuthStateChanged(auth, (user) => {
  renderAdminMode();

  if (user && getSession()) {
    showDashboard();
    return;
  }

  if (!user) {
    clearSession();
    showLogin();
  }
});

renderAdminMode();
if (getSession()) {
  showDashboard();
} else {
  showLogin();
}
