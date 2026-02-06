export function LightLeaks() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      {/* Orange glow — top right */}
      <div
        className="absolute"
        style={{
          top: -80,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,107,45,0.14), transparent 70%)",
          filter: "blur(65px)",
        }}
      />
      {/* Blue glow — mid left */}
      <div
        className="absolute"
        style={{
          top: 380,
          left: -100,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(61,90,150,0.18), transparent 70%)",
          filter: "blur(65px)",
        }}
      />
      {/* Teal glow — bottom right (desktop) */}
      <div
        className="absolute hidden lg:block"
        style={{
          bottom: -100,
          right: -50,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(74,158,142,0.08), transparent 70%)",
          filter: "blur(80px)",
        }}
      />
    </div>
  )
}
