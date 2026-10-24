import { createRoot } from 'react-dom/client';
import { KO_LABELS, ViewerPage, type Adapter, type ViewDocument } from '@iyulab/u-board';
import { countQualityMarks, findProblems, placedParts, type LookRequest, type LookResult, type Looker } from '@iyulab/u-board-mcp/tools';

/** What the board is drawn with — the editor's own: its data sources, its clock, where its elements may load from. */
export interface LookSetting {
  adapters: readonly Adapter[];
  clock?: () => number;
  elementOrigins?: readonly string[];
  elementFrames?: string;
}

/** How long a drawn board settles before it is read — charts finish their drawing animation, values arrive. */
const SETTLE_MS = 1500;
const DRAWN_TIMEOUT_MS = 20_000;
const MAX_CONSOLE_LINES = 5;

/**
 * `look` for the chat panel: the saved board drawn as its viewers see it — the library's viewer, in this page, out of
 * sight at the size asked for — and checked as the MCP server's `look` checks it (parts that run past their box,
 * elements that failed, widgets drawing their "invalid spec" card, values not live). A tab cannot photograph itself,
 * so it answers the report alone (`picture` false).
 */
export class InPageLooker implements Looker {
  readonly picture = false;

  constructor(private readonly setting: () => LookSetting) {}

  async look(request: LookRequest, saved: ViewDocument): Promise<LookResult> {
    const document = request.appearance ? { ...saved, appearance: request.appearance } : saved;
    const stage = window.document.createElement('div');
    stage.setAttribute('aria-hidden', 'true');
    stage.setAttribute('inert', '');
    // Laid out at its full size — sizes are what is checked — but where nobody sees it.
    stage.style.cssText = `position:fixed;top:0;left:${-request.width - 200}px;width:${request.width}px;height:${request.height}px;overflow:hidden;pointer-events:none`;
    window.document.body.appendChild(stage);
    const root = createRoot(stage);
    const errors: string[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.message);
    window.addEventListener('error', onError);
    try {
      const { adapters, clock, elementOrigins, elementFrames } = this.setting();
      root.render(
        <ViewerPage
          document={document}
          adapters={adapters}
          width={request.width}
          height={request.height}
          labels={KO_LABELS}
          clock={clock}
          elementOrigins={elementOrigins}
          elementFrames={elementFrames}
          boardId={request.board}
        />
      );
      await drawn(stage);
      await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
      const problems = findProblems(placedParts(document), stage);
      return {
        report: {
          picture: { width: request.width, height: request.height },
          problems,
          quality: countQualityMarks(stage),
          console: errors.slice(0, MAX_CONSOLE_LINES),
        },
      };
    } finally {
      window.removeEventListener('error', onError);
      root.unmount();
      stage.remove();
    }
  }
}

/** Resolves once the viewer has drawn its surface in `stage`. */
async function drawn(stage: HTMLElement): Promise<void> {
  const until = Date.now() + DRAWN_TIMEOUT_MS;
  while (!stage.querySelector('.ub-viewer__surface')) {
    if (Date.now() > until) throw new Error('the board did not draw within 20 s');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
