"use client";

type Props = {
  connected: boolean;
  loading: boolean;
  disabled: boolean;
  onSwap: () => void;
};

export function SwapButton({ connected, loading, disabled, onSwap }: Props) {
  if (!connected) {
    return (
      <button type="button" disabled className="swap-cta w-full cursor-not-allowed opacity-50">
        Swap
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSwap}
      disabled={disabled || loading}
      className="swap-cta w-full disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Swapping..." : "Swap"}
    </button>
  );
}
