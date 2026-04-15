import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { CanvasNode } from '../lib/canvasNodeModel';
import { colorIdToHex, hexToNearestColorId, mapNodeKindToBlockType } from '../lib/canvasNodeModel';
import { CONTENT_NODE_KIND_EVIDENCE_EP06 } from '../lib/evidenceNodeModel';
import type { ConnectorLinkType } from '../lib/connectorNodeModel';
import { connectorLinkTypeToDb, connectorLinkTypeFromDb } from '../lib/connectorNodeModel';

export type PersistedCanvasEdge = { id: string; from: string; to: string; linkType?: ConnectorLinkType };
type ReaderHighlight = { id: string; pageId: number; selectedText: string; color: string };
type ReaderNote = { id: string; pageId: number; x: number; y: number; text: string };

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function useSandboxPersistence(params: {
  sandboxId: string | null;
  userId: string | undefined;
  nodes: CanvasNode[];
  edges: PersistedCanvasEdge[];
  readerHighlights: ReaderHighlight[];
  readerNotes: ReaderNote[];
  debounceMs?: number;
}) {
  const { sandboxId, userId, nodes, edges, readerHighlights, readerNotes, debounceMs = 500 } = params;
  const timer = useRef<number | null>(null);
  const lastPayload = useRef<string>('');

  const flush = useCallback(async () => {
    if (!sandboxId || !userId || !isUuid(sandboxId)) return;
    const payload = JSON.stringify({ nodes, edges, readerHighlights, readerNotes });
    if (payload === lastPayload.current) return;
    lastPayload.current = payload;

    const { data: sb, error: sbErr } = await supabase
      .from('sandboxes')
      .select('id, read_only')
      .eq('id', sandboxId)
      .eq('user_id', userId)
      .maybeSingle();
    if (sbErr || !sb || sb.read_only) return;

    await supabase.from('blocks').delete().eq('sandbox_id', sandboxId).eq('user_id', userId);
    await supabase.from('connectors').delete().eq('sandbox_id', sandboxId).eq('user_id', userId);

    const idMap = new Map<string, string>();

    if (nodes.length) {
      const rows = nodes.map((node) => {
        const newId = crypto.randomUUID();
        idMap.set(node.id, newId);
        return {
          id: newId,
          sandbox_id: sandboxId,
          user_id: userId,
          type: mapNodeKindToBlockType(node.kind),
          content: {
            label: node.label,
            clientNodeId: node.id,
            title: node.title,
            body: node.body,
            tileVariant: node.tileVariant ?? 'default',
            originSandboxId: node.originSandboxId ?? null,
            sourceArtifact: node.sourceArtifact ?? null,
            ghostProposal: node.ghostProposal ?? null,
            lensPayload: node.lensPayload ?? null,
            evidencePayload: node.evidencePayload ?? null,
            connectorPayload: node.connectorPayload ?? null,
            freestylePayload: node.freestylePayload ?? null,
            ...(node.kind === 'evidence' ? { nodeKind: CONTENT_NODE_KIND_EVIDENCE_EP06 } : {}),
          } as Record<string, unknown>,
          position_x: node.x,
          position_y: node.y,
          width: node.width,
          height: node.height,
          color: colorIdToHex(node.colorId),
          shape: 'rectangle',
          tags: node.tags,
          is_favorite: node.favorite,
        };
      });
      await supabase.from('blocks').insert(rows);
    }

    if (edges.length) {
      const rows = edges
        .map((edge) => {
          const sid = idMap.get(edge.from);
          const tid = idMap.get(edge.to);
          if (!sid || !tid) return null;
          const lt = (edge as PersistedCanvasEdge).linkType ?? 'relationship';
          return {
            sandbox_id: sandboxId,
            user_id: userId,
            source_block_id: sid,
            target_block_id: tid,
            link_type: connectorLinkTypeToDb(lt),
          };
        })
        .filter(Boolean) as Record<string, unknown>[];
      if (rows.length) {
        await supabase.from('connectors').insert(rows);
      }
    }

    await supabase.from('highlights').delete().eq('sandbox_id', sandboxId).eq('user_id', userId);
    if (readerHighlights.length) {
      const hRows = readerHighlights.map((h) => ({
        sandbox_id: sandboxId,
        user_id: userId,
        page_number: h.pageId,
        start_offset: 0,
        end_offset: Math.max(1, h.selectedText.length),
        color: h.color,
        text_content: h.selectedText,
      }));
      await supabase.from('highlights').insert(hRows);
    }

    await supabase.from('notes').delete().eq('sandbox_id', sandboxId).eq('user_id', userId);
    if (readerNotes.length) {
      const nRows = readerNotes.map((n) => ({
        sandbox_id: sandboxId,
        user_id: userId,
        page_number: n.pageId,
        position_y: n.y,
        content: n.text,
      }));
      await supabase.from('notes').insert(nRows);
    }
  }, [sandboxId, userId, nodes, edges, readerHighlights, readerNotes]);

  useEffect(() => {
    if (!sandboxId || !userId || !isUuid(sandboxId)) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void flush();
    }, debounceMs);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [sandboxId, userId, nodes, edges, readerHighlights, readerNotes, debounceMs, flush]);

  useEffect(() => {
    const onUnload = () => {
      if (timer.current) window.clearTimeout(timer.current);
      void flush();
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [flush]);

  return { flush };
}

export async function loadSandboxGraph(sandboxId: string, userId: string) {
  if (!isUuid(sandboxId)) return null;
  const [{ data: blocks }, { data: connectors }, { data: highlights }, { data: notes }] = await Promise.all([
    supabase.from('blocks').select('*').eq('sandbox_id', sandboxId).eq('user_id', userId),
    supabase.from('connectors').select('*').eq('sandbox_id', sandboxId).eq('user_id', userId),
    supabase.from('highlights').select('*').eq('sandbox_id', sandboxId).eq('user_id', userId),
    supabase.from('notes').select('*').eq('sandbox_id', sandboxId).eq('user_id', userId),
  ]);

  const nodes: CanvasNode[] = (blocks ?? []).map((b: Record<string, unknown>) => {
    const content = (b.content ?? {}) as {
      label?: string;
      clientNodeId?: string;
      title?: string;
      body?: string;
      tileVariant?: string;
      originSandboxId?: string | null;
      sourceArtifact?: unknown;
      ghostProposal?: unknown;
      lensPayload?: unknown;
      evidencePayload?: unknown;
      connectorPayload?: unknown;
      freestylePayload?: unknown;
      nodeKind?: string;
    };
    const dbType = String(b.type);
    const ep06Evidence =
      dbType === 'evidence' &&
      (content.nodeKind === CONTENT_NODE_KIND_EVIDENCE_EP06 ||
        (content.evidencePayload &&
          typeof content.evidencePayload === 'object' &&
          content.evidencePayload !== null &&
          String((content.evidencePayload as { linkedSourceNodeId?: string }).linkedSourceNodeId ?? '').length > 0));
    const kindRaw = ep06Evidence ? 'evidence' : dbType === 'evidence' ? 'block' : dbType;
    const label = content.label ?? 'Block';
    const id = typeof content.clientNodeId === 'string' ? content.clientNodeId : String(b.id);
    const tags = Array.isArray(b.tags) ? (b.tags as string[]) : [];
    const rawNode = {
      id,
      kind: kindRaw as CanvasNode['kind'],
      label,
      title: typeof content.title === 'string' ? content.title : label,
      body: typeof content.body === 'string' ? content.body : '',
      x: Number(b.position_x ?? 0),
      y: Number(b.position_y ?? 0),
      width: Number(b.width ?? 200),
      height: Number(b.height ?? 120),
      colorId: hexToNearestColorId(String(b.color ?? '')),
      tags,
      favorite: Boolean(b.is_favorite),
      tileVariant: typeof content.tileVariant === 'string' ? content.tileVariant : 'default',
      originSandboxId: content.originSandboxId ?? null,
      sourceArtifact: content.sourceArtifact,
      ghostProposal: content.ghostProposal,
      lensPayload: content.lensPayload,
      evidencePayload: content.evidencePayload,
      connectorPayload: content.connectorPayload,
      freestylePayload: content.freestylePayload,
    };
    return migrateCanvasNode(rawNode);
  });

  const idToClient = new Map<string, string>();
  (blocks ?? []).forEach((b: Record<string, unknown>) => {
    const content = (b.content ?? {}) as { clientNodeId?: string };
    const cid = typeof content.clientNodeId === 'string' ? content.clientNodeId : String(b.id);
    idToClient.set(String(b.id), cid);
  });

  const edges: PersistedCanvasEdge[] = (connectors ?? []).map((c: Record<string, unknown>, i: number) => ({
    id: `edge-${i}-${String(c.id)}`,
    from: idToClient.get(String(c.source_block_id)) ?? String(c.source_block_id),
    to: idToClient.get(String(c.target_block_id)) ?? String(c.target_block_id),
    linkType: connectorLinkTypeFromDb(String(c.link_type ?? 'relationship')),
  }));

  const readerHighlights: ReaderHighlight[] = (highlights ?? []).map((h: Record<string, unknown>, i: number) => ({
    id: `hl-${String(h.id) ?? i}`,
    pageId: Number(h.page_number ?? 1),
    selectedText: String(h.text_content ?? ''),
    color: String(h.color ?? 'yellow'),
  }));

  const readerNotes: ReaderNote[] = (notes ?? []).map((n: Record<string, unknown>, i: number) => ({
    id: `note-${String(n.id) ?? i}`,
    pageId: Number(n.page_number ?? 1),
    x: 0,
    y: Number(n.position_y ?? 0),
    text: String(n.content ?? ''),
  }));

  return { nodes, edges, readerHighlights, readerNotes };
}
