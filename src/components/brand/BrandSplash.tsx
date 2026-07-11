import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { BrandMark, BrandMarkStatic, BRAND_BLUE, type BrandMarkProgress } from './BrandMark';
import { logCatch } from '../../utils/logger';

type Props = {
    onAnimationFinished: () => void;
    /** true olduğunda splash opacity ile kaybolur */
    fadingOut?: boolean;
    onFadeOutComplete?: () => void;
};

const EASE = Easing.out(Easing.cubic);
const FADE_OUT_MS = 420;

export function BrandSplash({
    onAnimationFinished,
    fadingOut = false,
    onFadeOutComplete,
}: Props) {
    const bar1 = useSharedValue(0);
    const bar2 = useSharedValue(0);
    const bar3 = useSharedValue(0);
    const line = useSharedValue(0);
    const arms = useSharedValue(0);
    const dot = useSharedValue(0);
    const settle = useSharedValue(1);
    const screenOpacity = useSharedValue(1);

    const [motionReady, setMotionReady] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);
    const finishedRef = React.useRef(false);
    const fadeDoneRef = React.useRef(false);

    const progress: BrandMarkProgress = { bar1, bar2, bar3, line, arms, dot, settle };

    const finish = React.useCallback(() => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        onAnimationFinished();
    }, [onAnimationFinished]);

    const completeFade = React.useCallback(() => {
        if (fadeDoneRef.current) return;
        fadeDoneRef.current = true;
        onFadeOutComplete?.();
    }, [onFadeOutComplete]);

    useEffect(() => {
        SplashScreen.hideAsync().catch(logCatch('general'));
    }, []);

    useEffect(() => {
        let cancelled = false;
        AccessibilityInfo.isReduceMotionEnabled()
            .then((enabled) => {
                if (!cancelled) {
                    setReduceMotion(enabled);
                    setMotionReady(true);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setReduceMotion(false);
                    setMotionReady(true);
                }
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!motionReady) return;

        if (reduceMotion) {
            bar1.value = 1;
            bar2.value = 1;
            bar3.value = 1;
            line.value = 1;
            arms.value = 1;
            dot.value = 1;
            settle.value = 1;
            const t = setTimeout(finish, 280);
            return () => clearTimeout(t);
        }

        bar1.value = withTiming(1, { duration: 450, easing: EASE });
        line.value = withDelay(200, withTiming(1, { duration: 700, easing: EASE }));
        dot.value = withDelay(550, withTiming(1, { duration: 400, easing: EASE }));
        bar2.value = withDelay(350, withTiming(1, { duration: 600, easing: EASE }));
        bar3.value = withDelay(550, withTiming(1, { duration: 650, easing: EASE }));
        arms.value = withDelay(650, withTiming(1, { duration: 550, easing: EASE }));
        settle.value = withDelay(
            1200,
            withSequence(
                withTiming(1.03, { duration: 200, easing: EASE }),
                withTiming(1, { duration: 200, easing: EASE })
            )
        );

        const t = setTimeout(finish, 1650);
        return () => clearTimeout(t);
    }, [motionReady, reduceMotion, bar1, bar2, bar3, line, arms, dot, settle, finish]);

    useEffect(() => {
        if (!fadingOut) return;

        const duration = reduceMotion ? 160 : FADE_OUT_MS;
        screenOpacity.value = withTiming(0, { duration, easing: EASE }, (finished) => {
            if (finished) {
                runOnJS(completeFade)();
            }
        });
    }, [fadingOut, reduceMotion, screenOpacity, completeFade]);

    const fadeStyle = useAnimatedStyle(() => ({
        opacity: screenOpacity.value,
    }));

    return (
        <Animated.View
            style={[styles.root, fadeStyle]}
            pointerEvents={fadingOut ? 'none' : 'auto'}
            accessibilityLabel="Finans yükleniyor"
            accessibilityRole="progressbar"
        >
            <View style={styles.center}>
                {!motionReady ? null : reduceMotion ? (
                    <BrandMarkStatic size={188} />
                ) : (
                    <BrandMark size={188} progress={progress} />
                )}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    root: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: BRAND_BLUE,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
