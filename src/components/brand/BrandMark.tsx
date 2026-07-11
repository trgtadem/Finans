import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

/** Brand blue matching assets/icon.png */
export const BRAND_BLUE = '#2D6CDF';
export const BRAND_YELLOW = '#FFC107';
export const BRAND_WHITE = '#FFFFFF';

const VB = 100;
/** Approx length of TREND_PATH for dash animation */
export const TREND_PATH_LENGTH = 72;
export const TREND_PATH = 'M 26 62 L 34 50 L 42 54 L 52 36 L 58 28';

export type BrandMarkProgress = {
    bar1: SharedValue<number>;
    bar2: SharedValue<number>;
    bar3: SharedValue<number>;
    line: SharedValue<number>;
    arms: SharedValue<number>;
    dot: SharedValue<number>;
    settle: SharedValue<number>;
};

type Props = {
    size?: number;
    progress: BrandMarkProgress;
};

function useBarProps(progress: SharedValue<number>, maxHeight: number, baseY: number) {
    return useAnimatedProps(() => {
        const p = Math.min(1, Math.max(0, progress.value));
        const h = maxHeight * p;
        return {
            height: h,
            y: baseY - h,
            opacity: p > 0.02 ? 1 : 0,
        };
    });
}

export function BrandMark({ size = 180, progress }: Props) {
    const bar1Props = useBarProps(progress.bar1, 30, 78);
    const bar2Props = useBarProps(progress.bar2, 44, 78);
    const bar3Props = useBarProps(progress.bar3, 58, 78);

    const lineProps = useAnimatedProps(() => {
        const p = Math.min(1, Math.max(0, progress.line.value));
        return {
            strokeDashoffset: TREND_PATH_LENGTH * (1 - p),
            opacity: p > 0.01 ? 1 : 0,
        };
    });

    const topArmProps = useAnimatedProps(() => {
        const p = Math.min(1, Math.max(0, progress.arms.value));
        const w = 28 * p;
        return {
            width: w,
            opacity: p > 0.02 ? 1 : 0,
        };
    });

    const midArmProps = useAnimatedProps(() => {
        const p = Math.min(1, Math.max(0, progress.arms.value));
        const w = 20 * Math.min(1, Math.max(0, (p - 0.1) / 0.9));
        return {
            width: Math.max(0, w),
            opacity: w > 0.5 ? 1 : 0,
        };
    });

    const dotProps = useAnimatedProps(() => {
        const p = Math.min(1, Math.max(0, progress.dot.value));
        const r = 3.2 * (0.4 + 0.6 * p);
        return {
            r,
            opacity: p,
        };
    });

    const groupProps = useAnimatedProps(() => {
        const s = progress.settle.value;
        return {
            transform: [
                { translateX: 50 },
                { translateY: 50 },
                { scale: s },
                { translateX: -50 },
                { translateY: -50 },
            ],
        };
    });

    return (
        <View
            style={[styles.wrap, { width: size, height: size, borderRadius: size * 0.22 }]}
            accessibilityRole="image"
            accessibilityLabel="Finans"
        >
            <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
                <Rect x={0} y={0} width={VB} height={VB} rx={22} ry={22} fill={BRAND_BLUE} />
                <AnimatedG animatedProps={groupProps}>
                    <AnimatedRect
                        x={20}
                        width={11}
                        rx={1.5}
                        fill={BRAND_WHITE}
                        animatedProps={bar1Props}
                    />
                    <AnimatedRect
                        x={35}
                        width={11}
                        rx={1.5}
                        fill={BRAND_WHITE}
                        animatedProps={bar2Props}
                    />
                    <AnimatedRect
                        x={50}
                        width={13}
                        rx={1.5}
                        fill={BRAND_WHITE}
                        animatedProps={bar3Props}
                    />
                    <AnimatedRect
                        x={63}
                        y={20}
                        height={11}
                        rx={1.5}
                        fill={BRAND_WHITE}
                        animatedProps={topArmProps}
                    />
                    <AnimatedRect
                        x={63}
                        y={42}
                        height={9}
                        rx={1.5}
                        fill={BRAND_WHITE}
                        animatedProps={midArmProps}
                    />
                    <AnimatedPath
                        d={TREND_PATH}
                        stroke={BRAND_WHITE}
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        strokeDasharray={TREND_PATH_LENGTH}
                        animatedProps={lineProps}
                    />
                    <AnimatedCircle cx={58} cy={28} fill={BRAND_YELLOW} animatedProps={dotProps} />
                </AnimatedG>
            </Svg>
        </View>
    );
}

/** Static full mark for reduce-motion */
export function BrandMarkStatic({ size = 180 }: { size?: number }) {
    return (
        <View
            style={[styles.wrap, { width: size, height: size, borderRadius: size * 0.22 }]}
            accessibilityRole="image"
            accessibilityLabel="Finans"
        >
            <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
                <Rect x={0} y={0} width={VB} height={VB} rx={22} ry={22} fill={BRAND_BLUE} />
                <G>
                    <Rect x={20} y={48} width={11} height={30} rx={1.5} fill={BRAND_WHITE} />
                    <Rect x={35} y={34} width={11} height={44} rx={1.5} fill={BRAND_WHITE} />
                    <Rect x={50} y={20} width={13} height={58} rx={1.5} fill={BRAND_WHITE} />
                    <Rect x={63} y={20} width={28} height={11} rx={1.5} fill={BRAND_WHITE} />
                    <Rect x={63} y={42} width={20} height={9} rx={1.5} fill={BRAND_WHITE} />
                    <Path
                        d={TREND_PATH}
                        stroke={BRAND_WHITE}
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />
                    <Circle cx={58} cy={28} r={3.2} fill={BRAND_YELLOW} />
                </G>
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        overflow: 'hidden',
        backgroundColor: BRAND_BLUE,
    },
});
