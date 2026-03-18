interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export default function Chip({ label, active = false, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-full text-sm font-medium transition ${
        active
          ? 'bg-white text-black hover:bg-zinc-200'
          : 'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 text-zinc-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}
