import type { ReactNode } from "react";

// Panelde düzenlenen basit metin biçimi:
//   ## Başlık   ### Alt başlık   - liste öğesi   boş satır = yeni paragraf
//   [[doldurulacak alan]] sarı vurguyla gösterilir.
// HTML kabul edilmez; her şey metin olarak işlenir.

function inline(text: string): ReactNode[] {
  return text.split(/(\[\[[^\]]+\]\])/g).map((part, i) =>
    part.startsWith("[[") && part.endsWith("]]") ? (
      <mark key={i} title="İşletme tarafından doldurulmalı">
        {part.slice(2, -2)}
      </mark>
    ) : (
      part
    ),
  );
}

export function RichText({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const out: ReactNode[] = [];
  blocks.forEach((block, bi) => {
    const lines = block.split("\n").filter((l) => l.trim());
    let list: string[] = [];
    const flush = (key: string) => {
      if (list.length) {
        out.push(
          <ul key={key}>
            {list.map((item, i) => (
              <li key={i}>{inline(item)}</li>
            ))}
          </ul>,
        );
        list = [];
      }
    };
    let para: string[] = [];
    const flushPara = (key: string) => {
      if (para.length) {
        out.push(<p key={key}>{inline(para.join(" "))}</p>);
        para = [];
      }
    };
    lines.forEach((line, li) => {
      const key = `${bi}-${li}`;
      if (line.startsWith("## ")) {
        flush(`${key}-l`);
        flushPara(`${key}-p`);
        out.push(<h2 key={key}>{inline(line.slice(3))}</h2>);
      } else if (line.startsWith("### ")) {
        flush(`${key}-l`);
        flushPara(`${key}-p`);
        out.push(<h3 key={key}>{inline(line.slice(4))}</h3>);
      } else if (/^[-•]\s/.test(line)) {
        flushPara(`${key}-p`);
        list.push(line.slice(2));
      } else {
        flush(`${key}-l`);
        para.push(line);
      }
    });
    flush(`${bi}-end-l`);
    flushPara(`${bi}-end-p`);
  });
  return <div className="prose-content">{out}</div>;
}
