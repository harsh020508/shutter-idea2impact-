import { Routes, Route } from "react-router";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Inventory from "./pages/Inventory";
import Restock from "./pages/Restock";
import Trades from "./pages/Trades";
import MapPindrops from "./pages/MapPindrops";
import Campaigns from "./pages/Campaigns";
import Heatmap from "./pages/Heatmap";
import Genie from "./pages/Genie";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import RetailerSetup from "./pages/RetailerSetup";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/billing" element={<Billing />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/restock" element={<Restock />} />
      <Route path="/trades" element={<Trades />} />
      <Route path="/pindrops" element={<MapPindrops />} />
      <Route path="/campaigns" element={<Campaigns />} />
      <Route path="/heatmap" element={<Heatmap />} />
      <Route path="/genie" element={<Genie />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/retailer/setup" element={<RetailerSetup />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
