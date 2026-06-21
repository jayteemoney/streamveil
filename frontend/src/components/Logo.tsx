export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span
      className="relative grid place-items-center rounded-xl"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, var(--color-accent), var(--color-accent2))",
        boxShadow: "0 8px 24px -8px rgba(124,92,255,0.7)",
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path
          d="M4 8c4-3 12 3 16 0M4 14c4-3 12 3 16 0M4 20c4-3 12 3 16 0"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.95"
        />
      </svg>
    </span>
  );
}
