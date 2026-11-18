import { useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import {
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type MouseHandlerDataParam,
  type TooltipContentProps,
} from "recharts";
import { ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDayLong, formatDayShort } from "@/components/calendar/monthGrid";
import {
  getZoomedView,
  normalizeZoomRange,
  zoomFromDates,
  Y_TICK_COUNT,
  type DailyCashflow,
  type ZoomRange,
} from "@/features/dashboard";
import { formatPLN } from "@/features/transactions";
import { cn } from "@/lib/utils";

const SERIES = [
  { key: "income", label: "Przychody", color: "var(--chart-income)" },
  { key: "expense", label: "Wydatki", color: "var(--chart-expense)" },
] as const;

const compact = new Intl.NumberFormat("pl-PL", { notation: "compact", maximumFractionDigits: 1 });
const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 };
/** Dzień miesiąca z daty YYYY-MM-DD — etykieta osi X. */
const dayOf = (iso: string) => String(Number(iso.slice(8, 10)));
/** Minimalny ruch myszy (px), od którego przeciągnięcie jest zaznaczeniem, a nie kliknięciem. */
const MIN_DRAG_PX = 4;
/** Jak długo po dotyku (ms) ignorować zdarzenia myszy emulowane przez przeglądarkę. */
const TOUCH_MOUSE_GUARD_MS = 800;
/** Szerokość (px) potrzebna na etykietę dnia osi X (dwie cyfry 12 px + odstęp). */
const MIN_PX_PER_DAY_LABEL = 20;
/** Przybliżona szerokość osi Y (px) — odejmowana od szerokości wykresu przy liczeniu miejsca na etykiety. */
const Y_AXIS_PX = 48;

function CashflowTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as DailyCashflow | undefined;
  if (!active || !point) return null;
  return (
    <div className="grid gap-1.5 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-medium first-letter:uppercase">{formatDayLong(point.date)}</p>
      {SERIES.map((s) => (
        <p key={s.key} className="flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
          <span className="text-muted-foreground">{s.label}</span>
          <span className="ml-auto pl-3 font-medium tabular-nums">{formatPLN(point[s.key])}</span>
        </p>
      ))}
    </div>
  );
}

/** Uchwyt suwaka zakresu w kolorach motywu (domyślny Recharts ma białe linie na sztywno). */
function BrushHandle({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  const mid = x + width / 2;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={3} fill="var(--background)" stroke="var(--muted-foreground)" />
      <line x1={mid} x2={mid} y1={y + height / 3} y2={y + (height * 2) / 3} stroke="var(--muted-foreground)" />
    </g>
  );
}

interface Selection {
  /** Daty YYYY-MM-DD dnia, od którego zaczęto przeciągać, i dnia pod kursorem. */
  from: string;
  to: string;
  startX: number;
  lastX: number;
}

/**
 * Wykres słupkowy: przychody i wydatki dla każdego dnia cyklu.
 * Powiększanie: przeciągnięcie myszą po wykresie albo suwak zakresu pod nim (działa też dotykiem).
 */
export function CashflowChart({ data }: { data: readonly DailyCashflow[] }) {
  const headingId = useId();
  const activeDays = data.filter((d) => d.income > 0 || d.expense > 0);

  // Powiększenie jest przypięte do konkretnych danych: nowe dane (inne operacje, nowy cykl) = reset.
  const [zoomState, setZoomState] = useState<{ data: readonly DailyCashflow[]; range: ZoomRange } | null>(null);
  const zoom = zoomState?.data === data ? zoomState.range : null;
  const setZoom = (range: ZoomRange | null) => setZoomState(range ? { data, range } : null);
  const view = getZoomedView(data, zoom);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  // Po powiększeniu etykieta przy każdym dniu — o ile się mieszczą (wąski telefon i długi zakres: jak bez powiększenia).
  const showEveryDay =
    view.isZoomed && (chartWidth - Y_AXIS_PX) / Math.max(1, view.data.length) >= MIN_PX_PER_DAY_LABEL;

  // Zaznaczenie myszą. Ref, bo `mouseup` (także poza wykresem) musi widzieć bieżący stan od razu,
  // a nasłuch jest podpinany synchronicznie w mousedown — szybkie kliknięcie nie może go wyprzedzić.
  const selectionRef = useRef<Selection | null>(null);
  const endSelectionRef = useRef<(() => void) | null>(null);
  // Przeglądarki dotykowe po stuknięciu emulują mousedown/mouseup — to nie jest przeciąganie myszą.
  const lastTouchRef = useRef(0);
  useEffect(() => () => endSelectionRef.current?.(), []);

  const updateSelection = (next: Selection | null) => {
    selectionRef.current = next;
    setSelection(next);
  };

  const onMouseDown = (state: MouseHandlerDataParam, e: ReactMouseEvent) => {
    if (e.button !== 0 || state.activeLabel == null) return;
    if (Date.now() - lastTouchRef.current < TOUCH_MOUSE_GUARD_MS) return;
    e.preventDefault(); // bez zaznaczania tekstu strony podczas przeciągania
    const date = String(state.activeLabel);
    updateSelection({ from: date, to: date, startX: e.clientX, lastX: e.clientX });

    endSelectionRef.current?.();
    const finish = (up: MouseEvent) => {
      const sel = selectionRef.current;
      stop();
      updateSelection(null);
      // Kliknięcie bez przeciągania tylko pokazuje tooltip.
      if (!sel || Math.abs(up.clientX - sel.startX) < MIN_DRAG_PX) return;
      const range = zoomFromDates(data, sel.from, sel.to);
      setZoomState(range ? { data, range } : null);
    };
    const stop = () => {
      window.removeEventListener("mouseup", finish);
      endSelectionRef.current = null;
    };
    window.addEventListener("mouseup", finish);
    endSelectionRef.current = stop;
  };
  const onMouseMove = (state: MouseHandlerDataParam, e: ReactMouseEvent) => {
    const sel = selectionRef.current;
    if (!sel || state.activeLabel == null) return;
    updateSelection({ ...sel, to: String(state.activeLabel), lastX: e.clientX });
  };

  const isSelecting = selection != null && Math.abs(selection.lastX - selection.startX) >= MIN_DRAG_PX;
  const [areaStart, areaEnd] =
    selection && selection.from > selection.to ? [selection.to, selection.from] : [selection?.from, selection?.to];

  const first = view.data[0];
  const last = view.data[view.data.length - 1];
  const brushLabel = first && last ? `Zakres dni na wykresie: od ${formatDayShort(first.date)} do ${formatDayShort(last.date)}` : undefined;

  return (
    <section aria-labelledby={headingId} className="grid min-w-0 gap-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h3 id={headingId} className="font-medium">
          Przychody i wydatki
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <ul aria-hidden="true" className="flex gap-3 text-xs text-muted-foreground">
            {SERIES.map((s) => (
              <li key={s.key} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                {s.label}
              </li>
            ))}
          </ul>
          {/* Na ekranach dotykowych przycisk jest wyższy (pointer-coarse) — tam jego miejsce jest stałe (invisible),
              żeby pojawienie się przycisku nie przesuwało wykresu i suwaka pod palcem. Przy myszy ma wysokość
              nagłówka, więc bez powiększenia jest po prostu ukryty i nie zabiera miejsca legendzie. */}
          <Button
            variant="outline"
            size="xs"
            className={cn(!view.isZoomed && "invisible pointer-fine:hidden")}
            onClick={() => setZoom(null)}
          >
            <ZoomOut aria-hidden="true" />
            Resetuj powiększenie
          </Button>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="h-56 sm:h-64"
        onTouchStart={() => {
          lastTouchRef.current = Date.now();
        }}
      >
        <ResponsiveContainer width="100%" height="100%" onResize={(width) => setChartWidth(width)}>
          <BarChart
            data={view.data}
            margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
            barGap={2}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickFormatter={dayOf}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              // Po powiększeniu każdy dzień zakresu ma etykietę; bez powiększenia — jak dotąd.
              interval={showEveryDay ? 0 : "preserveStartEnd"}
              minTickGap={8}
            />
            <YAxis
              width="auto"
              domain={view.yDomain}
              tickCount={Y_TICK_COUNT}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => compact.format(v)}
            />
            <Tooltip cursor={{ fill: "var(--muted)" }} content={CashflowTooltip} />
            {SERIES.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={14}
              />
            ))}
            {isSelecting && areaStart && areaEnd && (
              <ReferenceArea
                x1={areaStart}
                x2={areaEnd}
                fill="var(--muted-foreground)"
                fillOpacity={0.15}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.4}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {data.length > 1 && (
        <div className="h-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data as DailyCashflow[]} margin={{ top: 0, right: 16, bottom: 0, left: 16 }}>
              <Brush
                dataKey="date"
                height={32}
                travellerWidth={10}
                startIndex={view.startIndex}
                endIndex={view.endIndex}
                onChange={({ startIndex, endIndex }) =>
                  setZoom(normalizeZoomRange(startIndex, endIndex, data.length))
                }
                tickFormatter={dayOf}
                ariaLabel={brushLabel}
                // Ramka tła suwaka w kolorze obramowań kart (Recharts daje jej kolor `stroke`).
                className="text-xs [&>rect:first-of-type]:stroke-border"
                fill="var(--card)"
                stroke="var(--muted-foreground)"
                traveller={BrushHandle}
              >
                <BarChart>
                  {SERIES.map((s) => (
                    <Bar key={s.key} dataKey={s.key} fill={s.color} fillOpacity={0.5} isAnimationActive={false} />
                  ))}
                </BarChart>
              </Brush>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Ten sam zestaw danych w formie tabeli dla czytników ekranu. Tabela w div.sr-only — sama tabela
          nie respektuje width: 1px i rozpychała stronę na telefonie (poziome przewijanie). */}
      <div className="sr-only">
        <table>
          <caption>Przychody i wydatki w dniach cyklu, w których były operacje</caption>
          <thead>
            <tr>
              <th scope="col">Dzień</th>
              <th scope="col">Przychody</th>
              <th scope="col">Wydatki</th>
            </tr>
          </thead>
          <tbody>
            {activeDays.map((d) => (
              <tr key={d.date}>
                <th scope="row">{formatDayShort(d.date)}</th>
                <td>{formatPLN(d.income)}</td>
                <td>{formatPLN(d.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
