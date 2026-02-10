/**
 * Social sharing card generator
 * Creates shareable achievement images using Canvas API
 */

export interface ShareCardData {
  title: string;
  subtitle: string;
  stats: { label: string; value: string }[];
  hadith?: string;
  type: "walk" | "badge" | "streak" | "weekly";
}

export async function generateShareCard(data: ShareCardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d")!;

  // Background gradient (teal)
  const bg = ctx.createLinearGradient(0, 0, 1080, 1080);
  bg.addColorStop(0, "#094D4F");
  bg.addColorStop(1, "#0D7377");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1080);

  // Decorative circles
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "#FABB51";
  ctx.beginPath();
  ctx.arc(900, 150, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(180, 900, 250, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Gold accent bar
  const goldGrad = ctx.createLinearGradient(0, 0, 400, 0);
  goldGrad.addColorStop(0, "#FABB51");
  goldGrad.addColorStop(1, "#C78B08");
  ctx.fillStyle = goldGrad;
  ctx.fillRect(80, 120, 120, 4);

  // App name
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "600 24px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText("MosqueSteps", 80, 110);

  // Mosque emoji
  ctx.font = "80px sans-serif";
  ctx.fillText("🕌", 80, 260);

  // Title
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 52px 'Plus Jakarta Sans', system-ui, sans-serif";
  wrapText(ctx, data.title, 80, 340, 920, 60);

  // Subtitle
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "400 28px 'Plus Jakarta Sans', system-ui, sans-serif";
  wrapText(ctx, data.subtitle, 80, 420, 920, 36);

  // Stats cards
  const startY = 520;
  const cardWidth = (1080 - 160 - (data.stats.length - 1) * 20) / Math.min(data.stats.length, 3);
  data.stats.forEach((stat, i) => {
    const x = 80 + i * (cardWidth + 20);
    // Card background
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    roundRect(ctx, x, startY, cardWidth, 160, 16);
    ctx.fill();

    // Value
    ctx.fillStyle = "#FABB51";
    ctx.font = "800 42px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(stat.value, x + cardWidth / 2, startY + 80);

    // Label
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "500 20px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText(stat.label, x + cardWidth / 2, startY + 120);
    ctx.textAlign = "left";
  });

  // Hadith quote
  if (data.hadith) {
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    roundRect(ctx, 80, 740, 920, 140, 16);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "italic 22px 'Plus Jakarta Sans', system-ui, sans-serif";
    wrapText(ctx, `"${data.hadith}"`, 110, 790, 860, 30);
  }

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "500 22px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText("mosquesteps.app • Every step is a blessing", 80, 1020);

  // Gold bottom accent
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, 1070, 1080, 10);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, currentY);
      line = word + " ";
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Share or download the card
 */
export async function shareOrDownload(blob: Blob, title: string): Promise<void> {
  const file = new File([blob], "mosquesteps-achievement.png", { type: "image/png" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: "MosqueSteps Achievement",
      text: title,
      files: [file],
    });
  } else {
    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mosquesteps-achievement.png";
    a.click();
    URL.revokeObjectURL(url);
  }
}
