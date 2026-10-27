import { getWidgetLabel } from '@iyulab/u-widgets/tools';
// The widget library's names in Korean, for `widgetTypeName` — authoring code only, as in widget-fields.ts.
import '@iyulab/u-widgets/tools/locales/ko';
import { elementNameOf } from '@iyulab/u-board/toolkit';

/** What a widget is called where the editor names it: a prepared widget's name from the widget library, in `locale`,
 *  or the name of the board's element it places. */
export function widgetTypeName(type: string, locale?: string): string {
  return elementNameOf(type) ?? getWidgetLabel(type, locale);
}
