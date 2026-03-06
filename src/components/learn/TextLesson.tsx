type TextLessonProps = {
  content: string;
};

function renderBlock(block: string, index: number) {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  if (lines.every((line) => /^[-*]\s+/.test(line))) {
    return (
      <ul key={index} className="space-y-3 pl-5 text-base leading-7 text-brand-muted">
        {lines.map((line) => (
          <li key={line} className="list-disc text-pretty">
            {line.replace(/^[-*]\s+/, "")}
          </li>
        ))}
      </ul>
    );
  }

  if (lines.every((line) => /^\d+\.\s+/.test(line))) {
    return (
      <ol key={index} className="space-y-3 pl-5 text-base leading-7 text-brand-muted">
        {lines.map((line) => (
          <li key={line} className="list-decimal text-pretty">
            {line.replace(/^\d+\.\s+/, "")}
          </li>
        ))}
      </ol>
    );
  }

  if (lines.length === 1 && lines[0].startsWith("## ")) {
    return (
      <h3 key={index} className="text-balance text-xl font-semibold text-brand-secondary">
        {lines[0].replace(/^##\s+/, "")}
      </h3>
    );
  }

  if (lines.length === 1 && lines[0].startsWith("# ")) {
    return (
      <h2 key={index} className="text-balance text-2xl font-bold text-brand-secondary">
        {lines[0].replace(/^#\s+/, "")}
      </h2>
    );
  }

  return (
    <p key={index} className="text-pretty whitespace-pre-wrap text-base leading-7 text-brand-muted">
      {lines.join("\n")}
    </p>
  );
}

export function TextLesson({ content }: TextLessonProps) {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <article className="rounded-3xl border border-brand-border bg-brand-surface p-6 sm:p-8">
      <div className="space-y-6">
        {blocks.map((block, index) => renderBlock(block, index))}
      </div>
    </article>
  );
}
