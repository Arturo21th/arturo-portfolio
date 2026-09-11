const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
const parallax = document.querySelector("[data-parallax]");
root.classList.add("can-reveal");

function updateScrollEffects() {
  const max = Math.max(1, root.scrollHeight - innerHeight);
  const progress = scrollY / max;
  root.style.setProperty("--scroll", progress.toFixed(4));

  if (parallax && !reduceMotion) {
    const box = parallax.getBoundingClientRect();
    const offset = Math.max(-28, Math.min(28, box.top * -0.035));
    root.style.setProperty("--parallax", offset.toFixed(2));
  }
}

addEventListener("scroll", () => requestAnimationFrame(updateScrollEffects), { passive: true });
addEventListener("resize", updateScrollEffects);
updateScrollEffects();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { rootMargin: "0px 0px 18% 0px", threshold: 0.01 }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

if (!reduceMotion) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      if (innerWidth < 760) return;
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${y * -5}deg) rotateY(${x * 7}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

const canvas = document.getElementById("network");
const context = canvas.getContext("2d");
let width = 0;
let height = 0;
let points = [];
let mouse = { x: 0, y: 0 };

function resize() {
  width = canvas.width = innerWidth * devicePixelRatio;
  height = canvas.height = innerHeight * devicePixelRatio;
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  points = Array.from({ length: Math.min(32, Math.floor(innerWidth / 46)) }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.28 * devicePixelRatio,
    vy: (Math.random() - 0.5) * 0.28 * devicePixelRatio
  }));
}

addEventListener("resize", resize);
addEventListener("pointermove", (event) => {
  mouse = { x: event.clientX * devicePixelRatio, y: event.clientY * devicePixelRatio };
});

function draw() {
  context.clearRect(0, 0, width, height);
  context.lineWidth = devicePixelRatio;

  for (const point of points) {
    point.x = (point.x + point.vx + width) % width;
    point.y = (point.y + point.vy + height) % height;

    const dx = mouse.x - point.x;
    const dy = mouse.y - point.y;
    const pull = Math.max(0, 1 - Math.hypot(dx, dy) / (240 * devicePixelRatio));
    point.x -= dx * pull * 0.002;
    point.y -= dy * pull * 0.002;
  }

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const a = points[i];
      const b = points[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance > 130 * devicePixelRatio) continue;
      context.strokeStyle = `rgba(22, 122, 74, ${0.06 * (1 - distance / (130 * devicePixelRatio))})`;
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.stroke();
    }
  }

  context.fillStyle = "rgba(22, 122, 74, 0.32)";
  for (const point of points) {
    context.beginPath();
    context.arc(point.x, point.y, 1.5 * devicePixelRatio, 0, Math.PI * 2);
    context.fill();
  }

  requestAnimationFrame(draw);
}

resize();
if (!reduceMotion) draw();
