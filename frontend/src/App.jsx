import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect } from 'react';
import { trackPageView } from './utils/tracker';
import { ConfirmDialogProvider } from './lib/confirm-dialog';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from "./pages/LandingPage"
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminCollections from './pages/AdminCollections';
import AdminCategories from './pages/AdminCategories';
import AdminMaterial from './pages/AdminMaterial';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import Shop from './pages/Shop';
import ShopDetail from './pages/ShopDetail';
import Wholesale from './pages/Wholesale';
import ProtectedRoute from './components/ProtectedRoute';
import UserProfile from './pages/UserProfile';
import NotFound from './pages/NotFound';
import About from './pages/About';
import Unsubscribe from './pages/Unsubscribe';

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <RouteTracker />
      <ConfirmDialogProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:slug" element={<CollectionDetail />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:slug" element={<ShopDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:id/:token" element={<ResetPassword />} />
          <Route path="/wholesale" element={<Wholesale />} />
          <Route path="/about" element={<About />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route element={<ProtectedRoute requireAdmin={false} />}>
            <Route path="/profile" element={<UserProfile />} />
          </Route>
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/collections" element={<AdminCollections />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/materials" element={<AdminMaterial />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ConfirmDialogProvider>
    </BrowserRouter>
  )
}

export default App
