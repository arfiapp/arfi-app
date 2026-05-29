type Props = {
  rate: string;
  loading?: boolean;
  error?: string | null;
};

export function PriceInfo({ rate, loading, error }: Props) {
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-white/5 px-4 py-2.5 text-sm text-textSecondary">
        Calculating rate...
      </div>
    );
  }

  if (!rate) return null;

  return (
    <div className="rounded-xl border border-border bg-white/5 px-4 py-2.5 text-sm text-textSecondary">
      <span className="text-textPrimary">{rate}</span>
    </div>
  );
}
