"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function QuerySwitcher({
  param,
  options,
  current,
  ariaLabel,
}: {
  param: string;
  options: { value: string; label: string }[];
  current?: string;
  ariaLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  if (options.length <= 1 && param === "tenant") return null;
  return (
    <select
      className="acct-store"
      aria-label={ariaLabel}
      value={current ?? options[0]?.value}
      onChange={(e) => {
        const sp = new URLSearchParams(params.toString());
        sp.set(param, e.target.value);
        router.push(`${pathname}?${sp.toString()}`);
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
