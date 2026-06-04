import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { RoomLobbyPage } from "@/pages/RoomLobbyPage";
import { RoomPage } from "@/pages/RoomPage";
import { CampaignDashboardPage } from "@/pages/CampaignDashboardPage";
import { LandingPage } from "@/pages/LandingPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { CharacterSheetPage } from "@/pages/CharacterSheetPage";
import { WorldArchivePage } from "@/pages/WorldArchivePage";
import { SessionRecapsPage } from "@/pages/SessionRecapsPage";
import CampaignSetupPage from "@/pages/CampaignSetupPage";
import { TavernPage } from "@/pages/TavernPage";
import { CampaignUrlManager } from "@/components/CampaignUrlManager";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { TermsOfServicePage } from "@/pages/TermsOfServicePage";
import { AccessibilityPage } from "@/pages/AccessibilityPage";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

export default function App() {
  return (
    <div className="min-h-screen">
      <CookieConsentBanner />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CampaignDashboardPage />} />
          <Route path=":campaignId/setup" element={<CampaignUrlManager><CampaignSetupPage /></CampaignUrlManager>} />
          <Route path=":campaignId/archive" element={<CampaignUrlManager><WorldArchivePage /></CampaignUrlManager>} />
          <Route path=":campaignId/recaps" element={<CampaignUrlManager><SessionRecapsPage /></CampaignUrlManager>} />
          <Route path=":campaignId/tavern" element={<CampaignUrlManager><TavernPage /></CampaignUrlManager>} />
          <Route path=":campaignId/characters/:characterId" element={<CampaignUrlManager><CharacterSheetPage /></CampaignUrlManager>} />
        </Route>
        <Route
          path="/rooms"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RoomLobbyPage />} />
          <Route path=":id" element={<CampaignUrlManager><RoomPage /></CampaignUrlManager>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
