import AdminNotificationSender from '../../components/AdminNotificationSender';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import './AdminNotificationsPage.css';

const AdminNotificationsPage = () => {
  return (
    <AdminDashboardLayout pageTitle="Notifications">
      <div className="admin-notifications-page">
        <AdminNotificationSender />
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminNotificationsPage;
