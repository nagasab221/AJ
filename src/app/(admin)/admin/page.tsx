import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminLogin from '@/components/admin/AdminLogin';
import { isAdminRequest } from '@/lib/auth';
import { getBanner, getContent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!(await isAdminRequest())) {
    return <AdminLogin />;
  }

  const [content, banner] = await Promise.all([getContent(), getBanner()]);

  return <AdminDashboard initialContent={content} initialBanner={banner} />;
}
