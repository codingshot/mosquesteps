import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  speedX: number;
  speedY: number;
  rotationSpeed: number;
  opacity: number;
  shape: "circle" | "square" | "star";
}

const COLORS = [
  "hsl(39, 95%, 55%)", // gold
  "hsl(39, 95%, 40%)", // dark gold
  "hsl(174, 72%, 30%)", // teal
  "hsl(174, 72%, 45%)", // light teal
  "hsl(45, 100%, 60%)", // bright yellow
  "hsl(0, 0%, 100%)", // white
];

export default function Confetti({ duration = 3000 }: { duration?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const initial: Particle[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 8,
      rotation: Math.random() * 360,
      speedX: (Math.random() - 0.5) * 3,
      speedY: 2 + Math.random() * 4,
      rotationSpeed: (Math.random() - 0.5) * 15,
      opacity: 1,
      shape: (["circle", "square", "star"] as const)[Math.floor(Math.random() * 3)],
    }));
    setParticles(initial);

    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.shape === "circle" ? p.size : p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "star" ? "2px" : "1px",
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1.5 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}
