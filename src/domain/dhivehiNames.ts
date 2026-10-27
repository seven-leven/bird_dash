/** One Dhivehi name in Thaana, with how to say it when the list gives one. */
export interface DhivehiName {
  script: string;
  roman?: string;
}

const split = (s: string) => s.split('/').map((t) => t.trim()).filter(Boolean);

/**
 * A bird can have more than one Dhivehi name: the list writes them as
 * "ވަލު ކުކުޅު / ކުލީ ކުކުޅު" with "Valu Kukulhu / Kulhee Kukulhu". Pair each name with
 * its own romanisation, in order. When the counts differ (one name spelt two ways in
 * Latin, "Furedhdhe Ilolhi / Furehdhi Ilolhi"), the romanisation stays whole, with the
 * first name.
 */
export function dhivehiNames(script: string, roman = ''): DhivehiName[] {
  const scripts = split(script);
  const romans = split(roman);
  if (scripts.length === romans.length) {
    return scripts.map((s, i) => ({ script: s, roman: romans[i] }));
  }
  return scripts.map((s, i) =>
    i === 0 && romans.length > 0 ? { script: s, roman: romans.join(' / ') } : { script: s }
  );
}
