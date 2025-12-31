import { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, Pressable } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import type { CategoryStats } from '@/lib/storage';
import { formatCurrency } from '@/lib/format';

interface PieChartProps {
  data: CategoryStats[];
}

const { width } = Dimensions.get('window');
const CHART_SIZE = Math.min(width - 64, 280);
const RADIUS = CHART_SIZE / 2;
const INNER_RADIUS = RADIUS * 0.6;
const GAP_ANGLE = 2;

export function PieChart({ data }: PieChartProps) {
  const [selectedSlice, setSelectedSlice] = useState<CategoryStats | null>(null);

  if (data.length === 0) return null;

  let currentAngle = -90;

  const slices = data.map((item) => {
    const sliceAngle = (item.percentage / 100) * 360 - GAP_ANGLE;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle + GAP_ANGLE;

    return {
      ...item,
      startAngle,
      endAngle,
      sliceAngle,
    };
  });

  const polarToCartesian = (angle: number, radius: number) => {
    const angleInRadians = (angle * Math.PI) / 180;
    return {
      x: RADIUS + radius * Math.cos(angleInRadians),
      y: RADIUS + radius * Math.sin(angleInRadians),
    };
  };

  const createDonutSlice = (startAngle: number, endAngle: number) => {
    const outerStart = polarToCartesian(startAngle, RADIUS);
    const outerEnd = polarToCartesian(endAngle, RADIUS);
    const innerStart = polarToCartesian(endAngle, INNER_RADIUS);
    const innerEnd = polarToCartesian(startAngle, INNER_RADIUS);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArcFlag} 0 ${innerEnd.x} ${innerEnd.y}`,
      'Z',
    ].join(' ');
  };

  // Calculate which slice was tapped based on touch position
  const handleChartPress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    
    // Calculate distance from center
    const dx = locationX - RADIUS;
    const dy = locationY - RADIUS;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if tap is within donut ring
    if (distance < INNER_RADIUS || distance > RADIUS) {
      return;
    }
    
    // Calculate angle of tap
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    // Normalize to match our coordinate system (starting at -90)
    angle = (angle + 90 + 360) % 360;
    if (angle < 0) angle += 360;
    
    // Find which slice was tapped
    for (const slice of slices) {
      let start = (slice.startAngle + 90 + 360) % 360;
      let end = (slice.endAngle + 90 + 360) % 360;
      
      if (start > end) {
        // Handle wrap around 360
        if (angle >= start || angle <= end) {
          console.log('Tapped slice:', slice.categoryName);
          setSelectedSlice(slice);
          return;
        }
      } else {
        if (angle >= start && angle <= end) {
          console.log('Tapped slice:', slice.categoryName);
          setSelectedSlice(slice);
          return;
        }
      }
    }
  };

  return (
    <>
      <View style={styles.container}>
        <Pressable onPress={handleChartPress}>
          <Svg width={CHART_SIZE} height={CHART_SIZE}>
            <G>
              {slices.map((slice) => {
                const path = createDonutSlice(slice.startAngle, slice.endAngle);
                const midAngle = (slice.startAngle + slice.endAngle) / 2;
                const labelRadius = INNER_RADIUS + (RADIUS - INNER_RADIUS) * 0.5;
                const labelPos = polarToCartesian(midAngle, labelRadius);

                return (
                  <G key={slice.categoryId}>
                    <Path
                      d={path}
                      fill={slice.categoryColor}
                      opacity={selectedSlice?.categoryId === slice.categoryId ? 1 : 0.95}
                    />
                    {slice.percentage >= 8 && (
                      <SvgText
                        x={labelPos.x}
                        y={labelPos.y + 5}
                        fontSize="14"
                        fontWeight="600"
                        fill="white"
                        textAnchor="middle"
                        pointerEvents="none"
                      >
                        {slice.percentage.toFixed(0)}%
                      </SvgText>
                    )}
                  </G>
                );
              })}
            </G>
          </Svg>
        </Pressable>

        <View style={styles.centerLabel}>
          <Text style={styles.centerLabelText}>Total</Text>
          <Text style={styles.centerLabelValue}>{data.length}</Text>
          <Text style={styles.centerLabelSubtext}>kategori</Text>
        </View>
      </View>

      <Modal
        visible={selectedSlice !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedSlice(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedSlice(null)}
        >
          <View style={styles.modalContent}>
            {selectedSlice && (
              <>
                <View style={styles.modalHeader}>
                  <View
                    style={[
                      styles.modalIcon,
                      { backgroundColor: selectedSlice.categoryColor },
                    ]}
                  >
                    <Text style={styles.modalEmoji}>{selectedSlice.categoryIcon}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedSlice(null)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalTitle}>{selectedSlice.categoryName}</Text>
                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Total</Text>
                    <Text style={styles.modalStatValue}>
                      {formatCurrency(selectedSlice.total)}
                    </Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Persentase</Text>
                    <Text style={styles.modalStatValue}>
                      {selectedSlice.percentage.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Transaksi</Text>
                    <Text style={styles.modalStatValue}>
                      {selectedSlice.transactionCount}x
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabelText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  centerLabelValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  centerLabelSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmoji: {
    fontSize: 28,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  modalStats: {
    gap: 16,
  },
  modalStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalStatLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
});
