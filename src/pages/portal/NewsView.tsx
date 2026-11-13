import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '../../components/Icon';
import { CODES, regionName } from '../../lib/countries';
import { formatDate, portalApi, PortalError, type GuideLink, type NewsFeed, type NewsItem } from './api';

const TOPIC_KEYS = {
  visa: 'po_news_topic_visa',
  study: 'po_news_topic_study',
  work: 'po_news_topic_work',
  travel: 'po_news_topic_travel',
  family: 'po_news_topic_family',
  fees: 'po_news_topic_fees',
  residence: 'po_news_topic_residence'
} as const;

const KIND_KEYS = {
  visa: 'po_news_kind_visa',
  immigration: 'po_news_kind_immigration',
  study: 'po_news_kind_study',
  travel: 'po_news_kind_travel'
} as const;

/** Opens an official article or site in a new tab (the reader stays in the app). */
const External: React.FC<{ href: string; children: React.ReactNode; className?: string }> = ({ href, children, className }) => (
  <a href={href} target='_blank' rel='noopener noreferrer' className={className}>
    {children}
  </a>
);

/** "3 h ago" / "il y a 3 h" for the last update of the news. */
function since(iso: string | null, lang: string): string | null {
  if (!iso) return null;
  const minutes = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60000));
  const rtf = new Intl.RelativeTimeFormat(lang === 'en' ? 'en' : 'fr', { numeric: 'auto' });
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  if (minutes < 48 * 60) return rtf.format(-Math.round(minutes / 60), 'hour');
  return rtf.format(-Math.round(minutes / 1440), 'day');
}

/** The article's own image (from the official site); hidden if it does not load. */
const NewsImage: React.FC<{ src: string; source: string; href: string }> = ({ src, source, href }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <a href={href} target='_blank' rel='noopener noreferrer' className='po-news__media' tabIndex={-1} aria-hidden='true'>
      <img src={src} alt='' loading='lazy' decoding='async' referrerPolicy='no-referrer' onError={() => setFailed(true)} />
      <span className='po-news__credit'>{source}</span>
    </a>
  );
};

/**
 * Official news for the member's destination: government sources only, a
 * short summary in their language and the link to the full article. Other
 * countries: their official websites, looked up once and shared.
 */
export const NewsView: React.FC<{ onPlans: () => void }> = ({ onPlans }) => {
  const { t, lang } = useLanguage();
  const [country, setCountry] = useState<string | null>(null);
  const [feed, setFeed] = useState<NewsFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guide, setGuide] = useState<GuideLink[] | null>(null);
  const [guideState, setGuideState] = useState<'idle' | 'busy' | 'locked' | 'limit' | 'none' | 'error'>('idle');
  const [other, setOther] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setGuide(null);
    setGuideState('idle');
    portalApi
      .news(country, lang)
      .then((f) => {
        if (!alive) return;
        setFeed(f);
        if (!country && f.country) setCountry(f.country);
        setGuide(f.guide && f.guide.length ? f.guide : null);
      })
      .catch((e) => alive && setError(e instanceof PortalError ? e.code : 'generic'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [country, lang]);

  const covered = feed?.covered ?? [];
  const chips = useMemo(() => {
    // The country of the member's dossier first, then the followed countries.
    const dossier = feed?.dossier_country;
    const list = dossier ? [dossier, ...covered.filter((c) => c !== dossier)] : [...covered];
    if (country && !list.includes(country)) list.push(country);
    return list;
  }, [covered, feed?.dossier_country, country]);
  const allCountries = useMemo(
    () => CODES.map((c) => ({ code: c, name: regionName(c, lang) })).sort((a, b) => a.name.localeCompare(b.name, lang)),
    [lang]
  );

  const isCovered = !!country && covered.includes(country);
  const updated = since(feed?.updated_at ?? null, lang);

  const patchItem = (id: string, patch: Partial<NewsItem>) =>
    setFeed((f) => (f ? { ...f, items: f.items.map((n) => (n.id === id ? { ...n, ...patch } : n)) } : f));

  const vote = async (n: NewsItem, helpful: boolean) => {
    const next = n.mine === helpful ? null : helpful;
    const before = { mine: n.mine, helpful: n.helpful };
    // Instant feedback, then the server's count.
    patchItem(n.id, { mine: next, helpful: n.helpful + (next === true ? 1 : 0) - (n.mine === true ? 1 : 0) });
    try {
      const out = await portalApi.newsReact(n.id, next);
      patchItem(n.id, { mine: out.mine, helpful: out.helpful });
    } catch {
      patchItem(n.id, before);
    }
  };

  const opened = (n: NewsItem) => {
    void portalApi.newsRead(n.id).catch(() => undefined);
  };
  const name = country ? regionName(country, lang) : '';

  const findLinks = async () => {
    if (!country) return;
    setGuideState('busy');
    try {
      const out = await portalApi.newsGuide(country, lang);
      setGuide(out.links);
      setGuideState(out.links.length ? 'idle' : 'none');
    } catch (e) {
      const code = e instanceof PortalError ? e.code : '';
      setGuideState(code === 'membership_required' ? 'locked' : code === 'rate_limited' ? 'limit' : 'error');
    }
  };

  return (
    <section className='po-section po-news' aria-labelledby='po-h-news'>
      <div className='po-section__head'>
        <div>
          <h2 id='po-h-news'>{t('po_news_title')}</h2>
          <p className='po-section__lead'>{t('po_news_lead')}</p>
          {updated && (
            <p className='po-news__updated'>
              <Icon name='refresh' />
              {t('po_news_updated', { when: updated })}
            </p>
          )}
        </div>
      </div>

      <div className='po-news__countries' role='group' aria-label={t('po_news_country')}>
        {chips.map((c) => (
          <button
            key={c}
            type='button'
            className={`po-chip${c === country ? ' is-active' : ''}`}
            aria-pressed={c === country}
            onClick={() => setCountry(c)}
          >
            {regionName(c, lang)}
            {c === feed?.dossier_country && <span className='po-chip__tag'>{t('po_news_mine')}</span>}
          </button>
        ))}
        <label className='po-news__other'>
          <span className='sr-only'>{t('po_news_other')}</span>
          <select
            value={other}
            onChange={(e) => {
              setOther(e.target.value);
              if (e.target.value) setCountry(e.target.value);
            }}
          >
            <option value=''>{t('po_news_other')}</option>
            {allCountries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className='po-news__loading'>{t('po_news_loading')}</p>}
      {!loading && error && (
        <div className='po-card po-news__empty' role='alert'>
          <p>{t('po_news_error')}</p>
        </div>
      )}

      {!loading && !error && feed && !country && (
        <div className='po-card po-news__empty'>
          <p>{t('po_news_pick')}</p>
        </div>
      )}

      {!loading && !error && feed && country && (
        <>
          {feed.items.length > 0 ? (
            <ol className='po-news__list'>
              {feed.items.map((n) => (
                <li key={n.id} className={`po-card po-news__item${n.important ? ' is-important' : ''}${n.image_url ? ' has-media' : ''}`}>
                  {n.image_url && <NewsImage src={n.image_url} source={n.source} href={n.url} />}
                  <p className='po-news__meta'>
                    <span>{n.source}</span>
                    <span aria-hidden='true'>·</span>
                    <time dateTime={n.at}>{formatDate(n.at, lang)}</time>
                    {n.important && <span className='po-news__badge'>{t('po_news_important')}</span>}
                  </p>
                  <h3>
                    <a href={n.url} target='_blank' rel='noopener noreferrer' onClick={() => opened(n)}>
                      {n.title}
                    </a>
                  </h3>
                  {n.summary && <p className='po-news__summary'>{n.summary}</p>}
                  <div className='po-news__foot'>
                    <span className='po-news__topics'>
                      {n.topics
                        .filter((x): x is keyof typeof TOPIC_KEYS => x in TOPIC_KEYS)
                        .map((x) => (
                          <span key={x}>{t(TOPIC_KEYS[x])}</span>
                        ))}
                    </span>
                    <a href={n.url} target='_blank' rel='noopener noreferrer' className='po-news__read' onClick={() => opened(n)}>
                      {t('po_news_read')}
                      <Icon name='arrowUpRight' />
                    </a>
                  </div>
                  <div className='po-news__react'>
                    <span className='po-news__ask'>{t('po_news_useful_q')}</span>
                    <button
                      type='button'
                      className={`po-news__vote${n.mine === true ? ' is-on' : ''}`}
                      aria-pressed={n.mine === true}
                      onClick={() => void vote(n, true)}
                    >
                      <Icon name='thumbUp' />
                      {t('po_news_yes')}
                    </button>
                    <button
                      type='button'
                      className={`po-news__vote${n.mine === false ? ' is-on' : ''}`}
                      aria-pressed={n.mine === false}
                      onClick={() => void vote(n, false)}
                    >
                      <Icon name='thumbDown' />
                      {t('po_news_no')}
                    </button>
                    <span className='po-news__stats'>
                      {n.helpful > 0 && (
                        <span>{n.mine === true ? t(n.helpful > 1 ? 'po_news_helpful_you' : 'po_news_helpful_only_you', { n: n.helpful - 1 }) : t(n.helpful > 1 ? 'po_news_helpful_n' : 'po_news_helpful_1', { n: n.helpful })}</span>
                      )}
                      {n.reads > 0 && (
                        <span>
                          <Icon name='eye' />
                          {t(n.reads > 1 ? 'po_news_reads_n' : 'po_news_reads_1', { n: n.reads })}
                        </span>
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className='po-card po-news__empty'>
              <p>{isCovered ? t('po_news_none', { country: name }) : t('po_news_not_covered', { country: name })}</p>
            </div>
          )}

          {feed.access === 'preview' && feed.total > feed.items.length && (
            <div className='po-card po-news__lock'>
              <Icon name='lock' />
              <div>
                <strong>{t('po_news_more', { n: feed.total - feed.items.length })}</strong>
                <p>{t('po_news_more_text')}</p>
              </div>
              <button type='button' className='btn btn--primary' onClick={onPlans}>
                {t('po_news_plans')}
              </button>
            </div>
          )}

          {(feed.sources.length > 0 || !isCovered) && (
            <div className='po-news__links'>
              <h3>{t('po_news_official', { country: name })}</h3>
              {feed.sources.length > 0 && (
                <ul>
                  {feed.sources.map((s) => (
                    <li key={s.url}>
                      <External href={s.url}>
                        {s.name}
                        <Icon name='arrowUpRight' />
                      </External>
                    </li>
                  ))}
                </ul>
              )}
              {!isCovered && guide && guide.length > 0 && (
                <ul>
                  {guide.map((g) => (
                    <li key={g.url}>
                      <External href={g.url}>
                        {g.name}
                        <span className='po-news__kind'>{t(KIND_KEYS[g.kind as keyof typeof KIND_KEYS] ?? 'po_news_kind_visa')}</span>
                        <Icon name='arrowUpRight' />
                      </External>
                    </li>
                  ))}
                </ul>
              )}
              {!isCovered && !guide && (
                <div className='po-news__find'>
                  <p>{t('po_news_find_text', { country: name })}</p>
                  <button type='button' className='btn btn--secondary' onClick={() => void findLinks()} disabled={guideState === 'busy'}>
                    {guideState === 'busy' ? t('po_news_finding') : t('po_news_find')}
                  </button>
                  {guideState === 'locked' && (
                    <p className='po-news__note'>
                      {t('po_news_find_locked')}{' '}
                      <button type='button' className='po-link' onClick={onPlans}>
                        {t('po_news_plans')}
                      </button>
                    </p>
                  )}
                  {guideState === 'limit' && <p className='po-news__note'>{t('po_news_find_limit')}</p>}
                  {guideState === 'none' && <p className='po-news__note'>{t('po_news_find_none')}</p>}
                  {guideState === 'error' && <p className='po-news__note'>{t('po_news_error')}</p>}
                </div>
              )}
            </div>
          )}
          <p className='po-news__disclaimer'>{t('po_news_disclaimer')}</p>
        </>
      )}
    </section>
  );
};
