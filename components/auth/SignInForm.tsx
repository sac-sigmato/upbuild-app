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
} from "react-native";
// import your zustand / store hook — adjust path
import { socketInstance } from "@/sockets/socketInstance";
import { registerForPush } from "@/utils/registerForPush";
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

      // ✅ CASE 1: Approved user
      if (
        data.token &&
        data.userDetails &&
        data.userDetails.isApproved !== false
      ) {
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
          } catch (e) {}

          setLocalUser(userObj);

          /* 🔔 REGISTER PUSH TOKEN (NEW) */
          await registerForPush({
            api_url,
            jwt: data.token,
            apartmentId: userObj.apartment,
            flatId: userObj.flat,
          });

          // navigation handled elsewhere
        } else {
          await AsyncStorage.setItem(
            "pendingUser",
            JSON.stringify(data.userDetails)
          );
          navigation.navigate("SelectRole" as never);
        }

        // ❌ CASE 2: Unapproved user (NO push token)
      } else if (data.userDetails && data.userDetails.isApproved === false) {
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
        // 🔥 REGISTER PUSH TOKEN HERE (ONLY ONCE)
        try {
          await registerForPush({
            api_url,
            jwt: data.token,
            apartmentId: userObj.apartment,
            flatId: userObj.flat,
          });
        } catch (e) {
          console.warn("⚠️ Push registration failed", e);
        }


        /* 🔌 SOCKET REGISTER */
        socketInstance.emit("register-user", {
          userId: userObj._id,
          apartmentId: userObj.apartment,
          userType: userObj.userType,
        });

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

  // const handleVerifyOtpAndLogin = async () => {
  //   if (!otp.trim()) {
  //     Alert.alert("Error", "Please enter the OTP.");
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const res = await fetch(`${api_url}apartment/user/login/otp`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ identifier, otp }),
  //     });

  //     const data = await res.json();
  //     if (!res.ok) throw new Error(data.message || "OTP login failed");

  //     // CASE 1: Approved user with token and userDetails
  //     if (
  //       data.token &&
  //       data.userDetails &&
  //       data.userDetails.isApproved !== false
  //     ) {
  //       // store token
  //       await AsyncStorage.setItem("token", data.token);

  //       if (data.userDetails.roles?.length === 1) {
  //         const role = data.userDetails.roles[0];
  //         const userObj = {
  //           _id: data.userDetails._id,
  //           name: data.userDetails.name,
  //           email: data.userDetails.email,
  //           userType: role.roleId,
  //           roleName: role.slug,
  //           apartment: role.apartmentId,
  //           flat: role.flatId,
  //         };

  //         // update global store
  //         try {
  //           if (typeof setUser === "function") setUser(userObj);
  //         } catch (e) {
  //           // ignore if store shape differs
  //         }
  //         setLocalUser(userObj);

  //         toast("Logged in successfully!");
  //         // navigate to dashboard
  //         // adjust route name as per your navigator
  //         // cast to any to satisfy router typing for dynamic/unlisted routes
  //         router.push("/visitors" as any);
  //       } else {
  //         // multiple roles -> save pending and navigate to role select
  //         await AsyncStorage.setItem(
  //           "pendingUser",
  //           JSON.stringify(data.userDetails)
  //         );
  //         navigation.navigate("SelectRole" as never);
  //       }

  //       // CASE 2: Unapproved user
  //     } else if (data.userDetails && data.userDetails.isApproved === false) {
  //       // still may have token — store if present
  //       if (data.token) await AsyncStorage.setItem("token", data.token);

  //       const unapproved = {
  //         _id: data.userDetails._id,
  //         name: "Unapproved User",
  //         email: data.userDetails.email || "",
  //         contactNumber: data.userDetails.contactNumber,
  //       };

  //       try {
  //         if (typeof setUser === "function") setUser(unapproved);
  //       } catch (e) {}

  //       setLocalUser(unapproved);
  //       toast("OTP verified! Awaiting approval.");
  //       navigation.navigate("SelectState" as never);
  //     } else {
  //       // fallback
  //       toast("Login succeeded but response shape unexpected.");
  //     }
  //   } catch (err: any) {
  //     Alert.alert("Error", err.message || "Something went wrong.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handlePasswordLogin = async () => {
  //   if (!identifier || !password) {
  //     Alert.alert("Error", "Please fill all fields.");
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const response = await fetch(`${api_url}apartment/user/login`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ email: identifier, password }),
  //     });

  //     const data = await response.json();
  //     if (!response.ok) throw new Error(data.message || "Login failed");

  //     // store token
  //     if (data.token) await AsyncStorage.setItem("token", data.token);

  //     if (data.userDetails.roles?.length === 1) {
  //       const role = data.userDetails.roles[0];
  //       const userObj = {
  //         _id: data.userDetails._id,
  //         name: data.userDetails.name,
  //         email: data.userDetails.email,
  //         userType: role.roleId,
  //         roleName: role.slug,
  //         apartment: role.apartmentId,
  //         flat: role.flatId,
  //       };

  //       try {
  //         if (typeof setUser === "function") setUser(userObj);
  //       } catch (e) {}

  //       setLocalUser(userObj);
  //       toast("Logged in Successfully!");
  //        socketInstance.emit("register-user", {
  //          userId: userObj._id,
  //          apartmentId: userObj.apartment,
  //          userType: userObj.userType, // owner or tenant or occupant
  //        });
  //        console.log("Socket emitted");
  //       router.push("/visitors" as any);
  //     } else {
  //       await AsyncStorage.setItem(
  //         "pendingUser",
  //         JSON.stringify(data.userDetails)
  //       );
  //       navigation.navigate("SelectRole" as never);
  //     }
  //   } catch (error: any) {
  //     Alert.alert("Error", error?.message || "Something went wrong!");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <Image
        source={require("@/assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Title */}
      <Text style={styles.title}>Sign In</Text>

      {/* Email / Phone */}
      <TextInput
        style={styles.input}
        placeholder="*Email or Phone number"
        placeholderTextColor="#6B7280"
        value={identifier}
        onChangeText={setIdentifier}
        editable={!loading}
        autoCapitalize="none"
      />

      {/* OTP MODE */}
      {!showPasswordField && otpSent && (
        <>
          <TextInput
            style={styles.input}
            placeholder="*Enter OTP"
            placeholderTextColor="#6B7280"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            editable={!loading}
          />
        </>
      )}

      {/* PASSWORD MODE */}
      {showPasswordField && (
        <>
          <TextInput
            style={styles.input}
            placeholder="*Password"
            placeholderTextColor="#6B7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Primary Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={
          showPasswordField
            ? handlePasswordLogin
            : otpSent
            ? handleVerifyOtpAndLogin
            : handleSendOtp
        }
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {showPasswordField
              ? "Sign In"
              : otpSent
              ? "Verify & Login"
              : "Next"}
          </Text>
        )}
      </TouchableOpacity>

      {/* Switch Login Mode */}
      <TouchableOpacity
        onPress={() => {
          setShowPasswordField(!showPasswordField);
          setPassword("");
          setOtp("");
          setOtpSent(false);
        }}
        disabled={loading}
      >
        <Text style={styles.linkText}>
          {showPasswordField ? "Login with OTP" : "Login with Password"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );


};

export default SignInForm;
const styles = StyleSheet.create({
  page: {
    width:  "100%",
    height: "100%",
    flexGrow: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
  },

  logo: {
    width: 120,
    height: 30,
    marginBottom: 40,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#15803D",
    marginBottom: 28,
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#9CA3AF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 14,
  },

  forgotText: {
    alignSelf: "flex-end",
    fontSize: 13,
    color: "#15803D",
    marginBottom: 24,
  },

  button: {
    width: "100%",
    backgroundColor: "#22B884",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  linkText: {
    marginTop: 20,
    fontSize: 13,
    color: "#15803D",
    fontWeight: "500",
  },
});
