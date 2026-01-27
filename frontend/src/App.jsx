import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import InvoiceForm from './pages/InvoiceForm';
import Reports from './pages/Reports';
import SalesHistory from './pages/SalesHistory';
import Order from './pages/Order';
import StaffManagement from './pages/StaffManagement';

import InvoicePrint from './components/InvoicePrint';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';

import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';

const App = () => {
  return (
    <ThemeProvider>
      <CartProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/inventory" element={
              <ProtectedRoute>
                <MainLayout>
                  <Inventory />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/invoices" element={
              <ProtectedRoute>
                <MainLayout>
                  <Invoices />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/invoices/create" element={
              <ProtectedRoute>
                <MainLayout>
                  <InvoiceForm />
                </MainLayout>
              </ProtectedRoute>
            } />



            <Route path="/history" element={
              <ProtectedRoute>
                <MainLayout>
                  <SalesHistory />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/order" element={
              <ProtectedRoute>
                <MainLayout>
                  <Order />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/staff" element={
              <ProtectedRoute>
                <StaffManagement />
              </ProtectedRoute>
            } />



            <Route path="/invoices/:id/print" element={
              <ProtectedRoute>
                <InvoicePrint />
              </ProtectedRoute>
            } />

          </Routes>
        </ErrorBoundary>
      </CartProvider>
    </ThemeProvider>
  );
};

export default App;
