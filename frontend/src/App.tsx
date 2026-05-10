import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { RoomLobbyPage } from "@/pages/RoomLobbyPage";
import { RoomPage } from "@/pages/RoomPage";
import { CampaignDashboardPage } from "@/pages/CampaignDashboardPage";

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Navigate to="/campaigns" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CampaignDashboardPage />} />
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
      </Routes>
    </div>
  );
}
