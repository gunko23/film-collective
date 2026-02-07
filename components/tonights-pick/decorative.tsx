import { C, GRAIN_SVG } from "./constants"

export function GrainOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9998,
        opacity: 0.4,
        mixBlendMode: "overlay",
        backgroundImage: GRAIN_SVG,
        backgroundRepeat: "repeat",
      }}
      aria-hidden="true"
    />
  )
}

export function LightLeaks() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} aria-hidden="true">
      {/* Blue glow - top left */}
      <div
        style={{
          position: "absolute",
          top: -80,
          left: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.blueGlow}, transparent 70%)`,
          filter: "blur(65px)",
        }}
      />
      {/* Orange glow - bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: -80,
          right: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.orangeGlow}, transparent 70%)`,
          filter: "blur(65px)",
        }}
      />
    </div>
  )
}
