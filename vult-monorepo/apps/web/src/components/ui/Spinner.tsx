export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse-soft rounded-md bg-surface-hover ${className}`} />;
}
