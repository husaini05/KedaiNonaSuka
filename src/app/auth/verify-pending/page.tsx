import { Suspense } from "react";
import { VerifyPendingScreen } from "@/components/auth/verify-pending-screen";

export default function VerifyPendingPage() {
  return (
    <Suspense>
      <VerifyPendingScreen />
    </Suspense>
  );
}
