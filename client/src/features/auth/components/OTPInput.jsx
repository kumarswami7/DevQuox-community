import { useRef, useState, useEffect } from "react";
export const OTPInput = ({ value, onChange, length = 6 }) => {
  const [digits, setDigits] = useState(Array(length).fill(""));
  const inputRefs = useRef([]);
  useEffect(() => {
    const newDigits = Array(length).fill("");
    for (let i = 0; i < Math.min(value.length, length); i++) {
      newDigits[i] = value[i];
    }
    setDigits(newDigits);
  }, [value, length]);
  const handleChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[index] = val.substring(val.length - 1);
    setDigits(newDigits);
    const combined = newDigits.join("");
    onChange(combined);
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      const newDigits = Array(length).fill("");
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
      onChange(pasted);
      inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
    }
  };
  return <div className="flex gap-2 justify-center my-4">{digits.map((digit, idx) => <input
    key={idx}
    ref={(el) => inputRefs.current[idx] = el}
    type="text"
    inputMode="numeric"
    maxLength={1}
    value={digit}
    onChange={(e) => handleChange(idx, e.target.value)}
    onKeyDown={(e) => handleKeyDown(idx, e)}
    onPaste={handlePaste}
    className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-cardDark text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
  />)}</div>;
};
