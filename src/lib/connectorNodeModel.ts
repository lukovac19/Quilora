/** EP-07 Native connector — hub block between two canvas nodes. */

export type ConnectorLinkType = 'relationship' | 'contrast' | 'cause_effect';

/** DB `connectors.link_type` uses `cause_and_effect`. */
export function connectorLinkTypeToDb(t: ConnectorLinkType): 'relationship' | 'contrast' | 'cause_and_effect' {
  if (t === 'cause_effect') return 'cause_and_effect';
  return t;
}

export function connectorLinkTypeFromDb(raw: string): ConnectorLinkType {
  if (raw === 'cause_and_effect') return 'cause_effect';
  if (raw === 'contrast') return 'contrast';
  return 'relationship';
}

export type ConnectorNodePayload = {
  endpointFromId: string;
  endpointToId: string;
  linkType: ConnectorLinkType;
  userReasoning: string;
  aiAnalysisBody: string;
  sourceCitation: string;
  aiLoading?: boolean;
  creditsDebited?: number;
};

export const CONNECTOR_AI_CREDITS = 2;

export const CONNECTOR_LINK_LABELS: Record<ConnectorLinkType, string> = {
  relationship: 'Relationship',
  contrast: 'Contrast',
  cause_effect: 'Cause & Effect',
};

export function initialConnectorPayload(
  fromId: string,
  toId: string,
  linkType: ConnectorLinkType,
  sourceCitation: string,
): ConnectorNodePayload {
  return {
    endpointFromId: fromId,
    endpointToId: toId,
    linkType,
    userReasoning: '',
    aiAnalysisBody: '',
    sourceCitation,
    aiLoading: false,
  };
}

export function parseConnectorPayload(raw: unknown): ConnectorNodePayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  const from = String(c.endpointFromId ?? '');
  const to = String(c.endpointToId ?? '');
  if (!from || !to) return null;
  const lt = String(c.linkType ?? 'relationship');
  const linkType: ConnectorLinkType =
    lt === 'contrast' ? 'contrast' : lt === 'cause_effect' || lt === 'cause-and-effect' ? 'cause_effect' : 'relationship';
  return {
    endpointFromId: from,
    endpointToId: to,
    linkType,
    userReasoning: String(c.userReasoning ?? ''),
    aiAnalysisBody: String(c.aiAnalysisBody ?? ''),
    sourceCitation: String(c.sourceCitation ?? ''),
    aiLoading: Boolean(c.aiLoading),
    creditsDebited: c.creditsDebited != null ? Number(c.creditsDebited) : undefined,
  };
}

export function buildConnectorAiPrompt(params: {
  linkType: ConnectorLinkType;
  fromTitle: string;
  fromBody: string;
  toTitle: string;
  toBody: string;
  documentExcerpt: string;
  userReasoning?: string;
}): string {
  const { linkType, fromTitle, fromBody, toTitle, toBody, documentExcerpt, userReasoning } = params;
  const ctx = documentExcerpt.trim() ? `Document context (ground truth):\n${documentExcerpt.slice(0, 8000)}\n\n` : '';
  const pair = `Block A title: ${fromTitle}\nBlock A notes: ${fromBody.slice(0, 1200)}\n\nBlock B title: ${toTitle}\nBlock B notes: ${toBody.slice(0, 1200)}\n\n`;
  if (linkType === 'relationship') {
    return `${ctx}${pair}Task: In 2–4 sentences, explain how Block A and Block B relate in the document (themes, characters, arguments). Stay grounded in the context. Plain text only.`;
  }
  if (linkType === 'contrast') {
    return `${ctx}${pair}Task: In 2–4 sentences, contrast Block A and Block B — key differences or tensions. Plain text only.`;
  }
  return `${ctx}${pair}User hypothesis (cause → effect): ${userReasoning?.trim() || '(none)'}\n\nTask: In 2–5 sentences, analyze this causal claim using the document. Say whether the text supports, complicates, or is silent on it. Plain text only.`;
}
