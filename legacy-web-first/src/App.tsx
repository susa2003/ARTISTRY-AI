import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Brush, Camera as CameraIcon, Check,
  ChevronDown, ChevronRight, CircleHelp, Crop, Download, Eraser, Eye, EyeOff, FolderOpen,
  Hand, Image as ImageIcon, Layers3, LoaderCircle, Menu, Minus, MoveUpRight, Palette,
  Pencil, Plus, Redo2, RotateCcw, RotateCw, Save, Settings2, Sparkles, Trash2, Undo2,
  Upload, WandSparkles, X,
} from 'lucide-react';
import {
  getCachedImage, getProject, listProjects, makeId, removeProject, saveCachedImage, saveProject,
  type CachedImage, type StoredLayer, type StoredProject,
} from './storage';

type Page = 'home' | 'assist' | 'tool' | 'studio' | 'projects';
type FeatureId = 'loomis' | 'steps' | 'sketch' | 'tracing' | 'grid' | 'analyzer' | 'shading' | 'color';
type Feature = { id: FeatureId; title: string; detail: string; glyph: string };
type LayerState = { id: string; name: string; visible: boolean; image: Blob };
type ActiveImage = CachedImage;

const FEATURES: Feature[] = [
  { id: 'loomis', title: 'AI Loomis', detail: 'Find the head angle and build a simple form.', glyph: '◉' },
  { id: 'steps', title: 'Step-by-Step Drawing Guide', detail: 'Turn a reference into a clear drawing plan.', glyph: '↗' },
  { id: 'sketch', title: 'Sketch Converter', detail: 'Make a clean pencil-style study.', glyph: '〰' },
  { id: 'tracing', title: 'Tracing Studio', detail: 'Prepare a calm, high-contrast tracing view.', glyph: '⌁' },
  { id: 'grid', title: 'Smart Grid', detail: 'Lay a proportional grid over your reference.', glyph: '▦' },
  { id: 'analyzer', title: 'Drawing Analyzer', detail: 'Review value, light and overall balance.', glyph: '⌕' },
  { id: 'shading', title: 'Shading Assistant', detail: 'Explore light direction and value groups.', glyph: '◐' },
  { id: 'color', title: 'Color Studio', detail: 'Pull a small palette from any image.', glyph: '◌' },
];

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const AI_ENDPOINT = (import.meta.env.VITE_AI_API_URL as string | undefined)?.trim();
const TODAY_LABEL = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()).toUpperCase();

function isImageFile(name: string, mime = '') {
  const extension = name.slice(name.lastIndexOf('.')).toLowerCase();
  return ACCEPTED.includes(mime.toLowerCase()) || ACCEPTED_EXTENSIONS.includes(extension);
}

function imageSize(blob: Blob): Promise<{ width: number; height: number }> {
  return createImageBitmap(blob).then((bitmap) => {
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not prepare this image.')), type, quality));
}

async function downloadBlob(blob: Blob, filename: string) {
  if (Capacitor.isNativePlatform()) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    const { uri } = await Filesystem.writeFile({ path: filename, data: btoa(binary), directory: Directory.Cache });
    await Share.share({ title: 'Save your artwork', text: 'Choose where to save or share this copy.', url: uri, dialogTitle: 'Export artwork' });
    return;
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function niceDate(value: number) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(value);
}

function App() {
  const [page, setPage] = useState<Page>('home');
  const [feature, setFeature] = useState<FeatureId>('sketch');
  const [image, setImage] = useState<ActiveImage | null>(null);
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const galleryInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const documentInput = useRef<HTMLInputElement>(null);

  const announce = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3600);
  }, []);

  const refreshProjects = useCallback(async () => {
    try {
      const result = await listProjects();
      setProjects(result.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch {
      announce('Local project storage is unavailable in this browser.');
    }
  }, [announce]);

  useEffect(() => {
    void refreshProjects();
    const activeId = localStorage.getItem('artistry-active-image');
    if (activeId) {
      void getCachedImage(activeId).then((stored) => stored && setImage(stored)).catch(() => undefined);
    }
  }, [refreshProjects]);

  const acceptImage = useCallback(async (blob: Blob, name: string, mime = blob.type) => {
    const safeName = name || `Artwork reference.${mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'}`;
    if (!isImageFile(safeName, mime)) {
      announce('Choose a JPG, JPEG, PNG or WEBP image.');
      return;
    }
    if (blob.size > 60 * 1024 * 1024) {
      announce('This image is larger than 60 MB. Resize it or choose a smaller copy.');
      return;
    }
    try {
      const { width, height } = await imageSize(blob);
      const cached: CachedImage = {
        id: makeId(), name: safeName, original: blob, working: blob,
        width, height, isEdited: false, updatedAt: Date.now(),
      };
      await saveCachedImage(cached);
      localStorage.setItem('artistry-active-image', cached.id);
      setImage(cached);
      setPage('assist');
      announce('Image ready. Your original stays unchanged.');
    } catch {
      announce('That image could not be opened. Try a JPG, PNG or WEBP file.');
    }
  }, [announce]);

  const pickGallery = useCallback(async () => {
    setBusy('gallery');
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FilePicker.pickImages({ limit: 1 });
        const selected = result.files[0];
        if (!selected) return;
        const blob = selected.blob ?? (selected.webPath ? await (await fetch(selected.webPath)).blob() : null);
        if (!blob) throw new Error('The selected image could not be read.');
        await acceptImage(blob, selected.name, selected.mimeType);
      } else {
        galleryInput.current?.click();
      }
    } catch (error) {
      if (!(error instanceof Error && /cancel/i.test(error.message))) announce('Photo access was cancelled or unavailable. You can try the file picker instead.');
    } finally {
      setBusy('');
    }
  }, [acceptImage, announce]);

  const pickDocument = useCallback(async () => {
    setBusy('document');
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FilePicker.pickFiles({
          limit: 1,
          types: ['image/jpeg', 'image/png', 'image/webp'],
        });
        const selected = result.files[0];
        if (!selected) return;
        const blob = selected.blob ?? (selected.webPath ? await (await fetch(selected.webPath)).blob() : null);
        if (!blob) throw new Error('The selected image could not be read.');
        await acceptImage(blob, selected.name, selected.mimeType);
      } else {
        documentInput.current?.click();
      }
    } catch (error) {
      if (!(error instanceof Error && /cancel/i.test(error.message))) announce('The document could not be opened. Check the file type and try again.');
    } finally {
      setBusy('');
    }
  }, [acceptImage, announce]);

  const captureCamera = useCallback(async () => {
    setBusy('camera');
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await Camera.takePhoto({ quality: 92, includeMetadata: false });
        const blob = result.webPath ? await (await fetch(result.webPath)).blob() : null;
        if (!blob) throw new Error('The photo could not be read.');
        await acceptImage(blob, `Camera study ${new Date().toLocaleDateString()}.jpg`, blob.type || 'image/jpeg');
      } else {
        cameraInput.current?.click();
      }
    } catch (error) {
      if (!(error instanceof Error && /cancel/i.test(error.message))) announce('Camera access was not granted. Use the photo or document picker instead.');
    } finally {
      setBusy('');
    }
  }, [acceptImage, announce]);

  const createProject = useCallback(async (width = 1200, height = 800, name = 'Untitled drawing') => {
    const project: StoredProject = {
      id: makeId(), name, width, height, updatedAt: Date.now(),
      layers: [{ id: makeId(), name: 'Sketch', visible: true, image: new Blob() }],
    };
    try {
      await saveProject(project);
      await refreshProjects();
      sessionStorage.setItem('artistry-open-project', project.id);
      setPage('studio');
      setToast('');
      window.dispatchEvent(new CustomEvent('artistry-open-project', { detail: project.id }));
    } catch {
      announce('Could not save this drawing on the device. Check your available storage.');
    }
  }, [announce, refreshProjects]);

  const openProject = async (id: string) => {
    try {
      const project = await getProject(id);
      if (!project) return announce('This project is no longer available on this device.');
      sessionStorage.setItem('artistry-open-project', id);
      setPage('studio');
      window.dispatchEvent(new CustomEvent('artistry-open-project', { detail: id }));
    } catch {
      announce('Could not open this saved drawing.');
    }
  };

  const deleteProject = async (id: string) => {
    await removeProject(id);
    await refreshProjects();
    announce('Project removed from this device.');
  };

  const openTool = (id: FeatureId) => {
    setFeature(id);
    if (!image) {
      setPage('assist');
      announce('Choose a photo first. It will stay on this device until you choose AI analysis.');
    } else {
      setPage('tool');
    }
  };

  const pageTitle = page === 'home' ? 'Your creative space' : page === 'assist' ? 'Image studio' : page === 'tool' ? FEATURES.find((item) => item.id === feature)?.title : page === 'projects' ? 'Your projects' : 'Drawing studio';

  return (
    <div className="app-shell">
      <input ref={galleryInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void acceptImage(file, file.name, file.type); event.currentTarget.value = ''; }} />
      <input ref={cameraInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) void acceptImage(file, file.name, file.type); event.currentTarget.value = ''; }} />
      <input ref={documentInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void acceptImage(file, file.name, file.type); event.currentTarget.value = ''; }} />

      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><span /><span /><span /></div>
          <div><strong>ARTISTRY</strong><small>AI STUDIO</small></div>
          <button className="icon-button mobile-close" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <button className={`nav-item ${page === 'home' ? 'selected' : ''}`} onClick={() => { setPage('home'); setMobileMenu(false); }}><Sparkles size={17} /><span>Home</span></button>
        <button className={`nav-item ${page === 'assist' || page === 'tool' ? 'selected' : ''}`} onClick={() => { setPage('assist'); setMobileMenu(false); }}><WandSparkles size={17} /><span>Image assistance</span><span className="nav-pill">8</span></button>
        <button className={`nav-item ${page === 'studio' ? 'selected' : ''}`} onClick={() => { setPage('studio'); setMobileMenu(false); }}><Pencil size={17} /><span>Drawing studio</span></button>
        <button className={`nav-item ${page === 'projects' ? 'selected' : ''}`} onClick={() => { setPage('projects'); setMobileMenu(false); }}><Layers3 size={17} /><span>My projects</span><span className="nav-count">{projects.length}</span></button>
        <div className="sidebar-divider" />
        <div className="side-caption">IMAGE TOOLS</div>
        <div className="tool-nav-list">
          {FEATURES.map((item) => <button key={item.id} className={`tool-nav ${page === 'tool' && feature === item.id ? 'tool-nav-active' : ''}`} onClick={() => { openTool(item.id); setMobileMenu(false); }}><span className="tool-nav-glyph">{item.glyph}</span>{item.title}</button>)}
        </div>
        <div className="sidebar-bottom">
          <div className="local-badge"><span className="local-dot" /><span><b>Local by default</b><small>Drawing works offline</small></span></div>
          <button className="nav-item help-link" onClick={() => announce('Photos and projects are cached only on this device. AI analysis is sent only when you tap the AI analysis button.')}><CircleHelp size={16} /><span>Privacy & help</span></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button menu-toggle" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={19} /></button>
          <div className="breadcrumbs"><span>Studio</span><ChevronRight size={13} /><strong>{pageTitle}</strong></div>
          <div className="topbar-actions">
            <span className="local-status"><span className="local-dot" /> Saved on this device</span>
            {page !== 'studio' && <button className="button button-dark button-small" onClick={() => void createProject()}><Plus size={15} /> New drawing</button>}
            <div className="avatar">A</div>
          </div>
        </header>

        {page === 'home' && <HomePage image={image} projects={projects} onPick={pickGallery} onCamera={captureCamera} onDocument={pickDocument} onNew={() => void createProject()} onOpen={openProject} onAssist={() => setPage('assist')} onProjects={() => setPage('projects')} onTool={openTool} />}
        {page === 'assist' && <AssistPage image={image} busy={busy} onPick={pickGallery} onCamera={captureCamera} onDocument={pickDocument} onOpenTool={openTool} onUpdateImage={async (updated) => { setImage(updated); await saveCachedImage(updated); }} announce={announce} />}
        {page === 'tool' && <ToolPage feature={FEATURES.find((item) => item.id === feature)!} image={image} onBack={() => setPage('assist')} onPick={pickGallery} announce={announce} />}
        {page === 'projects' && <ProjectsPage projects={projects} onNew={() => void createProject()} onOpen={openProject} onDelete={deleteProject} />}
        {page === 'studio' && <DrawingStudio onCreate={createProject} announce={announce} onSaved={refreshProjects} />}
      </main>
      {mobileMenu && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}
      {toast && <div role="status" className="toast"><Check size={16} />{toast}<button onClick={() => setToast('')} aria-label="Dismiss"><X size={14} /></button></div>}
    </div>
  );
}

function ResumeReference({ image, onAssist }: { image: ActiveImage; onAssist: () => void }) {
  const url = useMemo(() => URL.createObjectURL(image.working), [image.working]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <button className="resume-reference" onClick={onAssist}><img src={url} alt="Current local reference" /><span><b>Continue with {image.name}</b><small>Open image studio <ArrowRight size={12} /></small></span></button>;
}

function HomePage({ image, projects, onPick, onCamera, onDocument, onNew, onOpen, onAssist, onProjects, onTool }: {
  image: ActiveImage | null; projects: StoredProject[]; onPick: () => void; onCamera: () => void; onDocument: () => void;
  onNew: () => void; onOpen: (id: string) => void; onAssist: () => void; onProjects: () => void; onTool: (id: FeatureId) => void;
}) {
  return (
    <div className="page-content home-page">
      <section className="welcome-row">
        <div><div className="eyebrow">{TODAY_LABEL} <span /> YOUR PRIVATE ART SPACE</div><h1>Make room for<br /><em>what you imagine.</em></h1><p>A calm studio for learning to draw, trying new ideas, and turning references into your own work.</p></div>
        <div className="hero-orbit" aria-hidden="true"><div className="orbit-circle orbit-one" /><div className="orbit-circle orbit-two" /><div className="orbit-sun" /><div className="orbit-scribble">✳</div><span className="orbit-tag">IDEAS<br />IN MOTION</span></div>
      </section>

      <section className="entry-grid">
        <article className="entry-card photo-entry">
          <div className="entry-top"><div className="entry-icon"><ImageIcon size={19} /></div><span className="step-label">01 / START FROM A REFERENCE</span></div>
          <div className="entry-body"><h2>Bring a photo<br />into the studio.</h2><p>Use your own image with drawing guides, tracing, shading and color tools.</p></div>
          <div className="entry-actions"><button className="button button-dark" onClick={onPick}><ImageIcon size={16} /> Choose a photo <ArrowRight size={16} /></button><button className="button button-line" onClick={onCamera}><CameraIcon size={16} /> Camera</button><button className="button button-line" onClick={onDocument}><FolderOpen size={16} /> Files</button></div>
          <div className="entry-foot"><span>JPG · PNG · WEBP</span><span>Nothing is sent automatically</span></div>
          {image && <ResumeReference image={image} onAssist={onAssist} />}
        </article>

        <article className="entry-card canvas-entry">
          <div className="entry-top"><div className="entry-icon entry-icon-ink"><Pencil size={18} /></div><span className="step-label">02 / START WITH A BLANK CANVAS</span></div>
          <div className="entry-body"><h2>Draw it<br />from the start.</h2><p>Open a blank page and make something with your own hands. No photo needed.</p></div>
          <div className="canvas-preview" aria-hidden="true"><div className="preview-paper"><svg viewBox="0 0 200 92"><path d="M17 71C38 60 38 25 63 26c15 0 19 24 30 21 10-3 9-26 23-26 13 0 13 33 27 34 8 1 19-12 38-6" fill="none" stroke="#23453d" strokeWidth="2.4" strokeLinecap="round"/><path d="M23 77c35-15 92 5 153-6" fill="none" stroke="#cf8168" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="3 5"/></svg><span className="preview-note">a line becomes a thing</span></div></div>
          <div className="entry-actions"><button className="button button-dark" onClick={onNew}><Pencil size={16} /> Open blank canvas <ArrowRight size={16} /></button><span className="offline-chip"><span className="local-dot" /> Works offline</span></div>
          <div className="entry-foot"><span>BRUSHES · LAYERS · UNDO</span><span>Autosaved on your device</span></div>
        </article>
      </section>

      <section className="section-heading"><div><div className="eyebrow">A LITTLE HELP WHEN YOU NEED IT</div><h2>Drawing companions</h2></div><button className="text-button" onClick={onAssist}>Explore image tools <ArrowRight size={15} /></button></section>
      <div className="feature-strip">{FEATURES.slice(0, 4).map((tool) => <button key={tool.id} className="feature-mini" onClick={() => onTool(tool.id)}><span className="mini-glyph">{tool.glyph}</span><b>{tool.title}</b><small>{tool.detail}</small></button>)}</div>

      <section className="section-heading recent-heading"><div><div className="eyebrow">PICK UP WHERE YOU LEFT OFF</div><h2>Recent projects</h2></div><button className="text-button" onClick={onProjects}>See all <ArrowRight size={15} /></button></section>
      {projects.length ? <div className="recent-grid">{projects.slice(0, 3).map((project, index) => <button className="recent-project" key={project.id} onClick={() => onOpen(project.id)}><div className={`recent-thumb thumb-${index}`}><span>{project.width} × {project.height}</span><div className="thumb-drawing"><svg viewBox="0 0 150 85"><path d="M13 65C31 57 28 18 51 22s16 32 29 27 13-31 27-28 11 35 31 26" fill="none" stroke="#39534b" strokeWidth="2.8" strokeLinecap="round" /></svg></div></div><div className="recent-copy"><b>{project.name}</b><small>Saved {niceDate(project.updatedAt)}</small></div></button>)}</div> : <button className="empty-recent" onClick={onNew}><span className="empty-plus"><Plus size={17} /></span><span><b>Your first sketch is waiting</b><small>Start a new drawing. It saves right here, on this device.</small></span><ArrowRight size={16} /></button>}
      <div className="local-note"><div className="note-lock">⌑</div><span><b>Your studio stays yours.</b> Images and drawings are stored on this device. AI analysis only uploads when you choose it.</span><span className="note-online"><span className="local-dot" /> Local tools available</span></div>
    </div>
  );
}

function AssistPage({ image, busy, onPick, onCamera, onDocument, onOpenTool, onUpdateImage, announce }: {
  image: ActiveImage | null; busy: string; onPick: () => void; onCamera: () => void; onDocument: () => void;
  onOpenTool: (id: FeatureId) => void; onUpdateImage: (image: ActiveImage) => Promise<void>; announce: (message: string) => void;
}) {
  const imageUrl = useMemo(() => image ? URL.createObjectURL(image.working) : '', [image]);
  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);
  const [cropOpen, setCropOpen] = useState(false);
  const [left, setLeft] = useState(5); const [top, setTop] = useState(5); const [cropWidth, setCropWidth] = useState(90); const [cropHeight, setCropHeight] = useState(90);
  const [resizeWidth, setResizeWidth] = useState(0); const [resizeHeight, setResizeHeight] = useState(0);

  useEffect(() => { if (image) { setResizeWidth(image.width); setResizeHeight(image.height); } }, [image?.id, image?.width, image?.height]);

  const transform = async (mode: 'rotate-left' | 'rotate-right' | 'crop' | 'resize') => {
    if (!image) return;
    try {
      const bitmap = await createImageBitmap(image.working);
      const output = document.createElement('canvas');
      if (mode === 'rotate-left' || mode === 'rotate-right') {
        output.width = bitmap.height; output.height = bitmap.width;
        const context = output.getContext('2d')!;
        context.translate(output.width / 2, output.height / 2);
        context.rotate(mode === 'rotate-left' ? -Math.PI / 2 : Math.PI / 2);
        context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
      } else if (mode === 'crop') {
        const x = Math.max(0, Math.min(99, left)) / 100 * bitmap.width;
        const y = Math.max(0, Math.min(99, top)) / 100 * bitmap.height;
        const width = Math.max(1, Math.min(100 - left, cropWidth)) / 100 * bitmap.width;
        const height = Math.max(1, Math.min(100 - top, cropHeight)) / 100 * bitmap.height;
        output.width = Math.round(width); output.height = Math.round(height);
        output.getContext('2d')!.drawImage(bitmap, x, y, width, height, 0, 0, output.width, output.height);
      } else {
        const width = Math.max(1, Math.min(12000, resizeWidth));
        const height = Math.max(1, Math.min(12000, resizeHeight));
        output.width = width; output.height = height;
        output.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
      }
      bitmap.close();
      const working = await canvasBlob(output, image.working.type || 'image/png');
      const size = await imageSize(working);
      await onUpdateImage({ ...image, working, width: size.width, height: size.height, isEdited: true, updatedAt: Date.now() });
      setCropOpen(false);
      announce('Updated the working copy. Your original image is unchanged.');
    } catch {
      announce('This edit could not be applied. Try a smaller image.');
    }
  };

  if (!image) return (
    <div className="page-content assist-page">
      <div className="page-intro"><div><div className="eyebrow">A PHOTO IS OPTIONAL FOR DRAWING</div><h1>Bring a reference<br /><em>when you’re ready.</em></h1><p>Choose an image to prepare it for any of the drawing tools below. The selected photo is cached on this device; it is never uploaded automatically.</p></div><div className="intro-stamp"><ImageIcon size={21} /><span>YOUR<br />REFERENCE</span></div></div>
      <div className="import-panel"><div className="import-illustration"><div className="illustration-sheet"><ImageIcon size={34} strokeWidth={1.2} /><span>photo<br />or artwork</span><i /></div><div className="illustration-spark">✳</div></div><div className="import-copy"><div className="eyebrow">SELECT A LOCAL IMAGE</div><h2>Start with something<br />you’d like to draw.</h2><p>JPG, JPEG, PNG and WEBP are supported. Your original stays untouched while you work on a cached copy.</p><div className="import-buttons"><button className="button button-dark" onClick={onPick}>{busy === 'gallery' ? <LoaderCircle className="spin" size={16} /> : <ImageIcon size={16} />} Photo gallery <ArrowRight size={15} /></button><button className="button button-line" onClick={onCamera}><CameraIcon size={16} /> Take a photo</button><button className="button button-line" onClick={onDocument}><FolderOpen size={16} /> Browse files</button></div><small className="permission-copy">The system picker asks only for the image you select. Camera access is requested when you take a photo.</small></div></div>
      <div className="section-heading tools-heading"><div><div className="eyebrow">AVAILABLE AFTER YOU PICK A REFERENCE</div><h2>Eight ways to explore it</h2></div><span className="offline-chip"><span className="local-dot" /> Drawing tools stay local</span></div>
      <FeatureGrid onOpen={onOpenTool} />
    </div>
  );

  return (
    <div className="page-content assist-page">
      <div className="page-intro compact-intro"><div><div className="eyebrow">YOUR REFERENCE IS READY</div><h1>See it a different way.</h1><p>Preview your photo, make a working-copy adjustment, then open a drawing companion.</p></div><button className="button button-line" onClick={onPick}><ImageIcon size={15} /> Change image</button></div>
      <div className="reference-workspace">
        <div className="reference-preview"><div className="reference-preview-bar"><span className="ref-dot" /><span className="ref-dot" /><span className="ref-dot" /><span className="reference-file-name">{image.name}</span><span className="ref-local">● ON DEVICE</span></div><div className="reference-image-stage"><img src={imageUrl} alt="Selected reference image preview" /></div><div className="reference-meta"><span>{image.width} × {image.height} px</span><span>{(image.working.size / 1024 / 1024).toFixed(1)} MB cached</span><span className="original-safe"><Check size={12} /> Original unchanged</span></div></div>
        <div className="reference-controls"><div className="controls-heading"><div><div className="eyebrow">PREPARE A COPY</div><h2>Image adjustments</h2></div><Settings2 size={18} /></div><p>Edits update your in-app copy. The photo in your library is never modified.</p><div className="adjustment-row"><span className="adjust-icon"><RotateCcw size={15} /></span><span><b>Rotate</b><small>Turn the working image</small></span><button className="tiny-icon" aria-label="Rotate left" onClick={() => void transform('rotate-left')}><RotateCcw size={15} /></button><button className="tiny-icon" aria-label="Rotate right" onClick={() => void transform('rotate-right')}><RotateCw size={15} /></button></div><div className="adjustment-row"><span className="adjust-icon"><Crop size={15} /></span><span><b>Crop</b><small>Keep the part you need</small></span><button className="tiny-icon" onClick={() => setCropOpen(!cropOpen)} aria-label="Open crop controls"><ChevronRight size={15} /></button></div>
          {cropOpen && <div className="crop-controls"><div className="crop-input-grid"><label>Left %<input type="number" min="0" max="99" value={left} onChange={(e) => setLeft(Number(e.target.value))} /></label><label>Top %<input type="number" min="0" max="99" value={top} onChange={(e) => setTop(Number(e.target.value))} /></label><label>Width %<input type="number" min="1" max="100" value={cropWidth} onChange={(e) => setCropWidth(Number(e.target.value))} /></label><label>Height %<input type="number" min="1" max="100" value={cropHeight} onChange={(e) => setCropHeight(Number(e.target.value))} /></label></div><button className="button button-dark button-full button-small" onClick={() => void transform('crop')}>Apply crop to copy</button></div>}
          <div className="adjustment-row resize-row"><span className="adjust-icon"><MoveUpRight size={15} /></span><span><b>Resize</b><small>Set working dimensions</small></span></div><div className="resize-inputs"><label>Width<input type="number" min="1" max="12000" value={resizeWidth} onChange={(e) => setResizeWidth(Number(e.target.value))} /></label><span>×</span><label>Height<input type="number" min="1" max="12000" value={resizeHeight} onChange={(e) => setResizeHeight(Number(e.target.value))} /></label><button className="tiny-icon" onClick={() => void transform('resize')} aria-label="Apply resize"><Check size={15} /></button></div>
          <div className="privacy-inline"><span className="local-dot" /><span><b>Private until you choose</b><small>AI analysis uploads only after your tap.</small></span></div>
        </div>
      </div>
      <div className="section-heading tools-heading"><div><div className="eyebrow">WORK FROM THIS IMAGE</div><h2>Choose a drawing companion</h2></div><span className="eight-count">08 TOOLS</span></div>
      <FeatureGrid onOpen={onOpenTool} />
      {image.isEdited && <div className="original-reset"><span>Working copy modified</span><button onClick={() => void (async () => { const size = await imageSize(image.original); await onUpdateImage({ ...image, working: image.original, ...size, updatedAt: Date.now(), isEdited: false }); announce('Restored the working copy from the original.'); })()}>Restore original as working copy</button></div>}
    </div>
  );
}

function FeatureGrid({ onOpen }: { onOpen: (id: FeatureId) => void }) {
  return <div className="feature-grid">{FEATURES.map((item, index) => <button className="feature-card" key={item.id} onClick={() => onOpen(item.id)}><span className={`feature-card-number feature-color-${index}`}>0{index + 1}</span><span className={`feature-card-icon feature-color-${index}`}>{item.glyph}</span><b>{item.title}</b><small>{item.detail}</small><ArrowRight className="feature-arrow" size={15} /></button>)}</div>;
}

function ToolPage({ feature, image, onBack, onPick, announce }: { feature: Feature; image: ActiveImage | null; onBack: () => void; onPick: () => void; announce: (message: string) => void }) {
  const [result, setResult] = useState<Blob | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [palette, setPalette] = useState<string[]>([]);
  const [aiResult, setAiResult] = useState<{ message?: string; tips?: string[]; resultUrl?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const baseUrl = useMemo(() => image ? URL.createObjectURL(image.working) : '', [image]);
  const resultUrl = useMemo(() => result ? URL.createObjectURL(result) : '', [result]);
  useEffect(() => () => { if (baseUrl) URL.revokeObjectURL(baseUrl); if (resultUrl) URL.revokeObjectURL(resultUrl); }, [baseUrl, resultUrl]);

  const createPreview = async () => {
    if (!image) return;
    setBusy(true); setAiResult(null); setAnalysis(''); setPalette([]);
    try {
      const bitmap = await createImageBitmap(image.working);
      const canvas = document.createElement('canvas');
      const limit = 1400; const ratio = Math.min(1, limit / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio)); canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();

      if (feature.id === 'sketch' || feature.id === 'tracing' || feature.id === 'shading') {
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = pixels.data;
        let total = 0; let dark = 0; let light = 0;
        for (let i = 0; i < data.length; i += 4) {
          const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          total += gray; if (gray < 76) dark++; if (gray > 205) light++;
          if (feature.id === 'sketch') {
            const edge = i >= canvas.width * 4 ? Math.abs(gray - (data[i - canvas.width * 4] * 0.299 + data[i - canvas.width * 4 + 1] * 0.587 + data[i - canvas.width * 4 + 2] * 0.114)) : 0;
            const value = Math.min(255, 242 - gray * 0.42 + edge * 0.72);
            data[i] = data[i + 1] = data[i + 2] = Math.max(0, value);
          } else if (feature.id === 'tracing') {
            const value = gray < 132 ? 30 : 245;
            data[i] = data[i + 1] = data[i + 2] = value;
          } else {
            data[i] = data[i + 1] = data[i + 2] = gray;
          }
        }
        ctx.putImageData(pixels, 0, 0);
        if (feature.id === 'shading') {
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, 'rgba(249, 204, 125, .28)'); gradient.addColorStop(.48, 'rgba(255,255,255,0)'); gradient.addColorStop(1, 'rgba(38, 56, 75, .20)');
          ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        setAnalysis(`Average value ${(total / (data.length / 4)).toFixed(0)} / 255 · ${Math.round(dark / (data.length / 4) * 100)}% deep shadow · ${Math.round(light / (data.length / 4) * 100)}% highlights`);
      } else if (feature.id === 'grid') {
        const divisions = 4; ctx.strokeStyle = 'rgba(28, 79, 67, .72)'; ctx.lineWidth = Math.max(1.2, canvas.width / 800); ctx.setLineDash([7, 5]);
        for (let col = 1; col < divisions; col++) { const x = canvas.width * col / divisions; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
        for (let row = 1; row < divisions; row++) { const y = canvas.height * row / divisions; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
        ctx.setLineDash([]); setAnalysis('A 4 × 4 proportional grid is ready. Follow one section at a time, checking where the important edges cross the lines.');
      } else if (feature.id === 'loomis') {
        const cx = canvas.width * .51; const cy = canvas.height * .44; const radius = Math.min(canvas.width, canvas.height) * .24;
        ctx.strokeStyle = 'rgba(30, 86, 74, .8)'; ctx.lineWidth = Math.max(2, canvas.width / 600); ctx.setLineDash([9, 6]);
        ctx.beginPath(); ctx.ellipse(cx, cy, radius * .79, radius, -.12, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - radius * .95, cy); ctx.lineTo(cx + radius * .95, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - radius * 1.2); ctx.lineTo(cx, cy + radius * 1.2); ctx.stroke(); ctx.setLineDash([]);
        setAnalysis('A starter construction guide is placed over the reference. Adjust the sphere and centerline to match the head turn before adding features.');
      } else if (feature.id === 'steps') {
        setAnalysis('1. Block in the biggest silhouette.  2. Mark the center line and major landmarks.  3. Compare width and height before adding details.  4. Group the shadow shapes.  5. Refine only after the proportions feel right.');
      } else if (feature.id === 'analyzer') {
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let total = 0; let shadow = 0; let highlight = 0;
        for (let i = 0; i < pixels.length; i += 4) { const value = pixels[i] * .299 + pixels[i + 1] * .587 + pixels[i + 2] * .114; total += value; if (value < 72) shadow++; if (value > 212) highlight++; }
        setAnalysis(`Image ${image.width} × ${image.height} px · mean value ${(total / (pixels.length / 4)).toFixed(0)} / 255 · shadow mass ${Math.round(shadow / (pixels.length / 4) * 100)}% · light mass ${Math.round(highlight / (pixels.length / 4) * 100)}%. Check the large shapes first, then compare edges and focal contrast.`);
      } else if (feature.id === 'color') {
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data; const buckets = new Map<string, number>();
        for (let i = 0; i < pixels.length; i += Math.max(4, Math.floor(pixels.length / 12000 / 4) * 4)) {
          const r = Math.round(pixels[i] / 32) * 32; const g = Math.round(pixels[i + 1] / 32) * 32; const b = Math.round(pixels[i + 2] / 32) * 32;
          const hex = `#${[r, g, b].map((v) => Math.min(v, 255).toString(16).padStart(2, '0')).join('')}`; buckets.set(hex, (buckets.get(hex) ?? 0) + 1);
        }
        setPalette([...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([hex]) => hex));
        setAnalysis('Sample a large shape from the image, then choose one warmer or cooler color for the focal area.');
      }
      setResult(await canvasBlob(canvas, 'image/png'));
    } catch {
      announce('This local preview could not be created. Try a smaller image.');
    } finally { setBusy(false); }
  };

  const runAI = async () => {
    if (!AI_ENDPOINT || !image) return;
    setBusy(true); setAiResult(null);
    try {
      const body = new FormData(); body.append('image', image.working, image.name); body.append('tool', feature.id);
      const response = await fetch(AI_ENDPOINT, { method: 'POST', body });
      if (!response.ok) throw new Error(`AI service returned ${response.status}.`);
      const data = await response.json() as { message?: string; tips?: string[]; resultUrl?: string };
      setAiResult(data);
    } catch (error) {
      announce(error instanceof Error ? error.message : 'AI analysis is unavailable right now.');
    } finally { setBusy(false); }
  };

  return (
    <div className="page-content tool-page">
      <button className="back-link" onClick={onBack}><ArrowLeft size={15} /> All image tools</button>
      <div className="tool-page-heading"><div><div className="eyebrow">IMAGE DRAWING COMPANION</div><h1>{feature.title}<span className="title-dot">.</span></h1><p>{feature.detail} Your image remains on-device unless you explicitly send it for AI analysis.</p></div><span className="tool-local-tag"><span className="local-dot" /> LOCAL PREVIEW</span></div>
      {!image ? <div className="missing-image"><div className="missing-symbol"><ImageIcon size={27} /></div><h2>Choose an image to begin.</h2><p>This tool works with a local photo or artwork reference.</p><button className="button button-dark" onClick={onPick}><Upload size={15} /> Choose a photo</button></div> : <div className="tool-workbench">
        <div className="tool-image-card"><div className="tool-image-bar"><span>REFERENCE IMAGE</span><span>{image.width} × {image.height}</span></div><div className="tool-image"><img src={resultUrl || baseUrl} alt={`${feature.title} preview`} />{resultUrl && <span className="preview-state">LOCAL PREVIEW</span>}</div><div className="tool-image-footer"><span>{image.name}</span><button className="quiet-button" onClick={onPick}>Change</button></div></div>
        <div className="tool-action-panel"><div className="eyebrow">TRY IT OUT</div><h2>A small first pass.</h2><p>Make a private preview on this device. It won’t overwrite your photo.</p><button className="button button-dark button-full" disabled={busy} onClick={() => void createPreview()}>{busy ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />} {busy ? 'Preparing preview…' : `Create ${feature.title.toLowerCase()} preview`}</button>
          {analysis && <div className="analysis-note"><div className="analysis-heading"><Sparkles size={14} /> Studio notes</div><p>{analysis}</p></div>}
          {palette.length > 0 && <div className="palette-row">{palette.map((color) => <span key={color} style={{ backgroundColor: color }} title={color} onClick={() => navigator.clipboard?.writeText(color)} />)}</div>}
          {result && <button className="button button-line button-full result-download" onClick={() => void downloadBlob(result, `${feature.id}-preview.png`)}><Download size={15} /> Save preview as PNG</button>}
          <div className="ai-connect"><div><b>Use connected AI</b><span>{AI_ENDPOINT ? 'Send this selected image for analysis.' : 'AI service is not connected. Local previews keep working.'}</span></div><button className="button button-light-small" disabled={!AI_ENDPOINT || busy} onClick={() => void runAI()}><WandSparkles size={14} /> Analyze with AI</button></div>
          {aiResult && <div className="analysis-note ai-notes"><div className="analysis-heading"><WandSparkles size={14} /> AI response</div>{aiResult.message && <p>{aiResult.message}</p>}{aiResult.tips?.map((tip, index) => <p key={index} className="ai-tip">{tip}</p>)}{aiResult.resultUrl && <img src={aiResult.resultUrl} alt="AI generated image result" />}</div>}
        </div>
      </div>}
      <div className="privacy-footer"><span className="privacy-lock">⌑</span><span><b>Your choice, every time.</b> Local previews never leave your device. The AI button sends only the selected working copy.</span></div>
    </div>
  );
}

function ProjectsPage({ projects, onNew, onOpen, onDelete }: { projects: StoredProject[]; onNew: () => void; onOpen: (id: string) => void; onDelete: (id: string) => void }) {
  return <div className="page-content projects-page">
    <div className="page-intro project-intro"><div><div className="eyebrow">SAVED LOCALLY</div><h1>Everything you make,<br /><em>kept close.</em></h1><p>Your projects stay on this device, ready to open whenever you come back.</p></div><button className="button button-dark" onClick={onNew}><Plus size={16} /> New drawing</button></div>
    {projects.length ? <div className="project-grid">{projects.map((project, index) => <article className="project-card" key={project.id}><button className={`project-thumbnail project-thumb-${index % 4}`} onClick={() => onOpen(project.id)}><span className="thumb-size">{project.width} × {project.height}</span><div className="project-sketch"><svg viewBox="0 0 180 100"><path d="M16 74C38 68 32 26 59 27c22 0 13 33 34 29 20-4 15-38 34-36 14 1 14 39 37 31" fill="none" stroke="#37584e" strokeWidth="2.5" strokeLinecap="round"/><path d="M22 83c50-14 85 7 135-5" fill="none" stroke="#d58c73" strokeWidth="1.2" strokeDasharray="3 5"/></svg></div></button><div className="project-card-footer"><button onClick={() => onOpen(project.id)}><b>{project.name}</b><small>Last saved {niceDate(project.updatedAt)}</small></button><button className="tiny-icon delete-project" onClick={() => onDelete(project.id)} aria-label={`Delete ${project.name}`}><Trash2 size={15} /></button></div></article>)}</div> : <div className="empty-projects"><div className="empty-project-symbol"><Layers3 size={28} /></div><div className="eyebrow">A FRESH PAGE</div><h2>Nothing saved here yet.</h2><p>Start a drawing and your work will be saved privately on this device.</p><button className="button button-dark" onClick={onNew}><Pencil size={15} /> Open a blank canvas</button></div>}
  </div>;
}

function DrawingStudio({ onCreate, announce, onSaved }: { onCreate: (width?: number, height?: number, name?: string) => void; announce: (message: string) => void; onSaved: () => Promise<void> }) {
  const [project, setProject] = useState<StoredProject | null>(null);
  const [layers, setLayers] = useState<LayerState[]>([]);
  const [activeLayer, setActiveLayer] = useState('');
  const [tool, setTool] = useState<'brush' | 'pencil' | 'eraser' | 'pan'>('brush');
  const [color, setColor] = useState('#25473d');
  const [size, setSize] = useState(9);
  const [zoom, setZoom] = useState(80);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [layersOpen, setLayersOpen] = useState(false);
  const [saveState, setSaveState] = useState('Saved on this device');
  const [dirtyTick, setDirtyTick] = useState(0);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const restored = useRef(new Set<string>());
  const histories = useRef<Record<string, { past: string[]; future: string[] }>>({});
  const drawing = useRef(false);
  const panning = useRef<{ pointerId: number; x: number; y: number; originX: number; originY: number } | null>(null);
  const toolRef = useRef(tool);
  useEffect(() => { toolRef.current = tool; }, [tool]);

  const load = useCallback(async (id: string) => {
    const stored = await getProject(id);
    if (!stored) { announce('This drawing is no longer available.'); return; }
    restored.current.clear();
    histories.current = {};
    setProject(stored);
    setLayers(stored.layers.map((layer) => ({ ...layer })));
    setActiveLayer(stored.layers.find((layer) => layer.visible)?.id ?? stored.layers[0]?.id ?? '');
    setSaveState('Saved on this device');
  }, [announce]);

  useEffect(() => {
    const pendingId = sessionStorage.getItem('artistry-open-project');
    if (pendingId) {
      sessionStorage.removeItem('artistry-open-project');
      void load(pendingId);
    }
    const handleOpen = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (id) void load(id);
    };
    window.addEventListener('artistry-open-project', handleOpen);
    return () => window.removeEventListener('artistry-open-project', handleOpen);
  }, [load]);

  useEffect(() => {
    if (!project) return;
    for (const layer of layers) {
      const canvas = canvasRefs.current[layer.id];
      if (!canvas || restored.current.has(layer.id)) continue;
      restored.current.add(layer.id);
      if (layer.image.size === 0) continue;
      void createImageBitmap(layer.image).then((bitmap) => {
        const context = canvas.getContext('2d');
        if (context) context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
      }).catch(() => announce(`The ${layer.name} layer could not be restored.`));
    }
  }, [layers, project, announce]);

  const makeSnapshot = useCallback(async (current = project, currentLayers = layers) => {
    if (!current) return;
    const savedLayers: StoredLayer[] = [];
    for (const layer of currentLayers) {
      const canvas = canvasRefs.current[layer.id];
      if (!canvas) { savedLayers.push(layer); continue; }
      try { savedLayers.push({ ...layer, image: await canvasBlob(canvas, 'image/png') }); }
      catch { savedLayers.push(layer); }
    }
    const updated: StoredProject = { ...current, layers: savedLayers, updatedAt: Date.now() };
    await saveProject(updated);
    setProject(updated);
    setLayers((existing) => existing.map((layer) => {
      const saved = savedLayers.find((item) => item.id === layer.id);
      return saved ? { ...layer, image: saved.image } : layer;
    }));
    setSaveState('Saved on this device');
    await onSaved();
  }, [layers, onSaved, project]);

  useEffect(() => {
    if (!project || dirtyTick === 0) return;
    setSaveState('Saving…');
    const timeout = window.setTimeout(() => { void makeSnapshot().catch(() => { setSaveState('Save failed'); announce('This drawing could not be saved. Check device storage.'); }); }, 900);
    return () => window.clearTimeout(timeout);
  }, [dirtyTick]);

  const changed = () => { setDirtyTick((tick) => tick + 1); };

  const saveNow = async () => {
    try { await makeSnapshot(); announce('Drawing saved on this device.'); }
    catch { announce('This drawing could not be saved. Check device storage.'); }
  };

  const addLayer = () => {
    const next: LayerState = { id: makeId(), name: `Layer ${layers.length + 1}`, visible: true, image: new Blob() };
    setLayers((current) => [...current, next]); setActiveLayer(next.id); changed();
  };

  const removeLayer = (id: string) => {
    if (layers.length <= 1) return announce('A drawing needs at least one layer.');
    const remaining = layers.filter((layer) => layer.id !== id);
    delete canvasRefs.current[id]; restored.current.delete(id); delete histories.current[id];
    setLayers(remaining); if (activeLayer === id) setActiveLayer(remaining[remaining.length - 1].id); changed();
  };

  const toggleLayer = (id: string) => {
    setLayers((current) => current.map((layer) => layer.id === id ? { ...layer, visible: !layer.visible } : layer)); changed();
  };

  const moveLayer = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction; if (nextIndex < 0 || nextIndex >= layers.length) return;
    const next = [...layers]; [next[index], next[nextIndex]] = [next[nextIndex], next[index]]; setLayers(next); changed();
  };

  const renameLayer = (id: string, name: string) => { setLayers((current) => current.map((layer) => layer.id === id ? { ...layer, name } : layer)); changed(); };

  const pointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!project) return;
    if (toolRef.current === 'pan') return;
    const canvas = event.currentTarget;
    const context = canvas.getContext('2d'); if (!context) return;
    canvas.setPointerCapture(event.pointerId); drawing.current = true;
    const history = histories.current[activeLayer] ?? { past: [], future: [] };
    history.past.push(canvas.toDataURL('image/png')); if (history.past.length > 25) history.past.shift(); history.future = [];
    histories.current[activeLayer] = history;
    const rect = canvas.getBoundingClientRect(); const x = (event.clientX - rect.left) * canvas.width / rect.width; const y = (event.clientY - rect.top) * canvas.height / rect.height;
    context.beginPath(); context.moveTo(x, y); context.lineCap = 'round'; context.lineJoin = 'round';
    context.lineWidth = toolRef.current === 'pencil' ? Math.max(1, size * .52) : size;
    context.strokeStyle = color; context.globalAlpha = toolRef.current === 'pencil' ? .68 : 1;
    context.globalCompositeOperation = toolRef.current === 'eraser' ? 'destination-out' : 'source-over';
    context.lineTo(x + .01, y + .01); context.stroke();
  };

  const pointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = event.currentTarget; const context = canvas.getContext('2d'); if (!context) return;
    const rect = canvas.getBoundingClientRect(); const x = (event.clientX - rect.left) * canvas.width / rect.width; const y = (event.clientY - rect.top) * canvas.height / rect.height;
    context.lineTo(x, y); context.stroke();
  };

  const pointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    const context = event.currentTarget.getContext('2d'); if (context) { context.closePath(); context.globalAlpha = 1; context.globalCompositeOperation = 'source-over'; }
    changed();
  };

  const applyHistory = (direction: 'undo' | 'redo') => {
    const canvas = canvasRefs.current[activeLayer]; const history = histories.current[activeLayer];
    if (!canvas || !history) return;
    const source = direction === 'undo' ? history.past : history.future;
    if (!source.length) return;
    const target = direction === 'undo' ? history.future : history.past;
    target.push(canvas.toDataURL('image/png'));
    const data = source.pop()!; const image = new Image();
    image.onload = () => { const context = canvas.getContext('2d')!; context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0); changed(); };
    image.src = data;
  };

  const exportDrawing = async (format: 'png' | 'jpg') => {
    if (!project) return;
    const output = document.createElement('canvas'); output.width = project.width; output.height = project.height;
    const context = output.getContext('2d')!;
    if (format === 'jpg') { context.fillStyle = '#fff'; context.fillRect(0, 0, output.width, output.height); }
    for (const layer of layers) { const canvas = canvasRefs.current[layer.id]; if (layer.visible && canvas) context.drawImage(canvas, 0, 0); }
    const blob = await canvasBlob(output, format === 'png' ? 'image/png' : 'image/jpeg', .94);
    await downloadBlob(blob, `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'artwork'}.${format}`);
    announce(`${format.toUpperCase()} copy exported. Your project remains saved here.`);
  };

  const startPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (tool !== 'pan' || !(event.target as HTMLElement).closest('.canvas-stack')) return;
    panning.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, originX: pan.x, originY: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const movePan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!panning.current) return;
    setPan({ x: panning.current.originX + event.clientX - panning.current.x, y: panning.current.originY + event.clientY - panning.current.y });
  };
  const endPan = () => { panning.current = null; };

  if (!project) return <div className="studio-loading"><div className="studio-loading-inner"><div className="empty-project-symbol"><Layers3 size={26} /></div><h2>Open your drawing space.</h2><p>Start from a clean canvas or open a project you’ve already saved.</p><button className="button button-dark" onClick={() => onCreate()}><Plus size={15} /> New blank canvas</button><small>Layers, undo and redo, export, and autosave work locally.</small></div></div>;

  return <div className="drawing-studio">
    <div className="studio-toolbar-top"><div className="studio-document-name"><span className="document-mark"><Pencil size={15} /></span><input value={project.name} aria-label="Project name" onChange={(event) => { const name = event.target.value; setProject((current) => current ? { ...current, name } : current); changed(); }} /><span className="save-status"><span className="local-dot" />{saveState}</span></div><div className="studio-top-actions"><button className="icon-button" aria-label="Undo" onClick={() => applyHistory('undo')}><Undo2 size={17} /></button><button className="icon-button" aria-label="Redo" onClick={() => applyHistory('redo')}><Redo2 size={17} /></button><span className="toolbar-divider" /><button className="button button-line button-small" onClick={() => void saveNow()}><Save size={15} /> Save</button><div className="export-wrap"><details><summary className="button button-dark button-small"><Download size={15} /> Export <ChevronDown size={13} /></summary><div className="export-menu"><button onClick={() => void exportDrawing('png')}>Export PNG <small>Transparent background</small></button><button onClick={() => void exportDrawing('jpg')}>Export JPG <small>White background</small></button></div></details></div></div></div>
    <div className="studio-body">
      <aside className="studio-tools"><div className="studio-tool-group"><small>TOOLS</small><button className={`studio-tool ${tool === 'brush' ? 'active' : ''}`} onClick={() => setTool('brush')} title="Brush"><Brush size={18} /><span>Brush</span></button><button className={`studio-tool ${tool === 'pencil' ? 'active' : ''}`} onClick={() => setTool('pencil')} title="Pencil"><Pencil size={18} /><span>Pencil</span></button><button className={`studio-tool ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')} title="Eraser"><Eraser size={18} /><span>Eraser</span></button><button className={`studio-tool ${tool === 'pan' ? 'active' : ''}`} onClick={() => setTool('pan')} title="Pan canvas"><Hand size={18} /><span>Pan</span></button></div>
        <div className="studio-tool-group"><small>COLOR</small><label className="color-control" title="Choose brush color"><input type="color" value={color} onChange={(event) => setColor(event.target.value)} /><span className="color-chip" style={{ backgroundColor: color }}><Palette size={15} /></span><span>Picker</span></label><div className="swatch-row">{['#25473d', '#d17b5c', '#dfb84e', '#25282a', '#707d9a', '#f1e5d1'].map((swatch) => <button key={swatch} style={{ backgroundColor: swatch }} className={color.toLowerCase() === swatch ? 'swatch-selected' : ''} onClick={() => setColor(swatch)} aria-label={`Set color ${swatch}`} />)}</div></div>
        <div className="studio-tool-group size-group"><small>SIZE <b>{size}px</b></small><input aria-label="Brush size" type="range" min="1" max="48" value={size} onChange={(event) => setSize(Number(event.target.value))} /></div>
        <div className="studio-offline"><span className="local-dot" /><small>Offline ready</small></div>
      </aside>
      <div className="canvas-workarea">
        <div className="canvas-toolbar"><span className="canvas-label">CANVAS <i /> {project.width} × {project.height}</span><div className="canvas-view-controls"><button className="tiny-icon" onClick={() => setZoom((value) => Math.max(35, value - 10))} aria-label="Zoom out"><Minus size={14} /></button><input aria-label="Canvas zoom" type="range" min="35" max="150" step="5" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /><span>{zoom}%</span><button className="tiny-icon" onClick={() => setZoom((value) => Math.min(150, value + 10))} aria-label="Zoom in"><Plus size={14} /></button><button className="fit-button" onClick={() => { setZoom(80); setPan({ x: 0, y: 0 }); }}>Fit</button></div></div>
        <div className={`canvas-viewport ${tool === 'pan' ? 'viewport-pan' : ''}`} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan}>
          <div className="canvas-centering" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}><div className="canvas-paper" style={{ width: project.width * zoom / 100, height: project.height * zoom / 100 }}><div className="canvas-stack" style={{ width: project.width, height: project.height, transform: `scale(${zoom / 100})` }}>{layers.map((layer, index) => <canvas key={layer.id} ref={(element) => { canvasRefs.current[layer.id] = element; }} width={project.width} height={project.height} className={`drawing-layer ${activeLayer === layer.id ? 'drawing-layer-active' : ''}`} style={{ zIndex: index + 1, display: layer.visible ? 'block' : 'none', pointerEvents: activeLayer === layer.id && tool !== 'pan' ? 'auto' : 'none', cursor: tool === 'eraser' ? 'cell' : tool === 'pan' ? 'grab' : 'crosshair' }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} />)}</div></div></div>
        </div>
        <div className="canvas-bottom-bar"><span><span className="local-dot" /> Autosaved locally</span><span>Drag to draw <i /> Use the hand tool to move around</span><span>PNG / JPG export</span></div>
      </div>
      <aside className="layers-panel"><div className="layers-heading"><div><small>YOUR PAGE</small><h3>Layers <span>{layers.length}</span></h3></div><button className="tiny-icon" onClick={addLayer} aria-label="Add layer"><Plus size={16} /></button></div><button className="add-layer-button" onClick={addLayer}><Plus size={14} /> Add a layer</button><div className="layer-list">{layers.map((layer, index) => <div key={layer.id} className={`layer-row ${activeLayer === layer.id ? 'layer-active' : ''}`} onClick={() => setActiveLayer(layer.id)}><button className="layer-eye" aria-label={layer.visible ? 'Hide layer' : 'Show layer'} onClick={(event) => { event.stopPropagation(); toggleLayer(layer.id); }}>{layer.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button><span className="layer-preview"><span /></span><input value={layer.name} aria-label="Layer name" onClick={(event) => event.stopPropagation()} onChange={(event) => renameLayer(layer.id, event.target.value)} /><div className="layer-order"><button disabled={index === layers.length - 1} onClick={(event) => { event.stopPropagation(); moveLayer(index, 1); }} aria-label="Move layer down"><ArrowDown size={12} /></button><button disabled={index === 0} onClick={(event) => { event.stopPropagation(); moveLayer(index, -1); }} aria-label="Move layer up"><ArrowUp size={12} /></button></div><button className="layer-delete" onClick={(event) => { event.stopPropagation(); removeLayer(layer.id); }} aria-label="Delete layer"><Trash2 size={13} /></button></div>)}</div><div className="layers-help"><span className="help-spark">✳</span><b>Draw on separate layers.</b><small>Try one layer for loose shapes and another for detail.</small></div></aside>
    </div>
    <div className="studio-mobile-tools"><button onClick={() => setTool('brush')} className={tool === 'brush' ? 'active' : ''}><Brush size={17} />Brush</button><button onClick={() => setTool('pencil')} className={tool === 'pencil' ? 'active' : ''}><Pencil size={17} />Pencil</button><button onClick={() => setTool('eraser')} className={tool === 'eraser' ? 'active' : ''}><Eraser size={17} />Erase</button><button onClick={() => setTool('pan')} className={tool === 'pan' ? 'active' : ''}><Hand size={17} />Pan</button><button onClick={() => setLayersOpen(true)}><Layers3 size={17} />Layers</button><label><input type="color" value={color} onChange={(event) => setColor(event.target.value)} /><Palette size={17} />Color</label></div>
    {layersOpen && <div className="layer-sheet-backdrop" onClick={() => setLayersOpen(false)}><div className="layer-sheet" onClick={(event) => event.stopPropagation()}><div className="layer-sheet-heading"><div><small>YOUR PAGE</small><h3>Layers <span>{layers.length}</span></h3></div><button className="tiny-icon" onClick={() => setLayersOpen(false)} aria-label="Close layers"><X size={17} /></button></div><button className="add-layer-button" onClick={addLayer}><Plus size={14} /> Add a layer</button><div className="layer-sheet-list">{layers.map((layer, index) => <div key={layer.id} className={`layer-row ${activeLayer === layer.id ? 'layer-active' : ''}`} onClick={() => setActiveLayer(layer.id)}><button className="layer-eye" aria-label={layer.visible ? 'Hide layer' : 'Show layer'} onClick={(event) => { event.stopPropagation(); toggleLayer(layer.id); }}>{layer.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button><span className="layer-preview"><span /></span><input value={layer.name} aria-label="Layer name" onClick={(event) => event.stopPropagation()} onChange={(event) => renameLayer(layer.id, event.target.value)} /><div className="layer-order"><button disabled={index === layers.length - 1} onClick={(event) => { event.stopPropagation(); moveLayer(index, 1); }} aria-label="Move layer down"><ArrowDown size={12} /></button><button disabled={index === 0} onClick={(event) => { event.stopPropagation(); moveLayer(index, -1); }} aria-label="Move layer up"><ArrowUp size={12} /></button></div><button className="layer-delete" onClick={(event) => { event.stopPropagation(); removeLayer(layer.id); }} aria-label="Delete layer"><Trash2 size={13} /></button></div>)}</div><p className="layer-sheet-help">Choose a layer to draw on it. Hide a layer to keep it out of your export.</p></div></div>}
  </div>;
}

export default App;


