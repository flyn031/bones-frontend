// src/routes/auditRoutes.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuditDashboard from '../components/audit/AuditDashboard';

const AuditRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AuditDashboard />} />
    </Routes>
  );
};

export default AuditRoutes;