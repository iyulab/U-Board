// A seismic network's stations drawn as a drum recorder's paper: cream chart paper ruled by the minute, a red margin,
// and every station a channel across it with its trace inked as the recorder would draw it now. A channel tells its
// state by the trace itself as well as by its ink: a fine tremor when quiet, a swelling wiggle in blue when it felt
// something, a burst in red when it crossed its alert level, a dashed flat line in grey when it stopped reporting —
// and by a sign at its end. Below, the event the network picked out; on the right the network's name stamped on the
// paper's header, the figures now, the key, the recent events and the detections through the week. The network and
// its stations are made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/quake-helicorder.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#c4231b"
  },
  "elements": {
    "channel": {
      "template": "<article class=\"ch {{c.state}}\"><header><b>{{c.code}}</b><small>{{c.place}}</small></header><div class=\"tr\"></div><aside><i></i><strong>{{c.pga}}</strong><span>gal</span><em>{{c.word}}</em></aside></article>",
      "style": ".ch{height:100%;box-sizing:border-box;display:grid;grid-template-columns:120px 1fr 130px;align-items:center;gap:0;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1d1f24}\nheader{display:grid;gap:2px;padding-left:4px}\nb{font:800 20px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace;letter-spacing:.04em}\nsmall{font-size:12px;color:#6b604c}\n.tr{height:100%;background-repeat:no-repeat;background-size:100% 100%}\naside{display:grid;grid-template-columns:28px auto 1fr;grid-template-rows:auto auto;column-gap:6px;align-items:center;padding:6px 8px;margin-left:8px;border-left:2px solid #e2d6bb}\ni{grid-row:1/3;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;box-sizing:border-box;font:900 12px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;font-style:normal}\nstrong{font:800 22px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace}\naside span{font-size:12px;color:#6b604c;align-self:end;padding-bottom:3px}\nem{grid-column:2/4;font-style:normal;font-size:13px;font-weight:800;white-space:nowrap}\n.calm .tr{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20700%2060%22%20preserveAspectRatio%3D%22none%22%3E%3Cpolyline%20points%3D%220.0%2C30.3%202.5%2C29.4%205.0%2C30.1%207.5%2C31.6%2010.0%2C30.6%2012.5%2C30.1%2015.0%2C31.2%2017.5%2C31.3%2020.0%2C28.6%2022.5%2C31.6%2025.0%2C29.1%2027.5%2C29.0%2030.0%2C31.6%2032.5%2C28.6%2035.0%2C29.6%2037.5%2C28.5%2040.0%2C28.6%2042.5%2C30.6%2045.0%2C31.4%2047.5%2C31.0%2050.0%2C30.8%2052.5%2C28.6%2055.0%2C30.4%2057.5%2C30.0%2060.0%2C29.1%2062.5%2C31.3%2065.0%2C28.6%2067.5%2C31.0%2070.0%2C28.9%2072.5%2C28.5%2075.0%2C30.7%2077.5%2C30.8%2080.0%2C31.2%2082.5%2C31.0%2085.0%2C31.1%2087.5%2C30.8%2090.0%2C28.5%2092.5%2C29.5%2095.0%2C28.9%2097.5%2C30.5%20100.0%2C29.6%20102.5%2C29.4%20105.0%2C30.9%20107.5%2C29.4%20110.0%2C31.2%20112.5%2C30.2%20115.0%2C29.0%20117.5%2C29.9%20120.0%2C30.2%20122.5%2C29.7%20125.0%2C29.4%20127.5%2C31.1%20130.0%2C30.3%20132.5%2C29.5%20135.0%2C30.7%20137.5%2C30.3%20140.0%2C29.7%20142.5%2C30.2%20145.0%2C29.2%20147.5%2C28.7%20150.0%2C30.3%20152.5%2C30.1%20155.0%2C29.9%20157.5%2C29.3%20160.0%2C29.8%20162.5%2C28.7%20165.0%2C30.9%20167.5%2C29.0%20170.0%2C28.8%20172.5%2C31.1%20175.0%2C30.3%20177.5%2C30.4%20180.0%2C31.4%20182.5%2C29.2%20185.0%2C29.9%20187.5%2C29.7%20190.0%2C30.4%20192.5%2C30.6%20195.0%2C29.1%20197.5%2C29.0%20200.0%2C30.4%20202.5%2C28.4%20205.0%2C29.3%20207.5%2C30.9%20210.0%2C30.9%20212.5%2C29.8%20215.0%2C29.6%20217.5%2C30.0%20220.0%2C29.2%20222.5%2C29.3%20225.0%2C31.1%20227.5%2C29.3%20230.0%2C30.3%20232.5%2C28.6%20235.0%2C31.2%20237.5%2C30.6%20240.0%2C29.8%20242.5%2C29.0%20245.0%2C31.0%20247.5%2C29.3%20250.0%2C29.1%20252.5%2C29.9%20255.0%2C30.9%20257.5%2C29.6%20260.0%2C28.4%20262.5%2C29.7%20265.0%2C28.7%20267.5%2C31.6%20270.0%2C29.3%20272.5%2C30.2%20275.0%2C30.3%20277.5%2C31.3%20280.0%2C30.7%20282.5%2C31.5%20285.0%2C29.2%20287.5%2C29.1%20290.0%2C30.0%20292.5%2C29.7%20295.0%2C30.9%20297.5%2C30.0%20300.0%2C31.4%20302.5%2C30.9%20305.0%2C30.0%20307.5%2C31.3%20310.0%2C29.6%20312.5%2C30.3%20315.0%2C31.2%20317.5%2C29.9%20320.0%2C29.5%20322.5%2C30.8%20325.0%2C31.3%20327.5%2C31.2%20330.0%2C29.0%20332.5%2C29.2%20335.0%2C29.5%20337.5%2C28.6%20340.0%2C28.8%20342.5%2C30.5%20345.0%2C31.0%20347.5%2C29.2%20350.0%2C30.2%20352.5%2C29.3%20355.0%2C29.0%20357.5%2C30.3%20360.0%2C30.5%20362.5%2C31.3%20365.0%2C31.3%20367.5%2C29.2%20370.0%2C30.6%20372.5%2C28.8%20375.0%2C31.0%20377.5%2C29.5%20380.0%2C29.4%20382.5%2C30.6%20385.0%2C28.8%20387.5%2C31.1%20390.0%2C29.5%20392.5%2C29.3%20395.0%2C30.4%20397.5%2C29.9%20400.0%2C30.2%20402.5%2C31.4%20405.0%2C29.8%20407.5%2C31.5%20410.0%2C28.6%20412.5%2C30.3%20415.0%2C30.5%20417.5%2C28.9%20420.0%2C30.3%20422.5%2C30.9%20425.0%2C30.3%20427.5%2C28.6%20430.0%2C31.3%20432.5%2C29.9%20435.0%2C29.8%20437.5%2C31.0%20440.0%2C30.8%20442.5%2C28.9%20445.0%2C31.3%20447.5%2C29.4%20450.0%2C28.7%20452.5%2C29.1%20455.0%2C28.6%20457.5%2C30.8%20460.0%2C30.9%20462.5%2C30.3%20465.0%2C28.4%20467.5%2C29.7%20470.0%2C31.0%20472.5%2C29.8%20475.0%2C29.0%20477.5%2C29.1%20480.0%2C28.9%20482.5%2C30.3%20485.0%2C30.3%20487.5%2C29.4%20490.0%2C30.5%20492.5%2C28.8%20495.0%2C31.1%20497.5%2C28.7%20500.0%2C31.6%20502.5%2C28.8%20505.0%2C29.2%20507.5%2C28.7%20510.0%2C30.6%20512.5%2C29.8%20515.0%2C30.6%20517.5%2C28.5%20520.0%2C28.6%20522.5%2C28.4%20525.0%2C28.8%20527.5%2C30.0%20530.0%2C28.6%20532.5%2C31.6%20535.0%2C29.4%20537.5%2C28.9%20540.0%2C29.1%20542.5%2C29.4%20545.0%2C29.9%20547.5%2C30.0%20550.0%2C31.5%20552.5%2C30.7%20555.0%2C30.3%20557.5%2C28.9%20560.0%2C29.3%20562.5%2C30.9%20565.0%2C30.8%20567.5%2C30.0%20570.0%2C28.7%20572.5%2C30.7%20575.0%2C30.8%20577.5%2C28.6%20580.0%2C28.8%20582.5%2C29.4%20585.0%2C29.1%20587.5%2C29.2%20590.0%2C30.4%20592.5%2C30.2%20595.0%2C31.1%20597.5%2C30.1%20600.0%2C31.2%20602.5%2C30.0%20605.0%2C28.8%20607.5%2C30.5%20610.0%2C30.0%20612.5%2C30.1%20615.0%2C30.9%20617.5%2C31.6%20620.0%2C30.4%20622.5%2C30.6%20625.0%2C31.2%20627.5%2C29.4%20630.0%2C31.3%20632.5%2C30.0%20635.0%2C31.2%20637.5%2C31.5%20640.0%2C31.4%20642.5%2C31.2%20645.0%2C30.2%20647.5%2C28.5%20650.0%2C30.7%20652.5%2C28.7%20655.0%2C30.3%20657.5%2C28.5%20660.0%2C31.5%20662.5%2C28.4%20665.0%2C31.1%20667.5%2C31.1%20670.0%2C28.5%20672.5%2C29.8%20675.0%2C28.7%20677.5%2C30.1%20680.0%2C28.6%20682.5%2C29.5%20685.0%2C29.1%20687.5%2C29.8%20690.0%2C30.9%20692.5%2C30.9%20695.0%2C31.4%20697.5%2C29.6%20700.0%2C31.0%22%20stroke%3D%22%231d1f24%22%20stroke-width%3D%221.4%22%20fill%3D%22none%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E\")}\n.calm i{border:2px solid #1d1f24}\n.felt .tr{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20700%2060%22%20preserveAspectRatio%3D%22none%22%3E%3Cpolyline%20points%3D%220.0%2C30.6%202.5%2C29.5%205.0%2C31.3%207.5%2C29.3%2010.0%2C29.6%2012.5%2C30.7%2015.0%2C31.2%2017.5%2C30.8%2020.0%2C28.3%2022.5%2C30.5%2025.0%2C31.2%2027.5%2C29.4%2030.0%2C31.3%2032.5%2C28.4%2035.0%2C31.0%2037.5%2C30.5%2040.0%2C28.1%2042.5%2C31.8%2045.0%2C29.8%2047.5%2C31.6%2050.0%2C31.1%2052.5%2C30.3%2055.0%2C29.1%2057.5%2C30.3%2060.0%2C30.5%2062.5%2C30.2%2065.0%2C30.1%2067.5%2C29.2%2070.0%2C28.8%2072.5%2C31.0%2075.0%2C29.8%2077.5%2C28.7%2080.0%2C28.1%2082.5%2C28.6%2085.0%2C31.5%2087.5%2C31.4%2090.0%2C29.0%2092.5%2C28.3%2095.0%2C28.1%2097.5%2C30.9%20100.0%2C30.0%20102.5%2C29.1%20105.0%2C29.1%20107.5%2C28.2%20110.0%2C29.7%20112.5%2C29.2%20115.0%2C28.3%20117.5%2C28.7%20120.0%2C30.4%20122.5%2C29.3%20125.0%2C31.6%20127.5%2C30.8%20130.0%2C31.4%20132.5%2C31.6%20135.0%2C30.1%20137.5%2C28.1%20140.0%2C29.1%20142.5%2C28.4%20145.0%2C28.5%20147.5%2C28.2%20150.0%2C29.5%20152.5%2C28.5%20155.0%2C31.6%20157.5%2C29.5%20160.0%2C30.0%20162.5%2C30.5%20165.0%2C29.3%20167.5%2C28.0%20170.0%2C28.1%20172.5%2C30.0%20175.0%2C28.6%20177.5%2C30.7%20180.0%2C28.2%20182.5%2C31.6%20185.0%2C29.3%20187.5%2C29.3%20190.0%2C30.5%20192.5%2C31.7%20195.0%2C29.2%20197.5%2C31.4%20200.0%2C31.9%20202.5%2C30.9%20205.0%2C31.8%20207.5%2C29.2%20210.0%2C30.6%20212.5%2C28.6%20215.0%2C32.0%20217.5%2C30.4%20220.0%2C30.9%20222.5%2C29.2%20225.0%2C30.6%20227.5%2C31.1%20230.0%2C29.9%20232.5%2C30.5%20235.0%2C30.7%20237.5%2C28.9%20240.0%2C31.5%20242.5%2C31.9%20245.0%2C31.4%20247.5%2C28.1%20250.0%2C29.7%20252.5%2C29.5%20255.0%2C31.4%20257.5%2C29.1%20260.0%2C30.0%20262.5%2C30.3%20265.0%2C29.8%20267.5%2C29.8%20270.0%2C30.7%20272.5%2C31.5%20275.0%2C28.4%20277.5%2C30.8%20280.0%2C30.3%20282.5%2C30.2%20285.0%2C29.1%20287.5%2C31.3%20290.0%2C28.1%20292.5%2C31.5%20295.0%2C28.6%20297.5%2C29.9%20300.0%2C28.6%20302.5%2C29.9%20305.0%2C29.0%20307.5%2C28.5%20310.0%2C30.0%20312.5%2C29.8%20315.0%2C29.6%20317.5%2C29.8%20320.0%2C30.6%20322.5%2C29.9%20325.0%2C28.9%20327.5%2C29.7%20330.0%2C31.7%20332.5%2C28.7%20335.0%2C31.6%20337.5%2C30.1%20340.0%2C30.2%20342.5%2C30.8%20345.0%2C29.4%20347.5%2C31.3%20350.0%2C30.1%20352.5%2C30.8%20355.0%2C28.3%20357.5%2C28.8%20360.0%2C29.5%20362.5%2C31.5%20365.0%2C29.2%20367.5%2C30.6%20370.0%2C30.7%20372.5%2C31.3%20375.0%2C28.2%20377.5%2C29.0%20380.0%2C31.9%20382.5%2C28.5%20385.0%2C29.6%20387.5%2C29.6%20390.0%2C29.1%20392.5%2C30.0%20395.0%2C31.6%20397.5%2C30.7%20400.0%2C30.7%20402.5%2C31.4%20405.0%2C30.8%20407.5%2C30.2%20410.0%2C31.5%20412.5%2C28.5%20415.0%2C29.5%20417.5%2C28.8%20420.0%2C29.9%20422.5%2C29.8%20425.0%2C30.1%20427.5%2C29.1%20430.0%2C30.1%20432.5%2C30.5%20435.0%2C28.8%20437.5%2C30.6%20440.0%2C31.0%20442.5%2C28.3%20445.0%2C29.1%20447.5%2C28.9%20450.0%2C28.8%20452.5%2C29.5%20455.0%2C31.2%20457.5%2C30.7%20460.0%2C28.3%20462.5%2C31.3%20465.0%2C29.4%20467.5%2C31.8%20470.0%2C31.2%20472.5%2C29.6%20475.0%2C30.1%20477.5%2C31.3%20480.0%2C31.5%20482.5%2C30.4%20485.0%2C28.4%20487.5%2C28.7%20490.0%2C30.5%20492.5%2C30.9%20495.0%2C30.7%20497.5%2C28.6%20500.0%2C29.5%20502.5%2C32.0%20505.0%2C29.1%20507.5%2C30.8%20510.0%2C28.6%20512.5%2C28.8%20515.0%2C30.2%20517.5%2C29.2%20520.0%2C28.7%20522.5%2C30.1%20525.0%2C30.3%20527.5%2C28.8%20530.0%2C28.6%20532.5%2C31.2%20535.0%2C31.8%20537.5%2C29.6%20540.0%2C31.5%20542.5%2C28.1%20545.0%2C29.5%20547.5%2C29.4%20550.0%2C28.7%20552.5%2C31.1%20555.0%2C30.3%20557.5%2C28.1%20560.0%2C31.0%20562.5%2C28.8%20565.0%2C34.8%20567.5%2C22.7%20570.0%2C37.9%20572.5%2C37.3%20575.0%2C23.8%20577.5%2C31.7%20580.0%2C35.2%20582.5%2C21.2%20585.0%2C24.4%20587.5%2C35.8%20590.0%2C30.2%20592.5%2C27.3%20595.0%2C37.7%20597.5%2C23.7%20600.0%2C37.9%20602.5%2C25.8%20605.0%2C28.4%20607.5%2C24.7%20610.0%2C27.0%20612.5%2C31.9%20615.0%2C35.6%20617.5%2C31.6%20620.0%2C24.9%20622.5%2C31.5%20625.0%2C28.9%20627.5%2C34.7%20630.0%2C35.9%20632.5%2C35.7%20635.0%2C26.3%20637.5%2C34.4%20640.0%2C34.6%20642.5%2C32.8%20645.0%2C26.2%20647.5%2C33.4%20650.0%2C31.9%20652.5%2C34.4%20655.0%2C26.8%20657.5%2C28.0%20660.0%2C33.3%20662.5%2C28.9%20665.0%2C26.3%20667.5%2C26.4%20670.0%2C28.1%20672.5%2C26.5%20675.0%2C33.8%20677.5%2C33.6%20680.0%2C31.1%20682.5%2C31.2%20685.0%2C32.3%20687.5%2C30.4%20690.0%2C32.3%20692.5%2C29.9%20695.0%2C26.4%20697.5%2C28.1%20700.0%2C32.8%22%20stroke%3D%22%232357a6%22%20stroke-width%3D%221.4%22%20fill%3D%22none%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E\")}\n.felt i{background:#2357a6;color:#fff}\n.felt i::before{content:\"◆\"}\n.felt em,.felt strong{color:#2357a6}\n.alert .tr{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20700%2060%22%20preserveAspectRatio%3D%22none%22%3E%3Cpolyline%20points%3D%220.0%2C31.3%202.5%2C30.5%205.0%2C28.6%207.5%2C28.2%2010.0%2C29.8%2012.5%2C31.8%2015.0%2C31.0%2017.5%2C29.3%2020.0%2C29.2%2022.5%2C31.0%2025.0%2C30.0%2027.5%2C28.8%2030.0%2C28.5%2032.5%2C28.4%2035.0%2C28.7%2037.5%2C31.7%2040.0%2C29.6%2042.5%2C28.7%2045.0%2C30.0%2047.5%2C31.0%2050.0%2C29.6%2052.5%2C29.6%2055.0%2C30.9%2057.5%2C30.8%2060.0%2C28.2%2062.5%2C31.4%2065.0%2C30.4%2067.5%2C31.6%2070.0%2C32.0%2072.5%2C28.7%2075.0%2C30.9%2077.5%2C31.2%2080.0%2C30.4%2082.5%2C30.5%2085.0%2C30.8%2087.5%2C31.6%2090.0%2C29.6%2092.5%2C29.3%2095.0%2C30.5%2097.5%2C31.6%20100.0%2C28.5%20102.5%2C30.8%20105.0%2C32.0%20107.5%2C31.5%20110.0%2C31.8%20112.5%2C30.5%20115.0%2C30.7%20117.5%2C28.7%20120.0%2C31.7%20122.5%2C30.2%20125.0%2C31.0%20127.5%2C28.2%20130.0%2C29.7%20132.5%2C30.9%20135.0%2C29.0%20137.5%2C31.3%20140.0%2C30.6%20142.5%2C28.1%20145.0%2C29.4%20147.5%2C31.1%20150.0%2C31.7%20152.5%2C29.5%20155.0%2C28.2%20157.5%2C28.9%20160.0%2C30.3%20162.5%2C30.2%20165.0%2C30.2%20167.5%2C31.2%20170.0%2C31.0%20172.5%2C28.0%20175.0%2C30.0%20177.5%2C30.6%20180.0%2C28.0%20182.5%2C31.7%20185.0%2C28.1%20187.5%2C30.6%20190.0%2C31.7%20192.5%2C28.2%20195.0%2C29.2%20197.5%2C30.8%20200.0%2C31.4%20202.5%2C28.8%20205.0%2C28.9%20207.5%2C30.4%20210.0%2C30.6%20212.5%2C29.6%20215.0%2C31.5%20217.5%2C28.2%20220.0%2C30.2%20222.5%2C31.2%20225.0%2C29.4%20227.5%2C30.9%20230.0%2C29.8%20232.5%2C28.7%20235.0%2C31.8%20237.5%2C29.2%20240.0%2C29.1%20242.5%2C30.8%20245.0%2C29.1%20247.5%2C31.6%20250.0%2C32.0%20252.5%2C31.9%20255.0%2C29.5%20257.5%2C30.9%20260.0%2C28.8%20262.5%2C31.0%20265.0%2C30.0%20267.5%2C29.4%20270.0%2C29.4%20272.5%2C30.1%20275.0%2C29.4%20277.5%2C29.4%20280.0%2C30.8%20282.5%2C31.6%20285.0%2C29.9%20287.5%2C28.4%20290.0%2C30.8%20292.5%2C31.9%20295.0%2C31.9%20297.5%2C30.0%20300.0%2C28.4%20302.5%2C30.3%20305.0%2C28.2%20307.5%2C31.9%20310.0%2C29.2%20312.5%2C31.0%20315.0%2C31.1%20317.5%2C31.3%20320.0%2C31.3%20322.5%2C28.6%20325.0%2C28.3%20327.5%2C30.5%20330.0%2C29.4%20332.5%2C29.1%20335.0%2C31.1%20337.5%2C28.4%20340.0%2C28.0%20342.5%2C30.8%20345.0%2C29.2%20347.5%2C30.2%20350.0%2C29.4%20352.5%2C30.1%20355.0%2C31.7%20357.5%2C29.5%20360.0%2C30.0%20362.5%2C31.1%20365.0%2C30.1%20367.5%2C29.8%20370.0%2C30.5%20372.5%2C29.3%20375.0%2C30.8%20377.5%2C30.8%20380.0%2C28.4%20382.5%2C31.3%20385.0%2C29.2%20387.5%2C31.4%20390.0%2C30.0%20392.5%2C29.8%20395.0%2C29.6%20397.5%2C28.7%20400.0%2C28.8%20402.5%2C31.9%20405.0%2C29.2%20407.5%2C28.9%20410.0%2C30.8%20412.5%2C28.3%20415.0%2C31.2%20417.5%2C29.0%20420.0%2C29.4%20422.5%2C29.7%20425.0%2C31.5%20427.5%2C30.8%20430.0%2C29.8%20432.5%2C31.3%20435.0%2C29.6%20437.5%2C30.2%20440.0%2C29.1%20442.5%2C30.1%20445.0%2C31.3%20447.5%2C29.1%20450.0%2C31.6%20452.5%2C30.9%20455.0%2C29.1%20457.5%2C28.5%20460.0%2C29.2%20462.5%2C28.3%20465.0%2C31.7%20467.5%2C30.4%20470.0%2C28.6%20472.5%2C30.2%20475.0%2C29.2%20477.5%2C30.6%20480.0%2C30.5%20482.5%2C30.4%20485.0%2C31.3%20487.5%2C31.4%20490.0%2C28.3%20492.5%2C29.4%20495.0%2C30.5%20497.5%2C30.2%20500.0%2C28.4%20502.5%2C28.7%20505.0%2C28.2%20507.5%2C31.3%20510.0%2C29.9%20512.5%2C28.3%20515.0%2C29.5%20517.5%2C28.3%20520.0%2C29.1%20522.5%2C24.2%20525.0%2C31.8%20527.5%2C14.2%20530.0%2C32.4%20532.5%2C50.6%20535.0%2C24.9%20537.5%2C37.3%20540.0%2C22.2%20542.5%2C27.6%20545.0%2C37.4%20547.5%2C45.8%20550.0%2C37.0%20552.5%2C19.2%20555.0%2C17.9%20557.5%2C45.3%20560.0%2C19.4%20562.5%2C24.6%20565.0%2C29.4%20567.5%2C35.3%20570.0%2C20.6%20572.5%2C39.2%20575.0%2C25.3%20577.5%2C37.9%20580.0%2C18.6%20582.5%2C25.9%20585.0%2C21.9%20587.5%2C37.4%20590.0%2C37.6%20592.5%2C35.1%20595.0%2C25.0%20597.5%2C25.4%20600.0%2C30.9%20602.5%2C38.3%20605.0%2C34.3%20607.5%2C37.4%20610.0%2C33.6%20612.5%2C27.8%20615.0%2C37.2%20617.5%2C31.3%20620.0%2C32.8%20622.5%2C26.7%20625.0%2C29.3%20627.5%2C25.7%20630.0%2C35.5%20632.5%2C29.2%20635.0%2C23.5%20637.5%2C29.3%20640.0%2C31.8%20642.5%2C26.7%20645.0%2C30.8%20647.5%2C32.6%20650.0%2C27.7%20652.5%2C34.4%20655.0%2C32.6%20657.5%2C33.2%20660.0%2C26.2%20662.5%2C27.5%20665.0%2C32.6%20667.5%2C30.3%20670.0%2C26.7%20672.5%2C25.9%20675.0%2C27.5%20677.5%2C25.7%20680.0%2C29.3%20682.5%2C27.5%20685.0%2C32.1%20687.5%2C25.7%20690.0%2C33.2%20692.5%2C27.7%20695.0%2C25.9%20697.5%2C30.5%20700.0%2C31.0%22%20stroke%3D%22%23c4231b%22%20stroke-width%3D%221.4%22%20fill%3D%22none%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E\")}\n.alert i{background:#c4231b;color:#fff;clip-path:polygon(50% 4%,98% 94%,2% 94%);border-radius:0}\n.alert i::before{content:\"!\";padding-top:6px}\n.alert em,.alert strong{color:#c4231b}\n.alert{background:linear-gradient(90deg,transparent 0 120px,rgba(196,35,27,.07) 120px)}\n.offline .tr{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20700%2060%22%20preserveAspectRatio%3D%22none%22%3E%3Cpath%20d%3D%22M0%2030%20H%20420%22%20stroke%3D%22%238f8a80%22%20stroke-width%3D%221.6%22%20stroke-dasharray%3D%226%205%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E\")}\n.offline i{background:#8f8a80;color:#fff}\n.offline i::before{content:\"✕\"}\n.offline strong,.offline em{color:#8f8a80}",
      "props": {
        "c": "object"
      }
    },
    "event": {
      "template": "<section class=\"ev {{e.level}}\"><header><small>{{e.kind}}</small><h2>{{e.title}}</h2></header><dl><div><dt>규모</dt><dd>{{e.magnitude}}</dd></div><div><dt>발생</dt><dd>{{e.time}}</dd></div><div><dt>진원 깊이</dt><dd>{{e.depth}}</dd></div><div><dt>감지 관측소</dt><dd>{{e.stations}}</dd></div></dl><p>{{e.note}}</p></section>",
      "style": ".ev{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:8px;padding:14px 20px;border:2px solid #1d1f24;background:rgba(255,255,255,.55);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1d1f24}\nsmall{font:700 12px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace;letter-spacing:.12em;color:#6b604c}\nh2{margin:2px 0 0;font-size:22px;font-weight:900}\ndl{margin:0;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;align-items:center}\ndiv{border-left:3px solid #1d1f24;padding-left:10px}\ndt{font-size:12px;font-weight:700;color:#6b604c}\ndd{margin:0;font:800 24px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace}\np{margin:0;font-size:14px;font-weight:600}\n.felt div:first-child{border-color:#2357a6}\n.felt div:first-child dd{color:#2357a6}",
      "props": {
        "e": "object"
      }
    },
    "title": {
      "template": "<header class=\"tt\"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;padding:14px 20px;background:#f6f0e1;border:3px double #1d1f24;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1d1f24}\nsmall{font:700 13px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace;letter-spacing:.16em;color:#6b604c}\nh1{margin:0;font-size:36px;font-weight:900;letter-spacing:.04em}\ndiv{display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid #1d1f24;padding-top:6px}\nspan{font-size:15px;font-weight:700}\nb{font:800 26px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace;color:#c4231b}",
      "props": {
        "t": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1d1f24}\ndiv{display:grid;align-content:center;justify-items:center;text-align:center;background:#f6f0e1;border:1px solid #b9ad92}\ndt{font-size:13px;font-weight:700}\ndd{margin:0;font:800 28px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace}\nsmall{font-size:12px;color:#6b604c}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"ky\"><li><i class=\"calm\"></i>평온</li><li><i class=\"felt\">◆</i>감지</li><li><i class=\"alert\">!</i>경보</li><li><i class=\"offline\">✕</i>끊김</li></ul>",
      "style": ".ky{height:100%;box-sizing:border-box;margin:0;padding:0 18px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#f6f0e1;border:1px solid #b9ad92;font:800 14px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1d1f24}\nli{display:flex;align-items:center;gap:8px}\ni{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;box-sizing:border-box;font:900 11px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;font-style:normal;color:#fff}\n.calm{border:2px solid #1d1f24}\n.felt{background:#2357a6}\n.alert{background:#c4231b;clip-path:polygon(50% 4%,98% 94%,2% 94%);border-radius:0;padding-top:5px}\n.offline{background:#8f8a80}"
    },
    "recent": {
      "template": "<section class=\"rc\"><h2>최근 지진 기록</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{when}}</b><span>{{where}}</span><strong>{{magnitude}}</strong></li>{{/items}}</ol></section>",
      "style": ".rc{height:100%;box-sizing:border-box;padding:14px 18px;background:#f6f0e1;border:1px solid #b9ad92;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1d1f24}\nh2{margin:0 0 8px;font-size:17px;font-weight:900}\nol{margin:0;padding:0;list-style:none;display:grid;gap:4px}\nli{display:grid;grid-template-columns:118px 1fr 56px;align-items:center;gap:10px;padding:5px 4px;border-bottom:1px dotted #b9ad92;font-size:14px}\nb{font:700 13px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace}\nstrong{font:800 16px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace;text-align:right}\n.new{background:rgba(35,87,166,.1)}\n.new strong{color:#2357a6}\n.new b::before{content:\"◆ \";color:#2357a6}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "stations": {
      "from": "net",
      "path": "/net/stations",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "a1": {
          "at": "/value/a1"
        },
        "a2": {
          "at": "/value/a2"
        },
        "a3": {
          "at": "/value/a3"
        },
        "a4": {
          "at": "/value/a4"
        },
        "a5": {
          "at": "/value/a5"
        },
        "a6": {
          "at": "/value/a6"
        }
      }
    },
    "event": {
      "from": "net",
      "path": "/net/event",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "value": {}
      }
    },
    "now": {
      "from": "net",
      "path": "/net/now",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "net",
      "path": "/net/figures",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "value": {}
      }
    },
    "recent": {
      "from": "net",
      "path": "/net/recent",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "value": {}
      }
    },
    "week": {
      "from": "net",
      "path": "/net/week",
      "list": "/value",
      "fresh": 120,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "channel-a1": {
      "as": "element",
      "element": "channel",
      "of": "stations",
      "bind": {
        "c": "a1"
      }
    },
    "channel-a2": {
      "as": "element",
      "element": "channel",
      "of": "stations",
      "bind": {
        "c": "a2"
      }
    },
    "channel-a3": {
      "as": "element",
      "element": "channel",
      "of": "stations",
      "bind": {
        "c": "a3"
      }
    },
    "channel-a4": {
      "as": "element",
      "element": "channel",
      "of": "stations",
      "bind": {
        "c": "a4"
      }
    },
    "channel-a5": {
      "as": "element",
      "element": "channel",
      "of": "stations",
      "bind": {
        "c": "a5"
      }
    },
    "channel-a6": {
      "as": "element",
      "element": "channel",
      "of": "stations",
      "bind": {
        "c": "a6"
      }
    },
    "event": {
      "as": "element",
      "element": "event",
      "of": "event",
      "bind": {
        "e": "value"
      }
    },
    "title": {
      "as": "element",
      "element": "title",
      "of": "now",
      "bind": {
        "t": "value"
      }
    },
    "figures": {
      "as": "element",
      "element": "figures",
      "of": "figures",
      "bind": {
        "items": "value"
      }
    },
    "legend": {
      "as": "element",
      "element": "legend"
    },
    "recent": {
      "as": "element",
      "element": "recent",
      "of": "recent",
      "bind": {
        "items": "value"
      }
    },
    "week": {
      "as": "chart.bar",
      "of": "week",
      "title": "이번 주 감지한 지진 (건)",
      "x": "day",
      "y": "events",
      "series": [
        {
          "label": "감지",
          "color": "#2357a6"
        }
      ]
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      1000
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%234b4a47%22%2F%3E%0A%3Crect%20x%3D%2224%22%20y%3D%2224%22%20width%3D%22992%22%20height%3D%22952%22%20fill%3D%22%23f6f0e1%22%2F%3E%0A%3Cpath%20d%3D%22M24%2040%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%2060%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%2080%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20100%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20120%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20140%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20160%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20180%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20200%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20220%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20240%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20260%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20280%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20300%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20320%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20340%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20360%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20380%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20400%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20420%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20440%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20460%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20480%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20500%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20520%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20540%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20560%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20580%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20600%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20620%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20640%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20660%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20680%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20700%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20720%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20740%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20760%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20780%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20800%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20820%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20840%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20860%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20880%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20900%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20920%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20940%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M24%20960%20H%201016%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%0A%3Cpath%20d%3D%22M160%20110%20V%20740%22%20stroke%3D%22%23cdbd98%22%20stroke-width%3D%221.6%22%2F%3E%3Ctext%20x%3D%22160%22%20y%3D%22100%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2213%22%20fill%3D%22%237d6f55%22%20text-anchor%3D%22middle%22%3E14%3A26%3C%2Ftext%3E%3Cpath%20d%3D%22M231%20110%20V%20740%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22231%22%20y%3D%22100%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2213%22%20fill%3D%22%237d6f55%22%20text-anchor%3D%22middle%22%3E14%3A27%3C%2Ftext%3E%3Cpath%20d%3D%22M302%20110%20V%20740%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22302%22%20y%3D%22100%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2213%22%20fill%3D%22%237d6f55%22%20text-anchor%3D%22middle%22%3E14%3A28%3C%2Ftext%3E%3Cpath%20d%3D%22M373%20110%20V%20740%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22373%22%20y%3D%22100%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2213%22%20fill%3D%22%237d6f55%22%20text-anchor%3D%22middle%22%3E14%3A29%3C%2Ftext%3E%3Cpath%20d%3D%22M444%20110%20V%20740%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22444%22%20y%3D%22100%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2213%22%20fill%3D%22%237d6f55%22%20text-anchor%3D%22middle%22%3E14%3A30%3C%2Ftext%3E%3Cpath%20d%3D%22M515%20110%20V%20740%22%20stroke%3D%22%23cdbd98%22%20stroke-width%3D%221.6%22%2F%3E%3Ctext%20x%3D%22515%22%20y%3D%22100%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2213%22%20fill%3D%22%237d6f55%22%20text-anchor%3D%22middle%22%3E14%3A31%3C%2Ftext%3E%3Cpath%20d%3D%22M586%20110%20V%20740%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22586%22%20y%3D%22100%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2213%22%20fill%3D%22%237d6f55%22%20text-anchor%3D%22middle%22%3E14%3A32%3C%2Ftext%3E%3Cpath%20d%3D%22M657%20110%20V%20740%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22657%22%20y%3D%22100%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2213%22%20fill%3D%22%237d6f55%22%20text-anchor%3D%22middle%22%3E14%3A33%3C%2Ftext%3E%3Cpath%20d%3D%22M728%20110%20V%20740%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22728%22%20y%3D%22100%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2213%22%20fill%3D%22%237d6f55%22%20text-anchor%3D%22middle%22%3E14%3A34%3C%2Ftext%3E%3Cpath%20d%3D%22M799%20110%20V%20740%22%20stroke%3D%22%23e2d6bb%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22799%22%20y%3D%22100%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2213%22%20fill%3D%22%237d6f55%22%20text-anchor%3D%22middle%22%3E14%3A35%3C%2Ftext%3E%3Cpath%20d%3D%22M870%20110%20V%20740%22%20stroke%3D%22%23cdbd98%22%20stroke-width%3D%221.6%22%2F%3E%3Ctext%20x%3D%22870%22%20y%3D%22100%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2213%22%20fill%3D%22%23c4231b%22%20text-anchor%3D%22middle%22%3E14%3A36%20%E2%96%BC%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M34%2024%20V%20976%22%20stroke%3D%22%23d2554a%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22160%22%20y%3D%2266%22%20font-family%3D%22Malgun%20Gothic%2C%20sans-serif%22%20font-weight%3D%22800%22%20font-size%3D%2220%22%20fill%3D%22%235e5340%22%20letter-spacing%3D%222%22%3E%EA%B8%B0%EB%A1%9D%20%E2%80%94%20%EC%B5%9C%EA%B7%BC%2010%EB%B6%84%3C%2Ftext%3E%0A%3Crect%20x%3D%221032%22%20y%3D%2224%22%20width%3D%22544%22%20height%3D%22952%22%20fill%3D%22%233d3c39%22%2F%3E%0A%3Crect%20x%3D%221040%22%20y%3D%22652%22%20width%3D%22528%22%20height%3D%22316%22%20rx%3D%223%22%20fill%3D%22%23f6f0e1%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "channel-a1": [
        40,
        116,
        960,
        92
      ],
      "channel-a2": [
        40,
        220,
        960,
        92
      ],
      "channel-a3": [
        40,
        324,
        960,
        92
      ],
      "channel-a4": [
        40,
        428,
        960,
        92
      ],
      "channel-a5": [
        40,
        532,
        960,
        92
      ],
      "channel-a6": [
        40,
        636,
        960,
        92
      ],
      "event": [
        40,
        762,
        960,
        196
      ],
      "title": [
        1040,
        36,
        528,
        160
      ],
      "figures": [
        1040,
        210,
        528,
        106
      ],
      "legend": [
        1040,
        330,
        528,
        50
      ],
      "recent": [
        1040,
        394,
        528,
        244
      ],
      "week": [
        1050,
        664,
        508,
        294
      ]
    }
  }
};

export const quakeHelicorder: SamplePack = {
  id: "quake-helicorder",
  title: {
    "ko": "지진 관측망 — 드럼 기록지",
    "en": "A seismic network — a drum recorder’s paper"
  },
  field: {
    "ko": "지진 관측",
    "en": "Seismic monitoring"
  },
  kind: {
    "ko": "관측소 진동·지진 기록·감지 건수",
    "en": "Station shaking, events and detections"
  },
  domain: "environment",
  styles: [
    "print"
  ],
  summary: {
    "ko": "지진 관측망을 드럼 기록지로 — 분 단위 눈금이 그어진 크림색 기록지, 빨간 여백선, 그리고 관측소마다 기록지를 가로지르는 채널 하나와 기록계가 지금 그리는 대로 잉크로 그은 파형. 채널 상태는 잉크 색과 함께 파형 자체로: 평온하면 가는 잔떨림, 무언가를 감지하면 파랗게 부푸는 흔들림, 경보 수준을 넘으면 빨간 폭발, 보고가 끊기면 회색 점선 — 끝에는 기호(빈 원 · ◆ · ! 세모 · ✕). 아래에 관측망이 골라낸 지진, 오른쪽에 기록지 머리에 찍은 관측망 이름, 지금 수치, 범례, 최근 지진 기록, 이번 주 감지 건수. 관측망과 관측소는 지어낸 것이라 예시 데이터입니다.",
    "en": "A seismic network drawn as a drum recorder’s paper — cream chart paper ruled by the minute, a red margin, and every station a channel across it with its trace inked as the recorder draws it now. A channel tells its state by the trace itself as well as by its ink: a fine tremor when quiet, a swelling wiggle in blue when it felt something, a burst in red when it crossed its alert level, a dashed grey line when it stopped reporting — and by a sign at its end (an empty ring, a diamond, a triangle, a cross). Below, the event the network picked out; on the right the network’s name stamped on the paper’s header, the figures now, the key, the recent events and the detections through the week. The network and its stations are made up. Example data."
  },
  connectors: [
    {
      "key": "net",
      "name": "예시 지진 관측망 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 관측망·지진이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
