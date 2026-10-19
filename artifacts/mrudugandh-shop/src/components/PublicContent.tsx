import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { ArrowRight, HeartHandshake, Leaf } from 'lucide-react';
import { useSiteContent } from '@/lib/siteContent';
import { cmsImageUrl } from '@/lib/cmsImage';
import type { ContentInitiative } from '@workspace/api-client-react';

export function Tagline() {
  const { t, loaded } = useSiteContent();
  if (!loaded) return <span className="block h-16" />;
  return <>{t('tagline').split(/(?<=\.)\s+/).map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}</>;
}

function ContentState({ isLoading, isError, retry }: { isLoading: boolean; isError: boolean; retry: () => void }) {
  if (isLoading) return <div className="mx-auto max-w-5xl space-y-4 px-5 py-24" data-testid="status-content-loading">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-[#e3f3f7]" />)}</div>;
  if (isError) return <div className="mx-auto max-w-xl px-5 py-24 text-center" data-testid="status-content-error"><h2 className="font-display text-3xl text-[#173b61]">We could not load this page</h2><p className="mt-3 text-sm text-[#547080]">Please check your connection and try again.</p><button type="button" onClick={retry} className="mt-5 rounded-full bg-[#1688c6] px-6 py-3 text-sm font-bold text-white">Try again</button></div>;
  return null;
}

export function AboutContent({ Shell }: { Shell: (p: { children: ReactNode }) => ReactNode }) {
  const c = useSiteContent();
  const blocked = (c.isLoading || (c.isError && !c.loaded)) ? <ContentState isLoading={c.isLoading} isError={c.isError} retry={() => c.refetch()} /> : null;
  if (blocked) return <Shell>{blocked}</Shell>;
  const t = c.t;
  const title = t('aboutTitle');
  const dash = title.lastIndexOf('—');
  return <Shell>
    <section className="bg-[#e3f3f7]"><div className="mx-auto max-w-5xl px-5 py-20 text-center lg:py-28">
      {t('aboutEyebrow') && <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">{t('aboutEyebrow')}</p>}
      <h1 className="mx-auto mt-5 max-w-3xl font-display text-5xl leading-tight text-[#173b61] sm:text-7xl" data-testid="text-about-title">{dash > -1 ? <>{title.slice(0, dash + 1)} <em className="font-normal text-[#1688c6]">{title.slice(dash + 1).trim()}</em></> : title}</h1>
      {t('tagline') && <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-[#547080]" data-testid="text-about-tagline">{t('tagline')}</p>}
    </div></section>
    <section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
      <div className="rounded-[2rem] bg-[#f9f1df] p-10 lg:p-16"><HeartHandshake className="mb-12 text-[#c1792c]" size={38} />{t('aboutCallout') && <p className="font-display text-4xl leading-tight text-[#173b61]">{t('aboutCallout')}</p>}</div>
      <div>
        {t('aboutParagraphEn') && <p className="text-lg leading-8 text-[#547080]">{t('aboutParagraphEn')}</p>}
        {t('aboutParagraphMr') && <p className="mt-6 text-lg leading-8 text-[#547080]" data-testid="text-about-marathi">{t('aboutParagraphMr')}</p>}
        {t('missionEn') && <p className="mt-6 border-l-4 border-[#efb34f] pl-4 text-lg leading-8 text-[#31516a]">{t('missionEn')}</p>}
        {t('missionMr') && <p className="mt-4 border-l-4 border-[#efb34f] pl-4 text-lg leading-8 text-[#31516a]">{t('missionMr')}</p>}
      </div>
    </section>
    <section className="bg-[#173b61] text-white"><div className="mx-auto max-w-6xl px-5 py-20 text-center lg:py-24">
      {t('aboutBanner') && <p className="mx-auto max-w-2xl font-display text-4xl leading-tight sm:text-5xl">{t('aboutBanner')}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-[#efb34f] px-6 py-3.5 text-sm font-bold text-[#173b61]" data-testid="link-about-shop">Explore the collection <ArrowRight size={16} /></Link><a href="https://docs.google.com/forms/d/1pYcyZPJkmnSDP6P7OljPg9-xHsjc26XTORoi2aUPX3Y/edit?usp=drivesdk" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#8eb7c5] px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10" data-testid="link-volunteer-registration">Volunteer Registration Link <ArrowRight size={16} /></a></div>
    </div></section>
  </Shell>;
}

function Photos({ item, mode }: { item: ContentInitiative; mode: 'cover' | 'student' }) {
  const urls = item.imagePaths.map(cmsImageUrl).filter((u): u is string => !!u);
  if (!urls.length) return null;
  if (mode === 'student') return <div className="grid grid-cols-2 items-start gap-3 rounded-[2rem] bg-[#e3f3f7] p-3 shadow-md">{urls.map((u, i) => <img key={`${u}-${i}`} src={u} alt={`${item.title} photo ${i + 1}`} loading="lazy" className="h-auto w-full rounded-2xl bg-white object-contain object-top" />)}</div>;
  return <div className="grid grid-cols-2 gap-3 rounded-[2rem] bg-[#e3f3f7] p-3 shadow-md">{urls.map((u, i) => <img key={`${u}-${i}`} src={u} alt={`${item.title} photo ${i + 1}`} loading="lazy" className={`w-full rounded-2xl object-cover ${i === 0 && urls.length % 2 === 1 ? 'col-span-2 aspect-[16/9]' : 'aspect-square'}`} />)}</div>;
}

function Row({ item, flip }: { item: ContentInitiative; flip: boolean }) {
  const accent = item.section === 'impact' ? 'text-[#c1792c]' : 'text-[#1688c6]';
  return <div className="grid items-center gap-10 lg:grid-cols-2" data-testid={`section-initiative-${item.id}`}>
    <div className={flip ? 'lg:order-2 lg:pl-10' : 'lg:pr-10'}>{item.eyebrow && <p className={`text-xs font-bold uppercase tracking-[.2em] ${accent}`}>{item.eyebrow}</p>}<h3 className="mt-3 font-display text-3xl text-[#173b61] sm:text-4xl">{item.title}</h3>{item.body && <p className="mt-5 whitespace-pre-line text-base leading-7 text-[#547080]">{item.body}</p>}</div>
    {item.imagePaths.length > 0 && <div className={flip ? 'lg:order-1' : ''}><Photos item={item} mode={item.id === 'donation-drives' ? 'student' : 'cover'} /></div>}
  </div>;
}

function Side({ item, tone }: { item: ContentInitiative; tone: 'csr' | 'student' }) {
  return <article className="rounded-[2rem] border border-[#cfe5ea] bg-white p-6 shadow-[0_5px_20px_rgba(17,55,91,.04)] sm:p-8" data-testid={`section-initiative-${item.id}`}>
    {item.eyebrow && <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">{item.eyebrow}</p>}<h3 className="mt-3 font-display text-3xl text-[#173b61]">{item.title}</h3>
    {item.body && <p className="mt-4 whitespace-pre-line text-base leading-7 text-[#547080]">{item.body}</p>}
    <div className="mt-6"><Photos item={item} mode={tone === 'student' ? 'student' : 'cover'} /></div></article>;
}

export function InitiativesContent({ Shell }: { Shell: (p: { children: ReactNode }) => ReactNode }) {
  const c = useSiteContent();
  if (c.isLoading || (c.isError && !c.loaded)) return <Shell><ContentState isLoading={c.isLoading} isError={c.isError} retry={() => c.refetch()} /></Shell>;
  const t = c.t;
  const by = (s: string) => c.initiatives.filter((i) => i.section === s);
  const core = by('core'), csr = by('csr'), student = by('student'), impact = by('impact'), events = by('event');
  const colleges = c.partners.filter((p) => p.group === 'college');
  const networks = [['support', t('supportHeading')], ['exhibition', t('exhibitionHeading')], ['corporate', t('corporateHeading')]] as const;
  const net = networks.map(([g, h]) => ({ h, items: c.partners.filter((p) => p.group === g) })).filter((n) => n.items.length);
  const chip = (p: (typeof colleges)[number]) => <span key={p.id} className="inline-flex items-center gap-2 rounded-full border border-[#cfe5ea] bg-[#e3f3f7] px-6 py-3 text-sm font-semibold text-[#173b61]">{cmsImageUrl(p.logoPath) && <img src={cmsImageUrl(p.logoPath) ?? ''} alt="" className="h-6 w-6 object-contain" />}{p.name}</span>;
  return <Shell>
    <section className="relative overflow-hidden bg-[#e3f3f7] pb-24 pt-16 sm:pt-24 lg:pt-32"><div className="relative z-10 mx-auto max-w-7xl px-5 text-center lg:px-8">
      <p className="mb-5 inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[.24em] text-[#1688c6]"><span className="h-px w-8 bg-[#efb34f]" /> Connected with Heart <span className="h-px w-8 bg-[#efb34f]" /></p>
      <h1 className="mx-auto max-w-4xl font-display text-5xl leading-[1.05] tracking-tight text-[#153a67] sm:text-6xl lg:text-7xl">{t('initiativesTitle')}</h1>
      {t('initiativesIntro') && <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[#496a7a]">{t('initiativesIntro')}</p>}
    </div></section>
    {core.length > 0 && <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="mb-16 text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">What We Do</p><h2 className="mt-3 font-display text-4xl text-[#173b61]">{t('coreHeading')}</h2></div><div className="grid gap-16 lg:gap-24">{core.map((i, n) => <Row key={i.id} item={i} flip={n % 2 === 0} />)}</div></section>}
    {(csr.length > 0 || student.length > 0) && <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8"><div className={`grid items-start gap-8 ${csr.length && student.length ? 'lg:grid-cols-2' : ''}`}>{csr.length > 0 && <div className="space-y-8">{csr.map((i) => <Side key={i.id} item={i} tone="csr" />)}</div>}{student.length > 0 && <div className="space-y-8">{student.map((i) => <Side key={i.id} item={i} tone="student" />)}</div>}</div></section>}
    {events.length > 0 && <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8"><div className="grid gap-16">{events.map((i, n) => <Row key={i.id} item={i} flip={n % 2 === 0} />)}</div></section>}
    {(impact.length > 0 || t('environmentalNote')) && <section className="bg-[#f9f1df]"><div className="mx-auto max-w-7xl px-5 pt-20 lg:px-8">{t('impactHeading') && <div className="mb-14 text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#c1792c]">Impact</p><h2 className="mt-3 font-display text-4xl text-[#173b61]">{t('impactHeading')}</h2></div>}<div className="grid gap-16 pb-20">{impact.map((i, n) => <Row key={i.id} item={i} flip={n % 2 === 1} />)}</div></div>
      {t('environmentalNote') && <div className="bg-[#14395f] px-5 py-20 text-center"><div className="mx-auto max-w-4xl"><div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#1b4a78]"><Leaf className="text-[#efb34f]" size={28} /></div><p className="font-display text-2xl leading-relaxed text-white md:text-3xl">“{t('environmentalNote')}”</p></div></div>}</section>}
    {(colleges.length > 0 || t('studentHeading')) && <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="mb-12 text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Student &amp; Community Engagement</p><h2 className="mt-3 font-display text-4xl text-[#173b61]">{t('studentHeading')}</h2>{t('studentIntro') && <p className="mx-auto mt-4 max-w-2xl text-[#547080]">{t('studentIntro')}</p>}</div><div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-4">{colleges.map(chip)}</div></section>}
    {net.length > 0 && <section className="border-t border-[#cfe5ea] bg-[#f7fcfc] py-24"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="mb-16 text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Collaborations</p><h2 className="mt-3 font-display text-4xl text-[#173b61]">{t('networkHeading')}</h2>{t('networkIntro') && <p className="mx-auto mt-4 max-w-2xl text-[#547080]">{t('networkIntro')}</p>}</div>
      <div className={`grid gap-8 ${net.length === 3 ? 'md:grid-cols-3' : net.length === 2 ? 'md:grid-cols-2' : ''}`}>{net.map((g) => <div key={g.h} className="rounded-[2rem] border border-[#cfe5ea] bg-white p-8 shadow-[0_5px_20px_rgba(17,55,91,.04)]"><h3 className="mb-6 border-b border-[#cfe5ea] pb-4 font-display text-2xl text-[#173b61]">{g.h}</h3><ul className="space-y-4">{g.items.map((p) => <li key={p.id} className="flex items-start gap-3"><div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#efb34f]" />{cmsImageUrl(p.logoPath) && <img src={cmsImageUrl(p.logoPath) ?? ''} alt="" className="h-6 w-6 object-contain" />}<span className="font-medium leading-relaxed text-[#547080]">{p.name}</span></li>)}</ul></div>)}</div></div></section>}
  </Shell>;
}
