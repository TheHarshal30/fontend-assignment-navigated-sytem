// Converts media/demo.webm (produced by record.mjs) into a tight GIF and an MP4
// suitable for embedding in the README. The webm is removed afterward.
import { execFileSync } from "child_process";
import { existsSync, rmSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ffmpeg from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WEBM = path.join(ROOT, "media", "demo.webm");
const PALETTE = path.join(ROOT, "media", "_palette.png");
const GIF = path.join(ROOT, "media", "demo.gif");
const MP4 = path.join(ROOT, "media", "demo.mp4");

if (!existsSync(WEBM)) {
  console.error(`Missing ${WEBM}. Run \`pnpm record\` first.`);
  process.exit(1);
}

function run(args) {
  execFileSync(ffmpeg, args, { stdio: ["ignore", "ignore", "inherit"] });
}

console.log("→ building palette");
run([
  "-y",
  "-i",
  WEBM,
  "-vf",
  "fps=12,scale=760:-1:flags=lanczos,palettegen=max_colors=128:stats_mode=diff",
  PALETTE,
]);

console.log("→ encoding GIF");
run([
  "-y",
  "-i",
  WEBM,
  "-i",
  PALETTE,
  "-lavfi",
  "fps=12,scale=760:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle",
  GIF,
]);

console.log("→ encoding MP4");
run([
  "-y",
  "-i",
  WEBM,
  "-movflags",
  "+faststart",
  "-pix_fmt",
  "yuv420p",
  "-c:v",
  "libx264",
  "-crf",
  "22",
  "-preset",
  "slow",
  "-vf",
  "scale=1280:-2",
  MP4,
]);

rmSync(PALETTE, { force: true });
rmSync(WEBM, { force: true });
console.log("✓ media/demo.gif and media/demo.mp4 ready");
