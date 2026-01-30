import { useUserStore } from "@/store/useUserStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
        Alert,
        Platform,
        StyleSheet,
        Text,
        ToastAndroid,
        TouchableOpacity,
        View,
} from "react-native";
export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useUserStore();

  if (!user) return null;

  // ✅ FORCE STRING VALUES (CRITICAL FIX)
  const name = String(user.name ?? "-");
  const email = String(user.email ?? "-");
  const role = String(user.roleName ?? "User");
  const mobile = String(user.contactNumber ?? user.phone ?? user.mobile ?? "-");

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();

          // Optional extra safety
          await AsyncStorage.clear();

          if (Platform.OS === "android") {
            ToastAndroid.show("Logged out successfully", ToastAndroid.SHORT);
          } else {
            Alert.alert("Success", "Logged out successfully");
          }

          router.replace("/"); // 👈 Login / SignIn screen
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 🔙 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1eb88c" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profile</Text>

        {/* spacer */}
        <View style={{ width: 24 }} />
      </View>

      {/* CARD */}
      <View style={styles.card}>
        <ProfileRow label="Name" value={name} />
        <ProfileRow label="Email" value={email} />
        <ProfileRow label="Mobile" value={mobile} />
        <ProfileRow label="Role" value={role} />
      </View>

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6f7",
    padding: 16,
    marginTop: 40,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#1eb88c",
  },

  /* CARD */
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },

  row: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginTop: 2,
  },

  /* LOGOUT */
  logoutBtn: {
    marginTop: 24,
    backgroundColor: "#DC2626",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
