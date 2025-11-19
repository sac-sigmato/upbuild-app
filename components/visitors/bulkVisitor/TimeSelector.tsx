// components/TimeSelector.tsx
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  time: string; // "02:30 PM"
  setTime: (val: string) => void;
};

export function TimeSelector({ label, time, setTime }: Props) {
  const [hour, setHour] = useState<string>("");
  const [minute, setMinute] = useState<string>("");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  // Prefill from existing `time` like "02:30 PM"
  useEffect(() => {
    if (time) {
      const match = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
      if (match) {
        const h = match[1].padStart(2, "0");
        const m = match[2];
        const p = (match[3] || "AM").toUpperCase() as "AM" | "PM";
        setHour(h);
        setMinute(m);
        setPeriod(p);
      }
    } else {
      // Reset when empty
      setHour("");
      setMinute("");
      setPeriod("AM");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time]);

  // When dropdowns change, update the final string
  useEffect(() => {
    if (hour && minute && period) {
      // normalize hour to two digits
      const hh = hour.padStart(2, "0");
      const mm = minute.padStart(2, "0");
      setTime(`${hh}:${mm} ${period}`);
    } else {
      // if incomplete, clear time so parent knows it's incomplete
      setTime("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour, minute, period]);

  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const minutes = ["00", "15", "30", "45"];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.row}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={hour}
            onValueChange={(v) => setHour(String(v))}
            mode={Platform.OS === "ios" ? "dialog" : "dropdown"}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="HH" value="" />
            {hours.map((h) => (
              <Picker.Item key={h} label={h} value={h} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={minute}
            onValueChange={(v) => setMinute(String(v))}
            mode={Platform.OS === "ios" ? "dialog" : "dropdown"}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="MM" value="" />
            {minutes.map((m) => (
              <Picker.Item key={m} label={m} value={m} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={period}
            onValueChange={(v) => setPeriod(v as "AM" | "PM")}
            mode={Platform.OS === "ios" ? "dialog" : "dropdown"}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="AM" value="AM" />
            <Picker.Item label="PM" value="PM" />
          </Picker>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { fontSize: 13, color: "#374151", marginBottom: 6, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
    height: 44,
    justifyContent: "center",
  },
  picker: {
    height: 44,
    // width auto expands
  },
  pickerItem: {
    height: 44,
  },
});
