import {Route, Routes, BrowserRouter, Navigate, useLocation} from "react-router-dom";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { Home } from "./components/Home";
import { Menu } from "./components/Menu";
import { Posto } from "./components/Posto";
import { Checkin } from "./components/Checkin";
import { Checkout } from "./components/Checkout";
import { getAuthState, getDefaultAuthenticatedRoute } from "./services/auth";

function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { authenticated, role } = getAuthState();

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getDefaultAuthenticatedRoute(role)} replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { authenticated, role } = getAuthState();

  if (authenticated) {
    return <Navigate to={getDefaultAuthenticatedRoute(role)} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
    <Menu/>
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/login" element={<PublicOnlyRoute><Login/></PublicOnlyRoute>}/>
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Dashboard/></ProtectedRoute>}/>
      <Route path="/postos" element={<ProtectedRoute allowedRoles={["PADRAO"]}><Posto/></ProtectedRoute>}/>
      <Route path="/checkin" element={<ProtectedRoute allowedRoles={["PADRAO"]}><Checkin/></ProtectedRoute>}/>
      <Route path="/checkout" element={<ProtectedRoute allowedRoles={["PADRAO"]}><Checkout/></ProtectedRoute>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
    </BrowserRouter>
  );
}

export default App;
