import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DesignSystemShowcase } from './pages/DesignSystemShowcase';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeRole, setActiveRole] = useState<'Citizen' | 'Project Manager' | 'Contractor'>('Citizen');

  return (
    <Router>
      <Layout
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        activeRole={activeRole}
        onRoleSwitch={(role) => setActiveRole(role as 'Citizen' | 'Project Manager' | 'Contractor')}
      >
        <Routes>
          {/* Phase 1: Foundation Showcase & Design System */}
          <Route path="/" element={<DesignSystemShowcase />} />
          <Route path="/design-system" element={<DesignSystemShowcase />} />

          {/* Fallback to Root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
