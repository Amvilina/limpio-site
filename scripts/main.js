const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

const tween = (from, to, duration, onFrame) =>
  new Promise((resolve) => {
    const start = performance.now();
    const ease = (t) => 1 - (1 - t) ** 3;

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      onFrame(from + (to - from) * ease(t));
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    };

    requestAnimationFrame(step);
  });

document.querySelectorAll("[data-compare]").forEach((stage, index) => {
  const range = stage.querySelector(".compare__range");
  const before = stage.querySelector(".compare__before");
  const handle = stage.querySelector(".compare__handle");

  if (!range || !before || !handle) return;

  let locked = false;

  const paint = (value) => {
    const percent = Math.min(100, Math.max(0, Number(value)));
    before.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
    handle.style.left = `${percent}%`;
    range.value = String(percent);
  };

  const fromPointer = (event) => {
    const rect = stage.getBoundingClientRect();
    paint(((event.clientX - rect.left) / rect.width) * 100);
  };

  range.addEventListener("input", () => paint(range.value));

  stage.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    locked = true;
    stage.setPointerCapture(event.pointerId);
    fromPointer(event);
  });

  stage.addEventListener("pointermove", (event) => {
    if (!stage.hasPointerCapture(event.pointerId)) return;
    fromPointer(event);
  });

  paint(100);

  const figure = stage.closest(".compare") ?? stage;

  if (reduce.matches) {
    figure.classList.add("is-in");
    paint(50);
    return;
  }

  const play = async () => {
    figure.classList.add("is-in");
    if (locked) return;
    await new Promise((r) => setTimeout(r, 620 + 90 * index));
    if (locked) return;
    await tween(100, 8, 1100, (v) => {
      if (!locked) paint(v);
    });
    if (locked) return;
    await new Promise((r) => setTimeout(r, 280));
    if (locked) return;
    await tween(8, 50, 900, (v) => {
      if (!locked) paint(v);
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      play();
    },
    { threshold: 0.4, rootMargin: "0px 0px -12% 0px" }
  );

  io.observe(figure);
});
