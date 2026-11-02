import { useState } from 'react';
import type { Adapter, Board, ResolvedBinding } from '@iyulab/u-board/domain';
import { isHttpRef, readHttpRef, resolvedReading } from '@iyulab/u-board/picture';
import { BoardView, type BoardInput } from '@iyulab/u-board/viewer';

// 1. Your data. An adapter turns a reference in your system into a value and how current it is — and, if you like, a note
//    on where the value came from (`meta`), which the viewer shows in the part's tooltip.
const ANSWERS: Record<string, unknown> = {
  '/lines/L1/pumps': { value: [{ id: 'P1', state: 'run' }, { id: 'P2', state: 'trip' }] },
  '/lines/L2/pumps': { value: [{ id: 'P3', state: 'run' }] },
};

export const plant: Adapter = {
  id: 'plant',
  async resolve(ref): Promise<ResolvedBinding> {
    const answer = isHttpRef(ref) ? ANSWERS[ref.path] : undefined;
    const reading = isHttpRef(ref) && answer !== undefined ? readHttpRef(answer, ref, Date.now()) : undefined;
    if (!reading?.ok) return { value: undefined, quality: 'disconnected', reason: 'address' };
    return { ...resolvedReading(reading), meta: { source: 'plant historian', calibrated: true } };
  },
};

// 2. A board that reads from it. The `line` variable is a value your app gives the board: the board never asks for it itself.
export const board: Board = {
  variables: { line: { options: ['L1', 'L2'], default: 'L1' } },
  statuses: { running: { tone: 'ok', label: 'Running' }, tripped: { tone: 'alarm', label: 'Tripped' } },
  data: {
    pumps: {
      from: 'plant', path: '/lines/{{$line}}/pumps', list: '/value', key: 'id',
      fields: { state: { state: { run: 'running', trip: 'tripped' } } },
    },
  },
  parts: { pump: { as: 'status-card', each: 'pumps', title: 'Pump {{key}}', show: ['state'] } },
  layout: { kind: 'grid', items: ['pump'] },
};

// 3. Draw it in your app, at the values your app chooses. The board is drawn again when a value changes; what a person does on it
//    comes back to you as calls, and nothing is written anywhere by the viewer.
const adapters = [plant];

export function LineView() {
  const [line, setLine] = useState('L1');
  const [heard, setHeard] = useState<string[]>([]);
  return (
    <>
      <button onClick={() => setLine(line === 'L1' ? 'L2' : 'L1')}>Line {line}</button>
      <div style={{ height: 480 }}>
        <BoardView
          board={board}
          adapters={adapters}
          variables={{ line }}
          onTrigger={event => setHeard(list => [...list, `event ${event.name}`])}
          onInput={(input: BoardInput) => setHeard(list => [...list, `input ${input.type} in ${input.part}`])}
        />
      </div>
      <p role="status">{heard.length > 0 ? heard[heard.length - 1] : 'nothing has happened on the board yet'}</p>
    </>
  );
}
