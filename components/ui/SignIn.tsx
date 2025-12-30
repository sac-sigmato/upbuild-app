import React, { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ApartmentAdminSignInForm from "../auth/SignInForm";

const { width, height } = Dimensions.get("window");

const onboardingScreens = [
  {
    image: require("@/assets/banner/banner-1.png"),
    text: "Community management app, ensures the safety and convenience of gated societies. The software for gated society offers numerous innovative features.",
  },
  {
    image: require("@/assets/banner/banner-2.png"),
    text: "A next-generation apartment management platform built to deliver unmatched convenience, security, and seamless living for every resident.",
  },
];

const ApartmentAdminSignInPage = () => {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const goNext = () => {
    scrollRef.current?.scrollTo({
      x: width * (index + 1),
      animated: true,
    });
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={(e) =>
        setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
      }
    >
      {/* ---------- ONBOARDING SCREENS ---------- */}
      {onboardingScreens.map((item, i) => (
        <View key={i} style={styles.screen}>
          {/* LOGO */}
          <Image
            source={require("@/assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* ILLUSTRATION */}
          <Image source={item.image} style={styles.illustration} />

          {/* DESCRIPTION */}
          <Text style={styles.description}>{item.text}</Text>

          {/* NEXT BUTTON */}
          <TouchableOpacity style={styles.button} onPress={goNext}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* ---------- SIGN IN SCREEN ---------- */}
      <View style={styles.screen2}>
        <ApartmentAdminSignInForm />
      </View>
    </ScrollView>
  );
};

export default ApartmentAdminSignInPage;
const styles = StyleSheet.create({
  screen: {
    width,
    height,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  screen2: {
    width,
    height,
    backgroundColor: "#FFFFFF",
  },
  logo: {
    width: 150,
    height: 40,
    marginTop: 60,
    marginBottom: 20,
  },

  illustration: {
    width: 350,
    height: 350,
    resizeMode: "contain",
    marginBottom: 24,
  },

  description: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 32,
  },

  button: {
    position: "absolute",
    bottom: 40,
    backgroundColor: "#1EB88C",
    width: "90%",
    paddingVertical: 14,
    borderRadius: 8,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },

  signInTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1EB88C",
    marginBottom: 20,
  },
});
