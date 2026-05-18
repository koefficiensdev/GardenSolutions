import {
  clearDraft,
  fileToDataUrl,
  getDraft,
  saveRequestImages,
  saveDraft
} from "./local-db.js";
import { auth, db } from "./firebase-client.js";
import {
  addDoc,
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import {
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const quoteTriggers = document.querySelectorAll(".quote-trigger");
const hamburgerButton = document.getElementById("hamburgerButton");
const mobileMenu = document.getElementById("mobileMenu");
const serviceCards = document.querySelectorAll(".service-card");
const hero = document.querySelector(".hero");

const quoteModal = document.getElementById("quoteModal");
const quoteClose = document.getElementById("quoteClose");
const quoteForm = document.getElementById("quoteForm");
const quoteName = document.getElementById("quoteName");
const quoteEmail = document.getElementById("quoteEmail");
const quotePhone = document.getElementById("quotePhone");
const quoteDescription = document.getElementById("quoteDescription");
const quoteImages = document.getElementById("quoteImages");
const quotePreview = document.getElementById("quotePreview");
const quoteSubmit = document.getElementById("quoteSubmit");
const quoteStatus = document.getElementById("quoteStatus");
let publicAuthReady = null;

function ensurePublicAuth() {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  if (publicAuthReady) {
    return publicAuthReady;
  }

  publicAuthReady = new Promise((resolve, reject) => {
    const stop = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          stop();
          resolve(user);
        }
      },
      (error) => {
        stop();
        reject(error);
      }
    );

    signInAnonymously(auth).catch((error) => {
      stop();
      reject(error);
    });
  }).finally(() => {
    publicAuthReady = null;
  });

  return publicAuthReady;
}

function setQuoteStatus(message, isError = false) {
  quoteStatus.textContent = message;
  quoteStatus.style.color = isError ? "#9b2f2f" : "#355e3b";
}

function loadDraft() {
  const draft = getDraft();
  if (!draft) {
    return;
  }

  quoteName.value = draft.name || "";
  quoteEmail.value = draft.email || "";
  quotePhone.value = draft.phone || "";
  quoteDescription.value = draft.description || "";
}

function renderImagePreview(files) {
  quotePreview.innerHTML = "";

  Array.from(files).slice(0, 8).forEach((file) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const img = document.createElement("img");
    img.alt = file.name;
    img.src = URL.createObjectURL(file);
    img.addEventListener("load", () => URL.revokeObjectURL(img.src), { once: true });
    quotePreview.appendChild(img);
  });
}

function openQuoteModal() {
  quoteModal.classList.add("is-open");
  quoteModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  loadDraft();
}

function closeQuoteModal() {
  quoteModal.classList.remove("is-open");
  quoteModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  setQuoteStatus("");
}

quoteTriggers.forEach((trigger) => {
  trigger.addEventListener("click", openQuoteModal);
});

quoteClose?.addEventListener("click", closeQuoteModal);
quoteModal?.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.close === "modal") {
    closeQuoteModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && quoteModal.classList.contains("is-open")) {
    closeQuoteModal();
  }
});

[quoteName, quoteEmail, quotePhone, quoteDescription].forEach((input) => {
  input.addEventListener("input", () => {
    saveDraft({
      name: quoteName.value.trim(),
      email: quoteEmail.value.trim(),
      phone: quotePhone.value.trim(),
      description: quoteDescription.value.trim()
    });
  });
});

quoteImages?.addEventListener("change", () => {
  renderImagePreview(quoteImages.files || []);
});

quoteForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const files = Array.from(quoteImages.files || []).slice(0, 8);
  const payloadBase = {
    name: quoteName.value.trim(),
    email: quoteEmail.value.trim(),
    phone: quotePhone.value.trim(),
    description: quoteDescription.value.trim(),
    status: "under_consultation",
    createdAtMs: Date.now(),
    archivedAt: null
  };

  if (!payloadBase.name || !payloadBase.email || !payloadBase.phone || !payloadBase.description) {
    setQuoteStatus("Toltson ki minden kotelezo mezot.", true);
    return;
  }

  quoteSubmit.disabled = true;
  setQuoteStatus("Keres kuldese folyamatban...");

  try {
    await ensurePublicAuth();

    const requestId = crypto.randomUUID();
    let uploadFailures = 0;
    const uploadErrorCodes = new Set();
    let firestoreImageCount = 0;
    const uploadedImages = [];

    await setDoc(doc(db, "requests", requestId), {
      ...payloadBase,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      imageCount: 0,
      hasLocalImages: false,
      localImageCount: 0
    });

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;

      const dataUrl = await fileToDataUrl(file);

      const imagePayload = {
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl
      };

      uploadedImages.push(imagePayload);

      try {
        await addDoc(collection(db, "requests", requestId, "images"), {
          ...imagePayload,
          createdAt: serverTimestamp()
        });
        firestoreImageCount += 1;
      } catch (error) {
        uploadFailures += 1;
        if (error?.code) {
          uploadErrorCodes.add(error.code);
        }
      }
    }

    await updateDoc(doc(db, "requests", requestId), {
      updatedAt: serverTimestamp(),
      imageCount: firestoreImageCount,
      hasLocalImages: uploadedImages.length > 0,
      localImageCount: uploadedImages.length
    });

    let localImageSaveFailed = false;
    try {
      saveRequestImages(requestId, uploadedImages);
    } catch {
      localImageSaveFailed = true;
    }

    clearDraft();
    quoteForm.reset();
    quotePreview.innerHTML = "";
    if (uploadFailures > 0 && localImageSaveFailed) {
      setQuoteStatus("Ajanlatkeres mentve, de nehany kep sem Firestore kepek almappaba, sem helyben nem kerult fel.", true);
    } else if (uploadFailures > 0) {
      if (uploadErrorCodes.has("permission-denied")) {
        setQuoteStatus("Ajanlatkeres mentve, de a Firestore szabalyok tiltjak a kepek almappaba valo feltoltest.", true);
      } else {
        setQuoteStatus("Ajanlatkeres mentve, de nehany kep nem kerult fel a Firestore kepek almappaba.", true);
      }
    } else if (localImageSaveFailed) {
      setQuoteStatus("Ajanlatkerese Firestore-ba mentve, de a kepek helyi mentese nem sikerult (valoszinuleg tarhelykorlat miatt).", true);
    } else {
      setQuoteStatus("Ajanlatkerese sikeresen rogzitve (adatok Firestore, kepek Firestore almappaban + helyben).");
    }
    window.setTimeout(closeQuoteModal, 850);
  } catch (error) {
    const code = error?.code || "";
    if (code === "permission-denied") {
      setQuoteStatus("A Firestore jogosultsagok nem engedik a kuldest (permission-denied).", true);
    } else if (code === "auth/operation-not-allowed") {
      setQuoteStatus("Az anonim bejelentkezes nincs engedelyezve Firebase-ben. Kapcsolja be az Authentication / Anonymous modot.", true);
    } else if (code === "auth/admin-restricted-operation") {
      setQuoteStatus("Az anonim bejelentkezes tiltva van a projektben. Engedelyezze az Anonymous providert.", true);
    } else if (code === "unavailable") {
      setQuoteStatus("A szolgaltatas atmenetileg nem elerheto. Probalkozzon ujra kesobb.", true);
    } else {
      setQuoteStatus("Hiba tortent kuldes kozben. Probalkozzon ujra.", true);
    }
  } finally {
    quoteSubmit.disabled = false;
  }
});

// Scroll reveal
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay || 0;
        window.setTimeout(() => {
          el.classList.add("is-visible");
        }, Number(delay));
        revealObserver.unobserve(el);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".service-card").forEach((el, i) => {
  el.dataset.delay = i * 80;
  revealObserver.observe(el);
});

document.querySelectorAll(".trust-item").forEach((el, i) => {
  el.dataset.delay = i * 100;
  revealObserver.observe(el);
});

// Hero parallax (desktop only)
function onScroll() {
  if (window.innerWidth < 980 || !hero) return;
  const scrollY = window.scrollY;
  hero.style.backgroundPositionY = `calc(top + ${scrollY * 0.35}px)`;
}
window.addEventListener("scroll", onScroll, { passive: true });

function setMobileMenuState(isOpen) {
  if (!hamburgerButton || !mobileMenu) {
    return;
  }

  hamburgerButton.classList.toggle("is-open", isOpen);
  hamburgerButton.setAttribute("aria-expanded", String(isOpen));
  mobileMenu.classList.toggle("is-open", isOpen);
  mobileMenu.setAttribute("aria-hidden", String(!isOpen));
}

hamburgerButton?.addEventListener("click", () => {
  const shouldOpen = !hamburgerButton.classList.contains("is-open");
  setMobileMenuState(shouldOpen);
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    setMobileMenuState(false);
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMobileMenuState(false);
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 980) {
    setMobileMenuState(false);
  }
});

serviceCards.forEach((card) => {
  card.classList.remove("is-open");
});
