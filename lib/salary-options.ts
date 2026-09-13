// Опции для калькулятора зарплат (app/[locale]/salary, components/salary/SalaryClient.tsx).
// Та же форма {id, label, labelRu}, что уже используется для ROLE_TAGS
// (lib/profile-roles.ts) — роль в форме зарплат переиспользует ROLE_TAGS
// напрямую (см. импорт в SalaryClient.tsx), а не дублирует список ролей
// здесь ещё раз.

export interface SalaryOption {
  id:      string;
  label:   string;
  labelRu: string;
}

export const SENIORITY_LEVELS: SalaryOption[] = [
  { id: "trainee", label: "Trainee / Intern", labelRu: "Стажёр" },
  { id: "junior",  label: "Junior",           labelRu: "Junior" },
  { id: "middle",  label: "Middle",           labelRu: "Middle" },
  { id: "senior",  label: "Senior",           labelRu: "Senior" },
  { id: "lead",    label: "Lead / Principal", labelRu: "Lead / Principal" },
];

// Не претендует на исчерпывающий список стран мира — намеренно короткий
// набор, сфокусированный на вероятной аудитории продукта (СНГ + основные
// англоязычные/европейские IT-рынки), плюс "Другое" как явный отходной
// вариант, а не бесконечный выпадающий список на 190 стран ради формы,
// где реальная ценность — в достаточном количестве откликов на каждую
// опцию, а не в полноте списка.
export const COUNTRIES: SalaryOption[] = [
  { id: "am", label: "Armenia",        labelRu: "Армения" },
  { id: "ru", label: "Russia",         labelRu: "Россия" },
  { id: "ge", label: "Georgia",        labelRu: "Грузия" },
  { id: "by", label: "Belarus",        labelRu: "Беларусь" },
  { id: "ua", label: "Ukraine",        labelRu: "Украина" },
  { id: "kz", label: "Kazakhstan",     labelRu: "Казахстан" },
  { id: "uz", label: "Uzbekistan",     labelRu: "Узбекистан" },
  { id: "kg", label: "Kyrgyzstan",     labelRu: "Киргизия" },
  { id: "az", label: "Azerbaijan",     labelRu: "Азербайджан" },
  { id: "md", label: "Moldova",        labelRu: "Молдова" },
  { id: "pl", label: "Poland",         labelRu: "Польша" },
  { id: "de", label: "Germany",        labelRu: "Германия" },
  { id: "gb", label: "United Kingdom", labelRu: "Великобритания" },
  { id: "us", label: "United States",  labelRu: "США" },
  { id: "ca", label: "Canada",         labelRu: "Канада" },
  { id: "ae", label: "UAE",            labelRu: "ОАЭ" },
  { id: "other", label: "Other",       labelRu: "Другое" },
];

export const EMPLOYMENT_TYPES: SalaryOption[] = [
  { id: "remote",  label: "Remote",  labelRu: "Удалённо" },
  { id: "hybrid",  label: "Hybrid",  labelRu: "Гибрид" },
  { id: "office",  label: "Office",  labelRu: "Офис" },
];

export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
