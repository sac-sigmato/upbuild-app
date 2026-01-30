import { useUserStore } from "@/store/useUserStore";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AppUserHeader() {
  const router = useRouter();
  const { user } = useUserStore();

  if (!user) return null;

  const mobile = user.contactNumber || user.phone || user.mobile || "";

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.subText}>
          {user.roleName?.toUpperCase() || "User"}
          {mobile ? ` • ${mobile}` : ""}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.push("/profile")}
        style={styles.viewBtn}
      >
        <Text style={styles.viewText}>View</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textTransform: "capitalize",
  },
  subText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  viewBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#1eb88c",
  },
  viewText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
