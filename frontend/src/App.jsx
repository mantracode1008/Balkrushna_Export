import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceReports from './pages/InvoiceReports';
import SalesHistory from './pages/SalesHistory';
import ReadingManagement from './pages/ReadingManagement';
import SellerList from './pages/SellerList';
import SellerDetails from './pages/SellerDetails';
import SellerReports from './pages/SellerReports';
import SellerBuyerGrid from './pages/SellerBuyerGrid';
import SellerReportGrid from './pages/SellerReportGrid';

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
              <ProtectedRoute permission="dashboard_view">
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/inventory" element={
              <ProtectedRoute permission="inventory_manage">
                <MainLayout>
                  <Inventory />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/invoices" element={
              <ProtectedRoute permission="invoice_manage">
                <MainLayout>
                  <Invoices />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/invoices/create" element={
              <ProtectedRoute permission="invoice_manage">
                <MainLayout>
                  <InvoiceForm />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/invoices/reports" element={
              <ProtectedRoute permission="invoice_manage">
                <MainLayout>
                  <InvoiceReports />
                </MainLayout>
              </ProtectedRoute>
            } />


            <Route path="/history" element={
              <ProtectedRoute permission="dashboard_view">
                <MainLayout>
                  <SalesHistory />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/sellers" element={
              <ProtectedRoute permission="seller_manage">
                <MainLayout>
                  <SellerList />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/sellers/:id" element={
              <ProtectedRoute permission="seller_manage">
                <MainLayout>
                  <SellerDetails />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/sellers/reports" element={
              <ProtectedRoute permission="seller_manage">
                <MainLayout>
                  <SellerReports />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/sellers/sales-grid" element={
              <ProtectedRoute permission="seller_manage">
                <MainLayout>
                  <SellerBuyerGrid />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/sellers/grid-report" element={
              <ProtectedRoute permission="seller_manage">
                <MainLayout>
                  <SellerReportGrid />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/staff" element={
              <ProtectedRoute permission="admin_only">
                <ReadingManagement />
              </ProtectedRoute>
            } />



            <Route path="/invoices/:id/print" element={
              <ProtectedRoute permission="invoice_manage">
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
