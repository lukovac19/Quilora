/** EP-03 canvas block model + EP-04 Source + EP-05 Lens + EP-06 Evidence payloads. */

import type { LensNodePayload } from './lensNodeModel';
import { defaultLensPayloadForMigration, parseLensPayload } from './lensNodeModel';
import type { EvidenceNodePayload } from './evidenceNodeModel';
import { parseEvidencePayload } from './evidenceNodeModel';
import type { ConnectorNodePayload } from './connectorNodeModel';
import { parseConnectorPayload } from './connectorNodeModel';
import type { FreestyleNodePayload } from './freestyleNodeModel';
import { parseFreestylePayload } from './freestyleNodeModel';

export type { LensNodePayload, LensSubtype } from './lensNodeModel';
export type { EvidenceNodePayload, EvidenceSubtype } from './evidenceNodeModel';
export type { ConnectorNodePayload, ConnectorLinkType } from './connectorNodeModel';
export type { FreestyleNodePayload, FreestyleMode, FreestyleThreadMessage } from './freestyleNodeModel';

export type NodeKind = 'source' | 'connector' | 'block' | 'freestyle' | 'lens' | 'mastery' | 'evidence';

/** EP-04 Source Block — file-type badge */
export type SourceFileType = 'pdf' | 'epub' | 'text';

/** EP-04 persisted source material metadata (also stored in block content JSON). */
export type SourceArtifact = {
  fileType: SourceFileType;
  /** ISO 8601 when material was bound to this block */
  uploadedAt: string;
  /** Total pages detected for PDF (optional for EPUB/text) */
  totalPdfPages?: number;
  /** 1-based page indices included as “chapters” after Chapter Selection Overlay; omit = all pages */
  chapterSelectedPageIndices?: number[] | null;
  /** Original filename when known */
  linkedFileName?: string | null;
  /** EP-04 hidden system id for traceability / future RAG */
  sourceSystemId: string;
};

/** EP-04 Ghost Node — Entity extractor provisional result */
export type GhostEntityType = 'person' | 'location' | 'date';

export type GhostProposal = {
  entityLabel: string;
  entityType: GhostEntityType;
  linkedSourceNodeId: string;
};

export type BlockColorId = 'slate' | 'blue' | 'violet' | 'amber' | 'emerald' | 'rose';

export const BLOCK_COLOR_SWATCHES: ReadonlyArray<{ id: BlockColorId; hex: string; label: string }> = [
  { id: 'slate', hex: '#f1f5f9', label: 'Slate' },
  { id: 'blue', hex: '#dbeafe', label: 'Blue' },
  { id: 'violet', hex: '#ede9fe', label: 'Violet' },
  { id: 'amber', hex: '#fef3c7', label: 'Amber' },
  { id: 'emerald', hex: '#d1fae5', label: 'Emerald' },
  { id: 'rose', hex: '#ffe4e6', label: 'Rose' },
];

export const BOOKWORM_MAX_FAVORITES = 10;

export function hexToNearestColorId(hex: string | undefined | null): BlockColorId {
  const h = (hex ?? '').toLowerCase().trim();
  const found = BLOCK_COLOR_SWATCHES.find((s) => s.hex.toLowerCase() === h);
  if (found) return found.id;
  return 'blue';
}

export function colorIdToHex(id: BlockColorId | string | undefined): string {
  const found = BLOCK_COLOR_SWATCHES.find((s) => s.id === id);
  return found?.hex ?? '#dbeafe';
}

export type OverlayTileDef = {
  id: string;
  label: string;
  hint: string;
  /** EP-04 checklist: `data-{value}` on tile button, e.g. `file-upload-tile` */
  checklistDataAttr?: string;
};

export const NODE_OVERLAY_TILES: Record<Exclude<NodeKind, 'connector' | 'block' | 'mastery'>, OverlayTileDef[]> = {
  source: [
    {
      id: 'upload',
      label: 'File upload',
      hint: 'Attach a PDF or EPUB to this sandbox and place a Source block.',
      checklistDataAttr: 'file-upload-tile',
    },
    {
      id: 'cc_library',
      label: 'CC library',
      hint: 'Browse the commons catalog and activate a title onto the canvas.',
      checklistDataAttr: 'cc-library-tile',
    },
    {
      id: 'chapter_split',
      label: 'Chapter splitter',
      hint: 'Choose which PDF pages count as chapters for this Source.',
      checklistDataAttr: 'chapter-splitter-tile',
    },
    {
      id: 'fragment',
      label: 'Fragment clip',
      hint: 'Paste or type a short passage as a text Source.',
      checklistDataAttr: 'fragment-clip-tile',
    },
    {
      id: 'entity',
      label: 'Entity extractor',
      hint: 'Spawn review ghosts (people, places, dates) linked to a Source.',
      checklistDataAttr: 'entity-extractor-tile',
    },
  ],
  lens: [
    { id: 'plot_events', label: 'Plot & events', hint: 'Sequence chain with citations (8 cr).', checklistDataAttr: 'plot-events-tile' },
    { id: 'persona', label: 'Persona', hint: 'Character traits as grounded chips (5 cr).', checklistDataAttr: 'persona-tile' },
    { id: 'theme', label: 'Theme', hint: 'Thematic synthesis (4 cr).', checklistDataAttr: 'theme-tile' },
    { id: 'symbol', label: 'Symbol / motif', hint: 'Dual tab symbolism vs motif (6 cr).', checklistDataAttr: 'symbol-motif-tile' },
    { id: 'idea', label: 'Idea / message', hint: 'Thesis / message lens (5 cr).', checklistDataAttr: 'idea-message-tile' },
  ],
  evidence: [
    {
      id: 'anchor',
      label: 'Evidence anchor',
      hint: 'EP-06 — verbatim anchor (2 cr)',
      checklistDataAttr: 'evidence-anchor-tile',
    },
    {
      id: 'micro_search',
      label: 'Micro-detail search',
      hint: 'EP-06 — search in source (2 cr)',
      checklistDataAttr: 'micro-detail-search-tile',
    },
    {
      id: 'frequency',
      label: 'Frequency chart',
      hint: 'EP-06 — chapter counts (free)',
      checklistDataAttr: 'frequency-chart-tile',
    },
  ],
  freestyle: [
    {
      id: 'standalone',
      label: 'Standalone mode',
      hint: 'EP-08 — ungrounded chat',
      checklistDataAttr: 'standalone-mode-tile',
    },
    {
      id: 'connected',
      label: 'Connected mode',
      hint: 'EP-08 — grounded to source',
      checklistDataAttr: 'connected-mode-tile',
    },
  ],
};

export type NodeKindWithOverlay = keyof typeof NODE_OVERLAY_TILES;

export function isNodeKindWithOverlay(kind: NodeKind): kind is NodeKindWithOverlay {
  return Object.prototype.hasOwnProperty.call(NODE_OVERLAY_TILES, kind);
}

export function getOverlayTileLabel(kind: NodeKindWithOverlay, tileId: string): string {
  const t = NODE_OVERLAY_TILES[kind].find((x) => x.id === tileId);
  return t?.label ?? tileId;
}

export interface CanvasNode {
  id: string;
  kind: NodeKind;
  /** Legacy single-line title shown in minimap / persistence label */
  label: string;
  title: string;
  body: string;
  x: number;
  y: number;
  width: number;
  height: number;
  colorId: BlockColorId;
  tags: string[];
  favorite: boolean;
  tileVariant?: string;
  /** When duplicated from another sandbox (library) */
  originSandboxId?: string | null;
  /** EP-04 Source Block metadata */
  sourceArtifact?: SourceArtifact | null;
  /** EP-04 Ghost Node (entity extractor); when set, canvas shows GhostNodeFrame instead of generic block chrome */
  ghostProposal?: GhostProposal | null;
  /** EP-05 Lens block structured payload */
  lensPayload?: LensNodePayload | null;
  /** EP-06 Evidence block structured payload */
  evidencePayload?: EvidenceNodePayload | null;
  /** EP-07 Native connector hub payload */
  connectorPayload?: ConnectorNodePayload | null;
  /** EP-08 Freestyle chat payload */
  freestylePayload?: FreestyleNodePayload | null;
}

export const NODE_LABELS: Record<NodeKind, string> = {
  source: 'Source Node',
  connector: 'Connector',
  block: 'Block',
  freestyle: 'Freestyle Node',
  lens: 'Lens Node',
  mastery: 'Mastery Node',
  evidence: 'Evidence Node',
};

export function isNodeKind(value: string): value is NodeKind {
  return value in NODE_LABELS;
}

export function nodeKindFromLabel(label: string): NodeKind {
  const entry = (Object.keys(NODE_LABELS) as NodeKind[]).find((k) => NODE_LABELS[k] === label);
  return entry ?? 'block';
}

function parseSourceArtifact(raw: unknown): SourceArtifact | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  const ft = String(a.fileType ?? '');
  const fileType: SourceFileType = ft === 'pdf' || ft === 'epub' || ft === 'text' ? ft : 'text';
  const sid = String(a.sourceSystemId ?? '');
  if (!sid) return null;
  return {
    fileType,
    uploadedAt: String(a.uploadedAt ?? new Date().toISOString()),
    totalPdfPages: a.totalPdfPages != null ? Number(a.totalPdfPages) : undefined,
    chapterSelectedPageIndices: Array.isArray(a.chapterSelectedPageIndices)
      ? (a.chapterSelectedPageIndices as unknown[]).map((n) => Number(n)).filter((n) => !Number.isNaN(n))
      : a.chapterSelectedPageIndices === null
        ? null
        : undefined,
    linkedFileName: a.linkedFileName != null ? String(a.linkedFileName) : null,
    sourceSystemId: sid,
  };
}

function parseGhostProposal(raw: unknown): GhostProposal | null {
  if (!raw || typeof raw !== 'object') return null;
  const g = raw as Record<string, unknown>;
  const et = String(g.entityType ?? '');
  const entityType: GhostEntityType = et === 'person' || et === 'location' || et === 'date' ? et : 'person';
  const entityLabel = String(g.entityLabel ?? '').trim();
  const linkedSourceNodeId = String(g.linkedSourceNodeId ?? '');
  if (!entityLabel || !linkedSourceNodeId) return null;
  return { entityLabel, entityType, linkedSourceNodeId };
}

export function migrateCanvasNode(raw: unknown): CanvasNode {
  const o = raw as Record<string, unknown>;
  const kindRaw = String(o.kind ?? 'block');
  const kind: NodeKind = isNodeKind(kindRaw) ? kindRaw : 'block';
  const label = String(o.label ?? 'Block');
  const colorRaw = String(o.colorId ?? 'blue');
  const colorId = BLOCK_COLOR_SWATCHES.some((c) => c.id === colorRaw) ? (colorRaw as BlockColorId) : 'blue';
  const tags = Array.isArray(o.tags) ? (o.tags as unknown[]).map((t) => String(t)) : [];
  let sourceArtifact = parseSourceArtifact(o.sourceArtifact);
  const ghostProposal = parseGhostProposal(o.ghostProposal);
  if (kind === 'source' && !sourceArtifact) {
    sourceArtifact = {
      fileType: 'pdf',
      uploadedAt: new Date().toISOString(),
      sourceSystemId: newSourceSystemId(),
      linkedFileName: null,
      chapterSelectedPageIndices: null,
    };
  }
  let lensPayload = parseLensPayload(o.lensPayload);
  if (kind === 'lens' && !lensPayload) {
    lensPayload = defaultLensPayloadForMigration(String(o.tileVariant ?? 'theme'), null);
  }
  let evidencePayload = parseEvidencePayload(o.evidencePayload);
  if (kind === 'evidence' && !evidencePayload) {
    const sub = String(o.tileVariant ?? 'anchor');
    const st = sub === 'micro_search' || sub === 'frequency' ? sub : 'anchor';
    evidencePayload = {
      subtype: st,
      linkedSourceNodeId: '',
      sourceDocumentLabel: '',
      loading: false,
    };
  }
  let connectorPayload = parseConnectorPayload(o.connectorPayload);
  if (kind === 'connector' && !connectorPayload) {
    connectorPayload = {
      endpointFromId: '',
      endpointToId: '',
      linkType: 'relationship',
      userReasoning: '',
      aiAnalysisBody: '',
      sourceCitation: '',
    };
  }
  let freestylePayload = parseFreestylePayload(o.freestylePayload);
  if (kind === 'freestyle' && !freestylePayload) {
    freestylePayload = {
      mode: 'standalone',
      linkedSourceNodeId: null,
      sourceDocumentLabel: '',
      messages: [],
    };
  }
  return {
    id: String(o.id ?? `node-${Date.now()}`),
    kind,
    label,
    title: String(o.title ?? label),
    body: String(o.body ?? ''),
    x: Number(o.x ?? 0),
    y: Number(o.y ?? 0),
    width: Number(o.width ?? 260),
    height: Number(o.height ?? 140),
    colorId,
    tags,
    favorite: Boolean(o.favorite),
    tileVariant: o.tileVariant != null ? String(o.tileVariant) : 'default',
    originSandboxId: o.originSandboxId != null && String(o.originSandboxId) ? String(o.originSandboxId) : null,
    sourceArtifact,
    ghostProposal,
    lensPayload,
    evidencePayload,
    connectorPayload,
    freestylePayload,
  };
}

export function newSourceSystemId(): string {
  return `src-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`}`;
}

export function inferSourceFileType(file: File): SourceFileType {
  const n = file.name.toLowerCase();
  if (file.type === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
  if (file.type === 'application/epub+zip' || n.endsWith('.epub')) return 'epub';
  return 'text';
}

export function createCanvasNode(params: {
  kind: NodeKind;
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  title?: string;
  body?: string;
  colorId?: BlockColorId;
  tags?: string[];
  favorite?: boolean;
  tileVariant?: string;
  originSandboxId?: string | null;
  sourceArtifact?: SourceArtifact | null;
  ghostProposal?: GhostProposal | null;
  lensPayload?: LensNodePayload | null;
  evidencePayload?: EvidenceNodePayload | null;
  connectorPayload?: ConnectorNodePayload | null;
  freestylePayload?: FreestyleNodePayload | null;
}): CanvasNode {
  const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    kind: params.kind,
    label: params.label,
    title: params.title ?? params.label,
    body: params.body ?? '',
    x: params.x,
    y: params.y,
    width: params.width ?? (params.label.length > 22 ? 300 : 260),
    height: params.height ?? 148,
    colorId: params.colorId ?? 'blue',
    tags: params.tags ?? [],
    favorite: params.favorite ?? false,
    tileVariant: params.tileVariant ?? 'default',
    originSandboxId: params.originSandboxId ?? null,
    sourceArtifact: params.sourceArtifact ?? null,
    ghostProposal: params.ghostProposal ?? null,
    lensPayload: params.lensPayload ?? null,
    evidencePayload: params.evidencePayload ?? null,
    connectorPayload: params.connectorPayload ?? null,
    freestylePayload: params.freestylePayload ?? null,
  };
}

export function mapNodeKindToBlockType(kind: NodeKind): string {
  if (kind === 'block') return 'evidence';
  return kind;
}
