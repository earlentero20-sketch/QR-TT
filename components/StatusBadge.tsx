import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { getEventStatus } from '@/lib/eventStatus';

type Props = {
    start: string;
    end: string;
};

const STATUS_COLORS = {
    upcoming: COLORS.warning,
    live: COLORS.success,
    ended: COLORS.textSecondary,
} as const;

/** Re-checks the status every 30s so "Live" flips to "Ended" without a reload. */
export default function StatusBadge({ start, end }: Props) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(id);
    }, []);

    const info = getEventStatus(start, end, now);
    const color = STATUS_COLORS[info.status];

    return (
        <View style={[styles.badge, { backgroundColor: `${color}1A`, borderColor: color }]}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={[styles.label, { color }]}>
                {info.label} · {info.detail}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginTop: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
    },
});