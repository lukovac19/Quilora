import type { CanvasNode } from '../canvasNodeModel';
import { getCorpusForSourceNode } from '../documents/corpusRegistry';
import type { PageTextMap } from '../documents/pageAwareChunker';

/** Page text for a linked Source: prefers per-source registry, falls back to active reading map. */
export function getPageTextForLinkedSource(
  linkedSourceNodeId: string,
  nodes: CanvasNode[],
  globalPageText: PageTextMap,
): PageTextMap {
  const src = nodes.find((n) => n.id === linkedSourceNodeId && n.kind === 'source');
  if (!src?.sourceArtifact) return { ...globalPageText };
  const reg = getCorpusForSourceNode(src);
  const base = reg?.pages && Object.keys(reg.pages).length ? { ...reg.pages } : { ...globalPageText };
  const sel = src.sourceArtifact.chapterSelectedPageIndices;
  if (sel && sel.length > 0) {
    const out: PageTextMap = {};
    for (const p of sel) {
      if (base[p] != null) out[p] = base[p];
    }
    return Object.keys(out).length ? out : base;
  }
  return base;
}

export function getDocumentIdForSourceNode(sourceNode: CanvasNode | null | undefined): string | null {
  return sourceNode?.sourceArtifact?.sourceSystemId ?? null;
}

export function collectConnectorDocumentIds(nodes: CanvasNode[]): string[] {
  const ids = new Set<string>();
  for (const n of nodes) {
    if (n.kind !== 'source' || !n.sourceArtifact) continue;
    ids.add(n.sourceArtifact.sourceSystemId);
  }
  return [...ids];
}
