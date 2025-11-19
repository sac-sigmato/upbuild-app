import { ThemedView } from "@/components/themed-view";
import SignIn from "@/components/ui/SignIn";

export default function Index() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SignIn />
    </ThemedView>
  );
}
