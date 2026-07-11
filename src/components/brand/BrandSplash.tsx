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
    fadingOut?: boolean;
    onFadeOutComplete?: () => void;
};

const EASE = Easing.out(Easing.cubic);
/** Kısa fade — algılanabilir ama startup’a az ekler */
const FADE_OUT_MS = 260;
/** Intro bitiş (ms) — önceki ~1650ms idi */
const INTRO_DONE_MS = 980;

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

    const [reduceMotion, setReduceMotion] = useState(false);
    const finishedRef = React.useRef(false);
    const fadeDoneRef = React.useRef(false);
    const startedRef = React.useRef(false);

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

    // Native solid-blue splash → JS aynı mavi; hemen gizle, animasyona başla
    useEffect(() => {
        SplashScreen.hideAsync().catch(logCatch('general'));
    }, []);

    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled()
            .then((enabled) => {
                if (enabled) setReduceMotion(true);
            })
            .catch(() => {});
    }, []);

    // Animasyonu AccessibilityInfo beklemeden hemen başlat
    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        bar1.value = withTiming(1, { duration: 280, easing: EASE });
        line.value = withDelay(80, withTiming(1, { duration: 420, easing: EASE }));
        dot.value = withDelay(280, withTiming(1, { duration: 240, easing: EASE }));
        bar2.value = withDelay(160, withTiming(1, { duration: 360, easing: EASE }));
        bar3.value = withDelay(280, withTiming(1, { duration: 400, easing: EASE }));
        arms.value = withDelay(340, withTiming(1, { duration: 340, easing: EASE }));
        settle.value = withDelay(
            720,
            withSequence(
                withTiming(1.02, { duration: 120, easing: EASE }),
                withTiming(1, { duration: 120, easing: EASE })
            )
        );

        const t = setTimeout(finish, INTRO_DONE_MS);
        return () => clearTimeout(t);
    }, [bar1, bar2, bar3, line, arms, dot, settle, finish]);

    // Reduce motion sonradan gelirse kısalt
    useEffect(() => {
        if (!reduceMotion) return;
        bar1.value = 1;
        bar2.value = 1;
        bar3.value = 1;
        line.value = 1;
        arms.value = 1;
        dot.value = 1;
        settle.value = 1;
        const t = setTimeout(finish, 120);
        return () => clearTimeout(t);
    }, [reduceMotion, bar1, bar2, bar3, line, arms, dot, settle, finish]);

    useEffect(() => {
        if (!fadingOut) return;

        const duration = reduceMotion ? 120 : FADE_OUT_MS;
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
                {reduceMotion ? (
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
