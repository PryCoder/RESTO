import React, { Suspense, useState, useEffect } from 'react';
const ManagerDashboard = React.lazy(() => import('./pages/managerdashboard'));
const ManagerQRPage = React.lazy(() => import('./pages/ManagerQRPage'));
const ManagerUsersPage = React.lazy(() => import('./pages/ManagerUsersPage'));
const VendorDashboard = React.lazy(() => import('./pages/vendordashboard'));
const WaiterDashboard = React.lazy(() => import('./pages/waiterdashboard'));
const KitchenDashboard = React.lazy(() => import('./pages/kitchendashboard'));
const InventoryManagement = React.lazy(() => import('./pages/InventoryManagement'));
const TableManagement = React.lazy(() => import('./pages/TableManagement'));
const UserProfilePage = React.lazy(() => import('./pages/UserProfilePage'));
import Register from './pages/register';
import Login from './pages/login';
import JoinPage from './pages/joinPage';
import HomePage from './pages/HomePage';
import PremiumLoader from './components/PremiumLoader';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerRegister from './pages/CustomerRegister';
import CustomerHomePage from './pages/CustomerHomePage';
import RestaurantDetailsPage from './pages/RestaurantDetails';
import CheckoutPage from './pages/checkout';
import OrderReceiptPage from './components/Receipt';
import CustomerAllOrders from './components/allOrders';
import CustomerOrderDetails from './components/Receipt';
import CustomerLogin from './pages/CustomerLogin';

function App() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200); // Shorter initial loader
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      <PremiumLoader visible={loading} text="Preparing your experience..." />
      <Suspense fallback={<PremiumLoader visible={true} text="Loading page..." />}> 
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/customer-login" element={<CustomerLogin/>} />
            <Route path="/orders" element={<CustomerAllOrders />} />
<Route path="/order/:orderId" element={<CustomerOrderDetails />} />
            <Route path="/receipt/sample-order-id" element={<OrderReceiptPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/dashboard/manager/:id" element={<ManagerDashboard />} />
            <Route path="/manager/qr" element={<ManagerQRPage />} />
            <Route path="/manager/users" element={<ManagerUsersPage />} />
            <Route path="/dashboard/vendor" element={<VendorDashboard />} />
            <Route path="/customer-register" element={<CustomerRegister/>} />
            <Route path="/dashboard/waiter" element={<WaiterDashboard />} />
            <Route path="/dashboard/kitchen" element={<KitchenDashboard />} />
            <Route path="/restaurants" element={<CustomerHomePage/>} />
            <Route path="/restaurant/:id" element={<RestaurantDetailsPage/>} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/inventory" element={<InventoryManagement />} />
            <Route path="/tables" element={<TableManagement />} />
            <Route path="/profile/:id" element={<UserProfilePage />} />
          </Routes>
        </Router>
      </Suspense>
    </>
  );
}

export default App;
