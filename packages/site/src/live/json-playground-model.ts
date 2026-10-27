// The JSON playground's reading of what was typed, apart from the page so it can be tested: the two texts — a board's
// definition and its data — parsed and checked, and every problem named by where it is.

import { type Board } from '@iyulab/u-board/domain';
import { checkBoard } from '@iyulab/u-board-designer/check';
import type { SampleConnector, SampleSnapshot } from '@iyulab/u-board-samples';

/** A board's data as the gallery publishes it (`data.json`): the sources it reads and what they answered. */
export interface BoardData {
  connectors: SampleConnector[];
  capturedAt: string;
  responses: SampleSnapshot['responses'];
}

export interface Problem {
  /** Which text it is in. */
  in: 'definition' | 'data';
  /** A JSON Pointer into it, or empty for the text as a whole. */
  path: string;
  message: string;
}

export interface Reading {
  board?: Board;
  data?: BoardData;
  problems: Problem[];
}

function parse(text: string, where: Problem['in'], problems: Problem[]): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    problems.push({ in: where, path: '', message: (error as Error).message });
    return undefined;
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function checkData(value: unknown, problems: Problem[]): BoardData | undefined {
  const before = problems.length;
  const problem = (path: string, message: string) => problems.push({ in: 'data', path, message });
  if (!isRecord(value)) {
    problem('', 'expected an object with "connectors", "capturedAt" and "responses"');
    return undefined;
  }
  if (!Array.isArray(value.connectors)) problem('/connectors', 'expected an array of sources');
  else
    value.connectors.forEach((c, i) => {
      if (!isRecord(c) || typeof c.key !== 'string' || c.key === '') problem(`/connectors/${i}/key`, 'expected the source’s key, the name its bindings use');
      else if (!isRecord(c.attribution) || typeof c.attribution.text !== 'string') problem(`/connectors/${i}/attribution/text`, 'expected the line that credits the source');
    });
  if (typeof value.capturedAt !== 'string' || Number.isNaN(Date.parse(value.capturedAt))) problem('/capturedAt', 'expected when the answers were recorded (ISO 8601)');
  if (!isRecord(value.responses)) problem('/responses', 'expected the answers, by source key and request path');
  return problems.length === before ? (value as unknown as BoardData) : undefined;
}

/** Reads the definition and the data typed into the playground. A board is drawn only from both read without problems. */
export function readPlayground(definitionText: string, dataText: string): Reading {
  const problems: Problem[] = [];
  const definition = parse(definitionText, 'definition', problems);
  let board: Board | undefined;
  if (definition !== undefined) {
    const { issues } = checkBoard(definition);
    for (const issue of issues) problems.push({ in: 'definition', path: issue.path, message: issue.message });
    if (issues.length === 0) board = definition as Board;
  }
  const raw = parse(dataText, 'data', problems);
  const data = raw === undefined ? undefined : checkData(raw, problems);
  return { board, data, problems };
}
