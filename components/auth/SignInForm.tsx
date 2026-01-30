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

import { socketInstance } from "@/sockets/socketInstance";
import { registerForPush } from "@/utils/registerForPush";
import { useRouter } from "expo-router";
import { Eye, EyeOff, Mail } from "lucide-react-native";
import { useUserStore } from "../../store/useUserStore";
import { api_url } from "../../utils/apiLocalhost";

const OTP_LENGTH = 5;

export default function SignInForm() {
  const router = useRouter();
  const navigation = useNavigation();
  const { setUser } = useUserStore();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  // ✅ OTP ATTEMPT INFO (FROM BACKEND)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null,
  );
  const [otpWindow, setOtpWindow] = useState<number | null>(null);

  const toast = (msg: string) =>
    Platform.OS === "android"
      ? ToastAndroid.show(msg, ToastAndroid.SHORT)
      : Alert.alert("", msg);

  const isIdentifierInvalid =
    identifier.length < 10 && !identifier.includes("@");

  /* ---------------- SEND OTP ---------------- */
  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      toast("Please enter your phone or email.");
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

      if (!res.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      toast("OTP sent successfully");
      setOtp("");
      setOtpSent(true);

      // ✅ SAME AS WEB
      setRemainingAttempts(
        typeof data.remainingAttempts === "number"
          ? data.remainingAttempts
          : null,
      );

      if (data.attemptWindow) {
        const minutes = parseFloat(data.attemptWindow);
        setOtpWindow(!isNaN(minutes) ? minutes : null);
      }
    } catch (err: any) {
      toast(err.message || "Something went wrong");
      setRemainingAttempts(null);
      setOtpWindow(null);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- VERIFY OTP ---------------- */
  const handleVerifyOtpAndLogin = async () => {
    if (!otp || otp.length !== OTP_LENGTH) {
      toast("Please enter valid OTP");
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

      await AsyncStorage.setItem("token", data.token);

      const role = data.userDetails.roles[0];
      const userObj = {
        _id: data.userDetails._id,
        name: data.userDetails.name,
        email: data.userDetails.email,
        contactNumber: data.userDetails.contactNumber,
        userType: role.roleId,
        roleName: role.slug,
        apartment: role.apartmentId,
        flat: role.flatId,
      };

      setUser(userObj);

      try {
        await registerForPush({
          api_url,
          jwt: data.token,
          apartmentId: userObj.apartment,
          flatId: userObj.flat,
        });
      } catch {}

      socketInstance.emit("register-user", {
        userId: userObj._id,
        apartmentId: userObj.apartment,
        userType: userObj.userType,
      });

      router.push("/visitors" as any);
    } catch (err: any) {
      toast(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- PASSWORD LOGIN ---------------- */
  const handlePasswordLogin = async () => {
    if (!identifier || !password) {
      toast("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${api_url}apartment/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      await AsyncStorage.setItem("token", data.token);

      const role = data.userDetails.roles[0];
      setUser({
        _id: data.userDetails._id,
        name: data.userDetails.name,
        email: data.userDetails.email,
        contactNumber: data.userDetails.contactNumber,
        userType: role.roleId,
        roleName: role.slug,
        apartment: role.apartmentId,
        flat: role.flatId,
      });

      router.push("/visitors" as any);
    } catch (err: any) {
      toast(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Image source={require("@/assets/logo.png")} style={styles.logo} />

      {/* BACK */}
      {(otpSent || showPasswordField) && (
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => {
            setOtpSent(false);
            setOtp("");
            setShowPasswordField(false);
            setRemainingAttempts(null);
            setOtpWindow(null);
          }}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
      )}

      {/* EMAIL / PHONE */}
      <Text style={styles.label}>*Email or Phone</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Enter email or phone number"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
        />
        <Mail size={18} color="#9CA3AF" />
      </View>

      {/* ✅ OTP ATTEMPT MESSAGE (SAME AS WEB) */}
      {/* {otpSent && remainingAttempts !== null && (
        <Text style={styles.attemptText}>
          You have <Text style={styles.bold}>{remainingAttempts}</Text> OTP
          attempt{remainingAttempts !== 1 && "s"} remaining within{" "}
          {otpWindow !== null ? (
            <>
              <Text style={styles.bold}>{otpWindow}</Text> minute
              {otpWindow !== 1 && "s"}
            </>
          ) : (
            "the configured window"
          )}
          .
        </Text>
      )} */}

      {/* OTP ATTEMPT MESSAGE */}
      {otpSent && remainingAttempts !== null && (
        <Text style={styles.attemptText}>
          You have <Text style={styles.bold}>{remainingAttempts}</Text> OTP
          attempt
          {remainingAttempts !== 1 && "s"} remaining within{" "}
          {otpWindow !== null ? (
            <>
              <Text style={styles.bold}>{otpWindow}</Text> minute
              {otpWindow !== 1 && "s"}
            </>
          ) : (
            "the configured window"
          )}
          .
        </Text>
      )}

      {/* ✅ ENTER OTP – IMMEDIATELY AFTER MESSAGE */}
      {otpSent && !showPasswordField && (
        <>
          <Text style={styles.label}>*Enter OTP</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={OTP_LENGTH}
          />
        </>
      )}

      {/* PASSWORD */}
      {showPasswordField && (
        <>
          <Text style={styles.label}>*Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff size={18} color="#9CA3AF" />
              ) : (
                <Eye size={18} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* PRIMARY BUTTON */}
      <TouchableOpacity
        style={styles.primaryButton}
        disabled={loading || (!showPasswordField && isIdentifierInvalid)}
        onPress={
          showPasswordField
            ? handlePasswordLogin
            : otpSent
              ? handleVerifyOtpAndLogin
              : handleSendOtp
        }
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>
            {showPasswordField
              ? "Login"
              : otpSent
                ? "Verify & Login"
                : "Send OTP"}
          </Text>
        )}
      </TouchableOpacity>

      {/* TOGGLE MODE */}
      <TouchableOpacity
        onPress={() => {
          setShowPasswordField(!showPasswordField);
          setOtpSent(false);
          setOtp("");
          setPassword("");
          setRemainingAttempts(null);
          setOtpWindow(null);
        }}
      >
        <Text style={styles.linkText}>
          {showPasswordField ? "Login with OTP" : "Login with Password"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: "#111827",
    marginBottom: 16,
  },

  logo: {
    width: 140,
    height: 36,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 40,
  },

  backRow: {
    marginBottom: 16,
  },

  backText: {
    color: "#22B884",
    fontWeight: "600",
    fontSize: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },

  attemptText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },

  bold: {
    fontWeight: "700",
    color: "#111827",
  },

  primaryButton: {
    backgroundColor: "#22B884",
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  linkText: {
    marginTop: 24,
    textAlign: "center",
    color: "#22B884",
    fontWeight: "600",
    fontSize: 14,
  },
});
