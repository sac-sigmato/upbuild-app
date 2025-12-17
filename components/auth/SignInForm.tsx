import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
// import your zustand / store hook — adjust path
import { socketInstance } from "@/sockets/socketInstance";
import { useRouter } from "expo-router";
import { useUserStore } from "../../store/useUserStore";
import { api_url } from "../../utils/apiLocalhost";
const SignInForm = () => {
  const router = useRouter();
  const navigation = useNavigation();
  // depending on how your store works:
  const { setUser } = useUserStore();
  const [user, setLocalUser] = useState({} as any);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null
  );
  const [otpWindow, setOtpWindow] = useState<number | null>(null);

  const toast = (msg: string) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert("", msg);
  };

  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      Alert.alert("Error", "Please enter your phone or email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${api_url}apartment/user/generate-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      // feedback
      toast("OTP sent successfully!");
      setOtpSent(true);
      setRemainingAttempts(data.remainingAttempts ?? null);

      // Extract OTP window in minutes (attemptWindow may be string)
      if (data.attemptWindow) {
        const minutes = parseFloat(data.attemptWindow as any);
        setOtpWindow(!isNaN(minutes) ? minutes : null);
      }
    } catch (err: any) {
      // Example: server could return "OTP limit reached" in message
      if (err?.message?.includes?.("OTP limit reached")) {
        Alert.alert("Error", err.message);
      } else {
        Alert.alert("Error", err.message || "Something went wrong.");
      }
      setRemainingAttempts(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndLogin = async () => {
    if (!otp.trim()) {
      Alert.alert("Error", "Please enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${api_url}apartment/user/login/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP login failed");

      // CASE 1: Approved user with token and userDetails
      if (
        data.token &&
        data.userDetails &&
        data.userDetails.isApproved !== false
      ) {
        // store token
        await AsyncStorage.setItem("token", data.token);

        if (data.userDetails.roles?.length === 1) {
          const role = data.userDetails.roles[0];
          const userObj = {
            _id: data.userDetails._id,
            name: data.userDetails.name,
            email: data.userDetails.email,
            userType: role.roleId,
            roleName: role.slug,
            apartment: role.apartmentId,
            flat: role.flatId,
          };

          // update global store
          try {
            if (typeof setUser === "function") setUser(userObj);
          } catch (e) {
            // ignore if store shape differs
          }
          setLocalUser(userObj);
         
          

          // toast("Logged in successfully!");
          // navigate to dashboard
          // adjust route name as per your navigator
          // cast to any to satisfy router typing for dynamic/unlisted routes
          // router.push("/visitors" as any);
        } else {
          // multiple roles -> save pending and navigate to role select
          await AsyncStorage.setItem(
            "pendingUser",
            JSON.stringify(data.userDetails)
          );
          navigation.navigate("SelectRole" as never);
        }

        // CASE 2: Unapproved user
      } else if (data.userDetails && data.userDetails.isApproved === false) {
        // still may have token — store if present
        if (data.token) await AsyncStorage.setItem("token", data.token);

        const unapproved = {
          _id: data.userDetails._id,
          name: "Unapproved User",
          email: data.userDetails.email || "",
          contactNumber: data.userDetails.contactNumber,
        };

        try {
          if (typeof setUser === "function") setUser(unapproved);
        } catch (e) {}

        setLocalUser(unapproved);
        toast("OTP verified! Awaiting approval.");
        navigation.navigate("SelectState" as never);
      } else {
        // fallback
        toast("Login succeeded but response shape unexpected.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!identifier || !password) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${api_url}apartment/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");

      // store token
      if (data.token) await AsyncStorage.setItem("token", data.token);

      if (data.userDetails.roles?.length === 1) {
        const role = data.userDetails.roles[0];
        const userObj = {
          _id: data.userDetails._id,
          name: data.userDetails.name,
          email: data.userDetails.email,
          userType: role.roleId,
          roleName: role.slug,
          apartment: role.apartmentId,
          flat: role.flatId,
        };

        try {
          if (typeof setUser === "function") setUser(userObj);
        } catch (e) {}

        setLocalUser(userObj);
        toast("Logged in Successfully!");
         socketInstance.emit("register-user", {
           userId: userObj._id,
           apartmentId: userObj.apartment,
           userType: userObj.userType, // owner or tenant or occupant
         });
         console.log("Socket emitted");
        router.push("/visitors" as any);
      } else {
        await AsyncStorage.setItem(
          "pendingUser",
          JSON.stringify(data.userDetails)
        );
        navigation.navigate("SelectRole" as never);
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/LOGO.png")} // adjust path
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Back button */}
      {(otpSent || showPasswordField) && (
        <TouchableOpacity
          onPress={() => {
            setOtpSent(false);
            setOtp("");
            setShowPasswordField(false);
          }}
        >
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      )}

      {/* Identifier Field */}
      <Text style={styles.label}>*Email or Phone</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter email or phone number"
        value={identifier}
        onChangeText={setIdentifier}
        editable={!loading}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {remainingAttempts !== null && otpSent && (
        <Text style={styles.infoText}>
          You have {remainingAttempts} OTP attempt
          {remainingAttempts !== 1 && "s"} remaining within{" "}
          {otpWindow !== null
            ? `${otpWindow} minute${otpWindow !== 1 ? "s" : ""}`
            : "the configured window"}
          .
        </Text>
      )}

      {/* OTP Field */}
      {!showPasswordField && otpSent && (
        <>
          <Text style={styles.label}>*Enter OTP</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 4-digit OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            editable={!loading}
          />
        </>
      )}

      {/* Password Field */}
      {showPasswordField && (
        <>
          <Text style={styles.label}>*Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            <Text style={styles.toggleText}>
              {showPassword ? "Hide Password" : "Show Password"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Buttons */}
      {!showPasswordField ? (
        <>
          {!otpSent ? (
            <TouchableOpacity
              style={[styles.button, loading && styles.disabled]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, loading && styles.disabled]}
              onPress={handleVerifyOtpAndLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify & Login</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setShowPasswordField(true)}
            disabled={loading}
          >
            <Text style={styles.linkText}>Login with Password</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={[styles.button, loading && styles.disabled]}
          onPress={handlePasswordLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

export default SignInForm;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 60,
  },
  backButton: {
    color: "#1eb88c",
    fontWeight: "bold",
    marginBottom: 10,
  },
  label: {
    color: "#3b414e",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  infoText: {
    color: "#666",
    fontSize: 13,
    marginTop: 5,
  },
  button: {
    backgroundColor: "#1eb88c",
    borderRadius: 25,
    paddingVertical: 12,
    marginTop: 16,
    alignItems: "center",
  },
  disabled: {
    backgroundColor: "#aaa",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#3b414e",
    borderRadius: 25,
    paddingVertical: 12,
    marginTop: 10,
    alignItems: "center",
  },
  secondaryText: {
    color: "#3b414e",
    fontWeight: "600",
  },
  linkText: {
    textAlign: "center",
    color: "#007bff",
    textDecorationLine: "underline",
    marginTop: 10,
  },
  toggleText: {
    color: "#007bff",
    marginTop: 5,
  },
});
