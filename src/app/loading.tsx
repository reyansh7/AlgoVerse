export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="h-16 w-16 animate-pulse rounded-full bg-accent/20" />
        <div className="absolute inset-2 animate-spin rounded-full border border-transparent border-t-accent" />
      </div>
      <div className="font-display text-2xl font-semibold tracking-tight text-gradient">
        AlgoVerse
      </div>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-accent" />
      </div>
    </div>
  );
}
