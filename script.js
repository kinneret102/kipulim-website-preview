const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");

menuToggle?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

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
    ".micro, h2, h3, p, li, blockquote, summary, .button, .text-link",
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

  processSteps.forEach((item) => item.classList.remove("active"));

  if (shouldOpen) {
    step.classList.add("active");
  }

  if (processCurrentNumber) processCurrentNumber.textContent = shouldOpen ? step.dataset.step || "" : "";
  if (processCurrentTitle) processCurrentTitle.textContent = shouldOpen ? step.dataset.title || "" : "";
};

processSteps.forEach((step) => {
  step.addEventListener("click", () => activateProcessStep(step));
  step.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    activateProcessStep(step);
  });
});

const videoCarousel = document.querySelector(".video-carousel");
const videoTrack = document.querySelector(".video-track");
const logoTrack = document.querySelector(".logo-track");

if (videoCarousel && videoTrack) {
  [...videoTrack.children].forEach((item) => {
    const clone = item.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
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
}

if (logoTrack) {
  [...logoTrack.children].forEach((item) => {
    const clone = item.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    logoTrack.appendChild(clone);
  });
}
