import React from "react";

export const PasswordStrength = ({ password = "" }) => {
  if (!password) return null;

  const checks = [
    { label: "8+ chars", valid: password.length >= 8 },
    { label: "Uppercase", valid: /[A-Z]/.test(password) },
    { label: "Number", valid: /[0-9]/.test(password) },
    { label: "Special char", valid: /[^A-Za-z0-9]/.test(password) }
  ];
  const score = checks.filter((c) => c.valid).length;
  const strengthColor =
    score <= 1
      ? "bg-rose-500"
      : score <= 2
      ? "bg-amber-500"
      : score === 3
      ? "bg-blue-500"
      : "bg-emerald-500";

  const strengthLabel =
    score <= 1 ? "Weak" : score <= 2 ? "Fair" : score === 3 ? "Good" : "Strong";

  return (
    <div className="space-y-1 pt-0.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-400">Password Strength:</span>
        <span
          className={`font-bold ${
            score <= 1
              ? "text-rose-500"
              : score <= 2
              ? "text-amber-500"
              : "text-emerald-600"
          }`}
        >
          {strengthLabel}
        </span>
      </div>
      <div className="flex gap-1 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`flex-1 transition-all duration-300 ${
              level <= score ? strengthColor : "bg-transparent"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default PasswordStrength;
