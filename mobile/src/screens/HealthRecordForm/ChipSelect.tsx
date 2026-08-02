import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

type ChipSelectProps = {
  label: string;
  options: readonly string[];
  value: string | null | undefined;
  onChange: (value: string) => void;
};

export function ChipSelect({ label, options, value, onChange }: ChipSelectProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={[styles.chip, selected && styles.chipSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={option}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.raisinBlack,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.raisinBlack + '30',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: colors.eminence,
    borderColor: colors.eminence,
  },
  chipLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.raisinBlack,
  },
  chipLabelSelected: {
    color: colors.white,
  },
});
