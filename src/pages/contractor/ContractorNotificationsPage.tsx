import React from 'react';
import { NotificationCenter } from '../../components/notifications/NotificationCenter';

export const ContractorNotificationsPage: React.FC = () => {
  return (
    <NotificationCenter
      role="contractor"
      title="Contractor Worksite Alerts"
      subtitle="Milestone verification updates, submission audit reviews, SLA deadline warnings, and project assignment notices"
      dashboardPath="/dashboard/contractor"
    />
  );
};

export default ContractorNotificationsPage;
