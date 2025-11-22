import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminDashboard from './dashboard';

export default async function AdminPage() {
  const session = await verifySession();

  if (!session) {
    redirect('/admin/login');
  }

  return <AdminDashboard currentUser={session} />;
}
