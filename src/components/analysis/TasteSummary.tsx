interface TasteItem {
  label: string;
  title: string;
  imageUrl?: string;
}

interface TasteSummaryProps {
  items: TasteItem[];
}

export default function TasteSummary({ items }: TasteSummaryProps) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-xl p-4 flex items-center gap-4 transition-all hover:bg-zinc-800/60 hover:border-zinc-700/50"
        >
          {item.imageUrl && (
            <div
              className="w-12 h-12 rounded-lg flex-shrink-0 bg-cover bg-center bg-zinc-800"
              style={{ backgroundImage: `url('${item.imageUrl}')` }}
            />
          )}
          <div>
            <div className="text-xs text-zinc-500">{item.label}</div>
            <div className="font-semibold mt-0.5">{item.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
