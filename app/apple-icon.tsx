import { ImageResponse } from "next/og";

/**
 * Ícono para iOS (fase QA — SEO). Mismo criterio que `icon.tsx` a 180×180,
 * sin bordes redondeados (iOS aplica su propia máscara).
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#101B45",
      }}
    >
      <div
        style={{
          width: 92,
          height: 92,
          borderRadius: 20,
          background: "#F9750D",
        }}
      />
    </div>,
    size,
  );
}
