import { useCallback, useState } from 'react';
import { isFirebaseConfigured } from '../config/firebase';

/**
 * Ana UI ancak bootReady ∩ animationDone olduğunda açılır.
 * Animasyon bitip auth hâlâ sürüyorsa splash hold eder.
 */
export function useAppBootGate(isReady: boolean, isLoading: boolean) {
    const [animationDone, setAnimationDone] = useState(false);

    const bootReady = isReady && !(isFirebaseConfigured() && isLoading);
    const canEnterApp = bootReady && animationDone;

    const onAnimationFinished = useCallback(() => {
        setAnimationDone(true);
    }, []);

    return {
        bootReady,
        animationDone,
        canEnterApp,
        onAnimationFinished,
    };
}
