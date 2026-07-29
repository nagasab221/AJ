/**
 * Small inline flags for the language switcher. Drawn rather than imported so
 * they cost no request and inherit the rounded treatment of the button.
 */
type Props = { className?: string };

/** United Arab Emirates, for the Arabic option. */
export function FlagAE({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      role="img"
      aria-label="العربية"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="24" height="16" fill="#fff" />
      <rect x="6" width="18" height="5.34" fill="#00732F" />
      <rect x="6" y="10.66" width="18" height="5.34" fill="#000" />
      <rect width="6" height="16" fill="#FF0000" />
    </svg>
  );
}

/** United States, for the English option. */
export function FlagUS({ className }: Props) {
  const stripes = Array.from({ length: 7 }, (_, i) => i * 2.462);
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      role="img"
      aria-label="English"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="24" height="16" fill="#fff" />
      {stripes.map((y) => (
        <rect key={y} y={y} width="24" height="1.231" fill="#B22234" />
      ))}
      <rect width="10.2" height="8.62" fill="#3C3B6E" />
      {/* Suggestion of a star field; individual stars are illegible at this size. */}
      {[1.6, 4.0, 6.4, 8.8].map((x) =>
        [1.5, 4.3, 7.1].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.62" fill="#fff" />
        ))
      )}
    </svg>
  );
}
