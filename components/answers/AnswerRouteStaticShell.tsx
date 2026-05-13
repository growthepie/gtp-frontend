// Server Component that emits a static, SEO-only article shell for
// /answers/[slug]. Headings, prose, and FAQ live in parse-time HTML so non-JS
// AI crawlers (GPTBot, ClaudeBot, PerplexityBot) can read the answer despite
// the visual UI being React-rendered. Visually hidden via sr-only style +
// aria-hidden so sighted/AT users see only the interactive UI.
//
// Differences vs the Quick Bite shell:
//   - QAPage / Question / Answer microdata (matches the JSON-LD QAPage)
//   - Direct accepted-answer paragraph at the top, tagged as itemProp="text"
//     and as `abstract` for AI consumers that prefer that signal
//   - No date rendering — answer pages are evergreen

import { headers } from 'next/headers';
import Link from 'next/link';
import { processAnswer } from '@/lib/answers/articleProcessor';

const ANSWER_RE = /^\/answers\/([^/?#]+)\/?$/;

const SR_ONLY: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export default async function AnswerRouteStaticShell() {
  const h = await headers();
  const pathname = h.get('x-pathname') || '';
  const m = pathname.match(ANSWER_RE);
  if (!m) return null;
  const slug = decodeURIComponent(m[1]);
  if (slug === 'index') return null;

  let processed;
  try {
    processed = await processAnswer(slug);
  } catch (e) {
    console.error(`AnswerRouteStaticShell failed for "${slug}":`, e);
    return null;
  }
  if (!processed) return null;

  const { qb, prose, faq, acceptedAnswer } = processed;
  const siteUrl = 'https://www.growthepie.com';
  const canonical = `${siteUrl}/answers/${slug}`;
  // Stable per-UTC-day timestamp so AI crawlers see consistent freshness
  // signals across hits within the same day.
  const todayUtcDate = new Date().toISOString().slice(0, 10);
  const todayUtcIso = `${todayUtcDate}T00:00:00Z`;

  // Skip the first prose paragraph in the body section so the accepted answer
  // isn't duplicated immediately below the Question/Answer block.
  const firstParaIndex = prose.findIndex(
    (c) => c.tag === 'p' && c.text.trim().length > 0,
  );
  const bodyChunks =
    firstParaIndex === -1
      ? prose
      : [...prose.slice(0, firstParaIndex), ...prose.slice(firstParaIndex + 1)];

  return (
    <div
      id="answer-static-shell"
      aria-hidden="true"
      style={SR_ONLY}
      data-prerender="answer"
    >
      <nav aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/answers">Answers</Link>
          </li>
          <li>{qb.title}</li>
        </ol>
      </nav>

      <article itemScope itemType="https://schema.org/QAPage">
        {/* Page-level freshness — answer pages refresh daily from the API. */}
        <meta itemProp="dateModified" content={todayUtcIso} />
        {qb.date && <meta itemProp="datePublished" content={qb.date} />}

        <div
          itemProp="mainEntity"
          itemScope
          itemType="https://schema.org/Question"
        >
          <h1 itemProp="name">{qb.title}</h1>
          <meta itemProp="text" content={qb.title} />
          <meta itemProp="answerCount" content="1" />
          {qb.date && <meta itemProp="dateCreated" content={qb.date} />}
          <meta itemProp="dateModified" content={todayUtcIso} />
          {qb.author && qb.author.length > 0 && (
            <div itemProp="author" itemScope itemType="https://schema.org/Person">
              <meta itemProp="name" content={qb.author.map((a) => a.name).join(', ')} />
            </div>
          )}

          {qb.subtitle && (
            <p className="quickbite-deck" itemProp="abstract">
              {qb.subtitle}
            </p>
          )}

          {acceptedAnswer && (
            <div
              itemProp="acceptedAnswer"
              itemScope
              itemType="https://schema.org/Answer"
            >
              <p itemProp="text">{acceptedAnswer}</p>
              <link itemProp="url" href={canonical} />
              {qb.date && <meta itemProp="dateCreated" content={qb.date} />}
              <meta itemProp="dateModified" content={todayUtcIso} />
              {qb.author && qb.author.length > 0 && (
                <div itemProp="author" itemScope itemType="https://schema.org/Organization">
                  <meta itemProp="name" content={qb.author.map((a) => a.name).join(', ')} />
                </div>
              )}
            </div>
          )}
        </div>

        <p>
          <Link href={canonical} rel="canonical">
            Read on growthepie
          </Link>
          {' · '}
          <span>
            Updated daily (last refresh:{' '}
            <time dateTime={todayUtcIso}>{todayUtcDate}</time>)
          </span>
        </p>

        {bodyChunks.length > 0 && (
          <section className="quickbite-prose">{renderProse(bodyChunks)}</section>
        )}

        {faq && faq.length > 0 && (
          <section aria-label="Frequently asked questions">
            <h2>Frequently asked questions</h2>
            <dl>
              {faq.map((item, i) => (
                <div key={i}>
                  <dt>
                    <h3>{item.q}</h3>
                  </dt>
                  <dd>
                    <p>{item.a}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {qb.topics && qb.topics.length > 0 && (
          <section aria-label="Topics discussed">
            <h2>Topics discussed</h2>
            <ul>
              {qb.topics.map((t, i) => (
                <li key={i}>
                  {t.url ? <Link href={t.url}>{t.name}</Link> : t.name}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}

function renderProse(chunks: { tag: 'h2' | 'h3' | 'h4' | 'p' | 'li'; text: string }[]) {
  const out: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    out.push(
      <ul key={`ul-${key++}`}>
        {listBuffer.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  };

  for (const c of chunks) {
    if (c.tag === 'li') {
      listBuffer.push(c.text);
      continue;
    }
    flushList();
    if (c.tag === 'h2') out.push(<h2 key={`k-${key++}`}>{c.text}</h2>);
    else if (c.tag === 'h3') out.push(<h3 key={`k-${key++}`}>{c.text}</h3>);
    else if (c.tag === 'h4') out.push(<h4 key={`k-${key++}`}>{c.text}</h4>);
    else out.push(<p key={`k-${key++}`}>{c.text}</p>);
  }
  flushList();
  return out;
}
