import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'admin_session';

export async function createSession(username: string) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, username, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
    });
}

export async function verifySession() {
    const cookieStore = await cookies();
    const session = cookieStore.get(COOKIE_NAME);

    if (!session?.value) {
        return null;
    }

    return session.value;
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export async function requireAdmin() {
    const session = await verifySession();
    if (!session) {
        redirect('/admin/login');
    }
    return session;
}
