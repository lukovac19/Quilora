import type { PageTextMap } from './pageAwareChunker';

export type RegisteredCorpus = {
  documentId: string;
  sourceTitle: string;
  pages: PageTextMap;
  canvasSourceNodeId: string | null;
  updatedAt: string;
};

const corpora = new Map<string, RegisteredCorpus>();

export function registerSourceCorpus(entry: Omit<RegisteredCorpus, 'updatedAt'> & { updatedAt?: string }) {
  corpora.set(entry.documentId, {
    ...entry,
    updatedAt: entry.updatedAt ?? new Date().toISOString(),
  });
}

export function unregisterCorpus(documentId: string) {
  corpora.delete(documentId);
}

export function getCorpusByDocumentId(documentId: string): RegisteredCorpus | undefined {
  return corpora.get(documentId);
}

export function getCorpusForSourceNode(sourceNode: { sourceArtifact?: { sourceSystemId: string } | null } | null): RegisteredCorpus | undefined {
  const id = sourceNode?.sourceArtifact?.sourceSystemId;
  if (!id) return undefined;
  return corpora.get(id);
}

export function allRegisteredDocumentIds(): string[] {
  return [...corpora.keys()];
}
