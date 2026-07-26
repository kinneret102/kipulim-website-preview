const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");

menuToggle?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));

  if (isOpen) {
    header.querySelector(".main-nav a")?.focus();
  }
});

document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

const accessibilityToggle = document.querySelector("[data-accessibility-toggle]");
const accessibilityPanel = document.querySelector("#accessibility-panel");
const accessibilityClose = document.querySelector("[data-accessibility-close]");
const accessibilityButtons = document.querySelectorAll("[data-accessibility-action]");
const accessibilityStorageKey = "kipulim-accessibility";
const accessibilityClassMap = {
  font: "a11y-font-large",
  contrast: "a11y-contrast",
  links: "a11y-links",
  spacing: "a11y-spacing",
  motion: "a11y-reduced-motion",
};

const getAccessibilityState = () => {
  try {
    return JSON.parse(window.localStorage?.getItem(accessibilityStorageKey)) || {};
  } catch {
    return {};
  }
};

let accessibilityState = getAccessibilityState();

const syncAccessibilityButtons = () => {
  accessibilityButtons.forEach((button) => {
    const action = button.dataset.accessibilityAction;
    const isActive = Boolean(accessibilityState[action]);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", action === "reset" ? "false" : String(isActive));
  });
};

const applyAccessibilityState = () => {
  Object.entries(accessibilityClassMap).forEach(([key, className]) => {
    document.body.classList.toggle(className, Boolean(accessibilityState[key]));
  });

  try {
    window.localStorage?.setItem(accessibilityStorageKey, JSON.stringify(accessibilityState));
  } catch {
    // Browsers can block storage in private or restricted contexts.
  }
  syncAccessibilityButtons();
};

const setAccessibilityPanel = (isOpen) => {
  if (!accessibilityToggle || !accessibilityPanel) return;

  accessibilityPanel.hidden = !isOpen;
  accessibilityToggle.setAttribute("aria-expanded", String(isOpen));
};

accessibilityToggle?.addEventListener("click", () => {
  setAccessibilityPanel(accessibilityPanel?.hidden ?? true);
});

accessibilityClose?.addEventListener("click", () => {
  setAccessibilityPanel(false);
  accessibilityToggle?.focus();
});

accessibilityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.accessibilityAction;

    if (action === "reset") {
      accessibilityState = {};
    } else if (action) {
      accessibilityState[action] = !accessibilityState[action];
    }

    applyAccessibilityState();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setAccessibilityPanel(false);
    if (header.classList.contains("is-open")) {
      header.classList.remove("is-open");
      menuToggle?.setAttribute("aria-expanded", "false");
      menuToggle?.focus();
    }
  }
});

applyAccessibilityState();

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const heroVideo = document.querySelector(".hero-media");
const heroSound = document.querySelector("[data-hero-sound]");

if (heroVideo) {
  heroVideo.muted = true;
  heroVideo.defaultMuted = true;
  heroVideo.loop = true;
  heroVideo.playsInline = true;
  heroVideo.play().catch(() => {});
  heroVideo.addEventListener("loadeddata", () => heroVideo.play().catch(() => {}), { once: true });
}

if (heroVideo && heroSound) {
  let heroSoundEnabled = false;

  const setHeroSound = (enabled) => {
    heroSoundEnabled = enabled;
    heroVideo.muted = !enabled;
    heroSound.classList.toggle("is-on", enabled);
    heroSound.setAttribute("aria-pressed", String(enabled));
    heroSound.setAttribute(
      "aria-label",
      enabled ? "כיבוי סאונד" : "הפעלת סאונד",
    );
    heroVideo.play().catch(() => {});
  };

  heroSound.addEventListener("click", () => {
    if (heroSoundEnabled && heroVideo.paused) {
      heroVideo.play().catch(() => {});
      heroSound.setAttribute("aria-label", "כיבוי סאונד");
      return;
    }

    setHeroSound(!heroSoundEnabled);
  });

  setHeroSound(false);
}

const revealObserver = prefersReducedMotion
  ? null
  : new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );

document.querySelectorAll("main section:not(.hero)").forEach((section) => {
  const revealItems = section.querySelectorAll(
    ".micro, h2, h3, p, li, blockquote, summary, .button, .text-link, .process-step-heading, .process-step-panel",
  );

  revealItems.forEach((item, index) => {
    item.classList.add("reveal");
    item.style.setProperty("--reveal-delay", `${Math.min(index * 35, 280)}ms`);

    if (prefersReducedMotion) {
      item.classList.add("is-visible");
      return;
    }

    revealObserver.observe(item);
  });
});

const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.querySelectorAll("[data-count]").forEach((number) => {
        const target = Number(number.dataset.count || 0);
        const suffix = number.dataset.suffix || "";
        const duration = prefersReducedMotion ? 0 : 1200;
        const startTime = performance.now();

        const update = (now) => {
          const progress = duration ? Math.min((now - startTime) / duration, 1) : 1;
          const eased = 1 - Math.pow(1 - progress, 4);
          const value = Math.round(target * eased);
          number.innerHTML = suffix ? `${value}<span>${suffix}</span>` : `${value}`;

          if (progress < 1) {
            requestAnimationFrame(update);
          }
        };

        requestAnimationFrame(update);
      });

      statsObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.4 },
);

const statsSection = document.querySelector(".stats");
if (statsSection) {
  statsObserver.observe(statsSection);
}

const processCurrentNumber = document.querySelector(".process-current strong");
const processCurrentTitle = document.querySelector(".process-current span");
const processSteps = document.querySelectorAll(".process-step");

const activateProcessStep = (step) => {
  const shouldOpen = !step.classList.contains("active");

  processSteps.forEach((item) => {
    item.classList.remove("active");
    const button = item.querySelector(".process-step-button");
    const panel = item.querySelector(".process-step-panel");
    button?.setAttribute("aria-expanded", "false");
    if (panel) panel.hidden = true;
  });

  if (shouldOpen) {
    step.classList.add("active");
  }

  const button = step.querySelector(".process-step-button");
  const panel = step.querySelector(".process-step-panel");
  button?.setAttribute("aria-expanded", String(shouldOpen));
  if (panel) panel.hidden = !shouldOpen;

  if (processCurrentNumber) processCurrentNumber.textContent = shouldOpen ? step.dataset.step || "" : "";
  if (processCurrentTitle) processCurrentTitle.textContent = shouldOpen ? step.dataset.title || "" : "";
};

processSteps.forEach((step) => {
  const button = step.querySelector(".process-step-button");
  button?.addEventListener("click", () => activateProcessStep(step));
});

const videoCarousel = document.querySelector(".video-carousel");
const videoTrack = document.querySelector(".video-track");
const logoTrack = document.querySelector(".logo-track");
const videoCarouselToggle = document.querySelector('[data-carousel-toggle="videos"]');
const logoCarouselToggle = document.querySelector('[data-carousel-toggle="logos"]');

if (videoCarousel && videoTrack) {
  [...videoTrack.children].forEach((item) => {
    const clone = item.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("video").forEach((video) => {
      video.removeAttribute("controls");
      video.setAttribute("tabindex", "-1");
      video.removeAttribute("aria-describedby");
    });
    videoTrack.appendChild(clone);
  });

  const videos = videoTrack.querySelectorAll("video");

  const playMutedLoop = (video) => {
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.play().catch(() => {});
  };

  videos.forEach(playMutedLoop);

  const activateVideo = (video) => {
    videoCarousel.classList.add("is-paused");
    videos.forEach((item) => {
      if (item === video) return;
      item.muted = true;
      item.pause();
    });

    video.loop = true;
    video.playsInline = true;

    if (!video.paused) {
      video.muted = false;
      return;
    }

    video.muted = true;
    video.play()
      .then(() => {
        if (activeHoverVideo === video) {
          video.muted = false;
        }
      })
      .catch(() => {
        if (activeHoverVideo === video) {
          video.muted = false;
        }
      });
  };

  const restoreCarousel = () => {
    if (videoCarousel.classList.contains("is-user-paused")) return;
    activeHoverVideo = null;
    videoCarousel.classList.remove("is-paused");
    videos.forEach(playMutedLoop);
  };

  let activeHoverVideo = null;

  const findVideoTarget = (event) => {
    const target = event.target;
    return target instanceof Element ? target.closest("video") : null;
  };

  const handleCarouselOver = (event) => {
    const video = findVideoTarget(event);
    if (!video || video === activeHoverVideo) return;
    activeHoverVideo = video;
    activateVideo(video);
  };

  const activateVideoAtPoint = (event) => {
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const video = target instanceof Element ? target.closest(".video-track video") : null;
    if (video && video !== activeHoverVideo) {
      activeHoverVideo = video;
      activateVideo(video);
    }
  };

  videoCarousel.addEventListener("mouseover", handleCarouselOver);
  videoCarousel.addEventListener("pointerover", handleCarouselOver);
  videoCarousel.addEventListener("mousemove", activateVideoAtPoint);
  videoCarousel.addEventListener("pointermove", activateVideoAtPoint);
  videoCarousel.addEventListener("mouseleave", restoreCarousel);
  videoCarousel.addEventListener("pointerleave", restoreCarousel);

  videos.forEach((video) => {
    video.addEventListener("mouseenter", () => activateVideo(video));
    video.addEventListener("pointerenter", () => activateVideo(video));
    video.addEventListener("focus", () => activateVideo(video));
    video.addEventListener("blur", restoreCarousel);
  });

  videoCarouselToggle?.addEventListener("click", () => {
    const shouldPause = !videoCarousel.classList.contains("is-user-paused");
    videoCarousel.classList.toggle("is-user-paused", shouldPause);
    videoCarousel.classList.toggle("is-paused", shouldPause);
    videoCarouselToggle.setAttribute("aria-pressed", String(shouldPause));
    videoCarouselToggle.textContent = shouldPause ? "הפעלת סרטונים" : "עצירת סרטונים";

    if (shouldPause) {
      videos.forEach((video) => {
        video.muted = true;
        video.pause();
      });
    } else {
      restoreCarousel();
    }
  });
}

if (logoTrack) {
  [...logoTrack.children].forEach((item) => {
    const clone = item.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    logoTrack.appendChild(clone);
  });

  logoCarouselToggle?.addEventListener("click", () => {
    const logoStrip = logoTrack.closest(".logo-strip");
    const shouldPause = !logoStrip?.classList.contains("is-paused");
    logoStrip?.classList.toggle("is-paused", shouldPause);
    logoCarouselToggle.setAttribute("aria-pressed", String(shouldPause));
    logoCarouselToggle.textContent = shouldPause ? "הפעלת לוגואים" : "עצירת לוגואים";
  });
}
