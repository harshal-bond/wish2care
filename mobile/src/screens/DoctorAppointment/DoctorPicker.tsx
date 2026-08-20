import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { Doctor } from '@wish2care/shared';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

type DoctorPickerProps = {
  selectedId: number | null;
  onSelect: (id: number) => void;
};

export function DoctorPicker({ selectedId, onSelect }: DoctorPickerProps) {
  const {
    data: doctors,
    isLoading,
    error,
  } = useQuery<Doctor[]>({
    queryKey: ['doctors'],
    queryFn: async () => (await fetchApi('/doctors'))?.data ?? [],
  });

  if (isLoading) {
    return <ActivityIndicator color={colors.eminence} style={styles.loading} />;
  }

  if (error || !doctors || doctors.length === 0) {
    return <Text style={styles.empty}>No doctors available right now.</Text>;
  }

  return (
    <View style={styles.list}>
      {doctors.map((doctor) => {
        const selected = doctor.id === selectedId;
        return (
          <Pressable
            key={doctor.id}
            onPress={() => onSelect(doctor.id)}
            style={[styles.item, selected && styles.itemSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={doctor.name}
          >
            <Text style={[styles.name, selected && styles.nameSelected]}>{doctor.name}</Text>
            {doctor.specialization ? (
              <Text style={[styles.specialization, selected && styles.specializationSelected]}>
                {doctor.specialization}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginVertical: 12,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.raisinBlack + '90',
  },
  list: {
    gap: 10,
  },
  item: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.raisinBlack + '15',
    padding: 14,
  },
  itemSelected: {
    backgroundColor: colors.eminence,
    borderColor: colors.eminence,
  },
  name: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.raisinBlack,
  },
  nameSelected: {
    color: colors.white,
  },
  specialization: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.raisinBlack + '90',
    marginTop: 2,
  },
  specializationSelected: {
    color: colors.white + 'CC',
  },
});
