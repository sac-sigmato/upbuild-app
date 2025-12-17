import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import ApartmentAdminSignInForm from "../auth/SignInForm"; // adjust import path

const ApartmentAdminSignInPage = () => {
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.wrapper}>
        {/* Left Section - Image & Text */}
        <View style={styles.leftSection}>
          <Image
            source={require("@/assets/banner/ApartmentLogin.png")} // update the path
            style={styles.image}
            resizeMode="contain"
          />
          <Text style={styles.title}>UpBuild</Text>
          <Text style={styles.description}>
            Community management app, ensures the safety and convenience of
            gated societies. The software for gated society offers numerous
            innovative features.
          </Text>
        </View>

        {/* Right Section - SignIn Form */}
        <View style={styles.rightSection}>
          <ApartmentAdminSignInForm />
        </View>
      </View>
    </ScrollView>
  );
};

export default ApartmentAdminSignInPage;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F5F7FB", // same as bg-logo
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  wrapper: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  leftSection: {
    width: "100%",
    alignItems: "center",
    textAlign: "center",
    marginBottom: 30,
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3B414E",
  },
  description: {
    fontSize: 14,
    color: "#3B414E",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  rightSection: {
    width: "100%",
    alignItems: "center",
  },
});
