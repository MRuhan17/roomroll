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

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
          <Route path=":campaignId/setup" element={<CampaignSetupPage />} />
          <Route path=":campaignId/archive" element={<WorldArchivePage />} />
          <Route path=":campaignId/recaps" element={<SessionRecapsPage />} />
          <Route path=":campaignId/tavern" element={<TavernPage />} />
          <Route path=":campaignId/characters/:characterId" element={<CharacterSheetPage />} />
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
          <Route path=":id" element={<RoomPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
