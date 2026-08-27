import Image from "next/image";

// public/logo.png is a reconstructed asset - the original upload
// (public/logo.jpeg) had no real alpha channel and a checkerboard
// "transparency preview" pattern baked into the pixels by whatever tool
// exported it, both smeared together by JPEG compression. It's rebuilt
// from that file (blur to kill the fine checker noise without losing the
// silhouette, then threshold) into a proper white-on-transparent PNG. A
// dark badge behind it (not a white one) is what makes it read clearly on
// both the dark sidebar and the light login screen.
export default function Logo({ size = 36, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-[#0f172a] shadow-sm ${animate ? "animate-logo-float" : ""}`}
      style={{ width: size, height: size, padding: size * 0.16 }}
    >
      <Image
        src="/logo.png"
        alt="Spider Hub"
        width={size}
        height={size}
        className="h-full w-full object-contain"
        priority
      />
    </span>
  );
}
