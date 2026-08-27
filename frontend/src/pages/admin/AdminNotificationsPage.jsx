import AdminNotificationSender from '../../components/AdminNotificationSender';
import ScheduledAnnouncements from '../../components/ScheduledAnnouncements';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import './AdminNotificationsPage.css';

const AdminNotificationsPage = () => {
  return (
    <AdminDashboardLayout pageTitle="Notifications">
      <div className="admin-notifications-page">
        <AdminNotificationSender />
        <ScheduledAnnouncements />
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminNotificationsPage;
