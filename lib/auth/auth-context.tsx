"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isConfigured: boolean;
  isSigningOut: () => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: false,
  signOut: async () => {},
  isConfigured: false,
  isSigningOut: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const isConfigured = !!supabase;

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(
      ({ data }: { data: { session: import("@supabase/supabase-js").Session | null } }) => {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
      }
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: import("@supabase/supabase-js").Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // Зачем этот ref, а не просто вызывать signOut() напрямую отовсюду
  // ═══════════════════════════════════════════════════════════════
  // На /profile есть свой обязательный редирект на /auth/login, когда
  // пользователь оказывается разлогинен — это защита закрытой страницы
  // (см. app/[locale]/profile/page.tsx), она должна срабатывать, если
  // человек ЗАШЁЛ на /profile уже разлогиненным (например, напрямую по
  // ссылке в другой вкладке). Но если человек СЕЙЧАС находится на
  // /profile и сам нажал "Sign out" в шапке сайта — тот же самый защитный
  // редирект начинает спорить с обычным переходом "после выхода — на
  // главную", который делает шапка. Кто из двух router.push "победит" —
  // не гарантировано (пробовали чинить очерёдностью через await/без
  // await — ненадёжно, гонка иногда всё равно проигрывалась).
  //
  // Правильное решение — не бороться со скоростью, а явно сказать
  // защитному редиректу "не сейчас, это не тот случай": signingOutRef
  // становится true в САМЫЙ первый момент вызова signOut() (синхронно,
  // до любых сетевых и асинхронных действий). Пока он true, защитный
  // редирект на /profile сам отступает и ничего не делает, зная что
  // навигацией уже занимается тот, кто вызвал signOut().
  //
  // ВАЖНО про то, когда сбрасывать флаг обратно в false — с первого
  // раза сделал это неправильно: сбрасывал прямо в finally, сразу как
  // только резолвился await supabase.auth.signOut(). Выглядело логично,
  // но не сработало: и resolve этого промиса, и наш finally — это
  // микрозадачи (microtask), они выполняются практически мгновенно
  // одна за другой. А вот сам useEffect на /profile, который должен
  // ПРОЧИТАТЬ этот флаг, React выполняет как "passive effect" — это
  // отдельная очередь задач браузера, которая обрабатывается ПОЗЖЕ
  // всех микрозадач. Получалось: flag успевал сброситься в false ещё
  // до того, как /profile вообще успевала его проверить — защита
  // срабатывала как будто signOut() и не вызывался.
  //
  // Поэтому сбрасываем через setTimeout — это гарантированно откладывает
  // сброс до следующей "макрозадачи", то есть заведомо ПОСЛЕ того как
  // React успеет прогнать все эффекты от текущего изменения user. Пары
  // сотен миллисекунд с запасом человек всё равно не заметит — он в
  // этот момент уже смотрит на новую страницу.
  const signingOutRef = useRef(false);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    signingOutRef.current = true;
    try {
      await supabase.auth.signOut();
    } finally {
      setTimeout(() => { signingOutRef.current = false; }, 500);
    }
  }, [supabase]);

  const isSigningOut = useCallback(() => signingOutRef.current, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, isConfigured, isSigningOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
