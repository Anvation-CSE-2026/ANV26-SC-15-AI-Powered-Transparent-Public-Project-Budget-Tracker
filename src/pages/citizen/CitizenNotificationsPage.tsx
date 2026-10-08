import React from 'react';
import { NotificationCenter } from '../../components/notifications/NotificationCenter';

export const CitizenNotificationsPage: React.FC = () => {
  return (
    <NotificationCenter
      role="citizen"
      title="Citizen Notifications & Activity Feed"
      subtitle="Real-time alerts on your reported grievances, public project milestones, civic polls, and ward updates"
      dashboardPath="/dashboard/citizen"
    />
  );
};

export default CitizenNotificationsPage;
