const sections = {
  maintenance: {
    label: "Prémium kerti szolgáltatás",
    title: "Kertfenntartás",
    trust: "Válasz 24 órán belül",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ez egy rövidebb mintaszöveg, amely a kertfenntartási szolgáltatás lényegét tömören mutatja be.",
    descriptionSecondary:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur feugiat metus nec elementum dignissim.",
    points: [
      "Precíz ütemezés és rendszeres helyszíni jelenlét",
      "Professzionális géppark és diszkrét kivitelezés",
      "Egyedi szezonális gondozási terv"
    ],
    thumbSrc:
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=500&q=80",
    fallbackImage:
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1920&q=80",
    mediaType: "video",
    mediaSrc:
      "https://cdn.pixabay.com/video/2020/04/27/37488-413124869_large.mp4"
  },
  mowing: {
    label: "Rendezett gyep",
    title: "Fűnyírás",
    trust: "Fix időablakos kiszállás",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ez a helykitöltő szöveg a rendszeres fűnyírás és gyepápolás bemutatására szolgál. Integer sed hendrerit magna, ac facilisis neque. Morbi vel nunc id ipsum fringilla feugiat.",
    descriptionSecondary:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque mattis volutpat sem, vel dignissim lorem malesuada sed. Praesent a lorem at odio gravida placerat et nec justo.",
    points: [
      "Sávmentes, egyenletes vágáskép minden alkalommal",
      "Élszegés és tiszta befejező munkák",
      "Szezonális gyepkondícióhoz igazított ütemezés"
    ],
    thumbSrc:
      "https://images.unsplash.com/photo-1621955249225-6b29c5f9304e?auto=format&fit=crop&w=500&q=80",
    fallbackImage:
      "https://images.unsplash.com/photo-1621955249225-6b29c5f9304e?auto=format&fit=crop&w=1920&q=80",
    mediaType: "video",
    mediaSrc:
      "https://cdn.pixabay.com/video/2022/07/31/126088-734348930_large.mp4"
  },
  hedges: {
    label: "Precíz forma",
    title: "Sövénynyírás",
    trust: "Formavágás prémium minőségben",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ez a minta szöveg a sövények formára vágását és esztétikus kerti vonalvezetést szemlélteti. Maecenas sollicitudin, nisl id volutpat cursus, enim nunc egestas purus, non porta mi ipsum vitae lacus.",
    descriptionSecondary:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse potenti. Sed at gravida turpis. Vivamus pretium erat eu sem cursus, non venenatis lacus gravida.",
    points: [
      "Geometrikus és organikus formák pontos kivitelezése",
      "Egészséges visszavágási ritmus fajta szerint",
      "Tiszta munkaterület és azonnali elszállítás"
    ],
    thumbSrc:
      "https://images.unsplash.com/photo-1599685315640-3eb587f77f7b?auto=format&fit=crop&w=500&q=80",
    fallbackImage:
      "https://images.unsplash.com/photo-1599685315640-3eb587f77f7b?auto=format&fit=crop&w=1920&q=80",
    mediaType: "video",
    mediaSrc:
      "https://cdn.pixabay.com/video/2022/05/31/119172-716826901_large.mp4"
  },
  irrigation: {
    label: "Okos vízellátás",
    title: "Öntözőrendszer",
    trust: "Hatékony vízhasználat, kontrollált működés",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ez a helykitöltő bekezdés az automata öntözőrendszer tervezését és beállítását mutatja be. Cras rutrum dolor ac nibh luctus, sed rhoncus libero placerat.",
    descriptionSecondary:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam erat volutpat. Nam mollis, odio vitae luctus suscipit, mauris mauris convallis sapien, et eleifend neque tortor id ipsum.",
    points: [
      "Zónákra bontott, növényigényhez hangolt beállítás",
      "Automatizált időzítés időjárásfüggő logikával",
      "Szezonzáró és tavaszi rendszerellenőrzés"
    ],
    thumbSrc:
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=500&q=80",
    fallbackImage:
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1920&q=80",
    mediaType: "video",
    mediaSrc:
      "https://cdn.pixabay.com/video/2021/08/04/83672-583342127_large.mp4"
  }
};

const menuButtons = document.querySelectorAll(".menu-item");
const panel = document.querySelector(".panel");
const eyebrow = document.getElementById("eyebrow");
const panelTitle = document.getElementById("panelTitle");
const panelDescription = document.getElementById("panelDescription");
const panelDescriptionSecondary = document.getElementById("panelDescriptionSecondary");
const servicePoints = document.getElementById("servicePoints");
const orderButton = document.getElementById("orderButton");
const quoteButton = document.getElementById("quoteButton");
const trustBadge = document.getElementById("trustBadge");
const bgVideo = document.getElementById("bgVideo");
const bgImage = document.getElementById("bgImage");
let activeSectionKey = "maintenance";

menuButtons.forEach((button) => {
  const key = button.dataset.key;
  const section = sections[key];

  if (section?.thumbSrc) {
    button.style.setProperty("--thumb-image", `url('${section.thumbSrc}')`);
  }
});

function updateSection(key) {
  const section = sections[key];

  if (!section) {
    return;
  }

  activeSectionKey = key;

  menuButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.key === key);
  });

  panel.classList.add("is-changing");

  window.setTimeout(() => {
    eyebrow.textContent = section.label;
    panelTitle.textContent = section.title;
    panelDescription.textContent = section.description;
    panelDescriptionSecondary.textContent = section.descriptionSecondary;
    trustBadge.textContent = section.trust;
    servicePoints.innerHTML = "";

    section.points.forEach((point) => {
      const item = document.createElement("li");
      item.textContent = point;
      servicePoints.appendChild(item);
    });

    panel.classList.remove("is-changing");
  }, 180);

  if (section.mediaType === "video") {
    const fallback = section.fallbackImage || section.thumbSrc;

    if (fallback) {
      bgImage.style.backgroundImage = `url('${fallback}')`;
      bgImage.classList.add("is-on");
    }

    bgVideo.classList.remove("is-on");
    bgVideo.pause();
    bgVideo.onerror = null;
    bgVideo.oncanplay = null;

    bgVideo.src = section.mediaSrc;
    bgVideo.load();

    bgVideo.oncanplay = () => {
      if (activeSectionKey !== key) {
        return;
      }

      bgVideo.classList.add("is-on");
      bgImage.classList.remove("is-on");
    };

    bgVideo.onerror = () => {
      if (activeSectionKey !== key) {
        return;
      }

      bgVideo.classList.remove("is-on");
      bgImage.classList.add("is-on");
    };

    bgVideo.play().catch(() => {
      if (activeSectionKey !== key) {
        return;
      }

      bgVideo.classList.remove("is-on");
      bgImage.classList.add("is-on");
    });
  } else {
    bgImage.style.backgroundImage = `url('${section.mediaSrc}')`;
    bgImage.classList.add("is-on");
    bgVideo.classList.remove("is-on");
    bgVideo.pause();
  }
}

menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    updateSection(button.dataset.key);
  });
});

orderButton.addEventListener("click", () => {
  orderButton.textContent = "Köszönjük, hamarosan jelentkezünk";
  orderButton.disabled = true;
  orderButton.classList.add("is-done");
});

quoteButton.addEventListener("click", () => {
  quoteButton.textContent = "Ajánlatkérés rögzítve";
  quoteButton.disabled = true;
  quoteButton.classList.add("is-done");
});

updateSection("maintenance");
