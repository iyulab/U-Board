/**
 * The widget library keeps `chart.*` behind its own entry (`@iyulab/u-widgets/charts` — the chart engine is most of
 * its weight), and a `chart.*` widget draws nothing until that entry has registered. The entry is fetched when a
 * board names a chart, not when this module is read: a board without one never pays for it.
 *
 * `needChartEntry` is idempotent and cheap. A chart drawn before the entry arrives shows the library's «module not
 * loaded» card for that moment, and the widget draws itself once the entry registers — nothing here has to render again.
 */
let loading: Promise<unknown> | undefined;

/** Whether a widget type is one the chart entry draws. */
export function isChartType(type: string): boolean {
  return type.startsWith('chart.');
}

/** Starts loading the chart entry if `types` hold a chart and it is not already loading or loaded. */
export function needChartEntry(types: Iterable<string>): void {
  if (loading) return;
  for (const type of types) {
    if (!isChartType(type)) continue;
    // A failed fetch is tried again at the next chart drawn, not remembered.
    loading = import('@iyulab/u-widgets/charts').catch(() => {
      loading = undefined;
    });
    return;
  }
}
