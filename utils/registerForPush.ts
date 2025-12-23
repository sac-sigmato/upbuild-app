import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerForPush({
  api_url,
  jwt,
  apartmentId,
  flatId,
}: {
  api_url: string;
  jwt: string;
  apartmentId: string;
  flatId: string;
}) {
  /* 1️⃣ REQUEST PERMISSION (REQUIRED) */
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("❌ Notification permission not granted");
    return;
  }

  /* 2️⃣ ANDROID CHANNEL (REQUIRED) */
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
    });
  }

  /* 3️⃣ REAL DEVICE TOKEN (FCM) */
  const token = await Notifications.getDevicePushTokenAsync();

  console.log("🔥 REAL FCM TOKEN:", token.data);

  /* 4️⃣ SEND TO BACKEND */
  await fetch(`${api_url}users/save-push-token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fcmToken: token.data,
      apartmentId,
      flatId,
    }),
  });
}
