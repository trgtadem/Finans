import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';

export default function RootIndex() {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }

    return <Redirect href="/(tabs)" />;
}
