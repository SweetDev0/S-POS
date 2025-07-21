import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import MarketPanel from './components/panels/MarketPanel';
import KafePanel from './components/panels/KafePanel';
import LoadingSpinner from './components/common/LoadingSpinner';
import StockManagementPanel from './components/panels/StockManagementPanel';
import StatisticsPanel from './components/panels/StatisticsPanel'; // Import the new panel
import AdminPanel from './components/panels/AdminPanel';
import Profile from './components/panels/Profile';

// Hooks
import { useAuth } from './contexts/AuthContext';

function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/market" element={<MarketPanel />} />
        <Route path="/kafe" element={<KafePanel />} />
        <Route path="/stok-yonetim" element={<StockManagementPanel />} />
        <Route path="/istatistikler" element={<StatisticsPanel />} /> {/* Add the new route */}
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App; 