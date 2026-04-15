import { useState, useEffect, useRef, useCallback, useMemo, useId, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { postSandboxChat, tryQuiloraDeepseek } from '../lib/quiloraEdge';
import { useToast } from '../context/ToastContext';
import { CreditBalanceWidget } from '../components/CreditBalanceWidget';
import { useApp, type User } from '../context/AppContext';
import {
  CC_LIBRARY_ACTIVATION_CREDITS,
  ENTITY_EXTRACT_CONFIRM_CREDITS,
  masteryBlitzCreditCost,
  quiloraDeductCredits,
  sourceUploadCreditCost,
} from '../services/creditService';
import { loadSandboxGraph, useSandboxPersistence, type PersistedCanvasEdge } from '../hooks/useSandboxPersistence';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { LucideIcon } from 'lucide-react';
import { AlignJustify, BookOpen, Bot, Brain, Box, Check, Copy, Download, Eye, FileSearch, FileText, FileUp, GraduationCap, Highlighter, LayoutList, Loader2, Lock, Maximize2, MessageCircle, Mic, Minus, Palette, PanelLeft, Paperclip, Pencil, Plus, Quote, Scissors, Search, Send, Share2, Sparkles, StopCircle, Trophy, Volume2, Wand2, X, ZoomIn, Play, Pause } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { extractPdfWithOcrProgress } from '../utils/pdfTextPipeline';
import type { NodeKind, CanvasNode } from '../lib/canvasNodeModel';
import {
  NODE_LABELS,
  nodeKindFromLabel,
  isNodeKind,
  migrateCanvasNode,
  createCanvasNode,
  BOOKWORM_MAX_FAVORITES,
  getOverlayTileLabel,
  isNodeKindWithOverlay,
  newSourceSystemId,
  inferSourceFileType,
  type SourceArtifact,
  type GhostProposal,
  type LensSubtype,
} from '../lib/canvasNodeModel';
import { initialLensPayload, buildActivatedLensContent, lensActivationCredit, LENS_SUBTYPE_LABELS } from '../lib/lensNodeModel';
import { initialEvidencePayload, buildAnchorFromCorpus, EVIDENCE_ANCHOR_CREDITS } from '../lib/evidenceNodeModel';
import type { CCBookEntry } from '../lib/ccCatalog';
import { NodeKindOverlayPanel } from '../components/canvas/NodeKindOverlayPanel';
import { CanvasBlockChrome } from '../components/canvas/CanvasBlockChrome';
import { BlocksLibraryPanel } from '../components/canvas/BlocksLibraryPanel';
import { ChapterSelectionOverlay } from '../components/canvas/ChapterSelectionOverlay';
import { CCLibraryBrowserPanel } from '../components/canvas/CCLibraryBrowserPanel';
import { SourceBlockChrome } from '../components/canvas/SourceBlockChrome';
import { GhostNodeFrame } from '../components/canvas/GhostNodeFrame';
import { FragmentClipModal } from '../components/canvas/FragmentClipModal';
import { LensBlockChrome } from '../components/canvas/LensBlockChrome';
import { EvidenceBlockChrome } from '../components/canvas/EvidenceBlockChrome';
import { ConnectorBlockChrome } from '../components/canvas/ConnectorBlockChrome';
import { ConnectorPickerEP07 } from '../components/canvas/ConnectorPickerEP07';
import type { ConnectorLinkType } from '../lib/connectorNodeModel';
import {
  CONNECTOR_AI_CREDITS,
  buildConnectorAiPrompt,
  initialConnectorPayload,
  CONNECTOR_LINK_LABELS,
} from '../lib/connectorNodeModel';
import { buildFreestylePromptContext, initialFreestylePayload, FREESTYLE_PROMPT_CREDITS } from '../lib/freestyleNodeModel';
import { FreestyleBlockChrome, FREESTYLE_BUBBLE_DRAG_MIME } from '../components/canvas/FreestyleBlockChrome';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const PDFJS_UNPKG = `https://unpkg.com/pdfjs-dist@${pdfjs.version}`;
const PDF_CMAP_URL = `${PDFJS_UNPKG}/cmaps/`;
const PDF_STANDARD_FONT_URL = `${PDFJS_UNPKG}/standard_fonts/`;

type WorkspaceMode = 'canvass' | 'reading' | 'mastery';
type MasteryView = 'quiz' | 'tutor';
type Phase = 'upload' | 'loading' | 'workspace';
type CanvasEdge = PersistedCanvasEdge & { animated?: boolean };
type LinkPickerState = {
  fromNodeId: string;
  toNodeId: string;
  canvasX: number;
  canvasY: number;
  phase: 'pick' | 'cause_effect';
  reasoningDraft: string;
};
type ConnectDragState = { fromNodeId: string; px: number; py: number };
type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; timestamp: string; pending?: boolean; lensFollowUp?: boolean };
type ReaderTool = 'highlight' | 'notes' | 'block-cutter' | 'lens' | 'share' | null;
type QuizQuestion = { id: string; question: string; options: string[]; correctIndex: number; explanation: string };
type ReaderNote = { id: string; pageId: number; x: number; y: number; text: string };
type ReaderHighlight = { id: string; pageId: number; selectedText: string; color: string };
type SelectionState = { text: string; pageId: number; rect: DOMRect } | null;
type LensBox = { visible: boolean; x: number; y: number; width: number; height: number; pageId: number | null };
type PendingConnection = { nodeId: string; x: number; y: number } | null;

function hasIncomingEvidenceEdge(nodeId: string, edges: CanvasEdge[], nodes: CanvasNode[]): boolean {
  return edges.some((e) => {
    if (e.to !== nodeId) return false;
    return nodes.some((n) => n.id === e.from && n.kind === 'evidence');
  });
}

const READING_SEARCH_COLORS = [
  { id: 'yellow', color: 'rgba(252,211,77,0.35)', label: 'yellow' },
  { id: 'blue', color: 'rgba(59,130,246,0.22)', label: 'blue' },
  { id: 'green', color: 'rgba(52,211,153,0.22)', label: 'green' },
  { id: 'pink', color: 'rgba(236,72,153,0.22)', label: 'pink' },
  { id: 'purple', color: 'rgba(124,58,237,0.22)', label: 'purple' },
];

function escapeRegex(text: string) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function escapeHtml(text: string) { return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function renderParagraphWithHighlights(text: string, pageId: number, search: string, highlights: ReaderHighlight[]) {
  let html = escapeHtml(text);
  const pageHighlights = highlights.filter((highlight) => highlight.pageId === pageId && highlight.selectedText.trim().length > 0);
  pageHighlights.forEach((highlight) => {
    const escaped = escapeRegex(escapeHtml(highlight.selectedText));
    const regex = new RegExp(escaped, 'i');
    html = html.replace(regex, `<span class="rounded px-0.5" style="background:${highlight.color}; color:#0a1929;">${escapeHtml(highlight.selectedText)}</span>`);
  });
  if (search.trim().length > 1) {
    const escapedSearch = escapeRegex(search.trim());
    const searchRegex = new RegExp(`(${escapedSearch})`, 'gi');
    html = html.replace(searchRegex, `<mark class="rounded bg-[#3b82c4]/20 px-0.5 text-[#0f172a]">$1</mark>`);
  }
  return html;
}

const BLUE = { deep: '#0a1929', primary: '#266ba7', primaryHi: '#3b82c4' };
const CHAT_PANEL_MIN = 250;
const CHAT_PANEL_MAX = 600;
const CHAT_COLLAPSE_TAB = 8;
/** MVP EP-03 left rail: Source, Lens, Evidence, Freestyle + locked EP-10 / EP-11 slots (connector/block remain on-canvas kinds only). */
const TOOLBAR_DRAGGABLE: Array<{ id: NodeKind; icon: typeof FileUp }> = [
  { id: 'source', icon: FileUp },
  { id: 'lens', icon: Search },
  { id: 'evidence', icon: FileSearch },
  { id: 'freestyle', icon: Sparkles },
];

const NODE_HELP: Record<NodeKind, { blurb: string; connects: string }> = {
  source: {
    blurb: 'Drop your PDF or topic here so the rest of your map has a clear anchor to build from.',
    connects: 'Connectors · Blocks · Lens nodes',
  },
  connector: {
    blurb: 'Draw a visual link between two ideas so relationships stay obvious as your map grows.',
    connects: 'Usually links two other nodes',
  },
  block: {
    blurb: 'Capture a quote or short passage you want to revisit, cite, or connect to other notes.',
    connects: 'Connectors · Freestyle · Lens',
  },
  freestyle: {
    blurb: 'A freeform note for hypotheses, reminders, or anything that does not need a strict template.',
    connects: 'Connectors · Blocks · Lens',
  },
  lens: {
    blurb: 'Zoom the assistant onto a specific passage so answers stay grounded in that slice of text.',
    connects: 'Often follows a Block or Source selection',
  },
  mastery: {
    blurb: 'Pin a quiz or practice goal on the canvas so study work lives next to your evidence.',
    connects: 'Connectors · Blocks · Tutor flow',
  },
  evidence: {
    blurb: 'Anchor claims in verbatim text, micro-detail search, or frequency views tied to your source.',
    connects: 'Source · Lens · Connectors',
  },
};
const INITIAL_NODES: CanvasNode[] = [];
const INITIAL_EDGES: CanvasEdge[] = [];
const INITIAL_CHAT_MESSAGES: ChatMessage[] = [{ id: 'assistant-welcome', role: 'assistant', content: "Document loaded. Ask anything about your uploaded PDF and I will respond with grounded context.", timestamp: '10:24 AM' }];

/** EP-03 top nav — Canvas + Reading (EP-04 Source “Open Reading”); Mastery / Tutor locked. */
const TOP_MODE_SLOTS: ReadonlyArray<{
  id: string;
  workspace?: WorkspaceMode;
  icon: LucideIcon;
  ariaFull: string;
  comingSoon: null | 'EP-09' | 'EP-10' | 'EP-11';
}> = [
  { id: 'canvas', workspace: 'canvass', icon: Box, ariaFull: 'Canvas Mode', comingSoon: null },
  { id: 'reading', workspace: 'reading', icon: BookOpen, ariaFull: 'Reading Mode', comingSoon: null },
  { id: 'mastery', workspace: 'mastery', icon: Trophy, ariaFull: 'Core Mastery Mode', comingSoon: 'EP-10' },
  { id: 'tutor', icon: GraduationCap, ariaFull: 'Tutor Mode', comingSoon: 'EP-11' },
];

function SandboxTopModeStrip({
  workspaceMode,
  onSelectWorkspace,
  variant = 'canvas',
}: {
  workspaceMode: WorkspaceMode;
  onSelectWorkspace: (mode: WorkspaceMode) => void;
  variant?: 'canvas' | 'reading';
}) {
  const inactiveHover = variant === 'reading' ? 'hover:bg-[#3b82c4]/18' : 'hover:bg-white/6';
  return (
    <div className="flex shrink-0 items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      {TOP_MODE_SLOTS.map((slot, index) => {
        const Icon = slot.icon;
        const locked = slot.comingSoon != null;
        const active = !locked && slot.workspace != null && workspaceMode === slot.workspace;
        return (
          <div key={slot.id} className="relative flex items-center">
            <button
              type="button"
              title={locked ? `Coming soon — ${slot.comingSoon}` : slot.ariaFull}
              onClick={() => {
                if (locked) return;
                if (slot.workspace) onSelectWorkspace(slot.workspace);
              }}
              className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                locked ? 'cursor-not-allowed text-white/40' : active ? 'text-white' : `text-[#d7ebff] ${inactiveHover} hover:text-white`
              }`}
              aria-label={locked ? `${slot.ariaFull} — coming soon (${slot.comingSoon})` : slot.ariaFull}
            >
              <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} />
              {locked ? (
                <Lock
                  className="pointer-events-none absolute right-0.5 top-0.5 h-2.5 w-2.5 text-white/65 drop-shadow-[0_1px_1px_rgba(0,0,0,0.65)]"
                  strokeWidth={2.5}
                  aria-hidden
                />
              ) : null}
              <span
                className={`pointer-events-none absolute bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[#3b82c4] transition-all duration-200 ${active ? 'opacity-100' : 'opacity-0'}`}
              />
            </button>
            {index < TOP_MODE_SLOTS.length - 1 ? <div className="h-5 w-px bg-white/10" /> : null}
          </div>
        );
      })}
    </div>
  );
}

function CanvasMiniMap({
  canvasRef,
  nodes,
  canvasPan,
  canvasScale,
}: {
  canvasRef: RefObject<HTMLDivElement | null>;
  nodes: CanvasNode[];
  canvasPan: { x: number; y: number };
  canvasScale: number;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const onResize = () => setTick((t) => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => {
    setTick((t) => t + 1);
  }, [nodes, canvasPan.x, canvasPan.y, canvasScale]);

  const el = canvasRef.current;
  const vw = el?.clientWidth ?? 0;
  const vh = el?.clientHeight ?? 0;
  const layout = useMemo(() => {
    if (!nodes.length || vw < 32) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    }
    const pad = 96;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;
    const bw = Math.max(320, maxX - minX);
    const bh = Math.max(240, maxY - minY);
    const mapW = 120;
    const mapH = 76;
    const s = Math.min(mapW / bw, mapH / bh);
    return { minX, minY, s, mapW, mapH, bw, bh };
  }, [nodes, vw]);

  if (!layout || !vw) return null;

  const { minX, minY, s, mapW, mapH } = layout;
  const viewW = vw / canvasScale;
  const viewH = (vh > 8 ? vh : vw * 0.62) / canvasScale;
  const viewX = -canvasPan.x / canvasScale;
  const viewY = -canvasPan.y / canvasScale;
  const boxLeft = (viewX - minX) * s;
  const boxTop = (viewY - minY) * s;
  const boxW = viewW * s;
  const boxH = viewH * s;

  return (
    <div
      className="pointer-events-none absolute bottom-14 left-3 z-[5] hidden rounded-xl border border-[#1e3a5f]/90 bg-[#0a1628]/95 p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:bottom-16 sm:left-4 sm:block"
      aria-hidden
    >
      <div className="relative overflow-hidden rounded-lg bg-[#e2e8f0]/25" style={{ width: mapW, height: mapH }}>
        <div
          className="absolute rounded border border-[#266ba7]/80 bg-[#266ba7]/15"
          style={{
            left: clamp(boxLeft, 0, mapW - 4),
            top: clamp(boxTop, 0, mapH - 4),
            width: Math.max(8, Math.min(boxW, mapW)),
            height: Math.max(8, Math.min(boxH, mapH)),
          }}
        />
        {nodes.map((n) => {
          const cx = (n.x + n.width / 2 - minX) * s;
          const cy = (n.y + n.height / 2 - minY) * s;
          return (
            <div
              key={n.id}
              className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#266ba7]"
              style={{ left: cx, top: cy }}
            />
          );
        })}
      </div>
      <p className="mt-1 text-center text-[9px] font-medium uppercase tracking-wide text-white/40">Map</p>
    </div>
  );
}

function SandboxHeaderProfileButton({ user }: { user: User | null }) {
  const initials = useMemo(() => {
    const src = (user?.name || user?.email || '?').trim();
    const parts = src.split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && parts[0][0] && parts[1][0]) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return src.slice(0, 2).toUpperCase() || '?';
  }, [user?.name, user?.email]);
  const title = user?.name?.trim() || user?.email || 'Account settings';
  return (
    <Link
      to="/settings"
      title={title}
      aria-label="Profile and account settings"
      className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[#0d1f33] text-xs font-bold text-white/90 transition-colors hover:border-[#266ba7]/40 hover:bg-[#266ba7]/20"
    >
      {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
      {user?.genesisBadge ? (
        <span
          className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-400 px-0.5 text-[8px] font-bold leading-none text-[#0a1929] shadow"
          aria-label="Genesis tier"
        >
          G
        </span>
      ) : null}
    </Link>
  );
}

function getNowTime() { return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function getNodeCenter(node: CanvasNode) { return { x: node.x + node.width / 2, y: node.y + node.height / 2 }; }
function getEdgePath(from: CanvasNode, to: CanvasNode) {
  const s = getNodeCenter(from);
  const e = getNodeCenter(to);
  const offset = 120;
  const c1x = s.x;
  const c1y = s.y + offset;
  const c2x = e.x;
  const c2y = e.y - offset;
  return `M ${s.x} ${s.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${e.x} ${e.y}`;
}

function getNodeConnectTail(node: CanvasNode) {
  return { x: node.x + node.width / 2, y: node.y + node.height };
}

function findNodeAtCanvasPoint(canvasX: number, canvasY: number, excludeId: string, list: CanvasNode[]): string | null {
  for (let i = list.length - 1; i >= 0; i--) {
    const n = list[i];
    if (n.id === excludeId || n.kind === 'connector') continue;
    if (canvasX >= n.x && canvasX <= n.x + n.width && canvasY >= n.y && canvasY <= n.y + n.height) return n.id;
  }
  return null;
}

function expandDeadNodesForDelete(prev: CanvasNode[], seed: Iterable<string>): Set<string> {
  const dead = new Set(seed);
  let added = true;
  while (added) {
    added = false;
    prev.forEach((n) => {
      if (dead.has(n.id)) return;
      if (n.kind !== 'connector' || !n.connectorPayload) return;
      const { endpointFromId, endpointToId } = n.connectorPayload;
      if (dead.has(endpointFromId) || dead.has(endpointToId)) {
        dead.add(n.id);
        added = true;
      }
    });
  }
  return dead;
}

function edgeInvolvesConnectorNode(edge: CanvasEdge, nodes: CanvasNode[]): boolean {
  const a = nodes.find((n) => n.id === edge.from);
  const b = nodes.find((n) => n.id === edge.to);
  return a?.kind === 'connector' || b?.kind === 'connector';
}

function buildDocumentContextExcerpt(pageTextByPage: Record<number, string>, maxChars: number) {
  const parts = Object.keys(pageTextByPage)
    .map(Number)
    .sort((a, b) => a - b)
    .map((n) => pageTextByPage[n]?.trim())
    .filter(Boolean) as string[];
  const joined = parts.join('\n\n');
  if (joined.length <= maxChars) return joined;
  return `${joined.slice(0, maxChars)}\n…`;
}

/** Keeps edge payloads smaller to avoid timeouts / relay issues when sending long PDF extracts. */
const CHAT_CONTEXT_MAX_CHARS = 24_000;
const LENS_CONTEXT_MAX_CHARS = 12_000;
const QUIZ_CONTEXT_MAX_CHARS = 60_000;

/** Object path inside the `pdfs` bucket from a Supabase Storage object URL, if recognizable. */
function pdfsObjectPathFromStorageUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    const m = u.pathname.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/pdfs\/(.+)$/i);
    if (!m?.[1]) return null;
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

const LOADER_STATUS_LINES = [
  'Uploading your material...',
  'Analyzing content...',
  'Building your Sandbox...',
] as const;

/** Sandboxes row id from Supabase is a UUID; local-only sandboxes use `local-…` and must not hit remote tables. */
function isSupabaseSandboxRowId(id: string): boolean {
  if (!id || id.startsWith('local-')) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

async function extractPdfTextWithProgress(
  file: File,
  onProgress: (fraction: number) => void,
  signal: AbortSignal,
  onPageText?: (pageNum: number, text: string) => void,
): Promise<{ map: Record<number, string>; title: string | null; numPages: number }> {
  const data = await file.arrayBuffer();
  if (signal.aborted) return { map: {}, title: null, numPages: 0 };
  return extractPdfWithOcrProgress(data, { onProgress, onPageText, signal });
}

function LazyReadingPageSection({
  pageId,
  scale,
  rootRef,
  setPageRef,
  active,
  pageNotes,
  onOpenNote,
}: {
  pageId: number;
  scale: number;
  rootRef: React.RefObject<HTMLDivElement | null>;
  setPageRef: (id: number, el: HTMLDivElement | null) => void;
  active: boolean;
  pageNotes: ReaderNote[];
  onOpenNote: (note: ReaderNote) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [renderPage, setRenderPage] = useState(false);
  useEffect(() => {
    const root = rootRef.current;
    const el = wrapRef.current;
    if (!el || !root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setRenderPage(true);
        });
      },
      { root, rootMargin: '240% 0px', threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootRef]);
  return (
    <section
      data-page-id={pageId}
      ref={(element) => {
        wrapRef.current = element;
        setPageRef(pageId, element);
      }}
      className={`relative mx-auto w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-white px-4 py-8 shadow-[0_30px_70px_rgba(15,23,42,0.12)] sm:px-8 sm:py-10 md:px-10 md:py-12 ${active ? 'ring-1 ring-[#3b82c4]/35' : ''}`}
    >
      {renderPage ? (
        <Page pageNumber={pageId} scale={scale} renderTextLayer renderAnnotationLayer className="pdf-page text-[#0f172a]" />
      ) : (
        <div className="flex min-h-[min(1056px,85vh)] w-full items-center justify-center rounded-2xl bg-[#f1f5f9]/80 text-sm text-[#64748b]" aria-hidden>
          Page {pageId}
        </div>
      )}
      {pageNotes.map((note) => (
        <button key={note.id} type="button" title={note.text} onClick={(clickEvent) => { clickEvent.stopPropagation(); onOpenNote(note); }} className="absolute z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#3b82c4]/40 bg-[#0f4b8a]/95 text-white shadow-[0_8px_24px_rgba(15,75,138,0.35)] transition-transform hover:scale-110" style={{ left: note.x, top: note.y }} aria-label="Edit margin note">
          <Pencil className="h-4 w-4" />
        </button>
      ))}
      <div className="mt-8 flex justify-center text-sm text-[#475569]">Page {pageId}</div>
    </section>
  );
}

function NodeToolbar({
  disabled,
  variant = 'vertical',
  onChooseNodeKind,
}: {
  disabled?: boolean;
  variant?: 'vertical' | 'horizontal';
  onChooseNodeKind?: (kind: NodeKind) => void;
}) {
  const [tip, setTip] = useState<{ kind: NodeKind; top: number; left: number } | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const dragStartedRef = useRef(false);

  const clearHideTimer = () => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const showTip = (kind: NodeKind, rect: DOMRect) => {
    clearHideTimer();
    const gap = 14;
    const width = 232;
    const left = Math.min(rect.right + gap, window.innerWidth - width - 8);
    const approxHeight = 168;
    const top = clamp(rect.top + rect.height / 2 - approxHeight / 2, 8, window.innerHeight - approxHeight - 8);
    setTip({ kind, left, top });
  };

  const scheduleHide = () => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setTip(null);
      hideTimerRef.current = null;
    }, 160);
  };

  useEffect(() => () => clearHideTimer(), []);

  const tipKind = tip?.kind;
  const help = tipKind ? NODE_HELP[tipKind] : null;
  const tipLabel = tipKind ? NODE_LABELS[tipKind] : '';

  const isHorizontal = variant === 'horizontal';
  return (
    <>
      <div
        className={
          isHorizontal
            ? `flex max-w-full flex-none flex-row items-center gap-2 overflow-x-auto overscroll-x-contain rounded-2xl border border-white/12 bg-[#0d1f33]/95 px-2 py-2 shadow-[0_-12px_40px_rgba(10,25,41,0.35)] backdrop-blur-xl scrollbar-thin [-webkit-overflow-scrolling:touch] ${disabled ? 'pointer-events-none opacity-40' : ''}`
            : `flex w-[4.75rem] shrink-0 flex-col items-center gap-4 rounded-[2rem] border border-white/12 bg-[#0d1f33]/95 px-2 py-5 shadow-[0_24px_60px_rgba(10,25,41,0.24)] backdrop-blur-xl ${disabled ? 'pointer-events-none opacity-40' : ''}`
        }
      >
        {TOOLBAR_DRAGGABLE.map(({ id, icon: Icon }) => (
          <div key={id} className="relative shrink-0">
            <button
              type="button"
              draggable
              onDragStart={(event) => {
                dragStartedRef.current = true;
                event.dataTransfer.setData('nodeType', NODE_LABELS[id]);
                event.dataTransfer.effectAllowed = 'copy';
              }}
              onDragEnd={() => {
                window.setTimeout(() => {
                  dragStartedRef.current = false;
                }, 0);
              }}
              onClick={() => {
                if (dragStartedRef.current) return;
                onChooseNodeKind?.(id);
              }}
              onMouseEnter={(event) => showTip(id, event.currentTarget.getBoundingClientRect())}
              onMouseLeave={scheduleHide}
              className="flex h-11 min-h-[44px] w-11 min-w-[44px] touch-manipulation items-center justify-center rounded-2xl border border-transparent bg-white/[0.04] text-[#c7e3ff] transition-all duration-200 hover:border-[#3b82c4]/35 hover:bg-[#266ba7]/18 hover:text-white hover:shadow-[0_0_24px_rgba(59,130,196,0.22)]"
              aria-label={NODE_LABELS[id]}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
        ))}
        <div className={`shrink-0 bg-white/10 ${isHorizontal ? 'mx-1 hidden min-h-[44px] w-px min-[480px]:block' : 'h-px w-8'}`} role="separator" aria-hidden />
        <div className={isHorizontal ? 'flex shrink-0 flex-row items-center gap-2' : 'flex shrink-0 flex-col items-center gap-2'}>
          <button
            type="button"
            disabled
            title="Coming soon — Core Mastery (EP-10)"
            aria-label="Core Mastery — coming soon"
            className="relative flex h-11 min-h-[44px] w-11 min-w-[44px] cursor-not-allowed touch-manipulation items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-white/35 opacity-80"
          >
            <Brain className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            <Lock className="pointer-events-none absolute right-0.5 top-0.5 h-2.5 w-2.5 text-white/50" strokeWidth={2.5} aria-hidden />
          </button>
          <button
            type="button"
            disabled
            title="Coming soon — Tutor Mode (EP-11)"
            aria-label="Tutor Mode — coming soon"
            className="relative flex h-11 min-h-[44px] w-11 min-w-[44px] cursor-not-allowed touch-manipulation items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-white/35 opacity-80"
          >
            <GraduationCap className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            <Lock className="pointer-events-none absolute right-0.5 top-0.5 h-2.5 w-2.5 text-white/50" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      </div>
      {tip && help && tipLabel && typeof document !== 'undefined' && createPortal(
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[600] w-[232px] rounded-xl border border-white/10 bg-[#061528] p-3.5 text-left shadow-[0_24px_55px_rgba(0,0,0,0.55)] transition-opacity duration-200"
          style={{ left: tip.left, top: tip.top }}
        >
          <p className="text-sm font-bold text-white">{tipLabel}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/65">{help.blurb}</p>
          <p className="mt-2.5 border-t border-white/10 pt-2 text-[10px] font-semibold uppercase tracking-wide text-[#7bbdf3]/90">Typical links</p>
          <p className="mt-0.5 text-xs text-white/55">{help.connects}</p>
        </div>,
        document.body,
      )}
    </>
  );
}

function UploadScreen({ fileName, isDragging, onBrowse, onUpload, onDrop, onDragOver, onDragLeave }: { fileName: string | null; isDragging: boolean; onBrowse: () => void; onUpload: () => void; onDrop: (event: React.DragEvent<HTMLDivElement>) => void; onDragOver: (event: React.DragEvent<HTMLDivElement>) => void; onDragLeave: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a1929] px-6 text-white">
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">Upload your Book or PDF</h1>
        <p className="mt-4 text-base text-white/65">Add your material to start building your Sandbox</p>
        <div role="button" tabIndex={0} onClick={onBrowse} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onBrowse(); } }} className={`mt-10 flex min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed px-8 py-10 transition-all ${isDragging ? 'border-[#3b82c4] bg-[#266ba7]/12 shadow-[0_0_40px_rgba(59,130,196,0.16)]' : 'border-[#266ba7]/60 bg-[#0d1f33]'}`}>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#266ba7]/14 text-[#7bbdf3]"><FileUp className="h-10 w-10" /></div>
          <p className="mt-6 text-lg font-semibold text-white">{fileName ?? 'Drag and drop your PDF here or click to browse'}</p>
          {fileName && <p className="mt-2 text-sm text-[#9bcfff]">Ready to upload</p>}
        </div>
        <button type="button" onClick={onUpload} className="mt-8 rounded-full bg-[#266ba7] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3b82c4]">Upload</button>
        <p className="mt-4 text-sm text-white/45">Supports PDF and EPUB formats</p>
      </div>
    </div>
  );
}

function LoadingScreen({
  exiting,
  onFadeOutComplete,
  progress,
  activeStage,
}: {
  exiting: boolean;
  onFadeOutComplete: () => void;
  progress: number;
  activeStage: number;
}) {
  const line = LOADER_STATUS_LINES[Math.min(activeStage, LOADER_STATUS_LINES.length - 1)] ?? LOADER_STATUS_LINES[0];
  const pct = Math.round(clamp(progress, 0, 1) * 100);
  const fadeDoneRef = useRef(false);

  useEffect(() => {
    if (!exiting) {
      fadeDoneRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      if (fadeDoneRef.current) return;
      fadeDoneRef.current = true;
      onFadeOutComplete();
    }, 750);
    return () => window.clearTimeout(timer);
  }, [exiting, onFadeOutComplete]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#0a1929] px-6 text-white transition-opacity duration-500 ease-out"
      style={{ opacity: exiting ? 0 : 1 }}
      onTransitionEnd={(event) => {
        if (event.propertyName !== 'opacity' || !exiting || fadeDoneRef.current) return;
        fadeDoneRef.current = true;
        onFadeOutComplete();
      }}
    >
      <div className="flex max-w-md flex-col items-center text-center">
        <Loader2 className="h-14 w-14 animate-spin text-[#266ba7]" strokeWidth={2} aria-hidden />
        <p className="mt-10 text-lg font-semibold text-white">{line}</p>
        <p className="mt-2 text-sm text-white/50">{pct}%</p>
        <div className="mt-8 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#266ba7] to-[#3b82c4] transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ReadingChatPanel({
  immersiveHidden,
  messages,
  inputValue,
  isSending,
  onInputChange,
  onSend,
  onQuickAction,
  onLensFollowUp,
  viewingPage,
  documentName,
  endRef,
}: {
  immersiveHidden: boolean;
  messages: ChatMessage[];
  inputValue: string;
  isSending: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onQuickAction: (prompt: string) => void;
  onLensFollowUp: (prompt: string) => void;
  viewingPage: number;
  documentName: string;
  endRef: React.RefObject<HTMLDivElement | null>;
}) {
  const panelHidden = immersiveHidden;
  return (
    <aside
      className={`relative z-20 flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border-l border-white/10 bg-gradient-to-b from-[#0d1f33] via-[#0b1a2b] to-[#091523] shadow-[0_26px_80px_rgba(10,25,41,0.24)] transition-opacity duration-200 ${panelHidden ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
    >
      <div className="flex items-start gap-3 border-b border-white/10 px-5 py-4">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#266ba7]/18 text-[#6eb6ff] ring-1 ring-[#3b82c4]/25"><Sparkles className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">Document Assistant</h2>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-white/55"><span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" /><span>Active · {documentName}</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 border-b border-[#3b82c4]/20 bg-[#ddecff] px-5 py-2.5 text-xs font-medium text-[#1e5a8f]">
        <BookOpen className="h-3.5 w-3.5" />
        <span>Viewing page {viewingPage} — context loaded</span>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6">
        {messages.map((message) => (
          <div key={message.id} className={`space-y-2 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[88%] items-start gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${message.role === 'user' ? 'bg-[#266ba7] text-white' : 'bg-[#091523] text-[#77b8f2] ring-1 ring-white/10'}`}>
                  {message.role === 'user' ? <MessageCircle className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                </div>
                <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-3xl px-4 py-3.5 text-sm leading-7 shadow-sm ${message.role === 'user' ? 'rounded-tr-md bg-[#266ba7] text-white' : 'rounded-tl-md bg-white text-[#0a1929]'}`}>
                    <span className="whitespace-pre-wrap">{message.content}</span>
                    {message.role === 'assistant' && message.pending && (
                      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#266ba7]" aria-hidden />
                    )}
                  </div>
                  <div className={`mt-1 px-1 text-[11px] text-white/35 ${message.role === 'user' ? 'text-right' : ''}`}>{message.timestamp}</div>
                </div>
              </div>
            </div>
            {message.role === 'assistant' && message.lensFollowUp && message.content && !message.pending && (
              <div className="flex flex-wrap gap-2 pl-10">
                <button type="button" onClick={() => onLensFollowUp("Explain it like I'm 5.")} className="rounded-full border border-[#3b82c4]/40 bg-[#266ba7]/12 px-3 py-1.5 text-xs font-semibold text-[#9bcfff] transition-colors hover:bg-[#266ba7]/22">
                  Explain it like I&apos;m 5
                </button>
                <button type="button" onClick={() => onLensFollowUp('Go deeper on this passage.')} className="rounded-full border border-[#3b82c4]/40 bg-[#266ba7]/12 px-3 py-1.5 text-xs font-semibold text-[#9bcfff] transition-colors hover:bg-[#266ba7]/22">
                  Go deeper
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="border-t border-white/10 px-5 py-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {['Summarize this page', 'List key figures', 'Explain risks'].map((label) => (
            <button key={label} type="button" onClick={() => onQuickAction(label)} className="rounded-full border border-[#3b82c4]/35 px-3 py-1.5 text-xs font-medium text-[#9bcfff] transition-colors hover:bg-[#266ba7]/14">
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-[1.4rem] border border-white/10 bg-[#081827] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <Paperclip className="ml-1 h-4 w-4 shrink-0 text-white/40" />
          <input type="text" value={inputValue} onChange={(event) => onInputChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSend(); } }} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40" placeholder="Ask about the document..." />
          <button type="button" className="text-white/40"><Mic className="h-4 w-4" /></button>
          <button type="button" onClick={onSend} disabled={isSending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#266ba7] text-white transition-colors hover:bg-[#3b82c4] disabled:cursor-not-allowed disabled:bg-[#266ba7]/55" aria-label="Send">
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-white/35">Powered by Document AI · Responses may not be fully accurate.</p>
      </div>
    </aside>
  );
}

function CanvasAssistantPanel({ documentName, viewingPage, messages, inputValue, isSending, onInputChange, onSend, onQuickAction, endRef }: { documentName: string; viewingPage: number; messages: ChatMessage[]; inputValue: string; isSending: boolean; onInputChange: (value: string) => void; onSend: () => void; onQuickAction: (prompt: string) => void; endRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <aside className="pointer-events-auto z-20 flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border-l border-white/10 bg-gradient-to-b from-[#0d1f33] via-[#0b1a2b] to-[#091523] shadow-[0_26px_80px_rgba(10,25,41,0.24)]">
      <div className="flex items-start gap-3 border-b border-white/10 px-5 py-4"><div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#266ba7]/18 text-[#6eb6ff] ring-1 ring-[#3b82c4]/25"><Sparkles className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-bold tracking-tight text-white">Document Assistant</h2><div className="mt-1 flex items-center gap-1.5 text-xs text-white/55"><span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" /><span className="truncate">Active · {documentName}</span></div></div></div></div></div>
      <div className="flex items-center gap-2 border-b border-[#3b82c4]/20 bg-[#ddecff] px-5 py-2.5 text-xs font-medium text-[#1e5a8f]"><BookOpen className="h-3.5 w-3.5" /><span>Viewing page {viewingPage} — context loaded</span></div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[88%] items-start gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${message.role === 'user' ? 'bg-[#266ba7] text-white' : 'bg-[#091523] text-[#77b8f2] ring-1 ring-white/10'}`}>{message.role === 'user' ? <MessageCircle className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}</div>
              <div className={message.role === 'user' ? 'items-end' : 'items-start'}>
                <div className={`rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${message.role === 'user' ? 'rounded-tr-md bg-[#266ba7] text-white' : 'rounded-tl-md bg-white text-[#0a1929]'}`}>{message.content || (message.pending ? '...' : '')}</div>
                <div className={`mt-1 px-1 text-[11px] text-white/35 ${message.role === 'user' ? 'text-right' : ''}`}>{message.timestamp}</div>
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="border-t border-white/10 px-5 py-4">
        <div className="mb-3 flex flex-wrap gap-2">{['Summarize this page', 'List key figures', 'Explain risks'].map((label) => <button key={label} type="button" onClick={() => onQuickAction(label)} className="rounded-full border border-[#3b82c4]/35 px-3 py-1.5 text-xs font-medium text-[#9bcfff] transition-colors hover:bg-[#266ba7]/14">{label}</button>)}</div>
        <div className="flex items-center gap-2 rounded-[1.4rem] border border-white/12 bg-white px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"><Mic className="ml-1 h-4 w-4 shrink-0 text-[#94a3b8]" /><input type="text" value={inputValue} onChange={(event) => onInputChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSend(); } }} className="min-w-0 flex-1 bg-transparent text-sm text-[#0a1929] outline-none placeholder:text-[#94a3b8]" placeholder="Ask about the document..." /><button type="button" onClick={onSend} disabled={isSending} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#266ba7] text-white transition-colors hover:bg-[#3b82c4] disabled:cursor-not-allowed disabled:bg-[#266ba7]/55" aria-label="Send"><Send className="h-4 w-4" /></button></div>
        <p className="mt-2 text-center text-[11px] text-white/35">Powered by Document AI - Responses may not be fully accurate</p>
      </div>
    </aside>
  );
}

export function SandboxExperience() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { user } = useApp();
  const [phase, setPhase] = useState<Phase>('upload');
  const [loaderExiting, setLoaderExiting] = useState(false);
  const [workspaceEnter, setWorkspaceEnter] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeSandboxName, setActiveSandboxName] = useState('Sandbox');
  const [activeSandboxId, setActiveSandboxId] = useState<string | null>(null);
  const [canvasReadOnly, setCanvasReadOnly] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('canvass');
  const [masteryView, setMasteryView] = useState<MasteryView>('tutor');
  const [canvasChatWidth, setCanvasChatWidth] = useState(380);
  const [canvasChatCollapsed, setCanvasChatCollapsed] = useState(false);
  const canvasChatPrevWidthRef = useRef(380);
  const canvasChatDragRef = useRef<{ startX: number; startW: number; collapsed: boolean } | null>(null);
  const [difficulty, setDifficulty] = useState<'Normal' | 'Hard' | 'Ranking'>('Normal');
  const [questionCount, setQuestionCount] = useState(10);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  type QuizWrongEntry = { question: string; userAnswer: string; correctAnswer: string; explanation: string };
  const [quizWrongAnswers, setQuizWrongAnswers] = useState<QuizWrongEntry[]>([]);
  const [quizSkipped, setQuizSkipped] = useState(0);
  const [hardSecondsLeft, setHardSecondsLeft] = useState<number | null>(null);
  const quizSelectedRef = useRef<number | null>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragNodeOffset, setDragNodeOffset] = useState({ x: 0, y: 0 });
  const [pendingConnection, setPendingConnection] = useState<PendingConnection>(null);
  const [attachEvidenceForBlockId, setAttachEvidenceForBlockId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(() => new Set());
  const [connectDrag, setConnectDrag] = useState<ConnectDragState | null>(null);
  const [linkPicker, setLinkPicker] = useState<LinkPickerState | null>(null);
  const [causeAiBusy, setCauseAiBusy] = useState(false);
  const [freestyleSendingId, setFreestyleSendingId] = useState<string | null>(null);
  const [viewVisible, setViewVisible] = useState(true);
  const [nodes, setNodes] = useState<CanvasNode[]>(INITIAL_NODES);
  const nodesRef = useRef(nodes);
  const canvasPanRef = useRef(canvasPan);
  const canvasScaleRef = useRef(canvasScale);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    canvasPanRef.current = canvasPan;
  }, [canvasPan]);
  useEffect(() => {
    canvasScaleRef.current = canvasScale;
  }, [canvasScale]);
  const [nodeOverlayKind, setNodeOverlayKind] = useState<NodeKind | null>(null);
  const [blocksPanelOpen, setBlocksPanelOpen] = useState(false);
  const [blocksSearch, setBlocksSearch] = useState('');
  const [ccLibraryOpen, setCcLibraryOpen] = useState(false);
  const [fragmentModalOpen, setFragmentModalOpen] = useState(false);
  const [chapterOverlay, setChapterOverlay] = useState<{
    totalPages: number;
    targetSourceId: string | null;
    initialSelected: number[] | null;
    placeAt: { x: number; y: number } | null;
  } | null>(null);
  const resizeDragRef = useRef<{ nodeId: string; startW: number; startH: number; startMx: number; startMy: number } | null>(null);
  const [edges, setEdges] = useState<CanvasEdge[]>(INITIAL_EDGES);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [readingChatMessages, setReadingChatMessages] = useState<ChatMessage[]>([
    { id: 'assistant-welcome', role: 'assistant', content: 'Document context loaded. Ask anything about this PDF.', timestamp: '10:24 AM' },
  ]);
  const [readingChatInput, setReadingChatInput] = useState('');
  const [readingIsSending, setReadingIsSending] = useState(false);
  const [readingSearch, setReadingSearch] = useState('');
  const [readingSearchMatches, setReadingSearchMatches] = useState<HTMLElement[]>([]);
  const [readingSearchMatchIndex, setReadingSearchMatchIndex] = useState(0);
  const [activeReadingPage, setActiveReadingPage] = useState(1);
  const [readingZoom, setReadingZoom] = useState(100);
  const [readerTool, setReaderTool] = useState<ReaderTool>(null);
  const [readerHighlightColor, setReaderHighlightColor] = useState(READING_SEARCH_COLORS[0].color);
  const [readerHighlights, setReaderHighlights] = useState<ReaderHighlight[]>([]);
  const [readerNotes, setReaderNotes] = useState<ReaderNote[]>([]);
  const [readerSelection, setReaderSelection] = useState<SelectionState>(null);
  const [readerSelectionColorPicker, setReaderSelectionColorPicker] = useState(false);
  const [readerNoteDraft, setReaderNoteDraft] = useState<{ pageId: number; x: number; y: number; text: string; visible: boolean; noteId?: string }>({ pageId: 0, x: 0, y: 0, text: '', visible: false });
  const [readerLensBox, setReaderLensBox] = useState<LensBox>({ visible: false, x: 0, y: 0, width: 0, height: 0, pageId: null });
  const [readingChatWidth, setReadingChatWidth] = useState(380);
  const [readingChatCollapsed, setReadingChatCollapsed] = useState(false);
  const readingChatPrevWidthRef = useRef(380);
  const readingChatDragRef = useRef<{ startX: number; startW: number; collapsed: boolean } | null>(null);
  const [readingImmersive, setReadingImmersive] = useState(false);
  const isLgUp = useMediaQuery('(min-width: 1024px)');
  const [mobileReadingPagesOpen, setMobileReadingPagesOpen] = useState(false);
  const [readingMobileToolsOpen, setReadingMobileToolsOpen] = useState(false);
  const [readingFocusY, setReadingFocusY] = useState<number | null>(null);
  const [readingTtsActive, setReadingTtsActive] = useState(false);
  const [readingTtsPlaying, setReadingTtsPlaying] = useState(false);
  const [readingTtsIndex, setReadingTtsIndex] = useState(0);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [pdfDocumentKey, setPdfDocumentKey] = useState(0);
  const pdfLoadAttemptRef = useRef(0);
  const [blockCutterPrompt, setBlockCutterPrompt] = useState<{ text: string; pageId: number } | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pageTextByPage, setPageTextByPage] = useState<Record<number, string>>({});
  const [pdfDocumentTitle, setPdfDocumentTitle] = useState<string | null>(null);
  const markerId = useId().replace(/:/g, '');
  const [tutorMessages, setTutorMessages] = useState<ChatMessage[]>([]);
  const [tutorInput, setTutorInput] = useState('');
  const [tutorSending, setTutorSending] = useState(false);
  const [pendingSessionPromise, setPendingSessionPromise] = useState<Promise<string | null> | null>(null);

  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const touchModeRef = useRef<'pan' | 'pinch' | null>(null);
  const pinchRef = useRef({ distance: 0, scale: 1 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceEp4FileInputRef = useRef<HTMLInputElement>(null);
  const sourceUploadCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const readingChatEndRef = useRef<HTMLDivElement>(null);
  const readingViewerRef = useRef<HTMLDivElement>(null);
  const readingZoomBarRef = useRef<HTMLDivElement>(null);
  const tutorEndRef = useRef<HTMLDivElement>(null);
  const hardTimerFireRef = useRef(false);
  const readingSelectRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const ttsIntervalRef = useRef<number | null>(null);
  const extractionAbortRef = useRef<AbortController | null>(null);
  const loaderRingIntervalRef = useRef<number | null>(null);

  const [loaderProgress, setLoaderProgress] = useState(0);
  const [loaderActiveStage, setLoaderActiveStage] = useState(0);

  useSandboxPersistence({
    sandboxId: activeSandboxId,
    userId: user?.id,
    nodes,
    edges,
    readerHighlights,
    readerNotes,
  });

  const patchNode = useCallback((id: string, patch: Partial<CanvasNode>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  const deleteNode = useCallback((id: string) => {
    const prev = nodesRef.current;
    const dead = expandDeadNodesForDelete(prev, [id]);
    setNodes((nprev) => nprev.filter((n) => !dead.has(n.id)));
    setEdges((eprev) => eprev.filter((e) => !dead.has(e.from) && !dead.has(e.to)));
    setSelectedNodeIds((s) => {
      const next = new Set(s);
      dead.forEach((d) => next.delete(d));
      return next;
    });
  }, []);

  const duplicateNode = useCallback(
    (id: string) => {
      const src = nodes.find((n) => n.id === id);
      if (!src) return;
      const dup = createCanvasNode({
        kind: src.kind,
        label: `${src.label} (copy)`,
        x: src.x + 36,
        y: src.y + 36,
        width: src.width,
        height: src.height,
        title: `${src.title} (copy)`,
        body: src.body,
        colorId: src.colorId,
        tags: [...src.tags],
        favorite: false,
        tileVariant: src.tileVariant,
        originSandboxId: src.originSandboxId ?? activeSandboxId,
        sourceArtifact: src.sourceArtifact
          ? { ...src.sourceArtifact, sourceSystemId: newSourceSystemId() }
          : null,
        ghostProposal: src.ghostProposal ? { ...src.ghostProposal } : null,
        lensPayload: src.lensPayload ? (JSON.parse(JSON.stringify(src.lensPayload)) as NonNullable<CanvasNode['lensPayload']>) : null,
        evidencePayload: src.evidencePayload
          ? (JSON.parse(JSON.stringify(src.evidencePayload)) as NonNullable<CanvasNode['evidencePayload']>)
          : null,
        connectorPayload: src.connectorPayload
          ? (JSON.parse(JSON.stringify(src.connectorPayload)) as NonNullable<CanvasNode['connectorPayload']>)
          : null,
        freestylePayload: src.freestylePayload
          ? (JSON.parse(JSON.stringify(src.freestylePayload)) as NonNullable<CanvasNode['freestylePayload']>)
          : null,
      });
      setNodes((prev) => [...prev, dup]);
    },
    [nodes, activeSandboxId],
  );

  const toggleBlockFavorite = useCallback(
    (id: string, next: boolean) => {
      const bookworm = user?.profileTier === 'bookworm' || user?.profileTier === undefined;
      if (next && bookworm) {
        const count = nodes.filter((n) => n.favorite).length;
        const was = nodes.find((n) => n.id === id)?.favorite;
        if (!was && count >= BOOKWORM_MAX_FAVORITES) {
          showToast(`Bookworm allows up to ${BOOKWORM_MAX_FAVORITES} favorites.`, 'warning');
          return;
        }
      }
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, favorite: next } : n)));
    },
    [nodes, user?.profileTier, showToast],
  );

  const onResizePointerDown = useCallback(
    (event: React.MouseEvent, nodeId: string) => {
      event.preventDefault();
      event.stopPropagation();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      resizeDragRef.current = {
        nodeId,
        startW: node.width,
        startH: node.height,
        startMx: event.clientX,
        startMy: event.clientY,
      };
    },
    [nodes],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const r = resizeDragRef.current;
      if (!r) return;
      const dx = (e.clientX - r.startMx) / canvasScale;
      const dy = (e.clientY - r.startMy) / canvasScale;
      setNodes((prev) =>
        prev.map((n) =>
          n.id === r.nodeId ? { ...n, width: Math.max(160, r.startW + dx), height: Math.max(96, r.startH + dy) } : n,
        ),
      );
    };
    const onUp = () => {
      resizeDragRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [canvasScale]);

  const handleSourceEp4File = useCallback(
    async (file: File) => {
      const pos = sourceUploadCanvasPosRef.current;
      sourceUploadCanvasPosRef.current = null;
      const el = canvasRef.current;
      const cx = pos?.x ?? (el ? (el.clientWidth / 2 - canvasPan.x) / canvasScale - 100 : 140);
      const cy = pos?.y ?? (el ? (el.clientHeight / 2 - canvasPan.y) / canvasScale - 70 : 140);
      setSelectedFile(file);
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      let numPages = 0;
      let extractedTitle: string | null = null;
      const map: Record<number, string> = {};
      if (isPdf) {
        const ac = new AbortController();
        try {
          const r = await extractPdfTextWithProgress(file, () => {}, ac.signal);
          Object.assign(map, r.map);
          numPages = r.numPages > 0 ? r.numPages : Object.keys(r.map).length;
          extractedTitle = r.title;
        } catch {
          /* ignore */
        }
      }
      setPageTextByPage(map);
      if (extractedTitle) setPdfDocumentTitle(extractedTitle);
      setPdfPageCount(numPages > 0 ? numPages : Object.keys(map).length);
      const artifact: SourceArtifact = {
        fileType: inferSourceFileType(file),
        uploadedAt: new Date().toISOString(),
        totalPdfPages: (numPages || Object.keys(map).length) || undefined,
        chapterSelectedPageIndices: null,
        linkedFileName: file.name,
        sourceSystemId: newSourceSystemId(),
      };
      const displayTitle = (extractedTitle || file.name.replace(/\.(pdf|epub)$/i, '') || 'Source').slice(0, 200);
      setNodes((prev) => [
        ...prev,
        createCanvasNode({
          kind: 'source',
          label: file.name.slice(0, 120),
          x: cx,
          y: cy,
          width: 300,
          height: 220,
          title: displayTitle,
          tileVariant: 'upload',
          sourceArtifact: artifact,
        }),
      ]);
      showToast('Source block added from file', 'success');
    },
    [canvasPan.x, canvasPan.y, canvasScale, showToast],
  );

  const handleCcLibraryActivate = useCallback(
    async (book: CCBookEntry) => {
      if (canvasReadOnly) {
        showToast('Sandbox is read-only.', 'warning');
        return;
      }
      const el = canvasRef.current;
      const cx = el ? (el.clientWidth / 2 - canvasPan.x) / canvasScale - 100 : 140;
      const cy = el ? (el.clientHeight / 2 - canvasPan.y) / canvasScale - 70 : 140;
      const creditRes = await quiloraDeductCredits({
        amount: CC_LIBRARY_ACTIVATION_CREDITS,
        eventType: 'library_activation',
        sandboxId: activeSandboxId && isSupabaseSandboxRowId(activeSandboxId) ? activeSandboxId : null,
        metadata: { title: book.title, author: book.author },
        idempotencyKey: `cc_act_${activeSandboxId ?? 'local'}_${book.id}_${Date.now()}`,
      });
      if (!creditRes.ok) {
        showToast(creditRes.message || 'Could not activate title.', 'warning');
        return;
      }
      const artifact: SourceArtifact = {
        fileType: 'text',
        uploadedAt: new Date().toISOString(),
        linkedFileName: book.title,
        sourceSystemId: newSourceSystemId(),
      };
      setNodes((prev) => [
        ...prev,
        createCanvasNode({
          kind: 'source',
          label: book.title.slice(0, 120),
          x: cx,
          y: cy,
          width: 300,
          height: 220,
          title: book.title,
          body: `${book.title} — ${book.author} (CC catalog, MVP placeholder).`,
          tileVariant: 'cc_library',
          sourceArtifact: artifact,
        }),
      ]);
      setCcLibraryOpen(false);
      showToast('Source added from CC Library (5 cr).', 'success');
    },
    [activeSandboxId, canvasPan.x, canvasPan.y, canvasReadOnly, canvasScale, showToast],
  );

  const handleFragmentClipSubmit = useCallback(
    (title: string, body: string) => {
      const pos = sourceUploadCanvasPosRef.current;
      sourceUploadCanvasPosRef.current = null;
      const el = canvasRef.current;
      const cx = pos?.x ?? (el ? (el.clientWidth / 2 - canvasPan.x) / canvasScale - 100 : 140);
      const cy = pos?.y ?? (el ? (el.clientHeight / 2 - canvasPan.y) / canvasScale - 70 : 140);
      const artifact: SourceArtifact = {
        fileType: 'text',
        uploadedAt: new Date().toISOString(),
        linkedFileName: null,
        sourceSystemId: newSourceSystemId(),
      };
      setNodes((prev) => [
        ...prev,
        createCanvasNode({
          kind: 'source',
          label: title.slice(0, 120),
          x: cx,
          y: cy,
          title,
          body,
          tileVariant: 'fragment',
          sourceArtifact: artifact,
          width: 280,
          height: 200,
        }),
      ]);
      setFragmentModalOpen(false);
      showToast('Fragment Source added.', 'success');
    },
    [canvasPan.x, canvasPan.y, canvasScale, showToast],
  );

  const handleChapterOverlayConfirm = useCallback(
    (pages: number[]) => {
      const ctx = chapterOverlay;
      setChapterOverlay(null);
      if (!ctx) return;
      if (ctx.targetSourceId) {
        setNodes((prev) =>
          prev.map((n) => {
            if (n.id !== ctx.targetSourceId || !n.sourceArtifact) return n;
            return {
              ...n,
              sourceArtifact: {
                ...n.sourceArtifact,
                chapterSelectedPageIndices: pages,
                totalPdfPages: ctx.totalPages,
              },
            };
          }),
        );
        showToast('Chapters updated for Source.', 'success');
      } else if (ctx.placeAt) {
        const artifact: SourceArtifact = {
          fileType: 'pdf',
          uploadedAt: new Date().toISOString(),
          totalPdfPages: ctx.totalPages,
          chapterSelectedPageIndices: pages,
          linkedFileName: selectedFile?.name ?? null,
          sourceSystemId: newSourceSystemId(),
        };
        setNodes((prev) => [
          ...prev,
          createCanvasNode({
            kind: 'source',
            label: (selectedFile?.name || 'PDF chapters').slice(0, 120),
            x: ctx.placeAt!.x,
            y: ctx.placeAt!.y,
            width: 300,
            height: 220,
            title: `Chapters (${pages.length})`,
            body: `Pages: ${pages.join(', ')}`,
            tileVariant: 'chapter_split',
            sourceArtifact: artifact,
          }),
        ]);
        showToast('Source created from chapter selection.', 'success');
      }
    },
    [chapterOverlay, selectedFile?.name, showToast],
  );

  const confirmGhostNode = useCallback(
    async (nodeId: string) => {
      const n = nodes.find((x) => x.id === nodeId);
      if (!n?.ghostProposal) return;
      if (canvasReadOnly) {
        showToast('Read-only sandbox.', 'warning');
        return;
      }
      const res = await quiloraDeductCredits({
        amount: ENTITY_EXTRACT_CONFIRM_CREDITS,
        eventType: 'entity_extract_confirm',
        sandboxId: activeSandboxId && isSupabaseSandboxRowId(activeSandboxId) ? activeSandboxId : null,
        idempotencyKey: `ghost_${nodeId}_${Date.now()}`,
        metadata: { entity: n.ghostProposal.entityLabel, type: n.ghostProposal.entityType },
      });
      if (!res.ok) {
        showToast(res.message || 'Insufficient credits.', 'warning');
        return;
      }
      patchNode(nodeId, {
        ghostProposal: null,
        kind: 'block',
        title: n.ghostProposal.entityLabel,
        body: `Confirmed ${n.ghostProposal.entityType} linked to source.`,
        tileVariant: 'entity-confirmed',
      });
      showToast('Entity confirmed (3 cr).', 'success');
    },
    [nodes, activeSandboxId, canvasReadOnly, patchNode, showToast],
  );

  const runLensActivation = useCallback(
    async (lensNode: CanvasNode, sourceTitle: string) => {
      const lp = lensNode.lensPayload;
      if (!lp || lp.subtype === 'persona') return;
      if (canvasReadOnly) {
        patchNode(lensNode.id, { lensPayload: { ...lp, loading: false } });
        showToast('Read-only sandbox.', 'warning');
        return;
      }
      const cost = lensActivationCredit(lp.subtype);
      const res = await quiloraDeductCredits({
        amount: cost,
        eventType: 'lens_activation',
        sandboxId: activeSandboxId && isSupabaseSandboxRowId(activeSandboxId) ? activeSandboxId : null,
        idempotencyKey: `lens_${lensNode.id}_${lp.subtype}_${Date.now()}`,
        metadata: { lensSubtype: lp.subtype },
      });
      if (!res.ok) {
        patchNode(lensNode.id, { lensPayload: { ...lp, loading: false } });
        showToast(res.message || 'Insufficient credits for lens.', 'warning');
        return;
      }
      await new Promise((r) => setTimeout(r, 500));
      const excerpt = buildDocumentContextExcerpt(pageTextByPage, LENS_CONTEXT_MAX_CHARS);
      const built = buildActivatedLensContent(lp.subtype, { sourceTitle, documentExcerpt: excerpt });
      patchNode(lensNode.id, {
        lensPayload: { ...lp, ...built },
        body: built.outputBody.slice(0, 480),
      });
      showToast(`Lens activated — ${cost} credits deducted.`, 'success');
    },
    [activeSandboxId, canvasReadOnly, pageTextByPage, patchNode, showToast],
  );

  const handlePersonaLensSubmit = useCallback(
    async (nodeId: string, characterName: string) => {
      const n = nodes.find((x) => x.id === nodeId);
      if (!n?.lensPayload || n.lensPayload.subtype !== 'persona') return;
      if (canvasReadOnly) {
        showToast('Read-only sandbox.', 'warning');
        return;
      }
      const lp = n.lensPayload;
      const src = nodes.find((s) => s.id === lp.linkedSourceNodeId);
      const sourceTitle = src?.title || src?.label || 'Source';
      patchNode(nodeId, { lensPayload: { ...lp, loading: true } });
      const cost = lensActivationCredit('persona');
      const res = await quiloraDeductCredits({
        amount: cost,
        eventType: 'lens_activation',
        sandboxId: activeSandboxId && isSupabaseSandboxRowId(activeSandboxId) ? activeSandboxId : null,
        idempotencyKey: `lens_persona_${nodeId}_${Date.now()}`,
        metadata: { characterName },
      });
      if (!res.ok) {
        patchNode(nodeId, { lensPayload: { ...lp, loading: false } });
        showToast(res.message || 'Insufficient credits for lens.', 'warning');
        return;
      }
      await new Promise((r) => setTimeout(r, 450));
      const excerpt = buildDocumentContextExcerpt(pageTextByPage, LENS_CONTEXT_MAX_CHARS);
      const built = buildActivatedLensContent('persona', { sourceTitle, documentExcerpt: excerpt, characterName });
      patchNode(nodeId, {
        lensPayload: { ...lp, ...built },
        body: built.outputBody.slice(0, 480),
      });
      showToast(`Lens activated — ${cost} credits deducted.`, 'success');
    },
    [activeSandboxId, canvasReadOnly, nodes, pageTextByPage, patchNode, showToast],
  );

  const runEvidenceActivation = useCallback(
    async (evidenceNode: CanvasNode, sourceTitle: string) => {
      const ep = evidenceNode.evidencePayload;
      if (!ep || canvasReadOnly) return;
      if (ep.subtype !== 'anchor') {
        patchNode(evidenceNode.id, { evidencePayload: { ...ep, loading: false } });
        return;
      }
      const cost = EVIDENCE_ANCHOR_CREDITS;
      const res = await quiloraDeductCredits({
        amount: cost,
        eventType: 'evidence_anchor',
        sandboxId: activeSandboxId && isSupabaseSandboxRowId(activeSandboxId) ? activeSandboxId : null,
        idempotencyKey: `ev_anchor_${evidenceNode.id}_${Date.now()}`,
        metadata: { evidenceSubtype: ep.subtype },
      });
      if (!res.ok) {
        patchNode(evidenceNode.id, { evidencePayload: { ...ep, loading: false } });
        showToast(res.message || 'Insufficient credits for evidence anchor.', 'warning');
        return;
      }
      const anchor = buildAnchorFromCorpus(sourceTitle, pageTextByPage);
      patchNode(evidenceNode.id, {
        evidencePayload: {
          ...ep,
          loading: false,
          ...anchor,
          anchorCreditsDebited: cost,
        },
        body: anchor.verbatimQuote.slice(0, 400),
      });
      showToast(`Evidence anchor — ${cost} credits deducted.`, 'success');
    },
    [activeSandboxId, canvasReadOnly, pageTextByPage, patchNode, showToast],
  );

  const evidenceMicroSearchPaid = useCallback(
    async (nodeId: string) => {
      if (canvasReadOnly) {
        showToast('Read-only sandbox.', 'warning');
        return false;
      }
      const res = await quiloraDeductCredits({
        amount: 2,
        eventType: 'evidence_micro_search',
        sandboxId: activeSandboxId && isSupabaseSandboxRowId(activeSandboxId) ? activeSandboxId : null,
        idempotencyKey: `ev_micro_${nodeId}_${Date.now()}`,
        metadata: {},
      });
      if (!res.ok) {
        showToast(res.message || 'Insufficient credits for micro-detail search.', 'warning');
        return false;
      }
      return true;
    },
    [activeSandboxId, canvasReadOnly, showToast],
  );

  const isUnanchoredClaimNode = useCallback(
    (node: CanvasNode) => {
      if (node.kind === 'freestyle') return false;
      if (node.kind !== 'block') return false;
      if (node.ghostProposal) return false;
      const meaningful = (node.body ?? '').trim().length >= 28 || (node.title ?? '').trim().length >= 20;
      if (!meaningful) return false;
      return !hasIncomingEvidenceEdge(node.id, edges, nodes);
    },
    [edges, nodes],
  );

  const handleOverlayTilePick = useCallback(
    (tileId: string) => {
      if (!nodeOverlayKind || !isNodeKindWithOverlay(nodeOverlayKind)) {
        setNodeOverlayKind(null);
        return;
      }
      const el = canvasRef.current;
      const cx = el ? (el.clientWidth / 2 - canvasPan.x) / canvasScale - 100 : 140;
      const cy = el ? (el.clientHeight / 2 - canvasPan.y) / canvasScale - 70 : 140;
      const tileLabel = getOverlayTileLabel(nodeOverlayKind, tileId);
      const kind = nodeOverlayKind;

      if (kind === 'source') {
        setNodeOverlayKind(null);
        if (tileId === 'upload') {
          sourceUploadCanvasPosRef.current = { x: cx, y: cy };
          sourceEp4FileInputRef.current?.click();
          return;
        }
        if (tileId === 'cc_library') {
          setCcLibraryOpen(true);
          return;
        }
        if (tileId === 'chapter_split') {
          const pages = pdfPageCount > 0 ? pdfPageCount : selectedFile?.type === 'application/pdf' ? 1 : 0;
          if (!selectedFile || pages < 2) {
            showToast('Add a multi-page PDF to this sandbox first.', 'warning');
            return;
          }
          setChapterOverlay({
            totalPages: Math.max(2, pages),
            targetSourceId: null,
            initialSelected: null,
            placeAt: { x: cx, y: cy },
          });
          return;
        }
        if (tileId === 'fragment') {
          sourceUploadCanvasPosRef.current = { x: cx, y: cy };
          setFragmentModalOpen(true);
          return;
        }
        if (tileId === 'entity') {
          const src = [...nodes].reverse().find((node) => node.kind === 'source' && node.sourceArtifact);
          if (!src?.sourceArtifact) {
            showToast('Add a Source block first.', 'warning');
            return;
          }
          const proposals: GhostProposal[] = [
            { entityLabel: 'Key figure (detected)', entityType: 'person', linkedSourceNodeId: src.id },
            { entityLabel: 'Primary setting (detected)', entityType: 'location', linkedSourceNodeId: src.id },
            { entityLabel: 'Narrative anchor date (detected)', entityType: 'date', linkedSourceNodeId: src.id },
          ];
          setNodes((prev) => {
            const next = [...prev];
            proposals.forEach((gp, i) => {
              next.push(
                createCanvasNode({
                  kind: 'block',
                  label: `Ghost · ${gp.entityType}`,
                  x: cx + i * 28,
                  y: cy + i * 36,
                  width: 220,
                  height: 168,
                  title: gp.entityLabel,
                  body: 'Provisional entity extraction — confirm or dismiss.',
                  tileVariant: 'ghost',
                  ghostProposal: gp,
                  colorId: 'violet',
                }),
              );
            });
            return next;
          });
          showToast('Ghost nodes placed — confirm (3 cr each) or dismiss.', 'success');
          return;
        }
      }

      if (kind === 'lens') {
        setNodeOverlayKind(null);
        const src = [...nodes].reverse().find((node) => node.kind === 'source' && node.sourceArtifact);
        if (!src?.sourceArtifact) {
          showToast('Add a Source block first to ground the Lens.', 'warning');
          return;
        }
        const subtype = tileId as LensSubtype;
        const sourceTitle = src.title || src.label;
        const initial = initialLensPayload(subtype, src.id, sourceTitle);
        const lensNode = createCanvasNode({
          kind: 'lens',
          label: `Lens · ${getOverlayTileLabel('lens', tileId)}`,
          x: cx,
          y: cy,
          width: subtype === 'plot_events' ? 360 : 320,
          height: subtype === 'plot_events' ? 440 : subtype === 'persona' ? 380 : 320,
          title: NODE_LABELS.lens,
          tileVariant: tileId,
          colorId: 'violet',
          lensPayload: initial,
        });
        setNodes((prev) => [...prev, lensNode]);
        if (subtype !== 'persona') {
          void runLensActivation(lensNode, sourceTitle);
        }
        return;
      }

      if (kind === 'evidence') {
        setNodeOverlayKind(null);
        const src = [...nodes].reverse().find((node) => node.kind === 'source' && node.sourceArtifact);
        if (!src?.sourceArtifact) {
          showToast('Add a Source block first to ground Evidence.', 'warning');
          return;
        }
        const subtype =
          tileId === 'micro_search' ? 'micro_search' : tileId === 'frequency' ? 'frequency' : 'anchor';
        const sourceTitle = src.title || src.label;
        const initial = initialEvidencePayload(subtype, src.id, sourceTitle);
        const sizes =
          subtype === 'frequency'
            ? { width: 340, height: 360 }
            : subtype === 'micro_search'
              ? { width: 320, height: 400 }
              : { width: 320, height: 380 };
        const evidenceNode = createCanvasNode({
          kind: 'evidence',
          label: `Evidence · ${getOverlayTileLabel('evidence', tileId)}`,
          x: cx,
          y: cy,
          width: sizes.width,
          height: sizes.height,
          title: NODE_LABELS.evidence,
          tileVariant: tileId,
          colorId: 'violet',
          evidencePayload: initial,
        });
        setNodes((prev) => [...prev, evidenceNode]);
        if (subtype === 'anchor') {
          void runEvidenceActivation(evidenceNode, sourceTitle);
        }
        return;
      }

      if (kind === 'freestyle') {
        setNodeOverlayKind(null);
        if (tileId === 'connected') {
          const src = [...nodes].reverse().find((node) => node.kind === 'source' && node.sourceArtifact);
          if (!src?.sourceArtifact) {
            showToast('Add a Source block first to use Connected mode.', 'warning');
            return;
          }
          const sourceTitle = src.title || src.label;
          const freestyleNode = createCanvasNode({
            kind: 'freestyle',
            label: `Freestyle · ${getOverlayTileLabel('freestyle', tileId)}`,
            x: cx,
            y: cy,
            width: 340,
            height: 440,
            title: NODE_LABELS.freestyle,
            tileVariant: tileId,
            colorId: 'amber',
            freestylePayload: initialFreestylePayload('connected', src.id, sourceTitle),
          });
          setNodes((prev) => [...prev, freestyleNode]);
          return;
        }
        const freestyleNode = createCanvasNode({
          kind: 'freestyle',
          label: `Freestyle · ${getOverlayTileLabel('freestyle', tileId)}`,
          x: cx,
          y: cy,
          width: 320,
          height: 420,
          title: NODE_LABELS.freestyle,
          tileVariant: tileId,
          colorId: 'amber',
          freestylePayload: initialFreestylePayload('standalone', null, ''),
        });
        setNodes((prev) => [...prev, freestyleNode]);
        return;
      }

      const label = `${NODE_LABELS[kind]} · ${tileLabel}`;
      setNodes((prev) => [...prev, createCanvasNode({ kind, label, x: cx, y: cy, title: tileLabel, tileVariant: tileId })]);
      setNodeOverlayKind(null);
    },
    [
      nodeOverlayKind,
      canvasPan.x,
      canvasPan.y,
      canvasScale,
      nodes,
      pdfPageCount,
      runLensActivation,
      runEvidenceActivation,
      selectedFile,
      showToast,
    ],
  );

  const duplicateFromLibrary = useCallback(
    (node: CanvasNode) => {
      const dup = createCanvasNode({
        kind: node.kind,
        label: `${node.label} (copy)`,
        x: node.x + 48,
        y: node.y + 48,
        width: node.width,
        height: node.height,
        title: `${node.title} (copy)`,
        body: node.body,
        colorId: node.colorId,
        tags: [...node.tags],
        favorite: false,
        tileVariant: node.tileVariant,
        originSandboxId: node.originSandboxId ?? activeSandboxId,
        sourceArtifact: node.sourceArtifact
          ? { ...node.sourceArtifact, sourceSystemId: newSourceSystemId() }
          : null,
        ghostProposal: node.ghostProposal ? { ...node.ghostProposal } : null,
        lensPayload: node.lensPayload ? (JSON.parse(JSON.stringify(node.lensPayload)) as NonNullable<CanvasNode['lensPayload']>) : null,
        evidencePayload: node.evidencePayload
          ? (JSON.parse(JSON.stringify(node.evidencePayload)) as NonNullable<CanvasNode['evidencePayload']>)
          : null,
        connectorPayload: node.connectorPayload
          ? (JSON.parse(JSON.stringify(node.connectorPayload)) as NonNullable<CanvasNode['connectorPayload']>)
          : null,
        freestylePayload: node.freestylePayload
          ? (JSON.parse(JSON.stringify(node.freestylePayload)) as NonNullable<CanvasNode['freestylePayload']>)
          : null,
      });
      setNodes((prev) => [...prev, dup]);
      showToast('Duplicate placed on canvas', 'success');
    },
    [activeSandboxId, showToast],
  );

  const focusNodeOnCanvas = useCallback(
    (id: string) => {
      const n = nodes.find((x) => x.id === id);
      const el = canvasRef.current;
      if (!n || !el) return;
      const targetX = el.clientWidth / 2 - (n.x + n.width / 2) * canvasScale;
      const targetY = el.clientHeight / 2 - (n.y + n.height / 2) * canvasScale;
      setCanvasPan({ x: targetX, y: targetY });
      setBlocksPanelOpen(false);
    },
    [nodes, canvasScale],
  );

  const isBookwormTier = user?.profileTier === 'bookworm' || user?.profileTier === undefined;

  const toggleNodeSelected = useCallback((id: string) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const multiSelectBounds = useMemo(() => {
    if (selectedNodeIds.size < 2) return null;
    const sel = nodes.filter((n) => selectedNodeIds.has(n.id));
    if (!sel.length) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    sel.forEach((n) => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    });
    return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, top: minY };
  }, [nodes, selectedNodeIds]);

  const onMultiGroup = useCallback(() => {
    setNodes((prev) =>
      prev.map((n) => (selectedNodeIds.has(n.id) ? { ...n, tags: [...new Set([...n.tags, 'group'])] } : n)),
    );
    showToast('Grouped selected blocks.', 'success');
  }, [selectedNodeIds, showToast]);

  const onMultiDelete = useCallback(() => {
    if (selectedNodeIds.size === 0) return;
    const dead = expandDeadNodesForDelete(nodesRef.current, selectedNodeIds);
    setNodes((prev) => prev.filter((n) => !dead.has(n.id)));
    setEdges((prev) => prev.filter((e) => !dead.has(e.from) && !dead.has(e.to)));
    setSelectedNodeIds(new Set());
  }, [selectedNodeIds]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, canvasChatWidth, canvasChatCollapsed]);
  useEffect(() => { readingChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [readingChatMessages, readingChatWidth, readingChatCollapsed]);
  useEffect(() => { tutorEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [tutorMessages, masteryView]);

  useEffect(() => {
    return () => {
      extractionAbortRef.current?.abort();
      extractionAbortRef.current = null;
      if (loaderRingIntervalRef.current) window.clearInterval(loaderRingIntervalRef.current);
      loaderRingIntervalRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (phase === 'loading') return;
    extractionAbortRef.current?.abort();
    extractionAbortRef.current = null;
    if (loaderRingIntervalRef.current) window.clearInterval(loaderRingIntervalRef.current);
    loaderRingIntervalRef.current = null;
  }, [phase]);

  useEffect(() => {
    setQuizIndex(0);
    setQuizSelectedOption(null);
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizComplete(false);
    setQuizWrongAnswers([]);
    setQuizSkipped(0);
    setHardSecondsLeft(null);
  }, [difficulty, questionCount]);

  useEffect(() => {
    quizSelectedRef.current = quizSelectedOption;
  }, [quizSelectedOption]);

  useEffect(() => {
    setPdfPageCount(0);
    setActiveReadingPage(1);
    setPageTextByPage({});
    setPdfDocumentTitle(null);
  }, [selectedFile]);

  useEffect(() => {
    if (phase !== 'workspace' || !selectedFile) return;
    if (selectedFile.type !== 'application/pdf') return;
    const existingChars = Object.values(pageTextByPage).reduce((acc, t) => acc + String(t ?? '').trim().length, 0);
    if (existingChars >= 200) return;
    const sandboxKey = activeSandboxId || sessionId;
    let cancelled = false;
    const extractAbort = new AbortController();
    void (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (sandboxKey && isSupabaseSandboxRowId(sandboxKey) && session?.access_token) {
          const { data: rows, error } = await supabase.from('sandbox_content').select('page_number, page_text').eq('sandbox_id', sandboxKey).order('page_number');
          if (!error && rows && rows.length > 0) {
            const map: Record<number, string> = {};
            rows.forEach((row) => { map[row.page_number] = String(row.page_text ?? ''); });
            const totalChars = Object.values(map).reduce((acc, t) => acc + t.trim().length, 0);
            if (totalChars >= 200) {
              if (!cancelled) setPageTextByPage(map);
              return;
            }
          }
        }
        const data = await selectedFile.arrayBuffer();
        if (cancelled) return;
        const { map, title } = await extractPdfWithOcrProgress(data, { signal: extractAbort.signal });
        if (cancelled) return;
        if (title) setPdfDocumentTitle(title);
        setPageTextByPage(map);
        const { data: { session: insertSession } } = await supabase.auth.getSession();
        if (isSupabaseSandboxRowId(sandboxKey) && insertSession?.access_token && Object.keys(map).length > 0) {
          const rows = Object.entries(map).map(([pageNumber, pageText]) => ({ sandbox_id: sandboxKey, page_number: Number(pageNumber), page_text: pageText }));
          await supabase.from('sandbox_content').insert(rows);
        }
      } catch {
        /* best-effort extraction; UI stays quiet */
      }
    })();
    return () => {
      cancelled = true;
      extractAbort.abort();
    };
  }, [phase, selectedFile, activeSandboxId, sessionId, pageTextByPage]);

  useEffect(() => {
    if (phase !== 'workspace') return;
    if (nodes.length > 0) return;
    const baseName = (selectedFile?.name || activeSandboxName || pdfDocumentTitle || 'Your material').replace(/\.(pdf|epub)$/i, '');
    const label = (pdfDocumentTitle || baseName || 'Your material').slice(0, 120);
    setNodes([
      createCanvasNode({
        kind: 'source',
        label,
        x: 120,
        y: 120,
        width: 280,
        height: 168,
        title: label,
        sourceArtifact: {
          fileType: selectedFile ? inferSourceFileType(selectedFile) : 'pdf',
          uploadedAt: new Date().toISOString(),
          totalPdfPages: pdfPageCount || undefined,
          chapterSelectedPageIndices: null,
          linkedFileName: selectedFile?.name ?? null,
          sourceSystemId: newSourceSystemId(),
        },
      }),
    ]);
  }, [phase, selectedFile, nodes.length, pdfDocumentTitle, activeSandboxName, pdfPageCount]);

  useEffect(() => {
    const stateSandbox = (location.state as { sandbox?: Record<string, unknown> } | undefined)?.sandbox;
    if (!stateSandbox) return;
    if (stateSandbox.id) setActiveSandboxId(stateSandbox.id as string);
    setCanvasReadOnly(Boolean(stateSandbox.read_only));
    if (stateSandbox.sandbox_name) setActiveSandboxName(stateSandbox.sandbox_name as string);
    if (stateSandbox.pdf_file_name) {
      setActiveSandboxName((stateSandbox.sandbox_name as string) || (stateSandbox.pdf_file_name as string));
    }
    if (stateSandbox.pdf_file_url) {
      void (async () => {
        try {
          const raw = String(stateSandbox.pdf_file_url).trim();
          if (!raw) {
            setPdfLoadError(true);
            return;
          }
          const fileName = (stateSandbox.pdf_file_name as string) || `${(stateSandbox.sandbox_name as string) || 'sandbox'}.pdf`;
          let blob: Blob;
          if (/^https?:\/\//i.test(raw)) {
            const u = new URL(raw);
            if (u.hostname.endsWith('.supabase.co') && (!u.pathname || u.pathname === '/')) {
              setPdfLoadError(true);
              return;
            }
            const objectPath = pdfsObjectPathFromStorageUrl(raw);
            if (objectPath) {
              const { data, error } = await supabase.storage.from('pdfs').download(objectPath);
              if (error || !data) throw error ?? new Error('download failed');
              blob = data;
            } else {
              const response = await fetch(raw);
              if (!response.ok) throw new Error('fetch pdf failed');
              blob = await response.blob();
            }
          } else {
            const path = raw.replace(/^\/+/, '');
            const { data: signed, error: signErr } = await supabase.storage.from('pdfs').createSignedUrl(path, 3600);
            if (signErr || !signed?.signedUrl) throw signErr ?? new Error('sign failed');
            const response = await fetch(signed.signedUrl);
            if (!response.ok) throw new Error('fetch signed pdf failed');
            blob = await response.blob();
          }
          setSelectedFile(new File([blob], fileName, { type: 'application/pdf' }));
        } catch {
          setPdfLoadError(true);
        }
      })();
    }
    setPhase('workspace');
    setWorkspaceMode('canvass');
    setWorkspaceEnter(true);
  }, [location.state]);

  useEffect(() => {
    if (!activeSandboxId || !isSupabaseSandboxRowId(activeSandboxId)) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from('sandboxes').select('read_only').eq('id', activeSandboxId).maybeSingle();
      if (cancelled) return;
      setCanvasReadOnly(Boolean(data?.read_only));
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSandboxId]);

  useEffect(() => {
    if (!activeSandboxId) return;
    try {
      const raw = localStorage.getItem(`sandbox_state_${activeSandboxId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { nodes?: CanvasNode[]; edges?: CanvasEdge[]; chatMessages?: ChatMessage[] };
      if (parsed.nodes) setNodes((parsed.nodes as unknown[]).map((row) => migrateCanvasNode(row)));
      if (parsed.edges) setEdges(parsed.edges);
      if (parsed.chatMessages) setChatMessages(parsed.chatMessages);
    } catch {
      // ignore invalid local cache
    }
  }, [activeSandboxId]);

  useEffect(() => {
    if (!activeSandboxId) return;
    const payload = { nodes, edges, chatMessages };
    localStorage.setItem(`sandbox_state_${activeSandboxId}`, JSON.stringify(payload));
  }, [activeSandboxId, chatMessages, edges, nodes]);

  useEffect(() => {
    if (phase !== 'workspace' || !activeSandboxId || !user?.id || !isSupabaseSandboxRowId(activeSandboxId)) return;
    let cancelled = false;
    void (async () => {
      try {
        if (localStorage.getItem(`sandbox_state_${activeSandboxId}`)) return;
      } catch {
        /* ignore */
      }
      const g = await loadSandboxGraph(activeSandboxId, user.id);
      if (cancelled || !g) return;
      if (g.nodes.length) setNodes(g.nodes.map((n) => migrateCanvasNode(n)));
      if (g.edges.length) setEdges(g.edges);
      if (g.readerHighlights.length) setReaderHighlights(g.readerHighlights);
      if (g.readerNotes.length) setReaderNotes(g.readerNotes);
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, activeSandboxId, user?.id]);

  useEffect(() => {
    if (phase !== 'workspace' || !user?.id || !activeSandboxId || !isSupabaseSandboxRowId(activeSandboxId)) return;
    void supabase.rpc('touch_reader_streak', { p_user_id: user.id });
  }, [phase, activeSandboxId, user?.id]);

  useEffect(() => {
    setPdfLoadError(false);
    pdfLoadAttemptRef.current = 0;
    setPdfDocumentKey((key) => key + 1);
  }, [workspaceMode, selectedFile]);

  const animateModeChange = useCallback((nextMode: WorkspaceMode) => {
    if (nextMode === 'mastery') return;
    if (nextMode === workspaceMode) return;
    setWorkspaceMode(nextMode);
  }, [workspaceMode]);

  const readingPageIds = useMemo(() => {
    const count = selectedFile ? Math.max(1, pdfPageCount) : 1;
    return Array.from({ length: count }, (_, index) => index + 1);
  }, [pdfPageCount, selectedFile]);

  const updateScale = useCallback((nextScale: number) => setCanvasScale(clamp(nextScale, 0.45, 2.2)), []);
  const zoomBy = useCallback((delta: number) => updateScale(canvasScale + delta), [canvasScale, updateScale]);
  const zoomCanvasPercent = useCallback((direction: 1 | -1) => {
    const factor = direction === 1 ? 1.1 : 0.9;
    updateScale(canvasScale * factor);
  }, [canvasScale, updateScale]);

  const onCanvasChatResizePointerDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      canvasChatDragRef.current = {
        startX: event.clientX,
        startW: canvasChatCollapsed ? 0 : canvasChatWidth,
        collapsed: canvasChatCollapsed,
      };
      const onMove = (ev: MouseEvent) => {
        const d = canvasChatDragRef.current;
        if (!d) return;
        const dx = d.startX - ev.clientX;
        if (d.collapsed) {
          if (dx > 24) {
            const next = Math.min(CHAT_PANEL_MAX, Math.max(CHAT_PANEL_MIN, canvasChatPrevWidthRef.current));
            setCanvasChatCollapsed(false);
            setCanvasChatWidth(next);
            canvasChatDragRef.current = { startX: ev.clientX, startW: next, collapsed: false };
          }
        } else {
          let w = d.startW + dx;
          if (w <= CHAT_PANEL_MIN * 0.55) {
            setCanvasChatCollapsed(true);
            setCanvasChatWidth(0);
            canvasChatDragRef.current = null;
          } else {
            w = Math.min(CHAT_PANEL_MAX, Math.max(CHAT_PANEL_MIN, w));
            setCanvasChatWidth(w);
            canvasChatPrevWidthRef.current = w;
          }
        }
      };
      const onUp = () => {
        canvasChatDragRef.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [canvasChatCollapsed, canvasChatWidth],
  );

  const onReadingChatResizePointerDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      readingChatDragRef.current = {
        startX: event.clientX,
        startW: readingChatCollapsed ? 0 : readingChatWidth,
        collapsed: readingChatCollapsed,
      };
      const onMove = (ev: MouseEvent) => {
        const d = readingChatDragRef.current;
        if (!d) return;
        const dx = d.startX - ev.clientX;
        if (d.collapsed) {
          if (dx > 24) {
            const next = Math.min(CHAT_PANEL_MAX, Math.max(CHAT_PANEL_MIN, readingChatPrevWidthRef.current));
            setReadingChatCollapsed(false);
            setReadingChatWidth(next);
            readingChatDragRef.current = { startX: ev.clientX, startW: next, collapsed: false };
          }
        } else {
          let w = d.startW + dx;
          if (w <= CHAT_PANEL_MIN * 0.55) {
            readingChatPrevWidthRef.current = Math.max(CHAT_PANEL_MIN, readingChatWidth);
            setReadingChatCollapsed(true);
            setReadingChatWidth(0);
            readingChatDragRef.current = null;
          } else {
            w = Math.min(CHAT_PANEL_MAX, Math.max(CHAT_PANEL_MIN, w));
            setReadingChatWidth(w);
            readingChatPrevWidthRef.current = w;
          }
        }
      };
      const onUp = () => {
        readingChatDragRef.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [readingChatCollapsed, readingChatWidth],
  );
  const onWheelCanvas = useCallback((event: React.WheelEvent) => { if (workspaceMode !== 'canvass') return; event.preventDefault(); updateScale(canvasScale + (event.deltaY > 0 ? -0.08 : 0.08)); }, [canvasScale, updateScale, workspaceMode]);

  const updateReadingZoom = useCallback((nextValue: number) => setReadingZoom(clamp(nextValue, 50, 200)), []);
  const scrollToReadingPage = useCallback((pageNumber: number) => {
    const element = pageRefs.current[pageNumber];
    if (!element || !readingViewerRef.current) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setActiveReadingPage(pageNumber);
    setReaderSelection(null);
    setReaderLensBox((box) => ({ ...box, visible: false }));
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      setMobileReadingPagesOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isLgUp) setMobileReadingPagesOpen(false);
  }, [isLgUp]);

  useEffect(() => {
    if (phase !== 'workspace' || typeof window === 'undefined') return;
    if (window.innerWidth < 768) {
      setReadingChatCollapsed(true);
    }
  }, [phase]);
  const onReadingViewerScroll = useCallback(() => {
    if (!readingViewerRef.current) return;
    const bounds = readingViewerRef.current.getBoundingClientRect();
    let nearest = activeReadingPage;
    let minDistance = Infinity;
    readingPageIds.forEach((pageId) => {
      const pageElement = pageRefs.current[pageId];
      if (!pageElement) return;
      const rect = pageElement.getBoundingClientRect();
      const distance = Math.abs(rect.top - bounds.top - 140);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = pageId;
      }
    });
    if (nearest !== activeReadingPage) setActiveReadingPage(nearest);
  }, [activeReadingPage, readingPageIds]);

  const clearReadingSelection = useCallback(() => {
    setReaderSelection(null);
    setReaderSelectionColorPicker(false);
    window.getSelection()?.removeAllRanges();
  }, []);

  const streamReadingAssistantMessage = useCallback(async (messageId: string, text: string, extras?: Partial<ChatMessage>) => {
    const chunks = text.split(/(\s+)/).filter(Boolean);
    for (const chunk of chunks) {
      await new Promise((resolve) => window.setTimeout(resolve, 26));
      setReadingChatMessages((prev) => prev.map((message) => message.id === messageId ? { ...message, ...extras, content: `${message.content}${chunk}`, pending: true } : message));
    }
    setReadingChatMessages((prev) => prev.map((message) => message.id === messageId ? { ...message, ...extras, pending: false } : message));
  }, []);

  useEffect(() => {
    if (!readingTtsActive || !readingTtsPlaying) return;
    const raw = pageTextByPage[activeReadingPage] ?? '';
    const totalWords = raw.trim() ? raw.split(/\s+/).filter(Boolean).length : 0;
    if (totalWords === 0) return;
    const interval = window.setInterval(() => {
      setReadingTtsIndex((value) => {
        if (value + 1 >= totalWords) {
          setReadingTtsPlaying(false);
          return 0;
        }
        return value + 1;
      });
    }, 450);
    ttsIntervalRef.current = interval;
    return () => { window.clearInterval(interval); ttsIntervalRef.current = null; };
  }, [readingTtsActive, readingTtsPlaying, activeReadingPage, pageTextByPage]);

  const toggleReadingTts = useCallback(() => {
    if (readingTtsActive) {
      setReadingTtsPlaying((active) => !active);
      return;
    }
    setReadingTtsActive(true);
    setReadingTtsPlaying(true);
    setReadingTtsIndex(0);
  }, [readingTtsActive]);

  const stopReadingTts = useCallback(() => {
    setReadingTtsActive(false);
    setReadingTtsPlaying(false);
    setReadingTtsIndex(0);
  }, []);

  const getPageIdFromNode = (node: Node | null) => {
    while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode as Node | null;
    return node && (node as HTMLElement).closest('[data-page-id]') ? Number((node as HTMLElement).closest('[data-page-id]')?.getAttribute('data-page-id')) : null;
  };

  const handleReadingSelection = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      clearReadingSelection();
      setBlockCutterPrompt(null);
      return;
    }
    const text = selection.toString().trim();
    if (!text) { clearReadingSelection(); setBlockCutterPrompt(null); return; }
    const pageId = getPageIdFromNode(selection.anchorNode as Node) ?? getPageIdFromNode(event.target as Node);
    if (!pageId) { clearReadingSelection(); setBlockCutterPrompt(null); return; }
    if (readerTool === 'block-cutter') {
      setBlockCutterPrompt({ text, pageId });
      setReaderSelection(null);
      setReaderSelectionColorPicker(false);
      window.getSelection()?.removeAllRanges();
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setReaderSelection({ text, pageId, rect });
    if (readerTool === 'highlight') {
      setReaderHighlights((prev) => [...prev, { id: `highlight-${Date.now()}`, pageId, selectedText: text, color: readerHighlightColor }]);
      clearReadingSelection();
    }
  }, [clearReadingSelection, readerHighlightColor, readerTool]);

  const applyReadingHighlight = useCallback((color: string) => {
    if (!readerSelection) return;
    setReaderHighlights((prev) => [...prev, { id: `highlight-${Date.now()}`, pageId: readerSelection.pageId, selectedText: readerSelection.text, color }]);
    setReaderSelection(null);
    setReaderSelectionColorPicker(false);
    window.getSelection()?.removeAllRanges();
  }, [readerSelection]);

  const addReaderNote = useCallback(() => {
    if (!readerNoteDraft.visible || !readerNoteDraft.text.trim()) return;
    const trimmed = readerNoteDraft.text.trim();
    if (readerNoteDraft.noteId) {
      setReaderNotes((prev) => prev.map((note) => (note.id === readerNoteDraft.noteId ? { ...note, text: trimmed } : note)));
    } else {
      setReaderNotes((prev) => [...prev, { id: `note-${Date.now()}`, pageId: readerNoteDraft.pageId, x: readerNoteDraft.x, y: readerNoteDraft.y, text: trimmed }]);
    }
    setReaderNoteDraft({ pageId: 0, x: 0, y: 0, text: '', visible: false });
  }, [readerNoteDraft]);

  const onReadingViewerMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (readerTool === 'lens') {
      const targetPageId = getPageIdFromNode(event.target as Node);
      if (!targetPageId) return;
      const rect = readingViewerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const startX = event.clientX - rect.left;
      const startY = event.clientY - rect.top;
      setReaderLensBox({ visible: true, x: startX, y: startY, width: 0, height: 0, pageId: targetPageId });
    }
    if (readerTool === 'notes') {
      const targetPageId = getPageIdFromNode(event.target as Node);
      if (!targetPageId) return;
      const rect = pageRefs.current[targetPageId]?.getBoundingClientRect();
      if (!rect) return;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 64 || x > rect.width - 64) {
        setReaderNoteDraft({ pageId: targetPageId, x, y, text: '', visible: true });
      }
    }
  }, [readerTool]);

  const onReadingViewerMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (readingImmersive && readingViewerRef.current) {
      const bounds = readingViewerRef.current.getBoundingClientRect();
      setReadingFocusY(event.clientY - bounds.top);
    }
    if (readerTool === 'lens' && readerLensBox.visible && readerLensBox.pageId && readingViewerRef.current) {
      const bounds = readingViewerRef.current.getBoundingClientRect();
      const width = event.clientX - bounds.left - readerLensBox.x;
      const height = event.clientY - bounds.top - readerLensBox.y;
      setReaderLensBox((box) => ({ ...box, width: Math.max(20, width), height: Math.max(20, height) }));
    }
  }, [readingImmersive, readerLensBox, readerTool]);

  const onReadingViewerMouseUp = useCallback(() => {
    if (readerTool !== 'lens' || !readerLensBox.visible || !readerLensBox.pageId || !readingViewerRef.current) return;
    if (readerLensBox.width < 24 || readerLensBox.height < 24) {
      setReaderLensBox({ visible: false, x: 0, y: 0, width: 0, height: 0, pageId: null });
      return;
    }
    const bounds = readingViewerRef.current.getBoundingClientRect();
    const cx = bounds.left + readerLensBox.x + readerLensBox.width / 2;
    const cy = bounds.top + readerLensBox.y + readerLensBox.height / 2;
    const hit = document.elementFromPoint(cx, cy) as HTMLElement | null;
    const paragraph = hit?.closest('p, h2, h3, h4, li') ?? hit;
    const extracted = (paragraph?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 1200);
    const excerpt = extracted.length > 0 ? extracted : 'This region did not resolve to readable text; try drawing the lens over a paragraph.';
    const lead = excerpt.length > 160 ? `${excerpt.slice(0, 160).trim()}…` : excerpt;
    const assistantPlain = `Summary:\n\n${lead}\n\nIn plain terms, this passage is about how readers stay engaged when the story gives them clear structure, open questions, and concrete sensory anchors.`;
    const userMessage: ChatMessage = { id: `user-lens-${Date.now()}`, role: 'user', content: '[AI Lens] Summarize this selection.', timestamp: getNowTime() };
    const assistantMessageId = `assistant-lens-${Date.now() + 1}`;
    setReadingChatMessages((prev) => [...prev, userMessage, { id: assistantMessageId, role: 'assistant', content: '', timestamp: getNowTime(), pending: true, lensFollowUp: true }]);
    void streamReadingAssistantMessage(assistantMessageId, assistantPlain, { lensFollowUp: true });
    setReaderLensBox({ visible: false, x: 0, y: 0, width: 0, height: 0, pageId: null });
    setReadingChatCollapsed(false);
    setReadingChatWidth((w) => (w < CHAT_PANEL_MIN ? Math.min(CHAT_PANEL_MAX, Math.max(CHAT_PANEL_MIN, readingChatPrevWidthRef.current)) : w));
  }, [readerLensBox, readerTool, streamReadingAssistantMessage]);

  const resolveBlockCutter = useCallback((kind: 'quote' | 'concept') => {
    if (!blockCutterPrompt) return;
    const labelPrefix = kind === 'quote' ? 'Quote' : 'Concept';
    const short = `${labelPrefix}: ${blockCutterPrompt.text.slice(0, 36)}${blockCutterPrompt.text.length > 36 ? '…' : ''}`;
    const newNode = createCanvasNode({
      kind: 'block',
      label: short,
      title: short,
      body: blockCutterPrompt.text.slice(0, 4000),
      x: 200,
      y: 200,
      width: 340,
      height: 160,
      tileVariant: 'block_cutter',
    });
    setNodes((prev) => [...prev, newNode]);
    setBlockCutterPrompt(null);
    setReaderTool(null);
  }, [blockCutterPrompt]);

  const currentQuestion = quizQuestions[quizIndex];
  const quizProgress = Math.round((Math.min(questionCount, quizIndex + (quizSubmitted ? 1 : 0)) / Math.max(1, questionCount)) * 100);

  useEffect(() => {
    hardTimerFireRef.current = false;
  }, [quizIndex]);

  useEffect(() => {
    if (workspaceMode !== 'mastery' || masteryView !== 'quiz' || difficulty !== 'Hard' || quizComplete || !currentQuestion || quizSubmitted) {
      setHardSecondsLeft(null);
      return;
    }
    setHardSecondsLeft(55);
    const id = window.setInterval(() => {
      setHardSecondsLeft((s) => {
        if (s === null || s <= 0) return 0;
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [workspaceMode, masteryView, difficulty, quizComplete, quizIndex, quizSubmitted, currentQuestion?.id]);

  useEffect(() => {
    if (difficulty !== 'Hard' || quizSubmitted || quizComplete || !currentQuestion) return;
    if (hardSecondsLeft === null || hardSecondsLeft > 0) return;
    if (hardTimerFireRef.current) return;
    hardTimerFireRef.current = true;
    const sel = quizSelectedRef.current;
    setQuizSubmitted(true);
    if (sel === null) {
      setQuizSkipped((count) => count + 1);
    } else if (sel === currentQuestion.correctIndex) {
      setQuizScore((score) => score + 1);
    } else {
      setQuizWrongAnswers((prev) => [
        ...prev,
        {
          question: currentQuestion.question,
          userAnswer: currentQuestion.options[sel] ?? '',
          correctAnswer: currentQuestion.options[currentQuestion.correctIndex] ?? '',
          explanation: currentQuestion.explanation,
        },
      ]);
    }
  }, [hardSecondsLeft, quizSubmitted, quizComplete, difficulty, currentQuestion]);

  const submitQuizAnswer = useCallback(() => {
    if (!currentQuestion || quizSelectedOption === null || quizSubmitted || quizComplete) return;
    setHardSecondsLeft(null);
    setQuizSubmitted(true);
    if (quizSelectedOption === currentQuestion.correctIndex) {
      setQuizScore((score) => score + 1);
    } else {
      setQuizWrongAnswers((prev) => [
        ...prev,
        {
          question: currentQuestion.question,
          userAnswer: currentQuestion.options[quizSelectedOption] ?? '',
          correctAnswer: currentQuestion.options[currentQuestion.correctIndex] ?? '',
          explanation: currentQuestion.explanation,
        },
      ]);
    }
  }, [currentQuestion, quizComplete, quizSelectedOption, quizSubmitted]);

  const goToNextQuestion = useCallback(() => {
    setHardSecondsLeft(null);
    if (quizIndex + 1 >= quizQuestions.length) {
      setQuizComplete(true);
      return;
    }
    setQuizIndex((index) => index + 1);
    setQuizSelectedOption(null);
    setQuizSubmitted(false);
  }, [quizIndex, quizQuestions.length]);

  const addCanvasNodeFromSelection = useCallback((text: string) => {
    if (!text) return;
    const lab = text.slice(0, 40) + (text.length > 40 ? '…' : '');
    const newNode = createCanvasNode({
      kind: 'block',
      label: lab,
      title: lab,
      body: text.slice(0, 8000),
      x: 160,
      y: 160,
      width: 320,
      height: 148,
      tileVariant: 'from_reading_selection',
    });
    setNodes((prev) => [...prev, newNode]);
    setReaderSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const sendSelectionToCanvas = useCallback(() => {
    if (!readerSelection) return;
    addCanvasNodeFromSelection(readerSelection.text);
  }, [addCanvasNodeFromSelection, readerSelection]);

  const onReadingShareOption = useCallback((option: string) => {
    setReaderTool(null);
    if (option === 'Copy link') navigator.clipboard.writeText(window.location.href).catch(() => void 0);
    if (option === 'Export PDF') {
      const blob = new Blob([`Export from ${selectedFile?.name ?? activeSandboxName}`], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${activeSandboxName || 'sandbox'}.txt`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (option === 'Share to Canvas') {
      const label = `Reading: ${selectedFile?.name ?? activeSandboxName}`;
      setNodes((prev) => [...prev, createCanvasNode({ kind: 'source', label, title: label, x: 220, y: 280, width: 300, height: 148, tileVariant: 'reading_share' })]);
    }
  }, [activeSandboxName, selectedFile?.name]);

  const updateReadingSearch = useCallback((value: string) => {
    setReadingSearch(value);
  }, []);

  const onReadingModeToolClick = useCallback((tool: ReaderTool) => {
    setReaderTool((current) => (current === tool ? null : tool));
    setReaderSelection(null);
  }, []);

  const getTtsHighlightForPage = useCallback((pageId: number, blockText: string) => {
    if (!readingTtsActive || !readingTtsPlaying || pageId !== activeReadingPage) return blockText;
    const words = blockText.split(/(\s+)/);
    let count = 0;
    return words
      .map((word) => {
        if (/\s+/.test(word)) return word;
        const highlight = count === readingTtsIndex;
        count += 1;
        return highlight ? `<span class="rounded bg-[#3b82c4]/20 px-0.5 text-[#0f172a]">${escapeHtml(word)}</span>` : escapeHtml(word);
      })
      .join('');
  }, [activeReadingPage, readingTtsActive, readingTtsPlaying, readingTtsIndex]);

  const createTtsRichText = useCallback((pageId: number, text: string) => {
    return readingTtsActive && pageId === activeReadingPage && readingTtsPlaying ? getTtsHighlightForPage(pageId, text) : escapeHtml(text);
  }, [activeReadingPage, getTtsHighlightForPage, readingTtsActive, readingTtsPlaying]);

  const maybeHideReaderNoteDraft = useCallback(() => {
    if (readerNoteDraft.visible) setReaderNoteDraft({ pageId: 0, x: 0, y: 0, text: '', visible: false });
  }, [readerNoteDraft.visible]);

  useEffect(() => {
    if (!readingImmersive || !readingViewerRef.current) return;
    const bounds = readingViewerRef.current.getBoundingClientRect();
    setReadingFocusY(bounds.height / 2);
  }, [readingImmersive]);

  useEffect(() => {
    if (!readingViewerRef.current) return;
    const textSpans = readingViewerRef.current.querySelectorAll('.react-pdf__Page__textContent span');
    const matches: HTMLElement[] = [];
    textSpans.forEach((node) => {
      const span = node as HTMLSpanElement;
      span.style.background = 'transparent';
      span.style.color = '';
      span.style.boxShadow = '';
      if (readingSearch.trim().length > 1 && span.textContent?.toLowerCase().includes(readingSearch.toLowerCase())) {
        span.style.background = 'rgba(59,130,246,0.22)';
        span.style.borderRadius = '4px';
        matches.push(span);
      }
    });
    setReadingSearchMatches(matches);
    setReadingSearchMatchIndex(matches.length ? 0 : -1);
  }, [activeReadingPage, readingSearch]);

  useEffect(() => {
    readingSearchMatches.forEach((match, index) => {
      match.style.boxShadow = index === readingSearchMatchIndex ? '0 0 0 2px rgba(37,99,235,0.45)' : '';
    });
    const activeMatch = readingSearchMatches[readingSearchMatchIndex];
    if (activeMatch) activeMatch.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }, [readingSearchMatchIndex, readingSearchMatches]);

  const handleReadingPanelClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!readingViewerRef.current?.contains(event.target as Node)) {
      clearReadingSelection();
      setBlockCutterPrompt(null);
      maybeHideReaderNoteDraft();
    }
  }, [clearReadingSelection, maybeHideReaderNoteDraft]);
  const onCanvasMouseDown = useCallback((event: React.MouseEvent) => {
    if (workspaceMode !== 'canvass') return;
    const target = event.target as HTMLElement | null;
    if (target?.closest?.('[data-connect-popup], [data-picker-popup], [data-multi-select-action-bar]')) return;
    setPendingConnection(null);
    setLinkPicker(null);
    if (
      !target?.closest?.(
        '[data-block-frame],[data-source-block],[data-lens-block],[data-evidence-block],[data-freestyle-block],[data-ghost-node-frame],[data-connector-block],[data-hover-connector-handle],[data-plus-handle-icon]',
      )
    ) {
      setSelectedNodeIds(new Set());
    }
    if (dragNodeId) return;
    if (event.button !== 0 && event.button !== 1) return;
    setIsPanning(true);
    panStart.current = { x: event.clientX, y: event.clientY, px: canvasPan.x, py: canvasPan.y };
  }, [canvasPan.x, canvasPan.y, dragNodeId, workspaceMode]);

  useEffect(() => {
    if (!isPanning && !dragNodeId) return;
    const move = (event: MouseEvent) => {
      if (dragNodeId && canvasRef.current) {
        const bounds = canvasRef.current.getBoundingClientRect();
        const x = (event.clientX - bounds.left - canvasPan.x - dragNodeOffset.x) / canvasScale;
        const y = (event.clientY - bounds.top - canvasPan.y - dragNodeOffset.y) / canvasScale;
        setNodes((prev) => prev.map((node) => node.id === dragNodeId ? { ...node, x, y } : node));
        return;
      }
      if (isPanning) {
        setCanvasPan({ x: panStart.current.px + (event.clientX - panStart.current.x), y: panStart.current.py + (event.clientY - panStart.current.y) });
      }
    };
    const up = () => {
      setIsPanning(false);
      setDragNodeId(null);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [canvasPan.x, canvasPan.y, canvasScale, dragNodeId, dragNodeOffset.x, dragNodeOffset.y, isPanning]);

  const onCanvasTouchStart = useCallback((event: React.TouchEvent) => {
    if (workspaceMode !== 'canvass') return;
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      touchModeRef.current = 'pan';
      panStart.current = { x: touch.clientX, y: touch.clientY, px: canvasPan.x, py: canvasPan.y };
    }
    if (event.touches.length === 2) {
      const [first, second] = Array.from(event.touches);
      pinchRef.current = { distance: Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY), scale: canvasScale };
      touchModeRef.current = 'pinch';
    }
  }, [canvasPan.x, canvasPan.y, canvasScale, workspaceMode]);

  const onCanvasTouchMove = useCallback((event: React.TouchEvent) => {
    if (workspaceMode !== 'canvass') return;
    if (touchModeRef.current === 'pan' && event.touches.length === 1) {
      const touch = event.touches[0];
      setCanvasPan({ x: panStart.current.px + (touch.clientX - panStart.current.x), y: panStart.current.py + (touch.clientY - panStart.current.y) });
    }
    if (touchModeRef.current === 'pinch' && event.touches.length === 2) {
      event.preventDefault();
      const [first, second] = Array.from(event.touches);
      const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
      updateScale(pinchRef.current.scale * (distance / pinchRef.current.distance));
    }
  }, [updateScale, workspaceMode]);

  /** Legacy edge session creation removed — chat uses Supabase sandbox UUID when signed in. */
  const createCanvasSession = useCallback(async (_file: File, opts?: { silent?: boolean }) => {
    void _file;
    void opts;
    return null;
  }, []);

  const persistSandboxRecord = useCallback(async (file: File, _sessionIdentifier: string | null): Promise<string> => {
    let rowId = `local-${Date.now()}`;
    const displayName = file.name.replace(/\.(pdf|epub)$/i, '') || 'Sandbox';
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: inserted, error } = await supabase
          .from('sandboxes')
          .insert({
            user_id: authUser.id,
            name: displayName,
            pdf_filename: file.name,
            last_opened_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (!error && inserted?.id) {
          rowId = inserted.id as string;
          const path = `${authUser.id}/${rowId}/${encodeURIComponent(file.name)}`;
          const { error: upErr } = await supabase.storage.from('pdfs').upload(path, file, {
            upsert: true,
            contentType: file.type || 'application/pdf',
          });
          await supabase
            .from('sandboxes')
            .update({ pdf_url: path, last_opened_at: new Date().toISOString() })
            .eq('id', rowId)
            .eq('user_id', authUser.id);
        }
      }
    } catch {
      /* fall back to local id */
    }
    try {
      const existingRaw = localStorage.getItem('quilora_sandboxes');
      let existing: Array<Record<string, string | null>> = [];
      if (existingRaw) {
        try {
          existing = JSON.parse(existingRaw) as Array<Record<string, string | null>>;
          if (!Array.isArray(existing)) existing = [];
        } catch {
          existing = [];
        }
      }
      const next = [
        {
          id: rowId,
          sandbox_name: displayName,
          pdf_file_name: file.name,
          pdf_file_url: null,
          session_id: _sessionIdentifier,
          created_at: new Date().toISOString(),
          last_opened_at: new Date().toISOString(),
        },
        ...existing,
      ];
      localStorage.setItem('quilora_sandboxes', JSON.stringify(next));
      setActiveSandboxId(rowId);
    } catch {
      // best-effort local persistence only
    }
    return rowId;
  }, []);

  const startLoadingFlow = useCallback((file: File) => {
    extractionAbortRef.current?.abort();

    const abortController = new AbortController();
    extractionAbortRef.current = abortController;

    setLoaderProgress(0);
    setLoaderActiveStage(0);

    setLoaderExiting(false);
    setWorkspaceEnter(false);
    setPhase('loading');
    setActiveSandboxName(file.name.replace(/\.(pdf|epub)$/i, '') || 'Sandbox');

    const flowStartedAt = Date.now();
    let sessionResolved = false;
    let extractFrac = 0;
    let extractionFinished = false;
    let displayedRing = 0;

    const bumpRing = () => {
      const sessionWeight = sessionResolved ? 1 : Math.min(1, (Date.now() - flowStartedAt) / 9000);
      const extractWeight = extractionFinished ? 1 : extractFrac;
      const target = clamp(sessionWeight * 0.34 + extractWeight * 0.62 + 0.04, 0, 0.98);
      displayedRing += (target - displayedRing) * 0.14;
      if (target - displayedRing < 0.0015) displayedRing = target;
      setLoaderProgress(displayedRing);
      setLoaderActiveStage(displayedRing < 0.34 ? 0 : displayedRing < 0.82 ? 1 : 2);
    };
    if (loaderRingIntervalRef.current) window.clearInterval(loaderRingIntervalRef.current);
    loaderRingIntervalRef.current = window.setInterval(bumpRing, 48);

    const sessionPromise = Promise.resolve(null);
    setPendingSessionPromise(sessionPromise);
    void sessionPromise
      .then(() => {
        sessionResolved = true;
      })
      .catch(() => {
        sessionResolved = true;
      });

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const extractionPromise: Promise<{ map: Record<number, string>; title: string | null; numPages: number }> = isPdf
      ? extractPdfTextWithProgress(
        file,
        (fraction) => {
          extractFrac = fraction;
        },
        abortController.signal,
      ).catch(() => ({ map: {} as Record<number, string>, title: null as string | null, numPages: 0 }))
      : Promise.resolve({ map: {}, title: null, numPages: 0 });

    void extractionPromise
      .then(() => {
        extractionFinished = true;
      })
      .catch(() => {
        extractionFinished = true;
      });

    void (async () => {
      try {
        const [createdSessionId, extracted] = await Promise.all([sessionPromise, extractionPromise]);
        if (abortController.signal.aborted) return;

        setSessionId(createdSessionId);
        const localRowId = await persistSandboxRecord(file, createdSessionId);
        if (isSupabaseSandboxRowId(localRowId)) setSessionId(localRowId);

        if (isPdf) {
          setPageTextByPage(extracted.map);
          if (extracted.title) setPdfDocumentTitle(extracted.title);
          if (extracted.numPages > 0) setPdfPageCount(extracted.numPages);
          const { data: { session: insertSession } } = await supabase.auth.getSession();
          if (isSupabaseSandboxRowId(localRowId) && insertSession?.access_token) {
            const rows = Object.entries(extracted.map).map(([pageNumber, pageText]) => ({ sandbox_id: localRowId, page_number: Number(pageNumber), page_text: pageText }));
            if (rows.length) {
              const { error: insertError } = await supabase.from('sandbox_content').insert(rows);
            }
            const pageNums = Object.keys(extracted.map).map(Number).filter((n) => !Number.isNaN(n));
            const sorted = pageNums.sort((a, b) => a - b);
            const fullText = sorted.map((n) => extracted.map[n]).join('\n\n').slice(0, 950_000);
            const { data: authData } = await supabase.auth.getUser();
            if (authData.user) {
              await supabase
                .from('sandboxes')
                .update({
                  pdf_text: fullText,
                  page_count: extracted.numPages || sorted.length,
                  last_opened_at: new Date().toISOString(),
                })
                .eq('id', localRowId)
                .eq('user_id', authData.user.id);
              const pagesForCost = extracted.numPages || sorted.length || 1;
              const cost = sourceUploadCreditCost(pagesForCost);
              const res = await quiloraDeductCredits({
                amount: cost,
                eventType: 'source_upload',
                sandboxId: localRowId,
                idempotencyKey: `src_${localRowId}`,
                metadata: { pages: pagesForCost },
              });
            }
          }
        }

        if (loaderRingIntervalRef.current) window.clearInterval(loaderRingIntervalRef.current);
        loaderRingIntervalRef.current = null;

        const workDoneAt = Date.now();
        const actualMs = workDoneAt - flowStartedAt;
        const targetHoldMs = actualMs <= 12_000 ? Math.max(3200, actualMs) : actualMs;
        const waitMs = Math.max(0, targetHoldMs - actualMs);
        if (waitMs > 0) await new Promise((resolve) => window.setTimeout(resolve, waitMs));
        if (abortController.signal.aborted) return;

        displayedRing = 1;
        setLoaderProgress(1);
        setLoaderActiveStage(2);

        await new Promise((resolve) => window.setTimeout(resolve, 900));
        if (abortController.signal.aborted) return;

        setLoaderExiting(true);
      } catch {
        if (loaderRingIntervalRef.current) window.clearInterval(loaderRingIntervalRef.current);
        loaderRingIntervalRef.current = null;
        setLoaderExiting(true);
      }
    })();
  }, [persistSandboxRecord]);

  const ensureSessionId = useCallback(async () => {
    if (activeSandboxId && isSupabaseSandboxRowId(activeSandboxId)) return activeSandboxId;
    if (sessionId && isSupabaseSandboxRowId(sessionId)) return sessionId;
    if (pendingSessionPromise) {
      const pendingId = await pendingSessionPromise;
      if (pendingId) setSessionId(pendingId);
      return pendingId;
    }
    if (!selectedFile) return null;
    const created = await createCanvasSession(selectedFile);
    setSessionId(created);
    return created;
  }, [activeSandboxId, createCanvasSession, pendingSessionPromise, selectedFile, sessionId]);

  const clientToCanvasXY = useCallback((clientX: number, clientY: number) => {
    const el = canvasRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const pan = canvasPanRef.current;
    const sc = canvasScaleRef.current;
    return {
      x: (clientX - rect.left - pan.x) / sc,
      y: (clientY - rect.top - pan.y) / sc,
    };
  }, []);

  const beginConnectDrag = useCallback(
    (fromId: string, event: React.PointerEvent | null) => {
      if (canvasReadOnly) return;
      const list = nodesRef.current;
      const fromN = list.find((n) => n.id === fromId);
      if (!fromN) return;
      const tail = getNodeConnectTail(fromN);
      const start = event ? clientToCanvasXY(event.clientX, event.clientY) : tail;
      setConnectDrag({ fromNodeId: fromId, px: start.x, py: start.y });
      const onMove = (ev: PointerEvent) => {
        const q = clientToCanvasXY(ev.clientX, ev.clientY);
        setConnectDrag((d) => (d ? { ...d, px: q.x, py: q.y } : null));
      };
      const onUp = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        setConnectDrag(null);
        const q = clientToCanvasXY(ev.clientX, ev.clientY);
        const hit = findNodeAtCanvasPoint(q.x, q.y, fromId, nodesRef.current);
        if (hit) {
          setLinkPicker({
            fromNodeId: fromId,
            toNodeId: hit,
            canvasX: q.x,
            canvasY: q.y,
            phase: 'pick',
            reasoningDraft: '',
          });
        }
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [canvasReadOnly, clientToCanvasXY],
  );

  const onConnectorDragStart = useCallback(
    (id: string, e: React.PointerEvent) => {
      if (e.button !== 0) return;
      beginConnectDrag(id, e);
    },
    [beginConnectDrag],
  );

  const onNativeConnectFromMenu = useCallback(
    (id: string) => {
      beginConnectDrag(id, null);
    },
    [beginConnectDrag],
  );

  const finalizeNativeConnector = useCallback(
    async (fromId: string, toId: string, linkType: ConnectorLinkType, userReasoning: string) => {
      if (canvasReadOnly) return;
      setCauseAiBusy(true);
      try {
        setLinkPicker(null);
        const list = nodesRef.current;
        const a = list.find((n) => n.id === fromId);
        const b = list.find((n) => n.id === toId);
        if (!a || !b) return;

        const creditRes = await quiloraDeductCredits({
          amount: CONNECTOR_AI_CREDITS,
          eventType: 'connector_ai_analysis',
          sandboxId: activeSandboxId && isSupabaseSandboxRowId(activeSandboxId) ? activeSandboxId : null,
          idempotencyKey: `conn_${fromId}_${toId}_${linkType}_${Date.now()}`,
          metadata: { linkType },
        });
        if (!creditRes.ok) {
          showToast(creditRes.message || 'Insufficient credits for connector analysis.', 'warning');
          return;
        }

        const docName = selectedFile?.name ?? activeSandboxName;
        const citation = `${docName} · grounded in sandbox Reading / PDF extraction`;
        const midX = (a.x + a.width / 2 + b.x + b.width / 2) / 2 - 130;
        const midY = (a.y + a.height / 2 + b.y + b.height / 2) / 2 - 90;

        const initial = initialConnectorPayload(fromId, toId, linkType, citation);
        const connectorNode = createCanvasNode({
          kind: 'connector',
          label: `Connector · ${CONNECTOR_LINK_LABELS[linkType]}`,
          x: Math.max(8, midX),
          y: Math.max(8, midY),
          width: 280,
          height: linkType === 'cause_effect' ? 280 : 220,
          title: 'Native connector',
          colorId: 'amber',
          connectorPayload: { ...initial, aiLoading: true, userReasoning, creditsDebited: CONNECTOR_AI_CREDITS },
        });
        const cid = connectorNode.id;

        setNodes((prev) => [...prev, connectorNode]);
        setEdges((prev) => [
          ...prev,
          { id: `conn-${fromId}-${cid}`, from: fromId, to: cid, linkType },
          { id: `conn-${cid}-${toId}`, from: cid, to: toId, linkType },
        ]);

        const excerpt = buildDocumentContextExcerpt(pageTextByPage, CHAT_CONTEXT_MAX_CHARS);
        const prompt = buildConnectorAiPrompt({
          linkType,
          fromTitle: a.title || a.label,
          fromBody: a.body,
          toTitle: b.title || b.label,
          toBody: b.body,
          documentExcerpt: excerpt,
          userReasoning: linkType === 'cause_effect' ? userReasoning : undefined,
        });

        let analysis = '';
        try {
          const direct = await tryQuiloraDeepseek(prompt);
          if (direct) {
            analysis = direct;
          } else {
            const activeSessionId = await ensureSessionId();
            const { data: { session } } = await supabase.auth.getSession();
            if (activeSessionId && session?.access_token) {
              const json = await postSandboxChat(session.access_token, activeSessionId, prompt);
              analysis = (json?.message?.content ?? '').trim();
            }
          }
        } catch {
          analysis = 'Analysis could not be completed. Check your connection and try again.';
        }
        if (!analysis) analysis = 'No analysis returned.';

        patchNode(cid, {
          connectorPayload: {
            ...initial,
            userReasoning,
            aiAnalysisBody: analysis,
            sourceCitation: citation,
            aiLoading: false,
            creditsDebited: CONNECTOR_AI_CREDITS,
          },
          body: analysis.slice(0, 400),
        });
        showToast(`Connector — ${CONNECTOR_AI_CREDITS} credits deducted.`, 'success');
      } finally {
        setCauseAiBusy(false);
      }
    },
    [
      activeSandboxId,
      activeSandboxName,
      canvasReadOnly,
      ensureSessionId,
      pageTextByPage,
      patchNode,
      selectedFile?.name,
      showToast,
    ],
  );

  const onMultiConnect = useCallback(() => {
    const first = [...selectedNodeIds][0];
    if (!first) return;
    beginConnectDrag(first, null);
  }, [beginConnectDrag, selectedNodeIds]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLinkPicker(null);
        setConnectDrag(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const streamAssistantMessage = useCallback(async (messageId: string, text: string) => {
    const chunks = text.split(/(\s+)/).filter(Boolean);
    for (const chunk of chunks) {
      await new Promise((resolve) => window.setTimeout(resolve, 28));
      setChatMessages((prev) => prev.map((message) => message.id === messageId ? { ...message, content: `${message.content}${chunk}`, pending: false } : message));
    }
  }, []);

  const streamFreestyleAssistant = useCallback(async (nodeId: string, assistantId: string, text: string) => {
    const chunks = text.split(/(\s+)/).filter(Boolean);
    let acc = '';
    for (const chunk of chunks) {
      await new Promise((resolve) => window.setTimeout(resolve, 28));
      acc += chunk;
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id !== nodeId || !n.freestylePayload) return n;
          const messages = n.freestylePayload.messages.map((m) =>
            m.id === assistantId && m.role === 'assistant' ? { ...m, content: acc, pending: false } : m,
          );
          return { ...n, body: acc.slice(0, 400), freestylePayload: { ...n.freestylePayload, messages } };
        }),
      );
    }
  }, []);

  const toggleFreestyleUserTurnIncluded = useCallback((nodeId: string, messageId: string, included: boolean) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId || !n.freestylePayload) return n;
        const messages = n.freestylePayload.messages.map((m) =>
          m.id === messageId && m.role === 'user' ? { ...m, includedInContext: included } : m,
        );
        return { ...n, freestylePayload: { ...n.freestylePayload, messages } };
      }),
    );
  }, []);

  const sendFreestyleAssistantToCanvas = useCallback(
    (nodeId: string, messageId: string) => {
      const n = nodesRef.current.find((x) => x.id === nodeId);
      const fp = n?.freestylePayload;
      if (!n || !fp) return;
      const msg = fp.messages.find((m) => m.id === messageId && m.role === 'assistant');
      if (!msg || msg.role !== 'assistant' || !msg.content.trim()) return;
      const text = msg.content.trim();
      const assistantId = `fs-canvas-${Date.now()}`;
      const newNode = createCanvasNode({
        kind: 'freestyle',
        label: 'Freestyle · from thread',
        title: 'Freestyle (from thread)',
        x: n.x + 40,
        y: n.y + 40,
        width: 320,
        height: 400,
        tileVariant: 'from-thread',
        colorId: 'amber',
        body: text.slice(0, 400),
        freestylePayload: {
          mode: fp.mode,
          linkedSourceNodeId: fp.linkedSourceNodeId,
          sourceDocumentLabel: fp.sourceDocumentLabel,
          messages: [{ id: assistantId, role: 'assistant', content: text, pending: false }],
        },
      });
      setNodes((prev) => [...prev, newNode]);
      showToast('Sent to canvas as a Freestyle block.', 'success');
    },
    [showToast],
  );

  const sendFreestylePrompt = useCallback(
    async (nodeId: string, promptText: string) => {
      const text = promptText.trim();
      if (!text || canvasReadOnly) return;
      const n = nodesRef.current.find((x) => x.id === nodeId);
      const fp = n?.freestylePayload;
      if (!n || !fp) return;

      const uid = `fs-u-${Date.now()}`;
      const aid = `fs-a-${Date.now() + 1}`;
      const nextMessages = [
        ...fp.messages,
        { id: uid, role: 'user' as const, content: text, includedInContext: true },
        { id: aid, role: 'assistant' as const, content: '', pending: true },
      ];
      setNodes((prev) =>
        prev.map((node) => (node.id === nodeId ? { ...node, freestylePayload: { ...fp, messages: nextMessages } } : node)),
      );

      setFreestyleSendingId(nodeId);
      try {
        const creditRes = await quiloraDeductCredits({
          amount: FREESTYLE_PROMPT_CREDITS,
          eventType: 'freestyle_prompt',
          sandboxId: activeSandboxId && isSupabaseSandboxRowId(activeSandboxId) ? activeSandboxId : null,
          idempotencyKey: `freestyle_${nodeId}_${uid}`,
          metadata: { mode: fp.mode },
        });
        if (!creditRes.ok) {
          setNodes((prev) =>
            prev.map((node) => (node.id === nodeId ? { ...node, freestylePayload: { ...fp, messages: fp.messages } } : node)),
          );
          showToast(creditRes.message ?? 'Insufficient credits.', 'warning');
          return;
        }

        const promptBody = buildFreestylePromptContext(nextMessages);
        const excerpt =
          fp.mode === 'connected' ? buildDocumentContextExcerpt(pageTextByPage, CHAT_CONTEXT_MAX_CHARS) : '';
        const payloadMessage = excerpt
          ? `The following is extracted text from the user's document (grounding — treat as source of truth where applicable):\n${excerpt}\n\nConversation:\n${promptBody}\n\nReply as Assistant to the last User line. Plain text.`
          : `[Standalone freestyle — not document-grounded.]\n\n${promptBody}\n\nReply as Assistant to the last User line. Plain text.`;

        let reply = '';
        const direct = await tryQuiloraDeepseek(payloadMessage);
        if (direct) {
          reply = direct;
        } else {
          const activeSessionId = await ensureSessionId();
          const { data: { session } } = await supabase.auth.getSession();
          if (activeSessionId && session?.access_token) {
            const json = await postSandboxChat(session.access_token, activeSessionId, payloadMessage);
            reply = (json?.message?.content ?? '').trim();
          }
        }
        if (!reply) reply = 'No response returned.';
        await streamFreestyleAssistant(nodeId, aid, reply);
        showToast(`Freestyle — ${FREESTYLE_PROMPT_CREDITS} credit deducted.`, 'success');
      } catch {
        setNodes((prev) =>
          prev.map((node) => {
            if (node.id !== nodeId || !node.freestylePayload) return node;
            const messages = node.freestylePayload.messages.map((m) =>
              m.id === aid && m.role === 'assistant'
                ? { ...m, content: 'Something went wrong. Try again.', pending: false }
                : m,
            );
            return { ...node, freestylePayload: { ...node.freestylePayload, messages } };
          }),
        );
        showToast('Freestyle prompt failed.', 'error');
      } finally {
        setFreestyleSendingId(null);
      }
    },
    [activeSandboxId, canvasReadOnly, ensureSessionId, pageTextByPage, showToast, streamFreestyleAssistant],
  );

  const sendChatMessage = useCallback(async (rawMessage?: string) => {
    const message = (rawMessage ?? chatInput).trim();
    if (!message || isSendingChat) return;
    if (canvasReadOnly) {
      showToast('This sandbox is read-only. Upgrade to Sage to use AI here.', 'warning');
      return;
    }
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: message, timestamp: getNowTime() };
    const assistantMessageId = `assistant-${Date.now() + 1}`;
    setChatInput('');
    setIsSendingChat(true);
    setChatMessages((prev) => [...prev, userMessage, { id: assistantMessageId, role: 'assistant', content: '', timestamp: getNowTime(), pending: true }]);
    try {
      const excerpt = buildDocumentContextExcerpt(pageTextByPage, CHAT_CONTEXT_MAX_CHARS);
      const payloadMessage = excerpt ? `The following is extracted text from the user's PDF (may be truncated):\n${excerpt}\n\nUser message:\n${message}` : message;
      const direct = await tryQuiloraDeepseek(payloadMessage);
      if (direct) {
        await streamAssistantMessage(assistantMessageId, direct);
        return;
      }
      const activeSessionId = await ensureSessionId();
      const { data: { session } } = await supabase.auth.getSession();
      if (!activeSessionId || !session?.access_token) {
        await streamAssistantMessage(assistantMessageId, 'Trenutno ne mogu generirati odgovor. Pokušaj ponovo za trenutak.');
        return;
      }
      const creditRes = await quiloraDeductCredits({
        amount: 1,
        eventType: 'study_chat',
        sandboxId: isSupabaseSandboxRowId(activeSessionId) ? activeSessionId : null,
        idempotencyKey: `study_chat_${userMessage.id}`,
        metadata: { channel: 'canvas' },
      });
      if (!creditRes.ok) {
        await streamAssistantMessage(assistantMessageId, creditRes.message ?? 'Insufficient credits. Please purchase a Boost Pack to continue.');
        return;
      }
      const json = await postSandboxChat(session.access_token, activeSessionId, payloadMessage);
      await streamAssistantMessage(assistantMessageId, json?.message?.content ?? 'The assistant could not generate a response right now. Please try again.');
    } catch {
      await streamAssistantMessage(assistantMessageId, 'Something went wrong while contacting the assistant. Please try again.');
    } finally {
      setIsSendingChat(false);
    }
  }, [canvasReadOnly, chatInput, ensureSessionId, isSendingChat, pageTextByPage, showToast, streamAssistantMessage]);

  const sendReadingChatMessage = useCallback(async (messageText?: string) => {
    const message = (messageText ?? readingChatInput).trim();
    if (!message || readingIsSending) return;
    if (canvasReadOnly) {
      showToast('This sandbox is read-only. Upgrade to Sage to use AI here.', 'warning');
      return;
    }
    const userMessage: ChatMessage = { id: `reader-user-${Date.now()}`, role: 'user', content: message, timestamp: getNowTime() };
    const assistantMessageId = `reader-assistant-${Date.now() + 1}`;
    setReadingChatInput('');
    setReadingIsSending(true);
    setReadingChatMessages((prev) => [...prev, userMessage, { id: assistantMessageId, role: 'assistant', content: '', timestamp: getNowTime(), pending: true }]);
    try {
      const excerpt = buildDocumentContextExcerpt(pageTextByPage, CHAT_CONTEXT_MAX_CHARS);
      const payloadMessage = excerpt
        ? `The following is extracted text from the user's PDF (may be truncated):\n${excerpt}\n\nUser message:\n${message}`
        : message;
      const direct = await tryQuiloraDeepseek(payloadMessage);
      if (direct) {
        await streamReadingAssistantMessage(assistantMessageId, direct);
        return;
      }
      const activeSessionId = await ensureSessionId();
      const { data: { session } } = await supabase.auth.getSession();
      if (!activeSessionId || !session?.access_token) {
        await streamReadingAssistantMessage(assistantMessageId, 'Trenutno ne mogu generirati odgovor. Pokušaj ponovo za trenutak.');
        return;
      }
      const creditRes = await quiloraDeductCredits({
        amount: 1,
        eventType: 'study_chat',
        sandboxId: isSupabaseSandboxRowId(activeSessionId) ? activeSessionId : null,
        idempotencyKey: `study_chat_${userMessage.id}`,
        metadata: { channel: 'reading' },
      });
      if (!creditRes.ok) {
        await streamReadingAssistantMessage(assistantMessageId, creditRes.message ?? 'Insufficient credits. Please purchase a Boost Pack to continue.');
        return;
      }
      const json = await postSandboxChat(session.access_token, activeSessionId, payloadMessage);
      await streamReadingAssistantMessage(assistantMessageId, json?.message?.content ?? 'The assistant could not generate a response right now. Please try again.');
    } catch {
      await streamReadingAssistantMessage(assistantMessageId, 'Something went wrong. Please try again.');
    } finally {
      setReadingIsSending(false);
    }
  }, [canvasReadOnly, ensureSessionId, pageTextByPage, readingChatInput, readingIsSending, showToast, streamReadingAssistantMessage]);

  const sendReaderQuickAction = useCallback((prompt: string) => {
    void sendReadingChatMessage(prompt);
  }, [sendReadingChatMessage]);

  const sendLensFollowUp = useCallback(
    (prompt: string) => {
      void sendReadingChatMessage(prompt);
    },
    [sendReadingChatMessage],
  );

  const streamTutorAssistantMessage = useCallback(async (messageId: string, text: string) => {
    const chunks = text.split(/(\s+)/).filter(Boolean);
    for (const chunk of chunks) {
      await new Promise((resolve) => window.setTimeout(resolve, 18));
      setTutorMessages((prev) => prev.map((message) => message.id === messageId ? { ...message, content: `${message.content}${chunk}`, pending: true } : message));
    }
    setTutorMessages((prev) => prev.map((message) => message.id === messageId ? { ...message, pending: false } : message));
  }, []);

  const sendTutorMessage = useCallback(async (rawMessage?: string) => {
    const message = (rawMessage ?? tutorInput).trim();
    if (!message || tutorSending) return;
    if (canvasReadOnly) {
      showToast('This sandbox is read-only. Upgrade to Sage to use AI here.', 'warning');
      return;
    }
    const userMessage: ChatMessage = { id: `tutor-user-${Date.now()}`, role: 'user', content: message, timestamp: getNowTime() };
    const assistantMessageId = `tutor-assistant-${Date.now() + 1}`;
    setTutorInput('');
    setTutorSending(true);
    setTutorMessages((prev) => [...prev, userMessage, { id: assistantMessageId, role: 'assistant', content: '', timestamp: getNowTime(), pending: true }]);
    try {
      const excerpt = buildDocumentContextExcerpt(pageTextByPage, CHAT_CONTEXT_MAX_CHARS);
      const payloadMessage = excerpt
        ? `You are an AI tutor for this PDF. Use the following extracted document text as primary context (may be truncated):\n${excerpt}\n\nStudent question:\n${message}`
        : message;
      const direct = await tryQuiloraDeepseek(payloadMessage);
      if (direct) {
        await streamTutorAssistantMessage(assistantMessageId, direct);
        return;
      }
      const activeSessionId = await ensureSessionId();
      const { data: { session } } = await supabase.auth.getSession();
      if (!activeSessionId || !session?.access_token) {
        await streamTutorAssistantMessage(assistantMessageId, 'Trenutno ne mogu generirati odgovor. Pokušaj ponovo za trenutak.');
        return;
      }
      const creditRes = await quiloraDeductCredits({
        amount: 1,
        eventType: 'study_chat',
        sandboxId: isSupabaseSandboxRowId(activeSessionId) ? activeSessionId : null,
        idempotencyKey: `study_chat_${userMessage.id}`,
        metadata: { channel: 'tutor' },
      });
      if (!creditRes.ok) {
        await streamTutorAssistantMessage(assistantMessageId, creditRes.message ?? 'Insufficient credits. Please purchase a Boost Pack to continue.');
        return;
      }
      const json = await postSandboxChat(session.access_token, activeSessionId, payloadMessage);
      await streamTutorAssistantMessage(assistantMessageId, json?.message?.content ?? 'I could not generate a tutor response right now.');
    } catch {
      await streamTutorAssistantMessage(assistantMessageId, 'Something went wrong while contacting the AI Tutor. Please try again.');
    } finally {
      setTutorSending(false);
    }
  }, [canvasReadOnly, ensureSessionId, pageTextByPage, showToast, streamTutorAssistantMessage, tutorInput, tutorSending]);

  const sendTutorPreset = useCallback((prompt: string) => {
    void sendTutorMessage(prompt);
  }, [sendTutorMessage]);

  const generateQuizFromDocument = useCallback(async () => {
    if (!selectedFile) return;
    if (canvasReadOnly) {
      showToast('This sandbox is read-only. Upgrade to Sage to generate quizzes.', 'warning');
      return;
    }
    setIsGeneratingQuiz(true);
    try {
      const activeSessionId = await ensureSessionId();
      const { data: { session } } = await supabase.auth.getSession();
      if (!activeSessionId || !session?.access_token) {
        setQuizQuestions([]);
        return;
      }
      const masteryCost = masteryBlitzCreditCost(questionCount);
      const qDedupe = `mastery_quiz_${activeSessionId}_${questionCount}_${difficulty}_${Date.now()}`;
      const creditRes = await quiloraDeductCredits({
        amount: masteryCost,
        eventType: 'mastery_blitz',
        sandboxId: isSupabaseSandboxRowId(activeSessionId) ? activeSessionId : null,
        idempotencyKey: qDedupe,
        metadata: { questionCount, difficulty },
      });
      if (!creditRes.ok) {
        showToast(creditRes.message ?? 'Insufficient credits. Please purchase a Boost Pack to continue.', 'error');
        setQuizQuestions([]);
        return;
      }
      const excerpt = buildDocumentContextExcerpt(pageTextByPage, QUIZ_CONTEXT_MAX_CHARS);
      const prompt = `${excerpt ? `Use this extracted PDF text as the only source of questions:\n${excerpt}\n\n` : ''}Generate exactly ${questionCount} multiple-choice quiz questions from the uploaded PDF context.
Return STRICT JSON array only.
Schema:
[{"id":"q1","question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]
Difficulty: ${difficulty}.`;
      const json = await postSandboxChat(session.access_token, activeSessionId, prompt);
      const content = (json?.message?.content ?? '').trim();
      const start = content.indexOf('[');
      const end = content.lastIndexOf(']');
      if (start === -1 || end === -1) throw new Error('invalid quiz payload');
      const parsed = JSON.parse(content.slice(start, end + 1)) as QuizQuestion[];
      const normalized = parsed
        .filter((item) => Array.isArray(item.options) && item.options.length === 4)
        .slice(0, questionCount)
        .map((item, index) => ({ ...item, id: item.id || `q-${index + 1}`, correctIndex: Math.max(0, Math.min(3, Number(item.correctIndex ?? 0))) }));
      setQuizQuestions(normalized);
      setQuizIndex(0);
      setQuizSelectedOption(null);
      setQuizSubmitted(false);
      setQuizScore(0);
      setQuizComplete(false);
    } catch {
      setQuizQuestions([]);
      showToast('Quiz generation failed. Check your connection or try again.', 'error');
    } finally {
      setIsGeneratingQuiz(false);
    }
  }, [canvasReadOnly, difficulty, ensureSessionId, pageTextByPage, questionCount, selectedFile, showToast]);

  useEffect(() => {
    if (workspaceMode !== 'mastery' || masteryView !== 'quiz') return;
    if (!selectedFile) return;
    void generateQuizFromDocument();
  }, [difficulty, generateQuizFromDocument, masteryView, questionCount, selectedFile, workspaceMode]);

  const addAnimatedEdge = useCallback((edge: CanvasEdge) => {
    setEdges((prev) => [...prev, edge]);
    window.setTimeout(() => setEdges((prev) => prev.map((item) => item.id === edge.id ? { ...item, animated: false } : item)), 320);
  }, []);

  const onCanvasDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (canvasReadOnly) return;
      if (!canvasRef.current) return;
      const outer = canvasRef.current.getBoundingClientRect();
      const x = (event.clientX - outer.left - canvasPan.x) / canvasScale;
      const y = (event.clientY - outer.top - canvasPan.y) / canvasScale;

      const bubbleRaw = event.dataTransfer.getData(FREESTYLE_BUBBLE_DRAG_MIME);
      if (bubbleRaw) {
        try {
          const parsed = JSON.parse(bubbleRaw) as {
            text?: string;
            mode?: string;
            linkedSourceNodeId?: string | null;
            sourceDocumentLabel?: string;
          };
          const t = String(parsed.text ?? '').trim();
          if (t) {
            const mode = parsed.mode === 'connected' ? 'connected' : 'standalone';
            const initial = initialFreestylePayload(
              mode,
              parsed.linkedSourceNodeId ?? null,
              String(parsed.sourceDocumentLabel ?? ''),
            );
            const assistantId = `fs-drop-${Date.now()}`;
            const newNode = createCanvasNode({
              kind: 'freestyle',
              label: 'Freestyle · from thread',
              title: 'Freestyle (from thread)',
              x,
              y,
              width: 320,
              height: 400,
              tileVariant: 'drag-from-thread',
              colorId: 'amber',
              body: t.slice(0, 400),
              freestylePayload: {
                ...initial,
                messages: [{ id: assistantId, role: 'assistant', content: t, pending: false }],
              },
            });
            setNodes((prev) => [...prev, newNode]);
            showToast('Sent to canvas as a Freestyle block.', 'success');
          }
        } catch {
          /* ignore malformed drag payload */
        }
        return;
      }

      const label = event.dataTransfer.getData('nodeType');
      if (!label) return;
      const kind = nodeKindFromLabel(label);

      if (kind === 'lens') {
        let lensNodeForActivation: CanvasNode | null = null;
        let sourceTitleForActivation = '';
        setNodes((prev) => {
          const src = [...prev].reverse().find((n) => n.kind === 'source' && n.sourceArtifact);
          if (!src?.sourceArtifact) {
            showToast('Add a Source block first to ground the Lens.', 'warning');
            return prev;
          }
          const subtype: LensSubtype = 'theme';
          sourceTitleForActivation = src.title || src.label;
          const initial = initialLensPayload(subtype, src.id, sourceTitleForActivation);
          const newNode = createCanvasNode({
            kind: 'lens',
            label: `Lens · ${LENS_SUBTYPE_LABELS[subtype]}`,
            x,
            y,
            width: 320,
            height: 320,
            title: NODE_LABELS.lens,
            tileVariant: 'drag-default',
            colorId: 'violet',
            lensPayload: { ...initial, loading: true },
          });
          lensNodeForActivation = newNode;
          const next = [...prev, newNode];
          if (prev.length > 0) {
            setPendingConnection({ nodeId: newNode.id, x: newNode.x + 8, y: newNode.y + newNode.height + 12 });
          }
          return next;
        });
        if (lensNodeForActivation && sourceTitleForActivation) {
          queueMicrotask(() => void runLensActivation(lensNodeForActivation!, sourceTitleForActivation));
        }
        return;
      }

      if (kind === 'evidence') {
        let evidenceNodeForActivation: CanvasNode | null = null;
        let evidenceSourceTitle = '';
        setNodes((prev) => {
          const src = [...prev].reverse().find((n) => n.kind === 'source' && n.sourceArtifact);
          if (!src?.sourceArtifact) {
            showToast('Add a Source block first to ground Evidence.', 'warning');
            return prev;
          }
          evidenceSourceTitle = src.title || src.label;
          const initial = initialEvidencePayload('anchor', src.id, evidenceSourceTitle);
          const newNode = createCanvasNode({
            kind: 'evidence',
            label: `Evidence · ${getOverlayTileLabel('evidence', 'anchor')}`,
            x,
            y,
            width: 320,
            height: 380,
            title: NODE_LABELS.evidence,
            tileVariant: 'drag-default',
            colorId: 'violet',
            evidencePayload: { ...initial, loading: true },
          });
          evidenceNodeForActivation = newNode;
          const next = [...prev, newNode];
          if (prev.length > 0) {
            setPendingConnection({ nodeId: newNode.id, x: newNode.x + 8, y: newNode.y + newNode.height + 12 });
          }
          return next;
        });
        if (evidenceNodeForActivation && evidenceSourceTitle) {
          queueMicrotask(() => void runEvidenceActivation(evidenceNodeForActivation!, evidenceSourceTitle));
        }
        return;
      }

      if (kind === 'freestyle') {
        const initial = initialFreestylePayload('standalone', null, '');
        const newNode = createCanvasNode({
          kind: 'freestyle',
          label: NODE_LABELS.freestyle,
          x,
          y,
          width: 320,
          height: 420,
          title: NODE_LABELS.freestyle,
          tileVariant: 'drag-default',
          colorId: 'amber',
          freestylePayload: initial,
        });
        setNodes((prev) => {
          const next = [...prev, newNode];
          if (prev.length > 0) {
            setPendingConnection({ nodeId: newNode.id, x: newNode.x + 8, y: newNode.y + newNode.height + 12 });
          }
          return next;
        });
        return;
      }

      const newNode = createCanvasNode({
        kind,
        label,
        title: label.split('·').pop()?.trim() ?? label,
        x,
        y,
        width: label.length > 18 ? 300 : 240,
        height: 148,
        tileVariant: 'drag-default',
      });
      setNodes((prev) => {
        const next = [...prev, newNode];
        if (prev.length > 0) {
          setPendingConnection({ nodeId: newNode.id, x: newNode.x + 8, y: newNode.y + newNode.height + 12 });
        }
        return next;
      });
    },
    [canvasPan.x, canvasPan.y, canvasReadOnly, canvasScale, runLensActivation, runEvidenceActivation, showToast],
  );

  if (phase === 'upload') {
    return (<><input ref={fileInputRef} type="file" accept=".pdf,.epub,application/pdf" className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} /><UploadScreen fileName={selectedFile?.name ?? null} isDragging={isDraggingFile} onBrowse={() => fileInputRef.current?.click()} onUpload={() => selectedFile ? startLoadingFlow(selectedFile) : fileInputRef.current?.click()} onDrop={(event) => { event.preventDefault(); setIsDraggingFile(false); setSelectedFile(event.dataTransfer.files?.[0] ?? null); }} onDragOver={(event) => { event.preventDefault(); setIsDraggingFile(true); }} onDragLeave={() => setIsDraggingFile(false)} /></>);
  }
  if (phase === 'loading') {
    return (
      <LoadingScreen
        exiting={loaderExiting}
        onFadeOutComplete={() => {
          setPhase('workspace');
          setLoaderExiting(false);
          setLoaderProgress(0);
          setLoaderActiveStage(0);
          setWorkspaceEnter(false);
          window.requestAnimationFrame(() => {
            window.setTimeout(() => setWorkspaceEnter(true), 90);
          });
        }}
        progress={loaderProgress}
        activeStage={loaderActiveStage}
      />
    );
  }

  return (
    <div className="flex h-screen min-h-0 min-w-0 flex-col overflow-x-hidden bg-[#0a1929] font-[Inter,sans-serif]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden text-white" style={{ background: BLUE.deep }}>
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#091523] px-4 py-3 shadow-[0_10px_40px_rgba(10,25,41,0.18)]">
        {workspaceMode === 'reading' ? (
          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <SandboxTopModeStrip workspaceMode={workspaceMode} onSelectWorkspace={animateModeChange} variant="reading" />
              <div className="h-9 w-px shrink-0 bg-white/10" />
              <span className="truncate text-sm font-medium text-white">{selectedFile?.name ?? `${activeSandboxName}.pdf`}</span>
            </div>
            <div />
            <div className="flex items-center justify-end gap-1">
              <CreditBalanceWidget variant="toolbar" className="mr-1" />
              <SandboxHeaderProfileButton user={user} />
              <button
                type="button"
                onClick={() => {
                  setReadingImmersive((prev) => {
                    if (prev) {
                      setReadingChatCollapsed(false);
                      setReadingChatWidth(Math.min(CHAT_PANEL_MAX, Math.max(CHAT_PANEL_MIN, readingChatPrevWidthRef.current)));
                    }
                    return !prev;
                  });
                }}
                className="rounded-full p-3 text-[#d7ebff] transition hover:bg-[#3b82c4]/18 hover:text-white"
                aria-label="Focus mode"
              >
                <Eye className="h-4.5 w-4.5" />
              </button>
              <button type="button" onClick={() => readingZoomBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })} className="rounded-full p-3 text-[#d7ebff] transition hover:bg-[#3b82c4]/18 hover:text-white" aria-label="Zoom controls">
                <ZoomIn className="h-4.5 w-4.5" />
              </button>
              <button type="button" onClick={toggleReadingTts} className={`rounded-full p-3 transition ${readingTtsActive ? 'bg-[#3b82c4]/15 text-white' : 'text-[#d7ebff] hover:bg-[#3b82c4]/18 hover:text-white'}`} aria-label="Read aloud">
                <Volume2 className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-4">
              <SandboxTopModeStrip workspaceMode={workspaceMode} onSelectWorkspace={animateModeChange} variant="canvas" />
              <div className="h-9 w-px bg-white/10" />
              <span className="truncate text-sm font-semibold tracking-wide text-white">{activeSandboxName}</span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBlocksPanelOpen(true)}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:border-[#266ba7]/40 hover:text-white"
                aria-expanded={blocksPanelOpen}
                aria-controls="blocks-library-panel"
              >
                <LayoutList className="h-4 w-4" aria-hidden />
                Blocks
              </button>
              <CreditBalanceWidget variant="toolbar" />
              <SandboxHeaderProfileButton user={user} />
              <button type="button" onClick={() => navigate('/dashboard')} className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:border-[#266ba7]/40 hover:text-white">Exit Sandbox</button>
            </div>
          </>
        )}
      </header>
      {canvasReadOnly ? (
        <div className="shrink-0 border-b border-amber-500/35 bg-amber-500/10 px-4 py-2.5 text-center text-xs text-amber-50">
          <strong>Read-only sandbox</strong> (Bookworm sandbox cap).{' '}
          <button type="button" className="font-semibold text-white underline-offset-2 hover:underline" onClick={() => navigate('/pricing')}>
            Upgrade to Sage
          </button>{' '}
          to edit blocks and run paid AI again. Pan and review still work.
        </div>
      ) : null}
      <div
        className={`relative min-h-0 flex-1 origin-center transition-[opacity,transform] duration-[920ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform] ${viewVisible && workspaceEnter ? 'scale-100 opacity-100' : 'scale-[0.985] opacity-0'}`}
      >
        {workspaceMode === 'canvass' && (
          <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden lg:flex-row lg:overflow-hidden">
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden max-lg:max-h-[min(52vh,520px)] lg:max-h-none lg:flex lg:flex-col">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden items-center pl-5 lg:flex">
                <div className="pointer-events-auto">
                  <NodeToolbar disabled={canvasReadOnly} variant="vertical" onChooseNodeKind={(k) => setNodeOverlayKind(k)} />
                </div>
              </div>
              <div ref={canvasRef} className="relative min-h-[min(200px,36dvh)] flex-1 cursor-grab overflow-hidden bg-white active:cursor-grabbing lg:min-h-0" onWheel={onWheelCanvas} onMouseDown={onCanvasMouseDown} onTouchStart={onCanvasTouchStart} onTouchMove={onCanvasTouchMove} onTouchEnd={() => { touchModeRef.current = null; }} onDragOver={(event) => event.preventDefault()} onDrop={onCanvasDrop} style={{ touchAction: 'none', backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.34) 1px, transparent 1.6px)', backgroundSize: `${28 * canvasScale}px ${28 * canvasScale}px`, backgroundPosition: `${canvasPan.x}px ${canvasPan.y}px` }}>
              <input
                ref={sourceEp4FileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.epub,application/pdf,application/epub+zip"
                onChange={(event) => {
                  const f = event.target.files?.[0];
                  event.target.value = '';
                  if (f) void handleSourceEp4File(f);
                }}
              />
              <div className="absolute inset-0" style={{ transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasScale})`, transformOrigin: '0 0' }}>
                <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
                  <defs>
                    <marker id={`sb-arrow-${markerId}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                      <path d="M0,0 L8,4 L0,8 Z" fill="#266ba7" />
                    </marker>
                    <marker id={`sb-arrow-conn-${markerId}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                      <path d="M0,0 L8,4 L0,8 Z" fill="#e8825a" />
                    </marker>
                  </defs>
                  {edges.map((edge) => {
                    const from = nodes.find((node) => node.id === edge.from);
                    const to = nodes.find((node) => node.id === edge.to);
                    if (!from || !to) return null;
                    const isConn = edgeInvolvesConnectorNode(edge, nodes);
                    return (
                      <path
                        key={edge.id}
                        data-connector-line-between-blocks={isConn ? '' : undefined}
                        d={getEdgePath(from, to)}
                        fill="none"
                        stroke={isConn ? '#e8825a' : '#266ba7'}
                        strokeWidth={isConn ? 2.75 : 3}
                        markerEnd={isConn ? `url(#sb-arrow-conn-${markerId})` : `url(#sb-arrow-${markerId})`}
                        pathLength={1}
                        style={edge.animated ? { strokeDasharray: 1, strokeDashoffset: 1, animation: 'drawEdge 300ms ease-out forwards' } : undefined}
                      />
                    );
                  })}
                  {connectDrag
                    ? (() => {
                        const fromN = nodes.find((n) => n.id === connectDrag.fromNodeId);
                        if (!fromN) return null;
                        const tail = getNodeConnectTail(fromN);
                        return (
                          <path
                            data-drag-line-preview
                            d={`M ${tail.x} ${tail.y} L ${connectDrag.px} ${connectDrag.py}`}
                            fill="none"
                            stroke="#e8825a"
                            strokeWidth="2.5"
                            strokeDasharray="6 4"
                          />
                        );
                      })()
                    : null}
                  {nodes.map((lensNode) => {
                    if (lensNode.kind !== 'lens' || !lensNode.lensPayload?.linkedSourceNodeId) return null;
                    const srcNode = nodes.find((n) => n.id === lensNode.lensPayload!.linkedSourceNodeId);
                    if (!srcNode) return null;
                    return (
                      <path
                        key={`lens-source-${lensNode.id}`}
                        data-source-connection-line
                        d={getEdgePath(srcNode, lensNode)}
                        fill="none"
                        stroke="#a8a0f8"
                        strokeWidth="2.5"
                        strokeDasharray="7 5"
                      />
                    );
                  })}
                  {nodes.map((evNode) => {
                    if (evNode.kind !== 'evidence' || !evNode.evidencePayload?.linkedSourceNodeId) return null;
                    const srcNode = nodes.find((n) => n.id === evNode.evidencePayload!.linkedSourceNodeId);
                    if (!srcNode) return null;
                    return (
                      <path
                        key={`evidence-source-${evNode.id}`}
                        data-evidence-source-connection-line
                        d={getEdgePath(srcNode, evNode)}
                        fill="none"
                        stroke="#7b68ee"
                        strokeWidth="2.5"
                        strokeDasharray="6 4"
                      />
                    );
                  })}
                  {nodes.map((fsNode) => {
                    if (fsNode.kind !== 'freestyle' || !fsNode.freestylePayload?.linkedSourceNodeId) return null;
                    const srcNode = nodes.find((n) => n.id === fsNode.freestylePayload!.linkedSourceNodeId);
                    if (!srcNode) return null;
                    return (
                      <path
                        key={`freestyle-source-${fsNode.id}`}
                        data-source-connection-line
                        d={getEdgePath(srcNode, fsNode)}
                        fill="none"
                        stroke="#f0a500"
                        strokeWidth="2.5"
                        strokeDasharray="6 4"
                      />
                    );
                  })}
                </svg>
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="pointer-events-auto absolute cursor-move"
                    style={{
                      left: node.x,
                      top: node.y,
                      width: node.width,
                      minHeight: node.height,
                      zIndex: dragNodeId === node.id ? 25 : 2,
                    }}
                    onMouseDown={(event) => {
                      const el = event.target as HTMLElement;
                      if (
                        el.closest(
                          '[data-resize-handle], [data-block-context-menu], [data-lens-no-drag], [data-evidence-no-drag], [data-freestyle-no-drag], [data-connector-no-drag], button, textarea, input',
                        )
                      )
                        return;
                      if (event.ctrlKey || event.metaKey) {
                        event.stopPropagation();
                        toggleNodeSelected(node.id);
                        return;
                      }
                      if (!selectedNodeIds.has(node.id)) {
                        setSelectedNodeIds(new Set([node.id]));
                      }
                      event.stopPropagation();
                      const nodeBounds = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                      setDragNodeId(node.id);
                      setDragNodeOffset({ x: event.clientX - nodeBounds.left, y: event.clientY - nodeBounds.top });
                    }}
                  >
                    {node.kind === 'source' && node.sourceArtifact ? (
                      <SourceBlockChrome
                        node={node}
                        artifact={node.sourceArtifact}
                        readOnly={canvasReadOnly}
                        pdfPageCount={pdfPageCount}
                        onUpdate={patchNode}
                        onDelete={deleteNode}
                        onDuplicate={duplicateNode}
                        onNativeConnectFromMenu={onNativeConnectFromMenu}
                        onConnectorDragStart={onConnectorDragStart}
                        onResizePointerDown={onResizePointerDown}
                        onOpenReadingMode={() => setWorkspaceMode('reading')}
                        onOpenChapterSplit={() => {
                          const pages = Math.max(2, pdfPageCount || node.sourceArtifact?.totalPdfPages || 2);
                          setChapterOverlay({
                            totalPages: pages,
                            targetSourceId: node.id,
                            initialSelected: node.sourceArtifact?.chapterSelectedPageIndices ?? null,
                            placeAt: null,
                          });
                        }}
                      />
                    ) : node.ghostProposal ? (
                      <GhostNodeFrame
                        ghostNodeId={node.id}
                        readOnly={canvasReadOnly}
                        entityLabel={node.ghostProposal.entityLabel}
                        entityType={node.ghostProposal.entityType}
                        linkedSourceNodeId={node.ghostProposal.linkedSourceNodeId}
                        onConfirm={() => void confirmGhostNode(node.id)}
                        onDismiss={() => deleteNode(node.id)}
                        onLinkToSource={() => focusNodeOnCanvas(node.ghostProposal!.linkedSourceNodeId)}
                        onNativeConnectFromMenu={onNativeConnectFromMenu}
                        onConnectorDragStart={onConnectorDragStart}
                      />
                    ) : node.kind === 'connector' && node.connectorPayload ? (
                      <ConnectorBlockChrome
                        node={node}
                        payload={node.connectorPayload}
                        endpointALabel={
                          nodes.find((x) => x.id === node.connectorPayload!.endpointFromId)?.title ??
                          nodes.find((x) => x.id === node.connectorPayload!.endpointFromId)?.label ??
                          'Block A'
                        }
                        endpointBLabel={
                          nodes.find((x) => x.id === node.connectorPayload!.endpointToId)?.title ??
                          nodes.find((x) => x.id === node.connectorPayload!.endpointToId)?.label ??
                          'Block B'
                        }
                        readOnly={canvasReadOnly}
                        onDelete={deleteNode}
                        onDuplicate={duplicateNode}
                        onResizePointerDown={onResizePointerDown}
                        onConnectorDragStart={onConnectorDragStart}
                      />
                    ) : node.kind === 'freestyle' && node.freestylePayload ? (
                      <FreestyleBlockChrome
                        node={node}
                        payload={node.freestylePayload}
                        readOnly={canvasReadOnly}
                        isSending={freestyleSendingId === node.id}
                        onUpdate={patchNode}
                        onDelete={deleteNode}
                        onDuplicate={duplicateNode}
                        onNativeConnectFromMenu={onNativeConnectFromMenu}
                        onConnectorDragStart={onConnectorDragStart}
                        onResizePointerDown={onResizePointerDown}
                        onSendPrompt={(id, t) => void sendFreestylePrompt(id, t)}
                        onToggleUserTurnIncluded={toggleFreestyleUserTurnIncluded}
                        onSendAssistantToCanvas={sendFreestyleAssistantToCanvas}
                      />
                    ) : node.kind === 'evidence' && node.evidencePayload ? (
                      <EvidenceBlockChrome
                        node={node}
                        payload={node.evidencePayload}
                        readOnly={canvasReadOnly}
                        sourceMissing={
                          !nodes.some(
                            (n) => n.id === node.evidencePayload!.linkedSourceNodeId && n.kind === 'source' && n.sourceArtifact,
                          )
                        }
                        corpusTextByPage={pageTextByPage}
                        onUpdate={patchNode}
                        onDelete={deleteNode}
                        onDuplicate={duplicateNode}
                        onNativeConnectFromMenu={onNativeConnectFromMenu}
                        onConnectorDragStart={onConnectorDragStart}
                        onResizePointerDown={onResizePointerDown}
                        onToggleFavorite={toggleBlockFavorite}
                        onFocusSourceNode={focusNodeOnCanvas}
                        onMicroSearchPaid={async (nodeId, _query) => evidenceMicroSearchPaid(nodeId)}
                      />
                    ) : node.kind === 'lens' && node.lensPayload ? (
                      <LensBlockChrome
                        node={node}
                        payload={node.lensPayload}
                        readOnly={canvasReadOnly}
                        onUpdate={patchNode}
                        onDelete={deleteNode}
                        onDuplicate={duplicateNode}
                        onNativeConnectFromMenu={onNativeConnectFromMenu}
                        onConnectorDragStart={onConnectorDragStart}
                        onResizePointerDown={onResizePointerDown}
                        onToggleFavorite={toggleBlockFavorite}
                        onPersonaSubmit={(id, name) => void handlePersonaLensSubmit(id, name)}
                      />
                    ) : (
                      <CanvasBlockChrome
                        node={node}
                        readOnly={canvasReadOnly}
                        unanchoredClaim={isUnanchoredClaimNode(node)}
                        onAttachEvidence={canvasReadOnly ? undefined : (id) => setAttachEvidenceForBlockId(id)}
                        onUpdate={patchNode}
                        onDelete={deleteNode}
                        onDuplicate={duplicateNode}
                        onNativeConnectFromMenu={onNativeConnectFromMenu}
                        onConnectorDragStart={onConnectorDragStart}
                        onResizePointerDown={onResizePointerDown}
                        onToggleFavorite={toggleBlockFavorite}
                      />
                    )}
                  </div>
                ))}
                {multiSelectBounds && !canvasReadOnly ? (
                  <div
                    data-multi-select-action-bar
                    data-action-bar-position
                    className="pointer-events-auto absolute z-[55] flex -translate-x-1/2 flex-wrap items-center gap-2 rounded-2xl border border-white/12 bg-[#0d1f33]/98 px-3 py-2 shadow-[0_20px_50px_rgba(10,25,41,0.35)]"
                    style={{ left: multiSelectBounds.cx, top: Math.max(4, multiSelectBounds.top - 52) }}
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <span
                      data-selection-count-badge
                      className="rounded-full bg-[#e8825a]/25 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-[#fde68a]"
                    >
                      {selectedNodeIds.size}
                    </span>
                    <button
                      type="button"
                      data-connect-btn
                      className="rounded-full bg-[#266ba7]/30 px-3 py-1 text-[11px] font-semibold text-[#b9dcff] hover:bg-[#266ba7]/45"
                      onClick={onMultiConnect}
                    >
                      Connect
                    </button>
                    <button
                      type="button"
                      data-group-btn
                      className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white hover:bg-white/15"
                      onClick={onMultiGroup}
                    >
                      Group
                    </button>
                    <button
                      type="button"
                      data-delete-btn
                      className="rounded-full bg-rose-500/25 px-3 py-1 text-[11px] font-semibold text-rose-100 hover:bg-rose-500/40"
                      onClick={onMultiDelete}
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
                {linkPicker && !canvasReadOnly ? (
                  <ConnectorPickerEP07
                    canvasX={linkPicker.canvasX + 6}
                    canvasY={linkPicker.canvasY + 6}
                    phase={linkPicker.phase}
                    reasoningDraft={linkPicker.reasoningDraft}
                    causeSubmitBusy={causeAiBusy}
                    onReasoningChange={(v) => setLinkPicker((p) => (p ? { ...p, reasoningDraft: v } : null))}
                    onPickRelationship={() => {
                      setLinkPicker((p) => {
                        if (!p) return p;
                        queueMicrotask(() => void finalizeNativeConnector(p.fromNodeId, p.toNodeId, 'relationship', ''));
                        return null;
                      });
                    }}
                    onPickContrast={() => {
                      setLinkPicker((p) => {
                        if (!p) return p;
                        queueMicrotask(() => void finalizeNativeConnector(p.fromNodeId, p.toNodeId, 'contrast', ''));
                        return null;
                      });
                    }}
                    onPickCauseEffect={() => {
                      setLinkPicker((prev) => (prev ? { ...prev, phase: 'cause_effect' } : null));
                    }}
                    onSubmitCauseToAi={() => {
                      setCauseAiBusy(true);
                      setLinkPicker((p) => {
                        if (!p || !p.reasoningDraft.trim()) {
                          queueMicrotask(() => setCauseAiBusy(false));
                          return p;
                        }
                        const { fromNodeId, toNodeId, reasoningDraft } = p;
                        queueMicrotask(async () => {
                          try {
                            await finalizeNativeConnector(fromNodeId, toNodeId, 'cause_effect', reasoningDraft);
                          } finally {
                            setCauseAiBusy(false);
                          }
                        });
                        return null;
                      });
                    }}
                    onDismiss={() => setLinkPicker(null)}
                  />
                ) : null}
                {pendingConnection && (
                  <div
                    data-connect-popup
                    role="dialog"
                    aria-label="Connect node"
                    className="absolute z-20 w-72 rounded-2xl border border-white/10 bg-[#0d1f33]/96 p-4 shadow-[0_24px_60px_rgba(10,25,41,0.3)]"
                    style={{ left: pendingConnection.x, top: pendingConnection.y }}
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <p className="mb-3 text-sm font-semibold text-white">Connect to:</p>
                    <div className="flex flex-wrap gap-2">
                      {nodes.filter((node) => node.id !== pendingConnection.nodeId).map((node) => (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => {
                            const pendingNode = nodes.find((n) => n.id === pendingConnection.nodeId);
                            const fromEvidence = pendingNode?.kind === 'evidence';
                            const fromId = fromEvidence ? pendingConnection.nodeId : node.id;
                            const toId = fromEvidence ? node.id : pendingConnection.nodeId;
                            addAnimatedEdge({
                              id: `edge-${fromId}-${toId}`,
                              from: fromId,
                              to: toId,
                              animated: true,
                            });
                            setPendingConnection(null);
                          }}
                          className="rounded-full bg-[#266ba7]/20 px-3 py-1.5 text-xs font-semibold text-[#b9dcff] hover:bg-[#266ba7]/35"
                        >
                          {node.label.slice(0, 26)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {nodes.length === 0 ? (
                <div
                  id="empty-state-prompt"
                  data-empty-canvas-prompt
                  className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center px-6 py-10"
                >
                  <div className="max-w-lg rounded-2xl border border-[#266ba7]/25 bg-white/[0.97] px-6 py-5 text-center shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
                    <p className="text-base font-semibold text-[#0f172a]">Start your sandbox map</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                      Drag <strong>Source</strong>, <strong>Lens</strong>, <strong>Evidence</strong>, or <strong>Freestyle</strong> from the left toolbar and drop them on the canvas.
                    </p>
                    <p className="mt-3 text-xs text-[#64748b]">Pan: drag empty space · Zoom: bottom-right controls or pinch</p>
                  </div>
                </div>
              ) : null}
              <CanvasMiniMap canvasRef={canvasRef} nodes={nodes} canvasPan={canvasPan} canvasScale={canvasScale} />
              <div className="pointer-events-auto absolute bottom-3 right-3 z-10 flex items-center gap-0.5 rounded-full border border-[#1e3a5f] bg-[#0a1628] px-2 py-1.5 text-xs font-medium text-white/95 shadow-[0_12px_32px_rgba(0,0,0,0.45)] sm:bottom-5 sm:right-5 sm:gap-1 sm:px-3">
                <button type="button" onClick={() => zoomCanvasPercent(-1)} className="flex h-10 min-h-[44px] w-10 min-w-[44px] touch-manipulation items-center justify-center rounded-full text-[#9bcfff] transition-colors hover:bg-white/10" aria-label="Zoom out"><Minus className="h-4 w-4" /></button>
                <span className="min-w-[3.25rem] text-center tabular-nums text-white/90">{Math.round(canvasScale * 100)}%</span>
                <button type="button" onClick={() => zoomCanvasPercent(1)} className="flex h-10 min-h-[44px] w-10 min-w-[44px] touch-manipulation items-center justify-center rounded-full text-[#9bcfff] transition-colors hover:bg-white/10" aria-label="Zoom in"><Plus className="h-4 w-4" /></button>
              </div>
              <style>{`@keyframes drawEdge{to{stroke-dashoffset:0;}}`}</style>
            </div>
              <div className="pointer-events-auto z-20 shrink-0 border-t border-white/10 bg-[#0d1f33]/98 px-2 py-2 lg:hidden">
                <NodeToolbar disabled={canvasReadOnly} variant="horizontal" onChooseNodeKind={(k) => setNodeOverlayKind(k)} />
              </div>
            </div>
            <div
              className="relative z-20 flex min-h-[min(280px,46dvh)] w-full shrink-0 flex-col border-t border-white/10 max-lg:min-h-0 max-lg:flex-1 lg:h-full lg:min-h-0 lg:w-auto lg:max-h-none lg:border-t-0 lg:border-l"
              style={{
                width: isLgUp ? (canvasChatCollapsed ? CHAT_COLLAPSE_TAB : canvasChatWidth) : canvasChatCollapsed ? CHAT_COLLAPSE_TAB : '100%',
              }}
            >
              {!canvasChatCollapsed && (
                <div className="flex min-h-0 min-w-0 flex-1 flex-row">
                  <button
                    type="button"
                    aria-label="Resize chat panel"
                    onMouseDown={onCanvasChatResizePointerDown}
                    className="w-2 shrink-0 cursor-col-resize self-stretch border-0 bg-transparent hover:bg-[#3b82c4]/45"
                  />
                  <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                    <CanvasAssistantPanel documentName={selectedFile?.name ?? `${activeSandboxName}.pdf`} viewingPage={1} messages={chatMessages} inputValue={chatInput} isSending={isSendingChat} onInputChange={setChatInput} onSend={() => void sendChatMessage()} onQuickAction={(prompt) => void sendChatMessage(prompt)} endRef={chatEndRef} />
                  </div>
                </div>
              )}
              {canvasChatCollapsed && (
                <button
                  type="button"
                  aria-label="Drag to expand chat panel"
                  onMouseDown={onCanvasChatResizePointerDown}
                  className="flex h-full w-full cursor-col-resize items-center justify-center border-l border-white/20 bg-[#091523] text-lg leading-none text-white/45 hover:bg-[#0d1f33] hover:text-white"
                >
                  ⋯
                </button>
              )}
            </div>
          </div>
        )}

        {workspaceMode === 'reading' && (
          <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden lg:flex-row">
            {!isLgUp && mobileReadingPagesOpen && !readingImmersive && (
              <div
                role="presentation"
                className="fixed inset-0 z-[50] bg-black/50 lg:hidden"
                onClick={() => setMobileReadingPagesOpen(false)}
              />
            )}
            {!isLgUp && !readingImmersive && (
              <button
                type="button"
                className="fixed left-0 top-[32%] z-[56] flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-r-2xl border border-l-0 border-white/15 bg-[#061528]/95 py-2 pl-1 pr-1.5 text-[9px] font-bold uppercase tracking-wide text-white/85 shadow-[4px_0_24px_rgba(0,0,0,0.35)] lg:hidden"
                onClick={() => setMobileReadingPagesOpen((open) => !open)}
                aria-expanded={mobileReadingPagesOpen}
                aria-label={mobileReadingPagesOpen ? 'Close pages panel' : 'Open pages panel'}
              >
                <PanelLeft className="h-5 w-5 shrink-0" />
                <span className="max-w-[2.5rem] leading-tight">Pages</span>
              </button>
            )}
            <aside
              className={`min-h-0 overflow-y-auto overflow-x-hidden border-r border-white/10 bg-[#061528]/95 shadow-[8px_0_40px_rgba(0,0,0,0.2)] transition-[flex-basis,max-width,transform] duration-500 ease-[cubic-bezier(0.34,0.08,0.25,1)] ${
                readingImmersive ? 'max-w-0 min-w-0 flex-[0_0_0%] -translate-x-2 border-transparent' : ''
              } ${
                !readingImmersive && isLgUp ? 'relative z-10 flex-[0_0_17%] min-w-[11rem] translate-x-0' : ''
              } ${
                !readingImmersive && !isLgUp && mobileReadingPagesOpen
                  ? 'fixed left-0 top-14 z-[55] flex h-[calc(100%-3.5rem)] w-[min(19rem,calc(100vw-1.25rem))] max-w-[calc(100vw-1rem)] flex-col border-white/10 pt-2 shadow-2xl'
                  : ''
              } ${!readingImmersive && !isLgUp && !mobileReadingPagesOpen ? 'hidden' : ''}`}
            >
              <div className="sticky top-5 px-5">
                <p className="mb-4 px-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/40">Pages</p>
                <div className="rounded-[1.75rem] border border-white/10 bg-[#081a2f]/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 rounded-full bg-[#0b2037]/95 px-3 py-2.5 text-sm text-white/70">
                      <Search className="h-4 w-4 shrink-0" />
                      <input value={readingSearch} onChange={(event) => updateReadingSearch(event.target.value)} placeholder="Search in document..." className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none" />
                    </div>
                    {readingSearch.trim().length > 1 && !readingSearchMatches.length ? (
                      <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#061528]/80 px-3 py-4 text-center">
                        <Search className="mb-2 h-5 w-5 text-[#3b82c4]/80" aria-hidden />
                        <p className="text-xs font-medium leading-relaxed text-white/55">No results found for &quot;{readingSearch.trim()}&quot;</p>
                        <p className="mt-1 text-[11px] text-white/40">Try a different keyword or phrase.</p>
                      </div>
                    ) : null}
                    {readingSearchMatches.length > 0 ? (
                      <div className="flex items-center justify-between gap-2 text-[11px] text-white/55">
                        <span>{`${Math.max(1, readingSearchMatchIndex + 1)} of ${readingSearchMatches.length}`}</span>
                        <div className="flex gap-1">
                          <button type="button" className="rounded-full p-1 hover:bg-white/10" onClick={() => setReadingSearchMatchIndex((index) => (index - 1 + readingSearchMatches.length) % readingSearchMatches.length)} aria-label="Previous match">↑</button>
                          <button type="button" className="rounded-full p-1 hover:bg-white/10" onClick={() => setReadingSearchMatchIndex((index) => (index + 1) % readingSearchMatches.length)} aria-label="Next match">↓</button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="mt-6 h-[calc(100%-5.5rem)] overflow-y-auto px-4 pb-8">
                <div className="space-y-4">
                  {readingPageIds.map((pageId) => {
                    const active = activeReadingPage === pageId;
                    return (
                      <button key={pageId} type="button" onClick={() => scrollToReadingPage(pageId)} className={`flex w-full items-center rounded-xl border-l-2 px-4 py-3 text-left text-sm font-medium transition-colors ${active ? 'border-l-[#3b82c4] bg-[#0f233a] text-white' : 'border-l-transparent bg-[#081b2f] text-white/80 hover:bg-[#0f233a]'}`}>
                        Page {pageId}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
            <main className={`relative z-0 min-h-0 min-w-0 flex-1 bg-[#e5ecf6]/[0.18] px-4 py-4 transition-[flex] duration-500 ease-[cubic-bezier(0.34,0.08,0.25,1)] sm:px-6 sm:py-6 ${readingImmersive ? 'lg:px-6' : 'lg:px-10'}`}>
              <div ref={readingZoomBarRef} className="sticky top-5 z-20 mx-auto flex w-full max-w-5xl items-center justify-center rounded-full border border-white/10 bg-[#081827]/95 px-3 py-2 shadow-[0_16px_40px_rgba(3,19,40,0.18)] backdrop-blur">
                <button type="button" onClick={() => updateReadingZoom(readingZoom - 10)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a1929] text-white transition hover:bg-[#174871]" aria-label="Zoom out"><Minus className="h-4 w-4" /></button>
                <span className="mx-4 min-w-[4.5rem] text-center text-sm font-semibold text-white">{readingZoom}%</span>
                <button type="button" onClick={() => updateReadingZoom(readingZoom + 10)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a1929] text-white transition hover:bg-[#174871]" aria-label="Zoom in"><Plus className="h-4 w-4" /></button>
              </div>
              <div ref={readingViewerRef} className={`relative mt-5 h-[calc(100%-5.5rem)] overflow-y-auto px-2 pb-20 ${readerTool === 'lens' ? 'cursor-crosshair' : ''}`} onScroll={onReadingViewerScroll} onWheel={(event) => { if (event.ctrlKey || event.metaKey) { event.preventDefault(); updateReadingZoom(readingZoom + (event.deltaY > 0 ? -10 : 10)); } }} onMouseDown={onReadingViewerMouseDown} onMouseMove={onReadingViewerMouseMove} onMouseUp={(event) => { handleReadingSelection(event); onReadingViewerMouseUp(); }} onClick={handleReadingPanelClick}>
                {readingImmersive && readingFocusY !== null && <div className="pointer-events-none absolute left-0 right-0 h-10 bg-[#3b82c4]/10" style={{ top: readingFocusY - 12 }} />}
                <div className="mx-auto w-full max-w-5xl space-y-10">
                  {selectedFile && !pdfLoadError ? (
                    <Document
                      key={pdfDocumentKey}
                      file={selectedFile}
                      options={{ cMapUrl: PDF_CMAP_URL, cMapPacked: true, standardFontDataUrl: PDF_STANDARD_FONT_URL }}
                      onLoadSuccess={({ numPages }) => {
                        pdfLoadAttemptRef.current = 0;
                        setPdfPageCount(numPages);
                        setPdfLoadError(false);
                      }}
                      onLoadError={() => {
                        setPdfPageCount(0);
                        pdfLoadAttemptRef.current += 1;
                        if (pdfLoadAttemptRef.current < 3) {
                          window.setTimeout(() => setPdfDocumentKey((key) => key + 1), 500);
                        } else {
                          setPdfLoadError(true);
                        }
                      }}
                    >
                      {readingPageIds.map((pageId) => {
                        const pageNotes = readerNotes.filter((note) => note.pageId === pageId);
                        return (
                          <LazyReadingPageSection
                            key={pageId}
                            pageId={pageId}
                            scale={readingZoom / 100}
                            rootRef={readingViewerRef}
                            setPageRef={(id, el) => { pageRefs.current[id] = el; }}
                            active={activeReadingPage === pageId}
                            pageNotes={pageNotes}
                            onOpenNote={(note) => setReaderNoteDraft({ pageId: note.pageId, x: note.x, y: note.y, text: note.text, visible: true, noteId: note.id })}
                          />
                        );
                      })}
                    </Document>
                  ) : (
                    <div className="mx-auto max-w-2xl rounded-3xl border border-[#3b82c4]/25 bg-white/95 px-8 py-10 text-center text-[#0f172a] shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
                      {pdfLoadError ? 'Unable to load PDF. Please try re-uploading your file.' : 'Upload a PDF in Sandbox to render full Reading Mode pages.'}
                    </div>
                  )}
                </div>
                {readerLensBox.visible && (
                  <div className="pointer-events-none absolute border-2 border-[#0ea5e9] bg-[#0ea5e91a]" style={{ left: readerLensBox.x, top: readerLensBox.y, width: readerLensBox.width, height: readerLensBox.height }} />
                )}
                {readerSelection && (
                  <div className="absolute z-30 origin-bottom scale-100 rounded-full bg-[#0d1f33]/95 p-2 shadow-[0_18px_40px_rgba(10,25,41,0.28)] backdrop-blur animate-[selectionBarIn_180ms_ease-out_both]" style={{ top: Math.max(16, readerSelection.rect.top - (readingViewerRef.current?.getBoundingClientRect().top ?? 0) - 48), left: Math.max(16, readerSelection.rect.left - (readingViewerRef.current?.getBoundingClientRect().left ?? 0)) }}>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={sendSelectionToCanvas} className="rounded-full p-2 text-white transition hover:bg-[#3b82c4]/20" title="Send to Canvas"><Box className="h-4 w-4" /></button>
                      <button type="button" onClick={() => void sendReadingChatMessage(readerSelection.text)} className="rounded-full p-2 text-white transition hover:bg-[#3b82c4]/20" title="Ask Quilora"><MessageCircle className="h-4 w-4" /></button>
                      <button type="button" onClick={() => setReaderSelectionColorPicker((prev) => !prev)} className="rounded-full p-2 text-white transition hover:bg-[#3b82c4]/20" title="Change highlight color"><Palette className="h-4 w-4" /></button>
                    </div>
                    {readerSelectionColorPicker && (
                      <div className="mt-2 flex gap-2 rounded-full bg-[#0a1929] p-2 shadow-lg">
                        {READING_SEARCH_COLORS.map((option) => (
                          <button key={option.id} type="button" onClick={() => applyReadingHighlight(option.color)} className="h-8 w-8 rounded-full border border-white/10 transition-transform hover:scale-110" style={{ background: option.color }} aria-label={option.label} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {readerNoteDraft.visible && (
                  <div className="absolute z-40 rounded-3xl border border-[#3b82c4]/40 bg-[#071528]/95 p-4 shadow-2xl" style={{ left: readerNoteDraft.x, top: readerNoteDraft.y }}>
                    <textarea rows={3} value={readerNoteDraft.text} onChange={(event) => setReaderNoteDraft((draft) => ({ ...draft, text: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); addReaderNote(); } }} className="w-72 resize-none rounded-2xl border border-white/10 bg-[#0a1b2f] p-3 text-sm text-white outline-none" placeholder="Margin note — Enter to save" />
                    <div className="mt-3 flex justify-end gap-2">
                      <button type="button" onClick={() => setReaderNoteDraft({ pageId: 0, x: 0, y: 0, text: '', visible: false })} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/60 hover:bg-white/5">Cancel</button>
                      <button type="button" onClick={addReaderNote} className="rounded-full bg-[#266ba7] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3b82c4]">Save</button>
                    </div>
                  </div>
                )}
              </div>
              {readingTtsActive && (
                <div className="pointer-events-auto absolute left-1/2 bottom-8 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-[#102d4e]/95 px-4 py-3 text-sm text-white shadow-[0_24px_60px_rgba(0,0,0,0.3)] backdrop-blur">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setReadingTtsPlaying((active) => !active)} className="rounded-full bg-[#153452] p-2 text-white transition hover:bg-[#1e5277]">
                      {readingTtsPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <span className="tabular-nums text-white/90">{readingTtsPlaying ? '1x' : 'Paused'}</span>
                    <button type="button" onClick={stopReadingTts} className="rounded-full bg-[#153452] p-2 text-white transition hover:bg-[#1e5277]"><StopCircle className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
              <div className="absolute right-3 top-28 z-30 hidden flex-col items-center gap-3 rounded-[2.25rem] bg-[#081827]/95 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:right-5 sm:top-32 sm:flex">
                <div className="relative flex flex-col items-center">
                  <button type="button" onClick={() => onReadingModeToolClick('highlight')} className={`flex h-12 min-h-[44px] w-12 min-w-[44px] touch-manipulation items-center justify-center rounded-full transition ${readerTool === 'highlight' ? 'bg-[#3b82c4] text-white shadow-lg shadow-[#3b82c4]/30' : 'bg-[#0f172a] text-white/80 hover:bg-[#3b82c4]/18'}`} aria-label="Highlighter"><Highlighter className="h-5 w-5" /></button>
                  <span className="mt-1 h-2 w-2 rounded-full border border-white/20 shadow-[0_0_8px_rgba(59,130,196,0.5)]" style={{ backgroundColor: readerHighlightColor }} aria-hidden />
                </div>
                <button type="button" onClick={() => onReadingModeToolClick('notes')} className={`flex h-12 min-h-[44px] w-12 min-w-[44px] touch-manipulation items-center justify-center rounded-full transition ${readerTool === 'notes' ? 'bg-[#3b82c4] text-white shadow-lg shadow-[#3b82c4]/30' : 'bg-[#0f172a] text-white/80 hover:bg-[#3b82c4]/18'}`} aria-label="Margin notes"><Pencil className="h-5 w-5" /></button>
                <button type="button" onClick={() => onReadingModeToolClick('block-cutter')} className={`flex h-12 min-h-[44px] w-12 min-w-[44px] touch-manipulation items-center justify-center rounded-full transition ${readerTool === 'block-cutter' ? 'bg-[#3b82c4] text-white shadow-lg shadow-[#3b82c4]/30' : 'bg-[#0f172a] text-white/80 hover:bg-[#3b82c4]/18'}`} aria-label="Block cutter"><Quote className="h-5 w-5" /></button>
                <button type="button" onClick={() => onReadingModeToolClick('lens')} className={`flex h-12 min-h-[44px] w-12 min-w-[44px] touch-manipulation items-center justify-center rounded-full transition ${readerTool === 'lens' ? 'bg-[#3b82c4] text-white shadow-lg shadow-[#3b82c4]/30' : 'bg-[#0f172a] text-white/80 hover:bg-[#3b82c4]/18'}`} aria-label="AI Lens"><Wand2 className="h-5 w-5" /></button>
                <button type="button" onClick={() => onReadingModeToolClick('share')} className={`relative flex h-12 min-h-[44px] w-12 min-w-[44px] touch-manipulation items-center justify-center rounded-full transition ${readerTool === 'share' ? 'bg-[#3b82c4] text-white shadow-lg shadow-[#3b82c4]/30' : 'bg-[#0f172a] text-white/80 hover:bg-[#3b82c4]/18'}`} aria-label="Share"><Share2 className="h-5 w-5" /></button>
                {readerTool === 'share' && (
                  <div className="absolute right-full top-1/2 z-20 max-w-[min(16rem,calc(100vw-4rem))] -translate-y-1/2 rounded-3xl border border-white/10 bg-[#081827]/95 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
                    {['Copy link', 'Export PDF', 'Share to Canvas'].map((option, optionIndex) => (
                      <button key={option} type="button" onClick={() => onReadingShareOption(option)} className={`flex w-full items-center gap-2 rounded-full border border-white/10 bg-[#102d4e]/90 px-3 py-2 text-left text-sm text-white transition hover:bg-[#164b74]/80 ${optionIndex < 2 ? 'mb-2' : ''}`}>
                        {option === 'Copy link' ? <Copy className="h-4 w-4" /> : option === 'Export PDF' ? <Download className="h-4 w-4" /> : <Box className="h-4 w-4" />}
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="fixed bottom-24 right-3 z-40 flex flex-col items-end gap-2 sm:hidden">
                <button
                  type="button"
                  className="flex h-12 min-h-[44px] w-12 min-w-[44px] items-center justify-center rounded-full border border-white/15 bg-[#081827] text-white shadow-lg"
                  aria-expanded={readingMobileToolsOpen}
                  aria-label="Reading tools"
                  onClick={() => setReadingMobileToolsOpen((open) => !open)}
                >
                  <Highlighter className="h-5 w-5" />
                </button>
                {readingMobileToolsOpen && (
                  <div className="mb-1 flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#081827]/95 p-2 shadow-xl">
                    <button type="button" onClick={() => { onReadingModeToolClick('highlight'); setReadingMobileToolsOpen(false); }} className={`flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-full transition ${readerTool === 'highlight' ? 'bg-[#3b82c4] text-white' : 'bg-[#0f172a] text-white/80'}`} aria-label="Highlighter"><Highlighter className="h-5 w-5" /></button>
                    <button type="button" onClick={() => { onReadingModeToolClick('notes'); setReadingMobileToolsOpen(false); }} className={`flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-full transition ${readerTool === 'notes' ? 'bg-[#3b82c4] text-white' : 'bg-[#0f172a] text-white/80'}`} aria-label="Margin notes"><Pencil className="h-5 w-5" /></button>
                    <button type="button" onClick={() => { onReadingModeToolClick('block-cutter'); setReadingMobileToolsOpen(false); }} className={`flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-full transition ${readerTool === 'block-cutter' ? 'bg-[#3b82c4] text-white' : 'bg-[#0f172a] text-white/80'}`} aria-label="Block cutter"><Quote className="h-5 w-5" /></button>
                    <button type="button" onClick={() => { onReadingModeToolClick('lens'); setReadingMobileToolsOpen(false); }} className={`flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-full transition ${readerTool === 'lens' ? 'bg-[#3b82c4] text-white' : 'bg-[#0f172a] text-white/80'}`} aria-label="AI Lens"><Wand2 className="h-5 w-5" /></button>
                    <button type="button" onClick={() => { onReadingModeToolClick('share'); setReadingMobileToolsOpen(false); }} className={`flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-full transition ${readerTool === 'share' ? 'bg-[#3b82c4] text-white' : 'bg-[#0f172a] text-white/80'}`} aria-label="Share"><Share2 className="h-5 w-5" /></button>
                  </div>
                )}
              </div>
            </main>
            <div
              className={`relative z-10 flex h-full min-h-0 max-h-[min(45vh,420px)] w-full shrink-0 border-l border-white/10 bg-[#091523] transition-[width] duration-200 ease-out max-lg:max-h-[min(45vh,420px)] lg:max-h-none ${readingImmersive ? 'pointer-events-none w-0 overflow-hidden border-transparent opacity-0' : ''}`}
              style={
                readingImmersive
                  ? undefined
                  : {
                      width: isLgUp ? (readingChatCollapsed ? CHAT_COLLAPSE_TAB : readingChatWidth) : readingChatCollapsed ? CHAT_COLLAPSE_TAB : '100%',
                    }
              }
            >
              {!readingImmersive && !readingChatCollapsed && (
                <div className="flex min-h-0 min-w-0 flex-1 flex-row">
                  <button
                    type="button"
                    aria-label="Resize reading chat panel"
                    onMouseDown={onReadingChatResizePointerDown}
                    className="w-2 shrink-0 cursor-col-resize self-stretch border-0 bg-transparent hover:bg-[#3b82c4]/45"
                  />
                  <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                    <ReadingChatPanel
                      immersiveHidden={false}
                      messages={readingChatMessages}
                      inputValue={readingChatInput}
                      isSending={readingIsSending}
                      onInputChange={setReadingChatInput}
                      onSend={() => void sendReadingChatMessage()}
                      onQuickAction={sendReaderQuickAction}
                      onLensFollowUp={sendLensFollowUp}
                      viewingPage={activeReadingPage}
                      documentName={selectedFile?.name ?? `${activeSandboxName}.pdf`}
                      endRef={readingChatEndRef}
                    />
                  </div>
                </div>
              )}
              {!readingImmersive && readingChatCollapsed && (
                <button
                  type="button"
                  aria-label="Drag to expand reading chat panel"
                  onMouseDown={onReadingChatResizePointerDown}
                  className="flex h-full w-full cursor-col-resize items-center justify-center border-l border-white/20 bg-[#091523] text-lg leading-none text-white/45 hover:bg-[#0d1f33] hover:text-white"
                >
                  ⋯
                </button>
              )}
            </div>
            {blockCutterPrompt && (
              <div role="presentation" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setBlockCutterPrompt(null)}>
                <div role="dialog" aria-modal className="w-full max-w-sm rounded-[1.75rem] border border-[#3b82c4]/30 bg-[#061528] p-6 text-white shadow-[0_32px_80px_rgba(0,0,0,0.45)]" onClick={(event) => event.stopPropagation()}>
                  <p className="text-center text-sm font-medium leading-relaxed text-white/90">Turn into Quote Block or Concept Block?</p>
                  <p className="mt-2 line-clamp-3 text-center text-xs text-white/45">{blockCutterPrompt.text}</p>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <button type="button" onClick={() => resolveBlockCutter('quote')} className="rounded-full bg-[#266ba7] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3b82c4]">Quote Block</button>
                    <button type="button" onClick={() => resolveBlockCutter('concept')} className="rounded-full border border-[#3b82c4]/50 bg-[#0a1f35] px-4 py-2.5 text-sm font-semibold text-[#b8d9ff] transition hover:bg-[#266ba7]/20">Concept Block</button>
                  </div>
                </div>
              </div>
            )}
            <style>{`@keyframes selectionBarIn{from{opacity:0;transform:translateY(6px) scale(0.96);}to{opacity:1;transform:translateY(0) scale(1);}}`}</style>
          </div>
        )}

        {workspaceMode === 'mastery' && (
          <div className="flex h-full min-h-0 flex-col bg-[#d9dce1] md:flex-row">
            <aside className="flex w-full shrink-0 flex-row items-center justify-center gap-6 border-b border-white/10 bg-[#091523] py-3 shadow-md md:w-24 md:flex-col md:justify-center md:border-b-0 md:border-r md:py-6 md:shadow-[8px_0_28px_rgba(9,21,35,0.25)]">
              <div className="flex flex-row items-center justify-center gap-8 md:flex-col md:gap-6">
                <button type="button" onClick={() => setMasteryView('tutor')} className={`flex h-12 min-h-[44px] w-12 min-w-[44px] touch-manipulation items-center justify-center rounded-full transition ${masteryView === 'tutor' ? 'bg-[#266ba7] text-white' : 'text-white hover:bg-[#266ba7]/20'}`}><Bot className="h-5 w-5" /></button>
                <button type="button" onClick={() => setMasteryView('quiz')} className={`flex h-12 min-h-[44px] w-12 min-w-[44px] touch-manipulation items-center justify-center rounded-full transition ${masteryView === 'quiz' ? 'bg-[#266ba7] text-white' : 'text-white hover:bg-[#266ba7]/20'}`}><Brain className="h-5 w-5" /></button>
              </div>
            </aside>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4 sm:p-6 md:p-8">
              {masteryView === 'quiz' ? (
                <div className="mx-auto flex h-full w-full max-w-4xl items-center justify-center">
                  <div className="w-full rounded-2xl bg-white p-4 shadow-[0_24px_65px_rgba(15,23,42,0.16)] sm:rounded-[2rem] sm:p-6 md:p-8">
                    {quizComplete ? (
                      <div className="space-y-8 text-left">
                        <div className="text-center">
                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#266ba7]/12 ring-2 ring-[#3b82c4]/35">
                            <Check className="h-8 w-8 text-[#266ba7] animate-[loaderPop_520ms_ease-out_both]" strokeWidth={2.5} />
                          </div>
                          <h2 className="text-3xl font-bold text-[#0f172a]">Quiz Complete!</h2>
                          <p className="mt-3 text-5xl font-bold text-[#266ba7]">{quizScore} <span className="text-2xl font-semibold text-[#64748b]">/ {Math.max(questionCount, quizQuestions.length)}</span></p>
                          <p className="mt-2 text-base font-medium text-[#334155]">
                            {(() => {
                              const total = Math.max(1, Math.max(questionCount, quizQuestions.length));
                              const pct = quizScore / total;
                              if (pct >= 0.9) return 'Excellent';
                              if (pct >= 0.7) return 'Good work';
                              if (pct >= 0.45) return 'Solid progress';
                              return 'Keep practicing';
                            })()}
                          </p>
                        </div>
                        <div className="grid gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-5 text-sm text-[#334155] sm:grid-cols-3">
                          <div><p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Correct</p><p className="mt-1 text-2xl font-bold text-emerald-600">{quizScore}</p></div>
                          <div><p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Incorrect</p><p className="mt-1 text-2xl font-bold text-rose-600">{quizWrongAnswers.length}</p></div>
                          <div><p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Skipped</p><p className="mt-1 text-2xl font-bold text-[#64748b]">{quizSkipped}</p></div>
                        </div>
                        {quizWrongAnswers.length > 0 && (
                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-wide text-[#64748b]">Review incorrect answers</h3>
                            <div className="mt-3 space-y-4">
                              {quizWrongAnswers.map((entry, index) => (
                                <div key={`${entry.question}-${index}`} className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
                                  <p className="text-sm font-semibold text-[#0f172a]">{entry.question}</p>
                                  <p className="mt-2 text-xs text-rose-600"><span className="font-semibold">Your answer:</span> {entry.userAnswer || '—'}</p>
                                  <p className="mt-1 text-xs text-emerald-700"><span className="font-semibold">Correct:</span> {entry.correctAnswer}</p>
                                  <p className="mt-2 border-t border-[#f1f5f9] pt-2 text-xs leading-relaxed text-[#475569]">{entry.explanation}</p>
                                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">From your document</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => {
                              setQuizComplete(false);
                              setQuizIndex(0);
                              setQuizSelectedOption(null);
                              setQuizSubmitted(false);
                              setQuizScore(0);
                              setQuizWrongAnswers([]);
                              setQuizSkipped(0);
                              void generateQuizFromDocument();
                            }}
                            className="rounded-full border border-[#266ba7]/50 px-6 py-3 text-sm font-semibold text-[#266ba7] transition hover:bg-[#266ba7]/10"
                          >
                            Try Again
                          </button>
                          <button type="button" onClick={() => setMasteryView('tutor')} className="rounded-full bg-[#266ba7] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#266ba7]/25 transition hover:bg-[#3b82c4]">Open AI Tutor</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                          {(['Normal', 'Hard', 'Ranking'] as const).map((difficultyOption) => (
                            <button
                              key={difficultyOption}
                              type="button"
                              onClick={() => setDifficulty(difficultyOption)}
                              className={`min-h-11 min-w-0 flex-1 rounded-full px-5 py-2.5 text-sm font-semibold transition sm:min-w-[6.5rem] sm:flex-none ${difficulty === difficultyOption ? 'bg-[#266ba7] text-white shadow-md shadow-[#266ba7]/25' : 'border border-[#cbd5e1] bg-white text-[#334155] hover:border-[#266ba7]/40'}`}
                            >
                              {difficultyOption}
                            </button>
                          ))}
                          <div className="flex w-full items-center justify-center gap-2 rounded-full border border-[#cbd5e1] px-3 py-2 text-[#334155] sm:ml-auto sm:w-auto sm:py-1.5">
                            <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-slate-100" onClick={() => setQuestionCount((count) => Math.max(5, count - 1))} aria-label="Fewer questions"><Minus className="h-4 w-4" /></button>
                            <span className="min-w-[7rem] text-center text-sm font-semibold">{questionCount} Questions</span>
                            <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-slate-100" onClick={() => setQuestionCount((count) => Math.min(25, count + 1))} aria-label="More questions"><Plus className="h-4 w-4" /></button>
                          </div>
                        </div>
                        {isGeneratingQuiz ? (
                          <div className="flex flex-col items-center justify-center gap-4 py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-[#266ba7]" aria-hidden />
                            <p className="text-sm font-medium text-[#334155]">Generating your assessment…</p>
                          </div>
                        ) : !currentQuestion ? (
                          <div className="py-16 text-center text-sm text-[#334155]">Unable to generate questions from this document right now.</div>
                        ) : (
                          <>
                            {difficulty === 'Hard' && hardSecondsLeft !== null && hardSecondsLeft > 0 && !quizSubmitted && (
                              <div className="mb-6 flex items-center justify-between rounded-2xl border border-[#266ba7]/25 bg-[#eef5ff] px-5 py-4">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[#266ba7]">Time remaining</span>
                                <span className="text-3xl font-bold tabular-nums text-[#0f172a]">{hardSecondsLeft}s</span>
                              </div>
                            )}
                            <p className="mb-2 text-right text-xs font-medium text-[#64748b]">Question {quizIndex + 1} of {Math.max(questionCount, quizQuestions.length)}</p>
                            <h3 className="mb-6 text-2xl font-bold text-[#0f172a]">{currentQuestion.question}</h3>
                            <div className="space-y-3">
                              {currentQuestion.options.map((option, index) => {
                                const isSelected = quizSelectedOption === index;
                                const isCorrect = index === currentQuestion.correctIndex;
                                const showCorrect = quizSubmitted && isCorrect;
                                const showWrong = quizSubmitted && isSelected && !isCorrect;
                                return (
                                  <button key={option} type="button" onClick={() => !quizSubmitted && setQuizSelectedOption(index)} className={`min-h-11 w-full rounded-2xl border px-4 py-3 text-left text-base font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out active:scale-[0.99] sm:text-sm ${showCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : showWrong ? 'border-rose-400 bg-rose-50 text-rose-700' : isSelected ? 'border-[#266ba7] bg-[#266ba7] text-white shadow-md shadow-[#266ba7]/25' : 'border-[#266ba7]/45 text-[#0f172a] hover:bg-[#266ba7]/8'}`}>
                                    {option}
                                  </button>
                                );
                              })}
                            </div>
                            {!quizSubmitted ? (
                              <button type="button" onClick={submitQuizAnswer} className="mt-7 w-full rounded-full bg-[#266ba7] py-3 text-sm font-semibold text-white">Submit Answer</button>
                            ) : (
                              <>
                                <p className="mt-6 text-sm text-[#334155]">{currentQuestion.explanation}</p>
                                <button type="button" onClick={goToNextQuestion} className="mt-4 w-full rounded-full bg-[#266ba7] py-3 text-sm font-semibold text-white">Next Question</button>
                              </>
                            )}
                          </>
                        )}
                        <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#e2e8f0]"><div className="h-full rounded-full bg-[#266ba7]" style={{ width: `${quizProgress}%` }} /></div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-[#e2e8f0] bg-white shadow-[0_24px_65px_rgba(15,23,42,0.16)]">
                    <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-8 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#64748b]">AI Tutor</p>
                      <p className="mt-1 truncate text-lg font-bold text-[#0f172a]">{pdfDocumentTitle || activeSandboxName || selectedFile?.name || 'Your material'}</p>
                      <p className="mt-0.5 text-xs text-[#64748b]">Grounded in your uploaded PDF</p>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                      <div className="space-y-5">
                        {tutorMessages.map((message) => (
                          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[88%] items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${message.role === 'user' ? 'bg-[#266ba7] text-white shadow-md shadow-[#266ba7]/20' : 'bg-[#091523] text-[#7bbdf3] ring-1 ring-white/10'}`}>
                                {message.role === 'user' ? <MessageCircle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                              </div>
                              <div className={`max-w-[min(100%,36rem)] rounded-3xl px-4 py-3.5 text-sm leading-7 shadow-sm ${message.role === 'user' ? 'rounded-tr-md bg-[#266ba7] text-white' : 'rounded-tl-md bg-[#f1f5f9] text-[#0f172a]'}`}>
                                <span className="whitespace-pre-wrap">{message.content}</span>
                                {message.pending && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#266ba7]" />}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={tutorEndRef} />
                      </div>
                    </div>
                    <div className="border-t border-[#e2e8f0] bg-[#f8fafc] px-6 py-5">
                      <div className="mx-auto flex max-w-3xl flex-col gap-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <button type="button" onClick={() => void sendTutorPreset('Explain it more')} className="rounded-full border-2 border-[#3b82c4] bg-[#091523] px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#266ba7]">Explain it more</button>
                          <button type="button" onClick={() => void sendTutorPreset("Explain it like I'm 5")} className="rounded-full border-2 border-[#3b82c4] bg-[#091523] px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#266ba7]">Explain it like I&apos;m 5</button>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-[#cbd5e1] bg-white px-4 py-2.5 shadow-inner">
                          <input type="text" value={tutorInput} onChange={(event) => setTutorInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendTutorMessage(); } }} className="min-w-0 flex-1 bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8]" placeholder="Ask your AI Tutor anything..." />
                          <button type="button" disabled={tutorSending} onClick={() => void sendTutorMessage()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#266ba7] text-white transition hover:bg-[#3b82c4] disabled:opacity-60"><Send className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <NodeKindOverlayPanel kind={nodeOverlayKind} onClose={() => setNodeOverlayKind(null)} onPickTile={handleOverlayTilePick} />
      {attachEvidenceForBlockId
        ? createPortal(
            <div
              role="presentation"
              data-attach-evidence-modal
              className="fixed inset-0 z-[490] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setAttachEvidenceForBlockId(null);
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="attach-evidence-title"
                className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1f33] p-5 shadow-[0_32px_90px_rgba(0,0,0,0.55)]"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <h2 id="attach-evidence-title" className="text-base font-bold text-white">
                  Attach Evidence
                </h2>
                <p className="mt-1 text-xs text-white/50">Choose an Evidence node to link to this claim (Evidence → claim).</p>
                <div className="mt-4 flex max-h-64 flex-col gap-2 overflow-y-auto">
                  {nodes.filter((n) => n.kind === 'evidence' && n.evidencePayload && n.id !== attachEvidenceForBlockId).length ===
                  0 ? (
                    <p className="text-xs text-white/45">Add an Evidence block from the left toolbar first.</p>
                  ) : null}
                  {nodes
                    .filter((n) => n.kind === 'evidence' && n.evidencePayload && n.id !== attachEvidenceForBlockId)
                    .map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left text-sm font-medium text-white transition hover:border-[#7b68ee]/45 hover:bg-[#7b68ee]/10"
                        onClick={() => {
                          const bid = attachEvidenceForBlockId;
                          if (!bid) return;
                          addAnimatedEdge({ id: `edge-${ev.id}-${bid}`, from: ev.id, to: bid, animated: true });
                          setAttachEvidenceForBlockId(null);
                        }}
                      >
                        {ev.label.slice(0, 48)}
                      </button>
                    ))}
                </div>
                <button
                  type="button"
                  className="mt-4 text-xs font-medium text-white/55 underline-offset-2 hover:text-white hover:underline"
                  onClick={() => setAttachEvidenceForBlockId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
      <ChapterSelectionOverlay
        open={chapterOverlay != null}
        totalPages={chapterOverlay?.totalPages ?? 1}
        isBookwormTier={isBookwormTier}
        initialSelected={chapterOverlay?.initialSelected ?? undefined}
        onCancel={() => setChapterOverlay(null)}
        onConfirm={handleChapterOverlayConfirm}
      />
      <CCLibraryBrowserPanel open={ccLibraryOpen} onClose={() => setCcLibraryOpen(false)} onActivateBook={(book) => void handleCcLibraryActivate(book)} />
      <FragmentClipModal open={fragmentModalOpen} onClose={() => setFragmentModalOpen(false)} onSubmit={handleFragmentClipSubmit} />
      <BlocksLibraryPanel
        open={blocksPanelOpen}
        onClose={() => setBlocksPanelOpen(false)}
        nodes={nodes}
        activeSandboxId={activeSandboxId}
        isBookwormTier={isBookwormTier}
        search={blocksSearch}
        onSearchChange={setBlocksSearch}
        onToggleFavorite={toggleBlockFavorite}
        onFocusNode={focusNodeOnCanvas}
        onDuplicateFromLibrary={duplicateFromLibrary}
      />
      </div>
    </div>
  );
}
