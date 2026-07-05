import StartDatePicker from './StartDatePicker';
import ResetButton from './ResetButton';

interface StartDateButtonProps {
  onReset: () => void;
  onSettingsChange: () => void;
}

export default function StartDateButton({ onReset, onSettingsChange }: StartDateButtonProps) {
  return (
    <div>
      <div className="flex items-end gap-4 max-sm:flex-col max-sm:items-stretch">
        <StartDatePicker onSettingsChange={onSettingsChange} />
        <ResetButton onReset={onReset} />
      </div>
    </div>
  );
}
