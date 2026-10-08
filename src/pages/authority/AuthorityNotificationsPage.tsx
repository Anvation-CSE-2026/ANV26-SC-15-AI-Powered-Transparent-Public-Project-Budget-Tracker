import React from 'react';
import { NotificationCenter } from '../../components/notifications/NotificationCenter';

export const AuthorityNotificationsPage: React.FC = () => {
  return (
    <NotificationCenter
      role="project_manager"
      title="PM Alerts & Telemetry Feed"
      subtitle="Critical operational alerts, contractor submission audits, project delay warnings, and complaint SLA notifications"
      dashboardPath="/dashboard/project-manager"
    />
  );
};

export default AuthorityNotificationsPage;
