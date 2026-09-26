import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/siteConfig";

export const alt = `${SITE_NAME} — comunidad de fe y propósito`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "96px",
        background: "linear-gradient(135deg, #101B45 0%, #060A1D 100%)",
        color: "#F5F6FA",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "#F9750D",
          }}
        />
        <div
          style={{
            fontSize: 30,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#FCA355",
          }}
        >
          Iglesia
        </div>
      </div>
      <div
        style={{
          marginTop: 40,
          fontSize: 76,
          fontWeight: 700,
          lineHeight: 1.1,
          maxWidth: 900,
        }}
      >
        Una comunidad creciendo en fe y propósito
      </div>
      <div style={{ marginTop: 32, fontSize: 30, color: "#A6AEC7" }}>
        {SITE_NAME}
      </div>
    </div>,
    size,
  );
}
