import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ConfirmDialogProvider } from './lib/confirm-dialog';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from "./pages/LandingPage"
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminCollections from './pages/AdminCollections';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import Shop from './pages/Shop';
import ShopDetail from './pages/ShopDetail';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
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
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/collections" element={<AdminCollections />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ConfirmDialogProvider>
    </BrowserRouter>
  )
}

export default App
