import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { LoadingScreen } from "../src/components/ui/LoadingScreen";

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/(app)/dashboard");
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [user, isLoading]);

  return <LoadingScreen message="Starting ITSM..." />;
}
