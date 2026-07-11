import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';

/**
 * Root redirect. Loading gate is owned by app/_layout BrandSplash —
 * avoid a second spinner/null flash here once Stack is mounted.
 */
export default function RootIndex() {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return null;
    }

    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }

    return <Redirect href="/(tabs)" />;
}
