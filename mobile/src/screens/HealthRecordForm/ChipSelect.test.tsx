import { fireEvent, render } from '@testing-library/react-native';
import { ChipSelect } from './ChipSelect';

const options = ['Normal', 'Caution', 'High-risk'];

describe('ChipSelect', () => {
  it('renders every option', () => {
    const { getByText } = render(<ChipSelect label="Classification" options={options} value={null} onChange={jest.fn()} />);

    options.forEach((option) => expect(getByText(option)).toBeTruthy());
  });

  it('marks the current value as selected', () => {
    const { getByRole } = render(
      <ChipSelect label="Classification" options={options} value="Caution" onChange={jest.fn()} />
    );

    expect(getByRole('button', { name: 'Caution' })).toHaveProp('accessibilityState', { selected: true });
    expect(getByRole('button', { name: 'Normal' })).toHaveProp('accessibilityState', { selected: false });
  });

  it('calls onChange with the pressed option', () => {
    const onChange = jest.fn();
    const { getByRole } = render(
      <ChipSelect label="Classification" options={options} value={null} onChange={onChange} />
    );

    fireEvent.press(getByRole('button', { name: 'High-risk' }));

    expect(onChange).toHaveBeenCalledWith('High-risk');
  });
});
