const CheckBox = ({ checked, onChange, disabled = false }) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className="w-4 h-4 text-[var(--pv-primary-500)] bg-white border-[var(--pv-neutral-grey-300)] rounded focus:ring-[var(--pv-primary-500)] cursor-pointer disabled:cursor-not-allowed"
    />
  );
};

export default CheckBox;
