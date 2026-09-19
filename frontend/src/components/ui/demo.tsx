import React from "react";
import { BrowserRouter } from "react-router-dom";
import { LoginPage } from "@/components/ui/sign-in-page";

interface DemoProps {
  onBack?: () => void;
  onLoginSuccess?: (userData: any) => void;
}

export default function Demo({ onBack, onLoginSuccess }: DemoProps = {}) {
  return (
    <BrowserRouter>
      <LoginPage onBack={onBack} onLoginSuccess={onLoginSuccess} />
    </BrowserRouter>
  );
}
