"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook to check authentication and redirect to register page if not authenticated.
 * Use this for actions that require authentication (PDF downloads, form submissions, etc.)
 */
export function useRequireAuth() {
    const { data: session, status } = useSession();
    const router = useRouter();

    /**
     * Check if user is authenticated. If not, redirect to register page.
     * @param callback Optional callback to execute if authenticated
     * @returns true if authenticated, false otherwise
     */
    const requireAuth = useCallback((callback?: () => void): boolean => {
        if (status === 'loading') {
            return false;
        }

        if (!session) {
            // Redirect to register page
            router.push('/register');
            return false;
        }

        // User is authenticated, execute callback if provided
        if (callback) {
            callback();
        }
        return true;
    }, [session, status, router]);

    /**
     * Async version of requireAuth for async callbacks
     */
    const requireAuthAsync = useCallback(async (callback?: () => Promise<void>): Promise<boolean> => {
        if (status === 'loading') {
            return false;
        }

        if (!session) {
            router.push('/register');
            return false;
        }

        if (callback) {
            await callback();
        }
        return true;
    }, [session, status, router]);

    return {
        session,
        status,
        requireAuth,
        requireAuthAsync,
        isAuthenticated: !!session,
        isLoading: status === 'loading'
    };
}
