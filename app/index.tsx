import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';

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
