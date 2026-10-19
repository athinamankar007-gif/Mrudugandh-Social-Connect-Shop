import { useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetSiteContentQueryKey, useSaveStoryContent, useCreateContentPartner, useSaveContentPartner, useDeleteContentPartner,
  useCreateContentInitiative, useSaveContentInitiative, useDeleteContentInitiative,
  type ContentPartner, type ContentInitiative, type ContentPartnerInput, type ContentInitiativeInput,
} from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { ImagePlus, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSiteContent } from "@/lib/siteContent";
import { cmsImageUrl } from "@/lib/cmsImage";

const input = "mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-3 text-sm font-normal outline-none focus:border-[#1688c6]";
const label = "block text-sm font-semibold text-[#31516a]";
const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

function Notice({ ok, err }: { ok: string; err: string }) {
  return <>{ok && <p role="status" className="mb-4 rounded-xl bg-[#e4f5ed] p-4 text-sm text-[#287552]">{ok}</p>}{err && <p role="alert" className="mb-4 rounded-xl bg-[#fae5e1] p-4 text-sm text-[#a84e47]">{err}</p>}</>;
}

function Skeleton() { return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#e3f3f7]" />)}</div>; }

function LoadError({ retry }: { retry: () => void }) {
  return <div className="rounded-xl bg-[#fae5e1] p-6 text-sm text-[#a84e47]">Could not load website content. <button type="button" onClick={retry} className="font-bold underline">Retry</button></div>;
}

function ImagesField({ paths, onChange, onBusy, multiple = true, title }: { paths: string[]; onChange: (fn: (prev: string[]) => string[]) => void; onBusy: (b: boolean) => void; multiple?: boolean; title: string }) {
  const { uploadFile, progress, error } = useUpload();
  const [batch, setBatch] = useState(false);
  const handle = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setBatch(true); onBusy(true);
    try {
      const added: string[] = [];
      for (const f of files) { const r = await uploadFile(f); if (r) added.push(r.objectPath); }
      if (added.length) onChange((prev) => (multiple ? [...prev, ...added] : [added[0]]));
    } finally { setBatch(false); onBusy(false); }
  };
  return <div className="mt-5 rounded-xl bg-[#f7fcfc] p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-bold text-[#31516a]">{title}</p>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#9bcbd8] px-4 py-2 text-xs font-bold text-[#1688c6]"><ImagePlus size={14} />{batch ? `Uploading ${progress}%` : "Upload"}<input type="file" accept="image/*" multiple={multiple} onChange={handle} disabled={batch} className="hidden" /></label></div>
    {error && <p className="mt-2 text-xs text-[#a84e47]">{error.message}</p>}
    {paths.length > 0 ? <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">{paths.map((p, i) => <div key={`${p}-${i}`} className="relative overflow-hidden rounded-xl bg-[#e3f3f7]">
      {cmsImageUrl(p) ? <img src={cmsImageUrl(p) ?? ""} alt={`Image ${i + 1}`} className="aspect-square w-full object-contain" /> : <div className="flex aspect-square items-center justify-center p-2 text-center text-[10px] text-[#6a8390]">{p}</div>}
      <button type="button" onClick={() => onChange((prev) => prev.filter((_, k) => k !== i))} aria-label={`Remove image ${i + 1}`} className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#a84e47] shadow"><X size={16} /></button>
    </div>)}</div> : <p className="mt-3 text-xs text-[#6a8390]">No images. Saving will intentionally leave this empty.</p>}
  </div>;
}

function Modal({ title, onClose, busy = false, children }: { title: string; onClose: () => void; busy?: boolean; children: React.ReactNode }) {
  return <Dialog open onOpenChange={(o) => { if (!o && !busy) onClose(); }}>
    <DialogContent onEscapeKeyDown={(e) => { if (busy) e.preventDefault(); }} onInteractOutside={(e) => { if (busy) e.preventDefault(); }} className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-[640px] overflow-y-auto rounded-2xl bg-white p-5 sm:p-8">
      <DialogTitle className="pr-8 font-display text-3xl font-normal text-[#173b61]">{title}</DialogTitle>
      <DialogDescription className="sr-only">{title}</DialogDescription>
      <div className="mt-2">{children}</div>
    </DialogContent></Dialog>;
}

function Confirm({ text, busy, onYes, onNo }: { text: string; busy: boolean; onYes: () => void; onNo: () => void }) {
  return <Modal title="Are you sure?" onClose={onNo} busy={busy}><p className="text-sm text-[#547080]">{text}</p><div className="mt-6 flex gap-3"><button type="button" disabled={busy} onClick={onYes} className="rounded-full bg-[#a84e47] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? "Deleting…" : "Delete"}</button><button type="button" disabled={busy} onClick={onNo} className="rounded-full border border-[#cfe5ea] px-5 py-3 text-sm font-bold text-[#31516a]">Cancel</button></div></Modal>;
}

const storyFields: [string, string, boolean][] = [
  ["aboutEyebrow", "About page eyebrow", false], ["aboutTitle", "About page title", false], ["tagline", "Tagline (about page and footer)", false],
  ["aboutCallout", "Highlight callout", false], ["aboutParagraphEn", "Story paragraph (English)", true], ["aboutParagraphMr", "Story paragraph (Marathi)", true],
  ["aboutBanner", "Bottom banner", false], ["missionEn", "Mission statement (English, shown if filled)", true], ["missionMr", "Mission statement (Marathi, shown if filled)", true],
  ["initiativesTitle", "Initiatives page title", false], ["initiativesIntro", "Initiatives intro", true], ["coreHeading", "Core initiatives heading", false],
  ["impactHeading", "Impact heading", false], ["environmentalNote", "Environmental note", true], ["studentHeading", "Student section heading", false],
  ["studentIntro", "Student section intro", true], ["networkHeading", "Network heading", false], ["networkIntro", "Network intro", true],
  ["supportHeading", "We Support heading", false], ["exhibitionHeading", "Exhibitions heading", false], ["corporateHeading", "Corporate partners heading", false],
];

export function CmsStoryTab() {
  const qc = useQueryClient();
  const c = useSiteContent();
  const save = useSaveStoryContent();
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [ok, setOk] = useState(""); const [err, setErr] = useState("");
  if (c.isLoading) return <Skeleton />;
  if (c.isError && !c.loaded) return <LoadError retry={() => c.refetch()} />;
  const val = (k: string) => draft?.[k] ?? c.t(k);
  const extraKeys = Object.keys(draft ?? {}).filter((k) => !storyFields.some(([f]) => f === k));
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setOk(""); setErr("");
    const texts: Record<string, string> = {};
    storyFields.forEach(([k]) => { texts[k] = val(k); });
    extraKeys.forEach((k) => { texts[k] = draft?.[k] ?? ""; });
    try { await save.mutateAsync({ data: { texts } }); await qc.invalidateQueries({ queryKey: getGetSiteContentQueryKey() }); setDraft(null); setOk("Saved. The website now shows this text."); }
    catch (x) { setErr(errMsg(x, "Could not save text.")); }
  };
  return <form onSubmit={submit} className="rounded-2xl border border-[#cfe5ea] bg-white p-6 sm:p-8">
    <h2 className="font-display text-3xl text-[#173b61]">Our Story & Taglines</h2>
    <p className="mt-2 text-sm text-[#547080]">Empty fields are saved as empty. {draft && <strong className="text-[#c1792c]">Unsaved changes.</strong>}</p>
    <div className="mt-5"><Notice ok={ok} err={err} /></div>
    <fieldset disabled={save.isPending} className="grid min-w-0 gap-5 border-0 p-0">{storyFields.map(([k, l, long]) => <label key={k} className={label}>{l}{long ? <textarea rows={4} value={val(k)} onChange={(e) => setDraft({ ...(draft ?? {}), [k]: e.target.value })} className={input} data-testid={`input-story-${k}`} /> : <input value={val(k)} onChange={(e) => setDraft({ ...(draft ?? {}), [k]: e.target.value })} className={input} data-testid={`input-story-${k}`} />}</label>)}</fieldset>
    <div className="mt-6 flex gap-3"><button disabled={save.isPending} type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#1688c6] px-6 py-3.5 text-sm font-bold text-white disabled:opacity-60" data-testid="button-save-story"><Save size={16} />{save.isPending ? "Saving…" : "Save text"}</button>{draft && <button type="button" onClick={() => setDraft(null)} className="rounded-full border border-[#cfe5ea] px-5 py-3 text-sm font-bold text-[#31516a]">Discard</button>}</div>
  </form>;
}

const groups: { id: ContentPartnerInput["group"]; name: string }[] = [{ id: "support", name: "We Support" }, { id: "exhibition", name: "Exhibitions" }, { id: "corporate", name: "Corporate partners" }, { id: "college", name: "Colleges" }];

export function CmsPartnersTab() {
  const qc = useQueryClient();
  const c = useSiteContent();
  const create = useCreateContentPartner(); const saveP = useSaveContentPartner(); const del = useDeleteContentPartner();
  const [editing, setEditing] = useState<{ id?: string; data: ContentPartnerInput } | null>(null);
  const [toDelete, setToDelete] = useState<ContentPartner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ok, setOk] = useState(""); const [err, setErr] = useState(""); const [formErr, setFormErr] = useState("");
  if (c.isLoading) return <Skeleton />;
  if (c.isError && !c.loaded) return <LoadError retry={() => c.refetch()} />;
  const pending = create.isPending || saveP.isPending;
  const refresh = () => qc.invalidateQueries({ queryKey: getGetSiteContentQueryKey() });
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!editing || uploading) return; setFormErr("");
    if (!editing.data.name.trim()) { setFormErr("Enter a name."); return; }
    const data = { ...editing.data, name: editing.data.name.trim() };
    try {
      if (editing.id) await saveP.mutateAsync({ id: editing.id, data }); else await create.mutateAsync({ data });
      await refresh(); setEditing(null); setOk(editing.id ? "Partner updated." : "Partner added."); setErr("");
    } catch (x) { setFormErr(errMsg(x, "Could not save partner.")); }
  };
  const remove = async () => {
    if (!toDelete) return;
    try { await del.mutateAsync({ id: toDelete.id }); await refresh(); setOk(`${toDelete.name} removed.`); setErr(""); }
    catch (x) { setErr(errMsg(x, "Could not delete partner.")); }
    setToDelete(null);
  };
  return <div>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-3xl text-[#173b61]">Collaborations & Partners</h2><button type="button" onClick={() => { setOk(""); setFormErr(""); setEditing({ data: { name: "", group: "support", logoPath: "", sortOrder: c.partners.length } }); }} className="inline-flex items-center gap-2 rounded-full bg-[#173b61] px-5 py-3 text-sm font-bold text-white" data-testid="button-add-partner"><Plus size={16} />Add partner</button></div>
    <Notice ok={ok} err={err} />
    {groups.map((g) => { const list = c.partners.filter((p) => p.group === g.id); return <section key={g.id} className="mb-6"><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#173b61]">{g.name}</h3>
      {list.length === 0 ? <p className="rounded-xl border border-dashed border-[#9ecbd5] p-5 text-center text-sm text-[#6a8390]">No partners in this group.</p> : <div className="grid gap-2 sm:grid-cols-2">{list.map((p) => <div key={p.id} className="flex items-center gap-3 rounded-xl border border-[#cfe5ea] bg-white p-3" data-testid={`row-partner-${p.id}`}>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#e3f3f7]">{cmsImageUrl(p.logoPath) ? <img src={cmsImageUrl(p.logoPath) ?? ""} alt="" className="h-full w-full object-contain" /> : <ImagePlus size={18} className="text-[#1688c6]" />}</div>
        <strong className="min-w-0 flex-1 truncate text-sm text-[#173b61]">{p.name}</strong>
        <button type="button" onClick={() => { setOk(""); setFormErr(""); setEditing({ id: p.id, data: { name: p.name, group: p.group, logoPath: p.logoPath, sortOrder: p.sortOrder } }); }} aria-label={`Edit ${p.name}`} className="rounded-full p-2.5 text-[#1688c6] hover:bg-[#e7f5f6]"><Pencil size={16} /></button>
        <button type="button" onClick={() => setToDelete(p)} aria-label={`Delete ${p.name}`} className="rounded-full p-2.5 text-[#a84e47] hover:bg-[#fff5f3]"><Trash2 size={16} /></button></div>)}</div>}</section>; })}
    {editing && <Modal title={editing.id ? "Edit partner" : "Add partner"} busy={pending || uploading} onClose={() => setEditing(null)}><form onSubmit={submit}><fieldset disabled={pending} className="min-w-0 border-0 p-0">
      {formErr && <p role="alert" className="mb-4 rounded-xl bg-[#fae5e1] p-3 text-sm text-[#a84e47]">{formErr}</p>}
      <label className={label}>Name<input value={editing.data.name} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, name: e.target.value } })} className={input} data-testid="input-partner-name" /></label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className={label}>Group<select value={editing.data.group} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, group: e.target.value as ContentPartnerInput["group"] } })} className={input}>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
        <label className={label}>Order<input type="number" min={0} max={10000} value={editing.data.sortOrder} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, sortOrder: Math.max(0, Math.min(10000, Math.round(Number(e.target.value) || 0))) } })} className={input} /></label></div>
      <ImagesField title="Logo (optional)" multiple={false} paths={editing.data.logoPath ? [editing.data.logoPath] : []} onBusy={setUploading} onChange={(fn) => setEditing((cur) => cur && { ...cur, data: { ...cur.data, logoPath: fn(cur.data.logoPath ? [cur.data.logoPath] : [])[0] ?? "" } })} />
      <button type="submit" disabled={pending || uploading} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1688c6] px-6 py-3.5 text-sm font-bold text-white disabled:opacity-60" data-testid="button-save-partner"><Save size={16} />{pending ? "Saving…" : uploading ? "Uploading…" : "Save partner"}</button></fieldset></form></Modal>}
    {toDelete && <Confirm text={`Remove ${toDelete.name} from the website? This cannot be undone.`} busy={del.isPending} onYes={remove} onNo={() => setToDelete(null)} />}
  </div>;
}

const sections: { id: ContentInitiativeInput["section"]; name: string }[] = [{ id: "core", name: "Core initiative" }, { id: "csr", name: "Corporate CSR" }, { id: "student", name: "Student community engagement" }, { id: "impact", name: "Social and environmental impact" }, { id: "event", name: "Event" }];

export function CmsInitiativesTab() {
  const qc = useQueryClient();
  const c = useSiteContent();
  const create = useCreateContentInitiative(); const saveI = useSaveContentInitiative(); const del = useDeleteContentInitiative();
  const [editing, setEditing] = useState<{ id?: string; data: ContentInitiativeInput } | null>(null);
  const [toDelete, setToDelete] = useState<ContentInitiative | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ok, setOk] = useState(""); const [err, setErr] = useState(""); const [formErr, setFormErr] = useState("");
  if (c.isLoading) return <Skeleton />;
  if (c.isError && !c.loaded) return <LoadError retry={() => c.refetch()} />;
  const pending = create.isPending || saveI.isPending;
  const refresh = () => qc.invalidateQueries({ queryKey: getGetSiteContentQueryKey() });
  const set = (patch: Partial<ContentInitiativeInput>) => editing && setEditing({ ...editing, data: { ...editing.data, ...patch } });
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!editing || uploading) return; setFormErr("");
    if (!editing.data.title.trim()) { setFormErr("Enter a title."); return; }
    const data = { ...editing.data, title: editing.data.title.trim() };
    try {
      if (editing.id) await saveI.mutateAsync({ id: editing.id, data }); else await create.mutateAsync({ data });
      await refresh(); setEditing(null); setOk(editing.id ? "Initiative updated." : "Initiative added."); setErr("");
    } catch (x) { setFormErr(errMsg(x, "Could not save initiative.")); }
  };
  const remove = async () => {
    if (!toDelete) return;
    try { await del.mutateAsync({ id: toDelete.id }); await refresh(); setOk(`${toDelete.title} removed.`); setErr(""); }
    catch (x) { setErr(errMsg(x, "Could not delete initiative.")); }
    setToDelete(null);
  };
  const openEdit = (i: ContentInitiative) => { setOk(""); setFormErr(""); setEditing({ id: i.id, data: { title: i.title, eyebrow: i.eyebrow, body: i.body, section: i.section, imagePaths: [...i.imagePaths], sortOrder: i.sortOrder } }); };
  return <div>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-3xl text-[#173b61]">Initiatives & Events</h2><button type="button" onClick={() => { setOk(""); setFormErr(""); setEditing({ data: { title: "", eyebrow: "", body: "", section: "core", imagePaths: [], sortOrder: c.initiatives.length } }); }} className="inline-flex items-center gap-2 rounded-full bg-[#173b61] px-5 py-3 text-sm font-bold text-white" data-testid="button-add-initiative"><Plus size={16} />Add initiative</button></div>
    <Notice ok={ok} err={err} />
    {c.initiatives.length === 0 && <p className="rounded-xl border border-dashed border-[#9ecbd5] p-12 text-center text-sm text-[#6a8390]">No initiatives yet. Add the first one.</p>}
    <div className="space-y-3">{c.initiatives.map((i) => <div key={i.id} role="button" tabIndex={0} onClick={() => openEdit(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEdit(i); } }} className="flex cursor-pointer items-center gap-4 rounded-2xl border border-[#cfe5ea] bg-white p-4 hover:bg-[#f5fbfc]" data-testid={`row-initiative-${i.id}`}>
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#e3f3f7]">{cmsImageUrl(i.imagePaths[0]) ? <img src={cmsImageUrl(i.imagePaths[0]) ?? ""} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="m-5 text-[#1688c6]" size={22} />}</div>
      <div className="min-w-0 flex-1"><strong className="block truncate text-[#173b61]">{i.title}</strong><small className="text-xs text-[#6a8390]">{sections.find((s) => s.id === i.section)?.name} · {i.imagePaths.length} photo{i.imagePaths.length === 1 ? "" : "s"}</small></div>
      <button type="button" onClick={(e) => { e.stopPropagation(); setToDelete(i); }} aria-label={`Delete ${i.title}`} className="rounded-full p-2.5 text-[#a84e47] hover:bg-[#fff5f3]"><Trash2 size={17} /></button></div>)}</div>
    {editing && <Modal title={editing.id ? "Edit initiative" : "Add initiative"} busy={pending || uploading} onClose={() => setEditing(null)}><form onSubmit={submit}><fieldset disabled={pending} className="min-w-0 border-0 p-0">
      {formErr && <p role="alert" className="mb-4 rounded-xl bg-[#fae5e1] p-3 text-sm text-[#a84e47]">{formErr}</p>}
      <label className={label}>Title<input value={editing.data.title} onChange={(e) => set({ title: e.target.value })} className={input} data-testid="input-initiative-title" /></label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className={label}>Eyebrow<input value={editing.data.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} className={input} /></label>
        <label className={label}>Section<select value={editing.data.section} onChange={(e) => set({ section: e.target.value as ContentInitiativeInput["section"] })} className={input}>{sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div>
      <label className={`${label} mt-4`}>Body<textarea rows={5} value={editing.data.body} onChange={(e) => set({ body: e.target.value })} className={input} /></label>
      <label className={`${label} mt-4 w-32`}>Order<input type="number" min={0} max={10000} value={editing.data.sortOrder} onChange={(e) => set({ sortOrder: Math.max(0, Math.min(10000, Math.round(Number(e.target.value) || 0))) })} className={input} /></label>
      <ImagesField title="Photos" paths={editing.data.imagePaths} onBusy={setUploading} onChange={(fn) => setEditing((cur) => cur && { ...cur, data: { ...cur.data, imagePaths: fn(cur.data.imagePaths) } })} />
      <button type="submit" disabled={pending || uploading} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1688c6] px-6 py-3.5 text-sm font-bold text-white disabled:opacity-60" data-testid="button-save-initiative"><Save size={16} />{pending ? "Saving…" : uploading ? "Uploading…" : "Save initiative"}</button></fieldset></form></Modal>}
    {toDelete && <Confirm text={`Remove "${toDelete.title}" from the website? This cannot be undone.`} busy={del.isPending} onYes={remove} onNo={() => setToDelete(null)} />}
  </div>;
}
