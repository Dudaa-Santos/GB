import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";

/* ---------- helpers ---------- */
const toISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const fromISO = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0..6 (domingo)
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
const PT_WEEK = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const monthLabelPT = (d) =>
  d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase();

/** semanas completas que cobrem o mês */
function buildWeeksForMonth(anchor) {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const lastOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const gridStart = startOfWeek(firstOfMonth);
  const gridEnd = addDays(startOfWeek(addDays(lastOfMonth, 6)), 6);

  const weeks = [];
  let cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        date: new Date(cursor),
        iso: toISO(cursor),
        inMonth: cursor.getMonth() === anchor.getMonth(),
        dow: cursor.getDay(), // 0..6
      });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/* ---------- componente ---------- */
export default function CalendarioSemanalSelecionado({
  selectedISO: controlledISO,
  onChange,
  initialMonth = new Date(),
  holidaysISO = [],
  dotsISO = [],
  highlightToday = true,

  // extras
  disableWeekends = true,           // desabilita sáb/dom
  sidePadding = 12,                 // respiro nas laterais
  title = "Selecione a data",       // texto à esquerda
}) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(initialMonth);
    d.setDate(1);
    return d;
  });
  const [internalISO, setInternalISO] = useState(() => toISO(new Date()));
  const selectedISO = controlledISO ?? internalISO;

  const todayISO = useMemo(() => toISO(new Date()), []);
  const weeks = useMemo(() => buildWeeksForMonth(viewMonth), [viewMonth]);

  const listRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(350);

  useEffect(() => {
    // mantém visível a semana do dia selecionado ao trocar de mês
    const selectedDate = fromISO(selectedISO);
    const sameMonth =
      selectedDate.getFullYear() === viewMonth.getFullYear() &&
      selectedDate.getMonth() === viewMonth.getMonth();

    const idx = sameMonth
      ? weeks.findIndex((w) => w.some((d) => d.iso === selectedISO))
      : 0;

    if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, animated: false });
  }, [viewMonth, selectedISO, weeks]);

  const select = (iso) => {
    if (!controlledISO) setInternalISO(iso);
    onChange?.(iso);
  };

  const goPrevMonth = () => {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() - 1, 1);
    setViewMonth(d);
  };
  const goNextMonth = () => {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() + 1, 1);
    setViewMonth(d);
  };

  const GAP = 6; // espaçamento fixo entre pílulas

  const renderWeek = ({ item: week }) => {
    // largura ajustada pra caber 7 pílulas
    const maxPerPill = Math.floor(
      (containerWidth - sidePadding * 2 - GAP * 6) / 7
    );
    const pillW = Math.min(PILL_W, Math.max(38, maxPerPill));

    return (
      <View style={[styles.row, { width: containerWidth, paddingHorizontal: sidePadding }]}>
        {week.map((d, idx) => {
          const isToday = d.iso === todayISO;
          const isSelected = selectedISO ? selectedISO === d.iso : highlightToday && isToday;

          const isHoliday = holidaysISO.includes(d.iso);
          const isWeekend = d.dow === 0 || d.dow === 6;
          const disabled = isHoliday || (disableWeekends && isWeekend);

          const isOut = !d.inMonth;
          const hasDot = dotsISO.includes(d.iso);

          return (
            <Pressable
              key={d.iso}
              disabled={disabled}
              onPress={() => {
                if (!d.inMonth) {
                  const newMonth = new Date(d.date.getFullYear(), d.date.getMonth(), 1);
                  setViewMonth(newMonth);
                }
                select(d.iso);
              }}
              style={[
                styles.pill,
                { width: pillW, marginRight: idx < 6 ? GAP : 0 },
                isSelected ? styles.pillSelected : styles.pillDefault,
                isOut && !isSelected && { opacity: 0.35 },

                // ✅ cor diferente quando está desabilitado por ser fim de semana
                disabled && !isSelected && (isWeekend ? styles.weekendDisabled : styles.pillDisabled),
              ]}
            >
              <Text
                style={[
                  styles.weekLabel,
                  isSelected && styles.weekLabelSelected,
                  disabled && !isSelected && styles.textMuted,
                ]}
              >
                {PT_WEEK[d.dow]}
              </Text>

              {hasDot && <View style={[styles.dot, isSelected && styles.dotSelected]} />}

              <Text
                style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                  disabled && !isSelected && styles.textMuted,
                ]}
              >
                {d.date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const getItemLayout = (_data, index) => ({
    length: containerWidth,
    offset: containerWidth * index,
    index,
  });

  return (
    <View
      style={[styles.container, { paddingVertical: 8 }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* linha: "Selecione a data" + mês e setas */}
      <View style={[styles.header, { paddingHorizontal: sidePadding }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.monthNavInline}>
            <Text onPress={goPrevMonth} style={styles.chevron}>{'\u2039'}</Text>
            <Text style={styles.monthTitle}>{monthLabelPT(viewMonth)}</Text>
            <Text onPress={goNextMonth} style={styles.chevron}>{'\u203A'}</Text>
          </View>
        </View>
      </View>

      {/* semanas paginadas */}
      <FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={weeks}
        renderItem={renderWeek}
        keyExtractor={(_item, i) => `week-${i}`}
        getItemLayout={getItemLayout}
      />
    </View>
  );
}

/* ---------- estilos ---------- */
const PILL_W = 46;
const PILL_H = 82;
const PILL_RADIUS = 28;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#FFFCF4",
    borderRadius: 12,
    alignSelf: "center",
  },

  header: {
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  monthNavInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    letterSpacing: 1,
  },
  chevron: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0B7A5A",
    paddingHorizontal: 4,
  },

  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },

  pill: {
    height: PILL_H,
    borderRadius: PILL_RADIUS,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  pillDefault: { backgroundColor: "transparent", borderColor: "#8B8B8B" },
  pillSelected: { backgroundColor: "#0B7A5A", borderColor: "#0B7A5A" },

  // desabilitado "normal" (ex: feriado)
  pillDisabled: { borderColor: "#C7C7C7", backgroundColor: "transparent" },

  // ✅ desabilitado por ser fim de semana
  weekendDisabled: {
    borderColor: "#616161",     // borda laranja suave
    backgroundColor: "#B1B1B1", // fundo pêssego claro
  },

  weekLabel: { fontSize: 12, color: "#6B6B6B", marginBottom: 6, fontWeight: "700" },
  weekLabelSelected: { color: "#E9FFF7" },
  dayNumber: { fontSize: 20, fontWeight: "800", color: "#3B3B3B", marginTop: 2 },
  dayNumberSelected: { color: "#FFFFFF" },
  textMuted: { color: "#9B9B9B" },

  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#595959", marginBottom: 6 },
  dotSelected: { backgroundColor: "#E9FFF7" },
});
