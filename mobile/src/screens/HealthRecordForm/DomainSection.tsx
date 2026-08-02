import { StyleSheet, Text, View } from 'react-native';
import { Control, Controller, Path } from 'react-hook-form';
import type { HealthRecordPartial } from '@wish2care/shared';
import { TextField } from '../../components/TextField';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { ChipSelect } from './ChipSelect';
import { DomainConfig, getRangeHint, toNumberOrNull } from './fieldsConfig';

type DomainSectionProps = {
  domain: DomainConfig;
  control: Control<HealthRecordPartial>;
};

export function DomainSection({ domain, control }: DomainSectionProps) {
  return (
    <View style={styles.card}>
      <Text style={[styles.title, domain.tone === 'alert' && styles.titleAlert]}>{domain.title}</Text>
      {domain.fields.map((field) => (
        <Controller
          key={field.key}
          control={control}
          name={field.key as Path<HealthRecordPartial>}
          render={({ field: { value, onChange } }) =>
            field.type === 'select' ? (
              <ChipSelect
                label={field.label}
                options={field.options}
                value={value as string | null | undefined}
                onChange={onChange}
              />
            ) : (
              <TextField
                label={field.unit ? `${field.label} (${field.unit})` : field.label}
                value={value == null ? '' : String(value)}
                onChangeText={(text) => onChange(toNumberOrNull(text))}
                keyboardType={field.integer ? 'number-pad' : 'decimal-pad'}
                hint={getRangeHint(field.rangeKey, value as number | null | undefined)}
              />
            )
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.raisinBlack,
  },
  titleAlert: {
    color: '#B3261E',
  },
});
