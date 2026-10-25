// The JSON Schema of a board, generated from the same lists the validator reads —
// the kinds, the tones, the emphases, the frames — so a reader that has only the schema (a model writing a board,
// another language's validator) is told the same words.
//
// The schema says a board's shape. What it cannot say — that an `of` names a declared data read, that every part is
// placed, that a state's words are statuses — `validateBoard` checks, and says where and how to write it instead.

import { PART_KINDS } from './kinds.js';
import { EMPHASES, FRAMES, TONES } from './types.js';

type Schema = Record<string, unknown>;

const ref = (name: string): Schema => ({ $ref: `#/$defs/${name}` });
const map = (of: Schema, description?: string): Schema => ({ type: 'object', additionalProperties: of, ...(description ? { description } : {}) });
const point: Schema = { type: 'array', prefixItems: [{ type: 'number' }, { type: 'number' }], items: false, minItems: 2 };
const size: Schema = { type: 'array', prefixItems: [{ type: 'number', exclusiveMinimum: 0 }, { type: 'number', exclusiveMinimum: 0 }], items: false, minItems: 2 };

/** The JSON Schema (draft 2020-12) of a board. */
export function boardSchema(): Schema {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'U-Board board',
    description:
      'A board: where its values come from and what they mean (data), what it shows (parts) and where (layout), its statuses and its look. ' +
      'Everything a person picks is addressed by id within its own map; coordinates appear only in a canvas layout.',
    type: 'object',
    required: ['parts', 'layout'],
    additionalProperties: false,
    properties: {
      board: {
        description: 'Its title, theme (light or dark), accent colour and skin — the look, once.',
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          theme: { enum: ['light', 'dark'] },
          accent: { type: 'string', description: "The board's accent colour: the accent tone, a header's banner." },
          skin: ref('skin'),
        },
      },
      statuses: map(ref('status'), "The board's own statuses by name: each a tone, its words and optionally a glyph and an emphasis."),
      symbols: map({ type: 'object', additionalProperties: false, properties: { viewBox: { type: 'string' }, path: { type: 'string' } } }, 'Small drawings a marker shows, by name: an SVG path and its view box.'),
      elements: map(ref('element'), 'Drawings no built-in makes: markup with declared holes, shown by a part "as": "element".'),
      data: map(ref('query'), 'Where values come from, read once for every part that shows them.'),
      presets: map(ref('part'), 'Settings a part takes with "use"; its own settings win.'),
      parts: map(ref('part'), 'What the board shows, by id — never where.'),
      layout: { ...ref('layout'), description: 'Where the parts go: a canvas (placed by coordinates) or a grid (in order, by span).' },
      triggers: { type: 'array', items: ref('trigger'), description: 'What the board does when something happens on it: on an event, when a part is in a status, do actions — show, move and tell only.' },
    },
    $defs: {
      tone: { enum: [...TONES], description: 'The tone a status is drawn in.' },
      emphasis: { enum: [...EMPHASES], description: 'A second channel besides colour.' },
      status: {
        type: 'object',
        required: ['tone'],
        additionalProperties: false,
        properties: { tone: ref('tone'), label: { type: 'string' }, glyph: { type: 'string' }, emphasis: ref('emphasis') },
      },
      mapping: {
        description: 'A map of raw values to words ("*" for anything else), or bands: the word below the first number, then each number and the word from it up.',
        oneOf: [
          { type: 'object', additionalProperties: { type: 'string', minLength: 1 }, minProperties: 1 },
          { type: 'array', minItems: 3, items: { type: ['string', 'number'] } },
        ],
      },
      field: {
        type: 'object',
        additionalProperties: false,
        properties: {
          at: { type: 'string', pattern: '^(/.*)?$', description: 'Where the value lives in an item, when it is not /<field name> — "" when an adapter’s item is the value.' },
          label: { type: 'string' },
          unit: { type: 'string' },
          digits: { type: 'integer', minimum: 0 },
          format: { type: 'string', description: 'A value format: "number:1", "percent", "time" …' },
          names: ref('mapping'),
          state: { description: 'How the value is doing, as a status: "raw" when the value is one, else a mapping.', oneOf: [{ const: 'raw' }, ref('mapping')] },
        },
      },
      query: {
        type: 'object',
        required: ['from'],
        oneOf: [
          { required: ['path'] },
          { required: ['ref'], not: { anyOf: ['list', 'key', 'where', 'time', 'answerTime', 'fresh', 'now', 'zone', 'pivot'].map(k => ({ required: [k] })) } },
        ],
        additionalProperties: false,
        properties: {
          from: { type: 'string', minLength: 1, description: 'The connector, or the adapter.' },
          path: { type: 'string', pattern: '^/', description: 'The request — {{now:yyyyMMdd}}-style places take the request time.' },
          ref: { description: 'What an adapter that is not an HTTP connector reads, as it defines it: one item, its fields under fields (at "" when the item is the value). Takes nothing but fields.' },
          list: { type: 'string', description: 'A JSON Pointer to the list of items in the answer.' },
          key: { type: 'string', description: 'The field that names each item: parts address one as <data>[<key>].' },
          where: map({ type: ['string', 'number', 'boolean'] }, 'Only the items whose fields equal these values.'),
          time: { type: 'string', description: 'The field holding when the source observed the item.' },
          pivot: {
            type: 'object',
            required: ['key', 'value'],
            additionalProperties: false,
            description: 'A list of one row per name read as one item: each row’s key field names a field, its value field is the value.',
            properties: { key: { type: 'string' }, value: { type: 'string' } },
          },
          answerTime: { type: 'string', pattern: '^/', description: 'Where the answer says when it was observed as a whole, a JSON Pointer ("/updatedAt") — the time of a part that reads the whole list.' },
          fresh: { type: 'number', exclusiveMinimum: 0, description: 'Seconds a value may be old and still be current.' },
          now: {
            description: 'For a source asked for a given time: the delay after a time it has its data, and how often it has new data (seconds).',
            type: 'object',
            additionalProperties: false,
            properties: { delay: { type: 'number', minimum: 0 }, step: { type: 'number', exclusiveMinimum: 0 } },
          },
          zone: { type: 'string', description: 'The IANA time zone the source writes times in.' },
          fields: map(ref('field'), 'What each field of an item means: label, unit, digits, format, names, state.'),
        },
      },
      part: {
        type: 'object',
        description: 'What is shown, of which data, with which fields. Options a kind takes sit beside these.',
        properties: {
          as: { enum: PART_KINDS.map(k => k.kind), description: 'The kind: ' + PART_KINDS.map(k => `${k.kind} — ${k.shows}`).join('; ') },
          use: { type: 'string', description: 'A preset whose settings this part takes.' },
          of: { type: 'string', pattern: '^[\\w-]+(\\[[^\\]]+\\])?$', description: '<data> for the whole, <data>[<key>] for one item.' },
          each: { type: 'string', description: 'A data list: one part per item, ids <part>/<key>.' },
          title: { type: 'string', description: '{{field}} reads a field of what the part shows, {{key}} its item.' },
          show: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
          size,
          parts: map(ref('part')),
          place: map(ref('place')),
          shapes: map(ref('shape')),
          links: map(ref('groupLink')),
          element: { type: 'string' },
          props: { type: 'object' },
          bind: map({ type: 'string', pattern: '^[\\w-]+(\\.(status|tone))?$' }),
        },
        not: { required: ['of', 'each'] },
        // A group draws its parts on a canvas of its own: «not a group, or a group with its size, parts and places».
        anyOf: [{ not: { properties: { as: { const: 'group' } }, required: ['as'] } }, { required: ['size', 'parts', 'place'] }],
      },
      place: {
        description: '[x, y] or [x, y, width, height] on the canvas.',
        type: 'array',
        items: { type: 'number' },
        oneOf: [{ minItems: 2, maxItems: 2 }, { minItems: 4, maxItems: 4 }],
      },
      shape: {
        type: 'object',
        additionalProperties: false,
        properties: {
          box: { type: 'array', items: { type: 'number' }, minItems: 4, maxItems: 4 },
          label: { type: 'string' },
          text: { type: 'string' },
          at: point,
          size: { type: 'number', exclusiveMinimum: 0 },
          line: { type: 'array', items: point, minItems: 2 },
          path: { type: 'string', pattern: '^[MLCQZ0-9.,\\s-]+$', description: 'Absolute M · L · C · Q · Z only.' },
          tone: ref('tone'),
          width: { type: 'number', exclusiveMinimum: 0 },
          dash: { type: 'boolean' },
        },
        oneOf: [{ required: ['box'] }, { required: ['text', 'at'] }, { required: ['line'] }, { required: ['path'] }],
      },
      groupLink: {
        type: 'object',
        required: ['from', 'to'],
        additionalProperties: false,
        properties: {
          from: { type: 'string', description: 'The part it starts at.' },
          to: { type: 'string', description: 'The part it ends at.' },
          of: { type: 'string', description: 'The data item it reads — for show, weight and {{field}} in its label.' },
          show: { type: 'string', description: 'The field whose state colours it, and dashes or thickens it by the status’s emphasis.' },
          label: { type: 'string', description: 'Its words: fixed, or {{field}} of what it reads.' },
          tone: { enum: [...TONES], description: 'Its colour when it shows no state.' },
          route: { enum: ['straight', 'orthogonal', 'curved'], description: 'How it runs: straight, with one turn (orthogonal) or bowed (curved).' },
          width: { type: 'number', exclusiveMinimum: 0, description: 'Its thickness.' },
          weight: {
            type: 'object',
            description: 'Its width from a field of the item it reads: bands [width, number, width, …] or a map { "<raw>": width, "*": width }.',
            required: ['field'],
            additionalProperties: false,
            oneOf: [{ required: ['bands'] }, { required: ['map'] }],
            properties: {
              field: { type: 'string' },
              bands: { type: 'array', items: { type: 'number' }, minItems: 3 },
              map: { type: 'object', additionalProperties: { type: 'number', exclusiveMinimum: 0 } },
            },
          },
          dash: { type: 'boolean', description: 'Dashed always.' },
          arrow: {
            description: 'Its arrowheads: "end" (toward to), "start" (toward from) or "both" — or from a field of the item it reads, as a direction that reverses: a map { "<raw>": "end", "*": "none" } or bands of a number ["start", 0, "end"] (the ends below the first number, then from each number up).',
            oneOf: [
              { enum: ['end', 'start', 'both'] },
              {
                type: 'object',
                required: ['field'],
                additionalProperties: false,
                oneOf: [{ required: ['bands'] }, { required: ['map'] }],
                properties: {
                  field: { type: 'string' },
                  map: { type: 'object', additionalProperties: { enum: ['end', 'start', 'both', 'none'] } },
                  bands: { type: 'array', items: { oneOf: [{ type: 'number' }, { enum: ['end', 'start', 'both', 'none'] }] }, minItems: 3 },
                },
              },
            ],
          },
        },
      },
      // The items of an "each" part placed by their own fields rather than one by one.
      placeByFields: {
        type: 'object',
        required: ['at'],
        additionalProperties: false,
        description: 'Items placed by their own fields: "at" names the fields holding x and y; "frame" is the values at the canvas’s left, top, right and bottom edges (the canvas’s own coordinates when left out); "size" the box centred on that point. An item with no number there, or outside the frame, is not drawn.',
        properties: {
          at: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2, description: '[the field holding x, the field holding y].' },
          frame: { type: 'array', items: { type: 'number' }, minItems: 4, maxItems: 4, description: '[left, top, right, bottom] — the values at the canvas’s edges; [-180, 90, 180, -90] for longitude and latitude over a picture of the whole world.' },
          size: { type: 'array', items: { type: 'number', exclusiveMinimum: 0 }, minItems: 2, maxItems: 2, description: '[width, height] of each item’s box.' },
        },
      },
      // A link on a board's own canvas shows or weighs a field only "of" something; inside a group (above) it may read
      // the group's data instead.
      link: { $ref: '#/$defs/groupLink', dependentRequired: { show: ['of'], weight: ['of'] } },
      canvas: {
        type: 'object',
        required: ['size', 'place'],
        properties: {
          size,
          background: { type: 'string' },
          place: map({ oneOf: [ref('place'), map(ref('place')), ref('placeByFields')] }, 'Where each part is; an "each" part places its items inside its own entry, or by their fields ({ "at": ["lon", "lat"], "frame": [...] }).'),
          shapes: map(ref('shape')),
          links: map(ref('link')),
        },
      },
      gridItem: {
        oneOf: [
          { type: 'string', description: 'A part.' },
          { type: 'array', prefixItems: [{ type: 'string' }, ref('span')], items: false, minItems: 2, description: '[part, span].' },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              id: { type: 'string' },
              span: ref('span'),
              height: { type: 'number', exclusiveMinimum: 0 },
              canvas: { type: 'object', $ref: '#/$defs/canvas', unevaluatedProperties: false },
              grid: { type: 'array', items: ref('gridItem'), description: 'A grid in the cell: its items span its twelve columns and stack.' },
            },
            oneOf: [{ required: ['id'] }, { required: ['canvas'] }, { required: ['grid'] }],
          },
        ],
      },
      span: { type: 'integer', minimum: 1, maximum: 12, description: 'Of the twelve columns.' },
      layout: {
        oneOf: [
          {
            type: 'object',
            allOf: [ref('canvas')],
            properties: { kind: { const: 'canvas' } },
            required: ['kind'],
            unevaluatedProperties: false,
          },
          {
            type: 'object',
            required: ['kind', 'items'],
            additionalProperties: false,
            properties: { kind: { const: 'grid' }, items: { type: 'array', items: ref('gridItem') } },
          },
        ],
      },
      skin: {
        type: 'object',
        additionalProperties: false,
        properties: {
          font: { type: 'string' },
          display: { type: 'string' },
          mono: { type: 'string' },
          palette: {
            type: 'object',
            additionalProperties: false,
            properties: Object.fromEntries(['paper', 'ink', 'muted', 'rule', 'ground'].map(k => [k, { type: 'string' }])),
          },
          frame: { enum: [...FRAMES] },
          radius: { type: 'number', minimum: 0 },
          shadow: { enum: ['none', 'soft', 'hard'] },
          density: { enum: ['regular', 'compact'] },
        },
      },
      trigger: {
        type: 'object',
        required: ['on', 'do'],
        additionalProperties: false,
        properties: {
          on: {
            description: 'A part clicked, an event an element raises, a part entering or leaving a status (of `field`, or its own state), the board opened.',
            oneOf: [
              { type: 'object', additionalProperties: false, required: ['event', 'part'], properties: { event: { const: 'click' }, part: { type: 'string' } } },
              { type: 'object', additionalProperties: false, required: ['event', 'part', 'name'], properties: { event: { const: 'element' }, part: { type: 'string' }, name: { type: 'string' } } },
              { type: 'object', additionalProperties: false, required: ['event', 'part', 'status'], properties: { event: { enum: ['enter', 'leave'] }, part: { type: 'string' }, field: { type: 'string' }, status: { type: 'string' } } },
              { type: 'object', additionalProperties: false, required: ['event'], properties: { event: { const: 'open' } } },
            ],
          },
          when: {
            type: 'object',
            additionalProperties: false,
            required: ['part', 'status'],
            description: 'Only while the part is in one of these statuses.',
            properties: { part: { type: 'string' }, field: { type: 'string' }, status: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' }, minItems: 1 }] } },
          },
          do: {
            type: 'array',
            minItems: 1,
            items: {
              oneOf: [
                { type: 'object', additionalProperties: false, required: ['action', 'url'], properties: { action: { const: 'open-link' }, url: { type: 'string', description: 'https://… or a path here; {{part}}, {{status}} and {{board}} are filled in.' } } },
                { type: 'object', additionalProperties: false, required: ['action', 'part'], properties: { action: { const: 'focus' }, part: { type: 'string' } } },
                { type: 'object', additionalProperties: false, required: ['action', 'name'], properties: { action: { const: 'emit' }, name: { type: 'string' } } },
                { type: 'object', additionalProperties: false, required: ['action', 'board'], properties: { action: { const: 'go-to-board' }, board: { type: 'string' } } },
              ],
            },
          },
        },
      },
      element: {
        type: 'object',
        oneOf: [{ required: ['template'] }, { required: ['script'] }],
        additionalProperties: false,
        properties: {
          template: { type: 'string', description: 'Markup with {{prop}} holes — names only; compute with CSS calc().' },
          style: { type: 'string', description: 'CSS for its own markup only.' },
          script: { type: 'string', description: 'Code run in a sandboxed frame with no network; its props arrive through ub.onProps.' },
          resources: { type: 'array', items: { type: 'string', pattern: '^https://[^/\\s]+$' }, description: 'The https:// origins a script loads from.' },
          props: map({ enum: ['number', 'string', 'boolean', 'list', 'object'] }),
        },
      },
    },
  };
}
