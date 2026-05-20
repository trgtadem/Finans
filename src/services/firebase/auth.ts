import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    updatePassword,
    onAuthStateChanged,
    User,
    EmailAuthProvider,
    reauthenticateWithCredential,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../../config/firebase';

export function subscribeToAuthState(
    callback: (user: User | null) => void
): () => void {
    const auth = getFirebaseAuth();
    if (!auth) {
        callback(null);
        return () => {};
    }
    return onAuthStateChanged(auth, callback);
}

export async function signUpWithEmail(
    email: string,
    password: string
): Promise<User> {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase yapılandırılmamış.');
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return credential.user;
}

export async function signInWithEmail(
    email: string,
    password: string
): Promise<User> {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase yapılandırılmamış.');
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
}

export async function signOut(): Promise<void> {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase yapılandırılmamış.');
    await sendPasswordResetEmail(auth, email);
}

export async function changePassword(
    currentPassword: string,
    newPassword: string
): Promise<void> {
    const auth = getFirebaseAuth();
    if (!auth?.currentUser?.email) {
        throw new Error('Oturum bulunamadı.');
    }
    const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
    );
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPassword);
}

export function getCurrentUser(): User | null {
    return getFirebaseAuth()?.currentUser ?? null;
}

export function isAuthAvailable(): boolean {
    return isFirebaseConfigured();
}
