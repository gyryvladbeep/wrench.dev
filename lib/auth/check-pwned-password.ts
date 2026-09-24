// Проверка пароля по базе утечек HaveIBeenPwned (Pwned Passwords,
// k-anonymity API) — бесплатная замена "Leaked password protection"
// из Supabase Auth, которая доступна только на платном плане Pro.
//
// Пароль целиком НИКОГДА не уходит на сторонний сервер: вычисляем
// SHA-1 локально в браузере (Web Crypto API), отправляем наружу
// только первые 5 символов хэша, HaveIBeenPwned отвечает списком ВСЕХ
// известных хэшей с таким же префиксом (обычно несколько сотен —
// специально, чтобы по одному префиксу нельзя было угадать, какой
// именно хэш искали), а сравнение оставшейся части хэша происходит
// уже локально. Тот же принцип, на котором построена платная функция
// Supabase — https://haveibeenpwned.com/API/v3#PwnedPasswords.
export async function isPasswordPwned(password: string): Promise<boolean | null> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      // Add-Padding — просит API подмешать в ответ случайные "пустые"
      // записи, чтобы размер ответа не выдавал косвенно, сколько
      // реальных совпадений было найдено (доп. защита приватности,
      // не влияет на логику ниже).
      headers: { "Add-Padding": "true" },
    });

    // API недоступен/упал — не блокируем регистрацию из-за стороннего
    // сервиса: эта проверка дополнительная, а не единственная линия
    // защиты (см. вызывающий код — там уже есть минимальная длина и
    // сам Supabase). null отдельно от false, чтобы вызывающий код мог
    // при желании отличить "точно не в утечках" от "не удалось
    // проверить", даже если сейчас оба случая ведут себя одинаково.
    if (!res.ok) return null;

    const text = await res.text();
    return text
      .split("\n")
      .some((line) => line.split(":")[0].trim() === suffix);
  } catch {
    return null;
  }
}
