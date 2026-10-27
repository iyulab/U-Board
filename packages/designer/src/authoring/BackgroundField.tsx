import { DEFAULT_DESIGNER_LABELS, type DesignerLabels } from '../labels.js';
import { useRef, useState } from 'react';
import { GROUP_STYLE } from '@iyulab/u-board/toolkit';
import type { CanvasLayout } from '@iyulab/u-board/toolkit';
import { readBackgroundImage, BackgroundImageError, BACKGROUND_IMAGE_TYPES, MAX_BACKGROUND_BYTES } from './background-image.js';

export interface BackgroundFieldProps {
  layout: CanvasLayout;
  /** The canvas with its background as chosen — or taken away. */
  onChange: (layout: CanvasLayout) => void;
  labels?: DesignerLabels;
}

/**
 * The background of a canvas board: an image file chosen, which the canvas takes the
 * size of — its parts keep their places in the canvas's units — or taken away, the canvas keeping its size.
 */
export function BackgroundField({ layout, onChange, labels = DEFAULT_DESIGNER_LABELS }: BackgroundFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const choose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const image = await readBackgroundImage(file);
      const size: [number, number] = image.width > 0 && image.height > 0 ? [image.width, image.height] : layout.size;
      onChange({ ...layout, background: image.src, size });
      setError(null);
    } catch (err) {
      const problem = err instanceof BackgroundImageError ? err.problem : 'unreadable';
      setError(
        problem === 'type'
          ? labels.backgroundType
          : problem === 'size'
            ? labels.backgroundTooLarge.replace('{max}', `${MAX_BACKGROUND_BYTES / (1024 * 1024)} MB`)
            : labels.backgroundUnreadable
      );
    }
  };
  const remove = () => {
    const { background: _gone, ...rest } = layout;
    onChange(rest);
  };
  return (
    <div className="ub-panel__actions" style={GROUP_STYLE}>
      <button type="button" className="ub-action" onClick={() => input.current?.click()}>
        {labels.setBackground}
      </button>
      {layout.background !== undefined && (
        <button type="button" className="ub-action" onClick={remove}>
          {labels.removeBackground}
        </button>
      )}
      <input ref={input} type="file" accept={BACKGROUND_IMAGE_TYPES.join(',')} onChange={choose} style={{ display: 'none' }} data-testid="background-file-input" />
      {error && (
        <p className="ub-panel__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
