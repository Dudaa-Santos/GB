import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

// util: yyyy-mm-dd
const toISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// domingo como início da semana
const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0..6
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const PT_WEEK = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

/**
 * props:
 * - referenceDate (Date | string ISO) -> qualquer dia dessa semana
 * - selectedISO (string ISO) -> data que ficará “ativa” (pílula cheia)
 * - dotsISO (string[]) -> datas com consultas (mostra pontinho)
 */
export default function WeekPillStatic({
  referenceDate = new Date(),
  selectedISO,
  dotsISO = [],
}) {
  const week = useMemo(() => {
    const start = startOfWeek(new Date(referenceDate));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = toISO(d);
      return {
        iso,
        weekLabel: PT_WEEK[i],
        dayNumber: d.getDate(),
        monthLabel: d.toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        }),
      };
    });
  }, [referenceDate]);

  // título (mês/ano) pegando o dia do meio da semana
  const monthTitle = week[3].monthLabel.toUpperCase();

  return (
    <View style={styles.container}>
      <Text style={styles.monthTitle}>{monthTitle}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        // é estático; não há interações
      >
        {week.map((d) => {
          const isSelected = selectedISO === d.iso;
          const hasDot = dotsISO.includes(d.iso);

          return (
            <View
              key={d.iso}
              style={[
                styles.pill,
                isSelected ? styles.pillSelected : styles.pillDefault,
              ]}
            >
              <Text
                style={[
                  styles.weekLabel,
                  isSelected && styles.weekLabelSelected,
                ]}
              >
                {d.weekLabel}
              </Text>

              {hasDot && <View style={styles.dot} />}

              <Text
                style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                ]}
              >
                {d.dayNumber}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const PILL_W = 46;      // << largura da pílula
const PILL_H = 82;     // << altura da pílula
const PILL_RADIUS = 28; // << raio (oval)

const styles = StyleSheet.create({
  container: {
    width: 350,
    backgroundColor: "#FFFCF4", 
    alignItems: "center", // fundo claro
  },
  monthTitle: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    letterSpacing: 1,
  },
  row: {
    gap:4,
  },
  pill: {
    width: PILL_W,
    height: PILL_H,
    borderRadius: PILL_RADIUS,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  pillDefault: {
    backgroundColor: "transparent",
    borderColor: "#8B8B8B",
  },
  pillSelected: {
    backgroundColor: "#0B7A5A",
    borderColor: "#0B7A5A",
  },
  weekLabel: {
    fontSize: 14,
    color: "#6B6B6B",
    marginBottom: 6,
    fontWeight: "600",
  },
  weekLabelSelected: {
    color: "#E9FFF7",
  },
  dayNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#3B3B3B",
    marginTop: 2,
  },
  dayNumberSelected: {
    color: "#FFFFFF",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#595959",
    marginBottom: 6,
  },
});
