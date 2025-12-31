import { BrowserRouter as Router, Routes, Route } from "react-router";
import { CurrencyProvider } from "@/react-app/hooks/useCurrency";
import HomePage from "@/react-app/pages/Home";
import EcosystemExplorer from "@/react-app/pages/EcosystemExplorer";
import HotStackAdmin from "@/react-app/pages/HotStackAdmin";
import GlobalBrandSearch from "@/react-app/pages/GlobalBrandSearch";
import UserDashboard from "@/react-app/pages/UserDashboard";
import BrandManagement from "@/react-app/pages/BrandManagement";
import HotStackDropZone from "@/react-app/pages/HotStackDropZone";
import APIDemos from "@/react-app/pages/APIDemos";
import AdminLogin from "@/react-app/pages/AdminLogin";
import AdminDashboard from "@/react-app/pages/AdminDashboard";
import AdminFiles from "@/react-app/pages/AdminFiles";
import AdminLogs from "@/react-app/pages/AdminLogs";
import AdminSystem from "@/react-app/pages/AdminSystem";
import GlobalSynergyHub from "@/react-app/pages/GlobalSynergyHub";
import MochaAppIntegration from "@/react-app/pages/MochaAppIntegration";
import ShoppingCart from "@/react-app/pages/ShoppingCart";
import FileScroll from "@/react-app/pages/FileScroll";
import FAAGlobalRelease from "@/react-app/pages/FAAGlobalRelease";

export default function App() {
  return (
    <CurrencyProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ecosystem" element={<EcosystemExplorer />} />
          <Route path="/hotstack" element={<HotStackAdmin />} />
          <Route path="/brands" element={<GlobalBrandSearch />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/brand-management" element={<BrandManagement />} />
          <Route path="/drop-zone" element={<HotStackDropZone />} />
          <Route path="/api-demos" element={<APIDemos />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/files" element={<AdminFiles />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/system" element={<AdminSystem />} />
          <Route path="/global-synergy-hub" element={<GlobalSynergyHub />} />
          <Route path="/mocha-integration" element={<MochaAppIntegration />} />
          <Route path="/cart" element={<ShoppingCart />} />
          <Route path="/scroll" element={<FileScroll />} />
          <Route path="/faa-global" element={<FAAGlobalRelease />} />
        </Routes>
      </Router>
    </CurrencyProvider>
  );
}
