// ═══════════════════════════════════════════════════════════════
// Контент дневного дайджеста — целиком статический, без ИИ и без
// инфраструктуры (см. договорённость: платформа ещё до 1500
// пользователей, никаких платных LLM-вызовов на каждый визит).
//
// Ирония "меняется каждый день" не потому что где-то есть крон или
// генерация — а потому что из заранее написанного пула строк каждый
// день детерминированно берётся своя, по номеру дня в году. У каждого
// пула своя длина, так что они естественно расходятся по фазе и не
// повторяются синхронно. 1 января следующего года всё начнётся заново
// с индекса 0 — это осознанный компромисс, не баг.
// ═══════════════════════════════════════════════════════════════

export interface Bilingual {
  en: string;
  ru: string;
}

/** Возвращает детерминированный индекс в пуле длины poolLength для
 *  переданной даты (UTC, без крона) — один и тот же для всех
 *  посетителей в течение суток, и автоматически другой на следующий. */
export function getDigestDayIndex(poolLength: number, date: Date = new Date()): number {
  if (poolLength <= 0) return 0;
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayOfYear = Math.round((today - startOfYear) / 86_400_000);
  return dayOfYear % poolLength;
}

// ── Шапка-девиз (masthead tagline) — вместо классического "Daily News" ──
export const DIGEST_TAGLINES: Bilingual[] = [
  { en: "All the bugs fit to print.", ru: "Все баги, достойные внимания." },
  { en: "Read by QAs, ignored by the build.", ru: "Читают QA, игнорирует сборка." },
  { en: "Yesterday's incident is today's postmortem.", ru: "Вчерашний инцидент — сегодняшний постмортем." },
  { en: "Now with 20% fewer false positives.", ru: "Теперь на 20% меньше ложных срабатываний." },
  { en: "Independently verified by nobody, as usual.", ru: "Независимо проверено никем, как обычно." },
  { en: "Works on our machine.", ru: "Работает на нашей машине." },
  { en: "The one changelog you'll actually read.", ru: "Единственный changelog, который вы реально прочитаете." },
  { en: "Freshly deployed, allegedly stable.", ru: "Свежедеплоено, предположительно стабильно." },
  { en: "Zero dependencies on your mood.", ru: "Ноль зависимостей от вашего настроения." },
  { en: "Covering the news, not the code coverage.", ru: "Освещаем новости, не покрытие кода." },
  { en: "Peer-reviewed by absolutely nobody.", ru: "Прошло ревью ровно нуля коллег." },
  { en: "No AI was harmed writing this — none was involved.", ru: "Ни один ИИ не пострадал при написании — он тут и не участвовал." },
  { en: "Shipped before the tests finished running.", ru: "Выкатили раньше, чем домчались тесты." },
  { en: "Today's forecast: mostly green, chance of flaky.", ru: "Прогноз на сегодня: в основном зелёно, местами нестабильно." },
  { en: "Best viewed in a browser that actually supports CSS.", ru: "Лучше всего смотрится в браузере, который правда умеет в CSS." },
  { en: "Your daily dose of scope creep.", ru: "Ваша дневная доза расползания скоупа." },
];

// ── Прощальная строка внизу страницы ──
export const DIGEST_SIGNOFFS: Bilingual[] = [
  { en: "Go forth and file a ticket.", ru: "Идите и заведите тикет." },
  { en: "May your regression suite stay green.", ru: "Пусть ваш регресс остаётся зелёным." },
  { en: "See you tomorrow, same bugs, different day.", ru: "До завтра — те же баги, другой день." },
  { en: "Now back to your actual sprint.", ru: "А теперь обратно к настоящему спринту." },
  { en: "That's all the news that's fit to reproduce.", ru: "Это все новости, которые удалось воспроизвести." },
  { en: "This digest was tested in production.", ru: "Этот дайджест протестирован прямо в продакшене." },
  { en: "Until tomorrow — don't merge on Friday.", ru: "До завтра — не мерджите по пятницам." },
  { en: "End of transmission. Retry count: 0.", ru: "Конец передачи. Счётчик ретраев: 0." },
  { en: "No cliffhanger — just go fix that bug you're avoiding.", ru: "Без интриги на завтра — просто почините тот баг, который избегаете." },
  { en: "This message will not repeat itself. Unlike your bug.", ru: "Это сообщение не повторится. В отличие от вашего бага." },
  { en: "Closing tab count: still too many.", ru: "Количество открытых вкладок: всё ещё слишком много." },
  { en: "Reminder: it's not a hack if it's in a config file.", ru: "Напоминание: это не костыль, если он в конфиге." },
];

// ── Факт / шутка дня — смесь реальных историй индустрии и юмора ──
export const DIGEST_FACTS: Bilingual[] = [
  { en: "The word \"bug\" predates computers, but the first documented computer bug was literal: in 1947, engineers found a moth trapped in a relay of the Harvard Mark II and taped it into the logbook.", ru: "Слово «баг» старше компьютеров, но первый задокументированный компьютерный баг был буквальным: в 1947 году инженеры нашли мотылька, застрявшего в реле Harvard Mark II, и вклеили его в журнал." },
  { en: "In 1999, NASA's Mars Climate Orbiter burned up in the Martian atmosphere because one team used imperial units (pound-force) and another used metric (newtons) — a $327 million unit-conversion bug.", ru: "В 1999 году зонд NASA Mars Climate Orbiter сгорел в атмосфере Марса, потому что одна команда использовала имперские единицы (фунт-сила), а другая — метрические (ньютоны). Баг на конвертации единиц стоимостью $327 млн." },
  { en: "The Ariane 5 rocket exploded 37 seconds after launch in 1996 — a 64-bit float was converted to a 16-bit integer, overflowed, and the resulting exception wasn't handled.", ru: "Ракета Ariane 5 взорвалась через 37 секунд после старта в 1996 году — 64-битное число с плавающей точкой конвертировали в 16-битное целое, произошло переполнение, а исключение никто не обработал." },
  { en: "\"There are only two hard things in Computer Science: cache invalidation, naming things, and off-by-one errors\" — the joke's punchline being that the list itself has an off-by-one error.", ru: "«В программировании есть только две сложные вещи: инвалидация кэша, именование сущностей и ошибки на единицу» — соль шутки в том, что список сам содержит ошибку на единицу." },
  { en: "RFC 2549 formally specifies \"IP over Avian Carriers\" — transmitting internet packets via carrier pigeon, including a section on quality of service.", ru: "RFC 2549 официально описывает «IP поверх птиц-носителей» — передачу интернет-пакетов почтовыми голубями, включая раздел про качество обслуживания." },
  { en: "A 2012 Y2K-style bug hit some Windows systems on leap day: certain Azure VMs and Windows Phones crashed because their activation logic assumed no year could have 366 days.", ru: "В 2012 году баг в стиле Y2K поразил часть систем Windows в день високосного 29 февраля: некоторые Azure VM и Windows Phone падали, потому что логика активации не допускала года с 366 днями." },
  { en: "The Therac-25 radiation therapy machine gave several patients massive overdoses in the 1980s due to a race condition between two input threads — a stark reminder that \"it works most of the time\" isn't a test strategy.", ru: "Аппарат лучевой терапии Therac-25 в 1980-х дал нескольким пациентам огромные передозировки облучения из-за состояния гонки между двумя потоками ввода — напоминание, что «обычно работает» не тест-стратегия." },
  { en: "In 2038, systems that store time as a signed 32-bit number of seconds since 1970 will overflow — the so-called \"Year 2038 problem,\" Y2K's sequel that QA teams are already quietly testing for.", ru: "В 2038 году системы, хранящие время как 32-битное знаковое число секунд с 1970 года, переполнятся — так называемая «проблема 2038 года», сиквел Y2K, который QA-команды уже тихонько тестируют." },
  { en: "The infamous \"500 mile email\" bug was real: a university's Sendmail config rejected outgoing mail if the recipient was calculated (via a timeout formula involving distance) to be more than 500 miles away.", ru: "Легендарный баг «письмо дальше 500 миль» был реальным: конфигурация Sendmail в одном университете отклоняла исходящую почту, если по формуле таймаута получатель «считался» дальше 500 миль." },
  { en: "A single misplaced comma is the most common syntax error reported across public Stack Overflow JSON questions — trailing commas remain undefeated.", ru: "Одна лишняя запятая — самая частая синтаксическая ошибка в вопросах про JSON на Stack Overflow. Висящая запятая в конце объекта непобедима." },
  { en: "\"It's not a bug, it's a feature\" has its own Wikipedia-documented history going back to at least 1980s hacker culture, usually said with exactly zero sincerity.", ru: "У фразы «это не баг, это фича» есть своя задокументированная история, уходящая как минимум в хакерскую культуру 1980-х — и говорится она обычно без единой капли искренности." },
  { en: "The term \"heisenbug\" describes a bug that disappears or changes behavior when you try to study it — usually by adding a print statement or opening devtools.", ru: "Термин «гейзенбаг» описывает баг, который исчезает или меняет поведение, как только вы пытаетесь его изучить — обычно достаточно добавить print или открыть devtools." },
  { en: "Excel has a well-known bug where certain gene names (like \"SEPT1\" or \"MARCH1\") get silently auto-converted to dates — serious enough that some genomics journals now require renaming affected genes.", ru: "У Excel есть известный баг: некоторые названия генов (вроде «SEPT1» или «MARCH1») он тихо превращает в даты — настолько серьёзно, что часть научных журналов по геномике теперь требует переименовывать такие гены." },
  { en: "\"Works on my machine\" has become such a universal phrase in software culture that there are entire merch lines built around it — Docker exists, in part, to make that excuse harder to use.", ru: "«У меня работает» стала настолько универсальной фразой, что вокруг неё существует целая индустрия мерча — Docker отчасти придуман, чтобы эту отговорку было сложнее произнести." },
  { en: "The QWERTY-adjacent \"Konami Code\" (↑↑↓↓←→←→BA) was originally added to a game as a developer testing shortcut and was never meant to ship — it leaked into the final release anyway.", ru: "«Konami Code» (↑↑↓↓←→←→BA) изначально был добавлен в игру как отладочный шорткат для разработчиков и не должен был попасть в релиз — но всё равно туда просочился." },
  { en: "Boundary value testing exists because off-by-one errors are, by a wide margin, the single most common class of logic bug across every language ever studied.", ru: "Тестирование граничных значений существует потому, что ошибки на единицу — с большим отрывом самый частый класс логических багов во всех когда-либо изученных языках." },
  { en: "The first ever pop-up ad (1994, for AT&T) had a 44% click-through rate — a number no banner ad has come close to since, mostly because everyone immediately learned to hate pop-ups.", ru: "У самого первого поп-ап баннера (1994, реклама AT&T) был CTR 44% — с тех пор ни один баннер к этому даже не приблизился, в основном потому что все моментально научились ненавидеть поп-апы." },
  { en: "A leap second was added to UTC in 2012 and briefly crashed Reddit, Mozilla, and several Linux systems due to a kernel bug in how the extra second was handled.", ru: "В 2012 году в UTC добавили високосную секунду, и она ненадолго уронила Reddit, Mozilla и несколько систем на Linux — из-за бага в ядре в обработке этой лишней секунды." },
  { en: "The phrase \"garbage in, garbage out\" was coined in the 1950s by early computing instructors trying to explain to students why blaming the computer for bad input data made no sense.", ru: "Фраза «мусор на входе — мусор на выходе» появилась в 1950-х, когда преподаватели ранней информатики пытались объяснить студентам, что винить компьютер за плохие входные данные бессмысленно." },
  { en: "Regression testing gets its name from statistics, not from \"things regressing\" — it originally meant re-running tests to confirm a fix didn't make anything \"regress\" to a worse state.", ru: "Термин «регрессионное тестирование» пришёл не из идеи «всё откатилось», а обозначал повторный прогон тестов, чтобы убедиться, что фикс не заставил что-то ещё «регрессировать» в худшее состояние." },
  { en: "A single unescaped apostrophe in a name field is still, decades after \"Little Bobby Tables,\" one of the most common ways real production databases get accidentally broken by real users.", ru: "Один неэкранированный апостроф в поле имени до сих пор, спустя десятилетия после «маленького Бобби Таблиц», остаётся одним из самых частых способов случайно сломать боевую базу — обычным пользователем." },
  { en: "The HTTP status code 418 (\"I'm a teapot\") was defined in a 1998 April Fools' RFC and, decades later, is still implemented as a real, working status code by major frameworks and even Google.", ru: "HTTP-код 418 («Я чайник») был описан в шуточном RFC на первое апреля 1998 года — и десятилетия спустя до сих пор реально реализован как рабочий статус-код в крупных фреймворках и даже у Google." },
  { en: "Chaos engineering — deliberately breaking production to see what happens — was pioneered by Netflix's \"Chaos Monkey,\" a tool that randomly kills live servers on purpose, during business hours.", ru: "Chaos engineering — намеренная поломка продакшена, чтобы посмотреть что будет — придумана Netflix и их «Chaos Monkey», инструментом, который случайно убивает боевые серверы прямо в рабочее время, специально." },
  { en: "The average developer spends significantly more time reading existing code than writing new code — which is the entire argument for naming your variables like an adult.", ru: "Средний разработчик тратит значительно больше времени на чтение существующего кода, чем на написание нового — это и есть весь аргумент в пользу того, чтобы называть переменные по-человечески." },
  { en: "Postel's Law — \"be conservative in what you send, liberal in what you accept\" — from a 1980 RFC, is quietly why the modern web tolerates so much broken HTML without falling over.", ru: "Закон Постела — «будь консервативен в том, что отправляешь, и либерален в том, что принимаешь» — из RFC 1980 года — тихо объясняет, почему современный веб терпит столько битого HTML и не разваливается." },
  { en: "The term \"rubber duck debugging\" is a real, documented technique: explaining your code line-by-line to an inanimate object (traditionally a rubber duck) reliably surfaces the bug before you finish the sentence.", ru: "«Отладка через резиновую уточку» — реальная, задокументированная техника: объясняя свой код построчно неодушевлённому предмету (традиционно резиновой уточке), баг находится ещё до конца фразы." },
  { en: "A famous 1994 Intel Pentium bug caused rare floating-point division errors — Intel initially downplayed it, then took a $475 million charge to recall and replace affected chips.", ru: "Известный баг Intel Pentium 1994 года вызывал редкие ошибки в делении чисел с плавающей точкой — Intel сначала преуменьшала проблему, а затем списала $475 млн на отзыв и замену затронутых чипов." },
  { en: "Fuzz testing — throwing huge volumes of random or malformed input at a program to see what breaks — has found real, serious security vulnerabilities in software as mature as OpenSSL and the Linux kernel.", ru: "Фаззинг-тестирование — заброс огромных объёмов случайного или некорректного ввода в программу, чтобы посмотреть, что сломается — находил реальные серьёзные уязвимости даже в таком зрелом софте, как OpenSSL и ядро Linux." },
  { en: "\"YAGNI\" (You Aren't Gonna Need It) is an Extreme Programming principle from the late 1990s, invented specifically to stop developers from building configurable, \"future-proof\" systems nobody asked for.", ru: "«YAGNI» (тебе это не понадобится) — принцип Extreme Programming конца 1990-х, придуманный специально, чтобы останавливать разработчиков от постройки гибких «на будущее» систем, которые никто не просил." },
  { en: "Windows 95 shipped with a bug where the system clock would drift if you left the machine running continuously for 49.7 days — the exact overflow point of a 32-bit millisecond counter.", ru: "В Windows 95 был баг, из-за которого системные часы «плыли», если машина работала без перезагрузки 49.7 дня подряд — ровно точка переполнения 32-битного счётчика миллисекунд." },
  { en: "The \"broken windows theory\" gets applied to codebases too: one un-fixed lint warning or one skipped test tends to make the next one feel acceptable, and technical debt compounds from there.", ru: "«Теорию разбитых окон» применяют и к кодовым базам: одно неисправленное предупреждение линтера или один пропущенный тест делают следующий такой же пропуск приемлемым — и технический долг растёт по цепочке." },
  { en: "A single missing null check in Boeing's 737 MAX MCAS software — reacting to one faulty sensor instead of comparing two — was central to two fatal 2018-2019 crashes, reshaping how the industry treats single points of failure.", ru: "Одна отсутствующая проверка на единственный неисправный датчик (вместо сверки с двумя) в системе MCAS Boeing 737 MAX сыграла ключевую роль в двух катастрофах 2018-2019 годов — и изменила подход индустрии к единым точкам отказа." },
  { en: "The original \"World Wide Web\" project proposal was rejected by Tim Berners-Lee's supervisor in 1989 with the handwritten note \"vague, but exciting.\"", ru: "Первое предложение проекта «Всемирная паутина» руководитель Тима Бернерса-Ли в 1989 году отклонил с рукописной пометкой «расплывчато, но интересно»." },
  { en: "\"Test-driven development\" — writing the failing test before the code that makes it pass — was popularized by Kent Beck in the early 2000s as part of Extreme Programming, not invented from scratch.", ru: "«Разработка через тестирование» — сначала пишем падающий тест, потом код, который его чинит — популяризовал Кент Бек в начале 2000-х в рамках Extreme Programming, а не изобрёл с нуля." },
  { en: "A 2017 bug in npm's `left-pad` package — 11 lines of code — was removed by its author, and it broke builds across thousands of major projects worldwide within hours.", ru: "В 2017 году автор npm-пакета `left-pad» (11 строк кода) удалил его — и за считаные часы это сломало сборки тысяч крупных проектов по всему миру." },
  { en: "The idiom \"canary in a coal mine\" gave its name to canary deployments — releasing a change to a small slice of real traffic first, so problems surface before the whole userbase is affected.", ru: "Идиома «канарейка в шахте» дала имя canary-деплоям — выкатке изменения сначала на маленький срез реального трафика, чтобы проблема всплыла раньше, чем затронет всех пользователей." },
  { en: "Feature flags predate modern SaaS by decades — IBM mainframe software used toggleable code paths as early as the 1970s to ship code dark and turn it on later.", ru: "Feature-флаги появились задолго до современного SaaS — софт для мейнфреймов IBM использовал переключаемые ветки кода ещё в 1970-х, чтобы выкатывать код «втёмную» и включать его позже." },
  { en: "The \"pesticide paradox\" in testing states that running the exact same test suite repeatedly eventually stops finding new bugs — not because the software is bug-free, but because the tests only cover what they already covered.", ru: "«Парадокс пестицида» в тестировании гласит: если прогонять один и тот же набор тестов раз за разом, он рано или поздно перестаёт находить новые баги — не потому что софт без багов, а потому что тесты покрывают только то, что уже покрывали." },
  { en: "GitHub's own status page once went down at the same time as GitHub itself, which meant the page meant to tell you GitHub was down couldn't tell you GitHub was down.", ru: "Страница статуса GitHub однажды упала одновременно с самим GitHub — то есть страница, которая должна была сообщить, что GitHub лежит, тоже лежала." },
  { en: "\"Dogfooding\" — using your own product internally before shipping it — reportedly got its name from a 1980s Alpo commercial tagline and a Microsoft executive's internal email urging the team to \"eat our own dog food.\"", ru: "«Dogfooding» — использование собственного продукта внутри компании до релиза — по легенде получило название от слогана рекламы корма Alpo в 1980-х и внутреннего письма менеджера Microsoft с призывом «есть свой собственный корм для собак»." },
  { en: "A misconfigured robots.txt file can accidentally deindex an entire production website from every search engine — with no error, no crash, and no alert, just slowly vanishing traffic.", ru: "Неправильно настроенный robots.txt может случайно выкинуть весь боевой сайт из индекса всех поисковиков — без единой ошибки, без падения и без алерта, просто медленно исчезающим трафиком." },
];

// ── Вступление к "инструменту дня" — независимо от того, какой именно
// инструмент выпадет по ротации, так что 87 инструментов не нужно
// обеспечивать 87 отдельными шутками ──
export const DIGEST_TOOL_INTROS: Bilingual[] = [
  { en: "Today's featured tool, chosen by an algorithm that does not care about your feelings:", ru: "Инструмент дня, выбранный алгоритмом, которому плевать на ваши чувства:" },
  { en: "In today's \"things you'll open in a panic at 5pm\" segment:", ru: "В сегодняшней рубрике «то, что вы откроете в панике в 18:00»:" },
  { en: "Rotated into the spotlight today, whether it asked for it or not:", ru: "Сегодня в свете софитов оказался — не спрашивали, но вот так вышло:" },
  { en: "The tool the digest recommends you bookmark and then forget about until you need it:", ru: "Инструмент, который дайджест советует добавить в закладки и забыть до момента, когда понадобится:" },
  { en: "Today's pick from the catalog — no sponsorship, it's all the same product:", ru: "Сегодняшний выбор из каталога — без спонсорства, продукт-то один и тот же:" },
  { en: "Featured today because the rotation said so, and the rotation doesn't lie:", ru: "В центре внимания сегодня — потому что так решила ротация, а ротация не врёт:" },
  { en: "One tool, zero excuses to keep doing it by hand:", ru: "Один инструмент, ноль оправданий продолжать делать это руками:" },
  { en: "Today's reminder that you already have this tool and keep forgetting:", ru: "Сегодняшнее напоминание, что этот инструмент у вас уже есть, но вы о нём забываете:" },
  { en: "Spotlight of the day, entirely unrelated to whatever's currently on fire for you:", ru: "Инструмент дня, никак не связанный с тем, что у вас сейчас горит:" },
  { en: "Today's tool, for the problem you'll have in approximately three hours:", ru: "Сегодняшний инструмент — для проблемы, которая у вас будет примерно через три часа:" },
  { en: "The catalog is 80+ tools deep. Today, this one gets to be seen:", ru: "В каталоге 80+ инструментов. Сегодня повезло вот этому:" },
  { en: "Digest editors' pick, where \"editors\" means Math.random with extra steps:", ru: "Выбор редакции дайджеста, где «редакция» — это Math.random с лишними шагами:" },
];

// ── Заголовок блока "Зал славы" — короткие подписи, ротируются реже ──
export const DIGEST_LEADERBOARD_INTROS: Bilingual[] = [
  { en: "People with more self-discipline than the digest editors:", ru: "Люди с большей самодисциплиной, чем у редакции дайджеста:" },
  { en: "The streak keeps going. Unclear if that's healthy.", ru: "Стрик продолжается. Неясно, насколько это здорово." },
  { en: "Today's reminder that someone out there hasn't missed a single day:", ru: "Сегодняшнее напоминание, что кто-то там ни разу не пропустил день:" },
  { en: "Ranked by consistency, not by being right on the first try:", ru: "Рейтинг по постоянству, а не по тому, кто угадал с первого раза:" },
];
