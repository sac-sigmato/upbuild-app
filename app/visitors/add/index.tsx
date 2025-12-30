import AddVisitorForm from "@/components/visitors/AddVisitorForm";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Add() {
  const router = useRouter();
  // const { typeOfVisitor } = useLocalSearchParams<{ typeOfVisitor?: string }>();

  //   useEffect(() => {
  //     console.log(typeOfVisitor, "typeOfVisitor");

  //   }, [typeOfVisitor]);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback if no history, navigate to a default screen
      router.push("/visitors"); // or whatever your visitors list route is
    }
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: "#f8f9fa",
      }}
      contentContainerStyle={{
        paddingTop: 16,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}
      >
        <TouchableOpacity
          onPress={handleGoBack}
          style={{
            padding: 8,
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#606873" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 22,
            color: "#606873",
            fontWeight: "bold",
          }}
        >
          Add Visitors
        </Text>
      </View>

      <View
      >
        <AddVisitorForm />
      </View>
    </ScrollView>
  );
}
