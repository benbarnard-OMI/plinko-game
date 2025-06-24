import confetti from 'canvas-confetti';

export function fireworkSmall(target: HTMLElement) {
  confetti({
    particleCount: 40,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#ffec3d', '#ff4d4f', '#40a9ff', '#73d13d'],
    scalar: 0.7,
    zIndex: 9999,
  });
}

export function fireworkJackpot(target: HTMLElement) {
  // Burst from center, more particles, multiple bursts
  confetti({
    particleCount: 120,
    spread: 120,
    startVelocity: 50,
    origin: { y: 0.6 },
    colors: ['#ffd700', '#ff4d4f', '#40a9ff', '#73d13d', '#fff'],
    scalar: 1.2,
    zIndex: 9999,
  });
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 180,
      startVelocity: 60,
      origin: { y: 0.5 },
      colors: ['#ffd700', '#fff', '#ffec3d'],
      scalar: 1.5,
      zIndex: 9999,
    });
  }, 350);
}
