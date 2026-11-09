# Промты для Nano Banana 2 — эмблемы аватарки Wrench-Branch

Это не файл проекта — справочник для генерации картинок. Готовые PNG нужно
положить в `public/avatars/emblems/` под именами ниже — код (`lib/profile-emblems.ts`,
`components/profile/AvatarGlyph.tsx`) их уже ждёт именно там и по этим именам.
Пока картинки нет — на её месте просто показывается инициал, как раньше,
ничего не ломается, так что можно генерировать не всё сразу, а по одной.

Это вторая версия файла — после того, как решили, что первый набор (просто
жук, просто лупа и т.д.) скучный. Ниже — 16 придуманных вместе концептов,
каждый со своим характером/отсылкой, плюс готовые промты под каждый.

## Итоговый список концептов (для быстрой сверки)

| Файл | Концепт |
|---|---|
| `bug.png` | Жук-убийца в духе Nix Assassin (Warcraft 3) — клинки вместо лап, кровь |
| `terminal.png` | Древний терминал в духе SCP-079 — злой ИИ в старом CRT-корпусе |
| `wrench.png` | Гаечный ключ «из говна и палок» — кустарная сборка |
| `shield.png` | Щит как фрагмент древней замшелой каменной стены |
| `magnifier.png` | Лупа-прицел — охота на баги |
| `flask.png` | Колба алхимика — отсылка на Acid Bomb Алхимика (Warcraft 3) |
| `gear.png` | Двемерская шестерня (Skyrim) с самоцветом-накопителем |
| `lightning.png` | Короткое замыкание — оголённые провода, рваный разряд |
| `keyboard-key.png` | Клавиша с надписью «+RESPECT» — отсылка на GTA |
| `rocket.png` | Зонд Voyager-1 с антенной-тарелкой и далёкой планетой |
| `database.png` | База данных «прод», обмотанная цепью с замком |
| `chip.png` | Микрочип с «цифровым дождём» — отсылка на Матрицу |
| `flame.png` | Горящий мусорный контейнер — дамстер-файр |
| `owl.png` | Мутировавшая сова из Fallout — светящиеся радиацией глаза |
| `ghost.png` | Призрак сотрудника, который умер за работой и продолжает печатать |
| `satellite.png` | Заменён на взрыв сверхновой звезды — единственная многоцветная эмблема |

`satellite.png` по смыслу теперь не спутник, а сверхновая — имя файла и id в
коде трогать не обязательно (это просто идентификатор), но если хочешь, могу
отдельно поправить подписи «Satellite/Спутник» → «Supernova/Сверхновая» в
`lib/profile-emblems.ts`, скажи отдельно, это мелкая правка.

## Технические требования

Эмблема ложится ПОВЕРХ одного из 10 цветов аватарки, поэтому база одна и та
же для всех 16:

- Прозрачный PNG (альфа-канал), не залитый квадрат.
- Простой узнаваемый силуэт без мелких деталей — картинка используется очень
  маленькой, мелкие детали пропадут.
- Квадратный холст 1024x1024, силуэт не упирается в края.
- Без водяных знаков, без лишнего текста (кроме одного явного исключения
  ниже).
- Единая толщина линий и степень геометрического упрощения на весь набор —
  чтобы 16 эмблем смотрелись одной коллекцией, а не случайным набором картинок.

Отличие от первой версии: раньше весь набор был строго одноцветным
(только #F8F8FB). Теперь часть эмблем — с одним акцентным цветом детали
(кровь, мох, свечение и т.п.), эмблема `keyboard-key` — с текстом
(единственное исключение из правила «без текста»), а `satellite`
(сверхновая) — единственная полностью многоцветная. Это осознанные
исключения, проговорённые отдельно по каждой иконке — не нужно их
унифицировать обратно.

## Пробуем одной генерацией — а если не выйдет, по одной

Набор стал заметно сложнее первой версии (у каждой эмблемы свой материал и
поза, у части — акцентный цвет, у одной — текст, у одной — сразу несколько
цветов), поэтому шанс, что модель на 16 разных сюжетах в одной картинке
что-то перепутает между соседними ячейками или подтянет не тот цвет не туда,
реально выше, чем был с прошлой простой версией. Но раз хочешь попробовать —
вот цельный промт на сетку 4x4 ниже. Если какие-то конкретные ячейки выйдут
плохо (слились детали, не тот цвет, задвоился текст) — не нужно
перегенерировать всё заново, просто возьми промт именно этой эмблемы из
раздела «Готовые промты — по одному на эмблему» дальше в файле и перегенерируй
только её отдельно, стиль будет тот же.

### Промт на сетку 4x4 (все 16 одной генерацией)

```
Create a single square image containing a clean 4x4 grid of 16 separate
icon-style emblems, arranged in 4 rows of 4, evenly spaced with generous,
equal padding between and around every cell so each icon sits fully
isolated within its own cell with nothing touching the edges of its cell or
the edges of neighboring icons. Do not draw any grid lines, borders,
numbers, or labels anywhere in the image — only the 16 icons themselves on
a plain background. The ONLY text allowed anywhere in the entire image is
the word "+RESPECT", which appears inside icon #9 (row 3, column 1) only —
no other icon contains any text or letters of any kind.

Every icon must be a minimalist flat icon/emblem in the same overall
visual style: a bold, clean silhouette, rendered as a solid, smooth,
slightly geometric vector-style illustration — NOT photorealistic, NOT 3D,
NOT a photo, NOT line-art. By default, every icon's silhouette is a single
solid off-white fill color (#F8F8FB) with no gradients, no outlines of a
different color, no drop shadows, no textures — EXCEPT where a specific
accent color is called out for that icon below, which must be the ONLY
extra color in that one cell (everything else in that cell stays
off-white). The entire background of the whole image, both between icons
and around the outer edge, must be fully transparent (PNG with alpha
channel) — not white, not black, not any solid color. Every icon must be
instantly recognizable as a small silhouette even scaled down to 64x64
pixels — keep the same line weight and the same level of geometric
simplification across all 16 icons so they read as one matched,
professionally designed set of collectible profile-avatar badges for a
developer/QA tools website, even though each icon has its own distinct
character, pose and subject.

Canvas: exactly 2048x2048 pixels, so each of the 16 cells is exactly
512x512 pixels.

Row 1:
(1) A monstrous insect assassin creature in a low predatory crouching
pose, with a segmented spiked armored carapace, narrow glowing slit eyes,
and two curved blade-like scythes in place of front legs, held ready to
strike. Off-white silhouette, EXCEPT thin drips of blood on the blade tips
and a small pool beneath its feet, rendered in deep red — the only accent
color in this cell.
(2) An old ominous CRT computer terminal with a bulky retro monitor body,
rounded shoulders, a slightly convex screen showing dense glitchy static
that vaguely suggests a single watching eye, and one or two cable tendrils
reaching outward from its base at odd bent angles. Entirely off-white
silhouette, no other colors.
(3) An adjustable wrench that looks crudely improvised from mismatched
scrap parts: the handle wrapped in uneven overlapping cloth/tape layers
with a few crooked nails sticking out at odd angles, the wrench head welded
on slightly askew with rough uneven edges. Entirely off-white silhouette,
no other colors.
(4) A shield-shaped emblem textured as a fragment of an ancient weathered
stone wall: rough uneven stone blocks with visible mortar joints, chipped
corners, a checkmark shape carved crudely into the stone like an ancient
rune. Off-white stone silhouette, EXCEPT small clumps of moss growing out
of the cracks near the bottom and edges, rendered in muted olive-green —
the only accent color in this cell.

Row 2:
(5) A hybrid between a magnifying glass and a sniper scope: a thick
angular lens ring with a crosshair inside it instead of plain glass, a
small checkmark at the exact center of the crosshair, a short sturdy
angular handle. Entirely off-white silhouette, no other colors.
(6) A laboratory erlenmeyer flask tilted at an angle as if about to be
thrown, filled with bubbling acid: one or two ragged corroded holes eaten
through the glass near the bottom with drips running down, thick fumes
rising from the neck shaped to vaguely suggest a menacing shape within the
smoke. Off-white glass silhouette, EXCEPT the liquid inside, the drips, and
the fumes, rendered in bright acidic yellow-green — the only accent color
in this cell.
(7) An ornate brass clockwork gear made of two nested rings of teeth (an
outer ring of many small fine teeth, an inner ring of fewer larger teeth),
with fine radial engraved line patterns on the band between them, and a
small round crystal shape at the exact center. Off-white metal silhouette,
EXCEPT the small central crystal, glowing warm amber-orange — the only
accent color in this cell.
(8) An electrical short circuit: two bent, twisted bare wire ends with
stripped, curling insulation, touching each other, with a jagged
multi-pronged spark bursting outward from the point of contact in several
irregular directions, not one clean diagonal bolt. Entirely off-white
silhouette, no other colors.

Row 3:
(9) A single rounded-square mechanical keyboard keycap, viewed at a
slight angle, with bold heavy condensed all-caps text reading "+RESPECT"
filling most of its face (this is the ONLY text anywhere in the entire
2048x2048 image — every other cell must contain zero text or letters).
Keycap body off-white, EXCEPT the "+RESPECT" text and a soft glow directly
around it, rendered in bright green — the only accent color in this cell.
(10) A space probe inspired by the Voyager 1 spacecraft, drifting in
space with no flame or exhaust trail: a large circular parabolic dish
antenna as the dominant shape, a smaller hexagonal probe body behind it,
one long thin straight boom arm extending outward to the side. Probe
silhouette off-white, plus in the far corner of this cell, away from the
probe, one small distant abstract planet (a simple circle, optionally with
a thin ring across it), rendered in deep violet-purple — the only accent
color in this cell.
(11) A classic database icon — a stack of three ellipse-topped cylinder
discs — leaning at a slight precarious angle, wrapped tightly with a heavy
chain and a padlock across the middle, rust streaks and a few dents on the
metal, a small crudely scratched prohibition symbol (a circle with a
diagonal line through it, not a letter) on one disc rim. Entirely off-white
silhouette, no other colors.
(12) A square microchip with small pin legs extending from its sides (one
corner pin replaced by a small circular jack/port shape with two or three
concentric rings around it), its face covered in several vertical
cascading line-streams of varying length, like falling code, instead of a
normal circuit-trace grid. Chip body and pins off-white, EXCEPT the
vertical falling code streams on its face, rendered in bright matrix-green
— the only accent color in this cell.

Row 4:
(13) A small rectangular dumpster/trash bin fully engulfed in fire, lid
flipped open, with several uneven jagged flame tongues of varying height
rising out of the open top and a puff of smoke curling above them. Entirely
off-white silhouette, no other colors.
(14) A small owl, front-facing, perched and alert, mutated by radiation:
feathers patchy and matted with a few small gaps revealing rough skin
underneath, talons larger and sharper than normal in a tense ready-to-
strike stance, a small dark radiation trefoil symbol worked subtly into the
silhouette as a marking on the chest or wing. Off-white body, EXCEPT its
two eyes, glowing sickly radioactive green — the only accent color in this
cell.
(15) A ghost: a slightly hunched, elongated rounded body with a wavy
flowing bottom edge instead of legs, both arms reaching forward at chest
height with fingers positioned as if typing on an invisible keyboard made
of the same ghostly material, two heavy half-closed tired eye-slits with no
other facial features, one small coffee mug shape hovering just beside it.
Entirely off-white silhouette, no other colors.
(16) A beautiful supernova explosion (NOT a satellite, NOT any kind of
spacecraft): a dense bright core at the center with asymmetric rays of
varying length and thickness bursting outward in an irregular,
organic-feeling starburst pattern, surrounded by two or three layered
rings/clouds of expanding material at different distances, outer layers
more sparse and broken-up than the dense inner ones. This is the ONLY cell
in the entire grid allowed to use multiple colors: render the central core
and innermost rays in warm bright gold-orange, blending smoothly outward
into cooler violet-blue for the outer rings/clouds and longer outer rays.
```

Позиция в сетке → имя файла. Таблица ниже — это буквально карта самой
картинки: каждая строка таблицы = один ряд картинки, читать слева направо.

|            | Колонка 1        | Колонка 2   | Колонка 3      | Колонка 4    |
|------------|------------------|-------------|----------------|--------------|
| **Ряд 1**  | bug              | terminal    | wrench         | shield       |
| **Ряд 2**  | magnifier        | flask       | gear           | lightning    |
| **Ряд 3**  | keyboard-key     | rocket      | database       | chip         |
| **Ряд 4**  | flame            | owl         | ghost          | satellite (сверхновая) |

То есть верхний левый значок на картинке — жук-убийца, правее него —
терминал, и так далее до конца ряда; нижний правый — сверхновая.

Пришли мне готовую картинку-сетку, когда сгенерируется — я сам нарежу на 16
файлов нужного размера с нужными именами и верну архивом, руками резать не
придётся.

---

## Готовые промты — по одному на эмблему (если сеткой не получится)

Каждый блок ниже самодостаточен — просто копируешь и вставляешь целиком в
Nano Banana 2, ничего дописывать не нужно. Пригодится, если какие-то
конкретные ячейки из сетки выше выйдут неудачно — перегенерируй только их.

### 1. `bug.png` — жук-убийца (Nix Assassin, Warcraft 3)

```
Create a minimalist flat icon/emblem of a monstrous insect assassin creature,
inspired by a blade-wielding insectoid warrior (in the visual spirit of a
Naga assassin unit from a fantasy strategy game). Bold, clean silhouette,
rendered as a solid, smooth, slightly geometric vector-style illustration —
NOT photorealistic, NOT 3D, NOT a photo, NOT line-art. The creature has a
low, predatory crouching stance (not symmetrical or calm), a segmented
armored carapace with sharp spikes along its back, narrow glowing slit eyes
with no pupils, and two curved blade-like scythes in place of front legs,
held ready to strike. The entire creature is rendered in a single solid
off-white fill color (#F8F8FB) — no gradients, no outlines of a different
color, no shading, no textures — EXCEPT for a small amount of blood: render
thin drips running down the tips of the blades and a small pool/splatter
beneath the creature's feet in a deep red color, as the one and only accent
color in the image. No text, no letters, no watermark. Square 1:1 canvas,
1024x1024, generous padding on all sides so the creature doesn't touch the
frame edges. Background must be fully transparent (PNG with alpha channel).
This is one emblem in a matched set of collectible profile-avatar badges for
a developer/QA tools website — keep the same line weight and geometric
simplification style as a cohesive icon set, instantly recognizable even at
64x64 pixels.
```

### 2. `terminal.png` — древний терминал (SCP-079)

```
Create a minimalist flat icon/emblem of an old, ominous CRT computer
terminal — visually inspired by a sentient hostile vintage mainframe/
terminal creature from science-fiction horror. Bold, clean silhouette,
solid smooth slightly geometric vector-style illustration — NOT
photorealistic, NOT 3D, NOT a photo, NOT line-art. The terminal has a bulky
retro CRT monitor body with rounded shoulders (not a thin modern flat
window), a slightly convex screen, and one or two thin cable-like tendrils
extending out from the bottom of its casing, bent outward asymmetrically
like reaching limbs rather than hanging neatly. On the screen, show a dense
block of small glitchy abstract symbols/static arranged so it vaguely
suggests a single watching eye or face within the noise, without drawing a
literal cartoon eye. The whole icon uses a single solid off-white fill color
(#F8F8FB) only — no gradients, no outline of a different color, no drop
shadows, no textures, no other colors anywhere. No text, no letters, no
watermark. Square 1:1 canvas, 1024x1024, generous padding on all sides.
Background fully transparent (PNG with alpha channel). Part of a matched
set of collectible profile-avatar badges for a developer/QA tools website —
same line weight and geometric simplification as the rest of the set,
instantly recognizable at 64x64 pixels.
```

### 3. `wrench.png` — ключ «из говна и палок»

```
Create a minimalist flat icon/emblem of an adjustable wrench that looks
crudely improvised and jury-rigged from mismatched scrap parts, rather than
a clean forged tool. Bold clean overall silhouette (still instantly
readable as a wrench), solid smooth slightly geometric vector-style
illustration — NOT photorealistic, NOT 3D, NOT a photo, NOT line-art. The
handle is wrapped in uneven overlapping layers of cloth/tape-like wrapping,
with a few crooked nails or screws sticking out at odd angles along its
length rather than flush. The wrench head looks asymmetrically welded on at
a slightly wrong angle, one jaw of the head visibly wider or more crooked
than the other, edges rough and uneven rather than smooth and machined. The
whole icon uses a single solid off-white fill color (#F8F8FB) only — no
gradients, no outline of a different color, no drop shadows, no textures,
no other colors. No text, no letters, no watermark. Square 1:1 canvas,
1024x1024, generous padding on all sides. Background fully transparent
(PNG with alpha channel). Part of a matched set of collectible
profile-avatar badges for a developer/QA tools website — same line weight
and geometric simplification as the rest of the set, instantly recognizable
at 64x64 pixels.
```

### 4. `shield.png` — щит из древней замшелой стены

```
Create a minimalist flat icon/emblem shaped like a shield, but textured as
a fragment of an ancient weathered stone wall rather than a forged metal
shield. Bold clean overall shield-shaped silhouette, solid smooth slightly
geometric vector-style illustration — NOT photorealistic, NOT 3D, NOT a
photo, NOT line-art. The surface reads as rough uneven stone blocks with
visible mortar joints, chipped corners, and one or two cracks running
across some of the blocks. A checkmark shape is carved crudely into the
stone like an ancient rune, with rough uneven edges rather than a smooth
printed checkmark. The stone silhouette itself is rendered in a single
solid off-white fill color (#F8F8FB) — no gradients, no other shading —
EXCEPT small clumps of moss growing out of the cracks and joints
(concentrated near the bottom and edges), rendered in a muted olive-green
color as the one and only accent color in the image. No text, no letters,
no watermark. Square 1:1 canvas, 1024x1024, generous padding on all sides.
Background fully transparent (PNG with alpha channel). Part of a matched
set of collectible profile-avatar badges for a developer/QA tools website —
same line weight and geometric simplification as the rest of the set,
instantly recognizable at 64x64 pixels.
```

### 5. `magnifier.png` — лупа-прицел

```
Create a minimalist flat icon/emblem that is a hybrid between a magnifying
glass and a sniper scope/crosshair — a hunting tool rather than an ordinary
desk magnifier. Bold clean silhouette, solid smooth slightly geometric
vector-style illustration — NOT photorealistic, NOT 3D, NOT a photo, NOT
line-art. The lens ring is thicker and more mechanical/angular than a
normal magnifying glass, with a crosshair (thin cross lines) inside the
lens instead of plain glass, and a small checkmark shape sits at the exact
center of the crosshair as the target mark. The handle is short, sturdy,
and slightly angular rather than a thin smooth rod. The whole icon uses a
single solid off-white fill color (#F8F8FB) only — no gradients, no outline
of a different color, no drop shadows, no textures, no other colors. No
text, no letters, no watermark. Square 1:1 canvas, 1024x1024, generous
padding on all sides. Background fully transparent (PNG with alpha
channel). Part of a matched set of collectible profile-avatar badges for a
developer/QA tools website — same line weight and geometric simplification
as the rest of the set, instantly recognizable at 64x64 pixels.
```

### 6. `flask.png` — колба алхимика (Acid Bomb, Warcraft 3)

```
Create a minimalist flat icon/emblem of a laboratory erlenmeyer flask
filled with dangerous bubbling acid, inspired by a toxic acid-bomb potion
thrown by an alchemist character in a fantasy strategy game. Bold clean
overall flask silhouette, solid smooth slightly geometric vector-style
illustration — NOT photorealistic, NOT 3D, NOT a photo, NOT line-art. The
flask is tilted at an angle as if about to be thrown, not standing upright
calmly. The glass has one or two ragged corroded holes eaten through it
near the bottom, with drips of liquid running down the outside of the glass
from the holes and from the neck. Thick fumes rise from the neck of the
flask, shaped so the cloud vaguely suggests a small skull or menacing shape
within the smoke, without drawing a literal cartoon skull. The flask's
glass outline itself is rendered in a single solid off-white fill color
(#F8F8FB) — EXCEPT the liquid inside, the drips, and the fumes, which are
rendered in a bright acidic yellow-green color as the one and only accent
color in the image. No text, no letters, no watermark. Square 1:1 canvas,
1024x1024, generous padding on all sides. Background fully transparent
(PNG with alpha channel). Part of a matched set of collectible
profile-avatar badges for a developer/QA tools website — same line weight
and geometric simplification as the rest of the set, instantly recognizable
at 64x64 pixels.
```

### 7. `gear.png` — двемерская шестерня (Skyrim)

```
Create a minimalist flat icon/emblem of an ornate brass clockwork gear
mechanism, inspired by the intricate ancient dwarven automaton machinery
from a fantasy RPG. Bold clean overall circular gear silhouette, solid
smooth slightly geometric vector-style illustration — NOT photorealistic,
NOT 3D, NOT a photo, NOT line-art. The gear is composed of two nested rings
of teeth — an outer ring of many small fine teeth, and a visible inner ring
of fewer, larger teeth — rather than one simple plain gear. The metal band
between the rings has fine radial engraved line patterns around its
circumference, like hand-tooled ornamental etching. At the exact center
sits a small round crystal/gem shape, distinct from the surrounding metal.
The gear's metal silhouette is rendered in a single solid off-white fill
color (#F8F8FB) — EXCEPT the small central crystal, which glows in a warm
amber-orange color as the one and only accent color in the image. No text,
no letters, no watermark. Square 1:1 canvas, 1024x1024, generous padding on
all sides. Background fully transparent (PNG with alpha channel). Part of a
matched set of collectible profile-avatar badges for a developer/QA tools
website — same line weight and geometric simplification as the rest of the
set, instantly recognizable at 64x64 pixels.
```

### 8. `lightning.png` — короткое замыкание

```
Create a minimalist flat icon/emblem depicting an electrical short circuit:
two bare stripped wire ends touching each other, with a violent spark
bursting outward from the point of contact. Bold clean overall silhouette,
solid smooth slightly geometric vector-style illustration — NOT
photorealistic, NOT 3D, NOT a photo, NOT line-art. The two wires are bent
and twisted, not straight, with their insulation stripped back and curling
away from the exposed tips. From the point where the bare wire tips touch,
draw a jagged, multi-pronged spark burst radiating outward in several
irregular directions (not one clean diagonal bolt) — like a real chaotic
electrical discharge. The whole icon uses a single solid off-white fill
color (#F8F8FB) only — no gradients, no outline of a different color, no
drop shadows, no textures, no other colors. No text, no letters, no
watermark. Square 1:1 canvas, 1024x1024, generous padding on all sides.
Background fully transparent (PNG with alpha channel). Part of a matched
set of collectible profile-avatar badges for a developer/QA tools website —
same line weight and geometric simplification as the rest of the set,
instantly recognizable at 64x64 pixels.
```

### 9. `keyboard-key.png` — клавиша «+RESPECT» (GTA)

Единственная эмблема с текстом — сознательное исключение (мелко и
только по-английски, обсуждали отдельно).

```
Create a minimalist flat icon/emblem of a single rounded-square mechanical
keyboard keycap, viewed at a slight angle. Bold clean overall keycap
silhouette, solid smooth slightly geometric vector-style illustration — NOT
photorealistic, NOT 3D, NOT a photo, NOT line-art. On the face of the
keycap, instead of a normal keyboard symbol, show the text "+RESPECT" in a
bold, heavy, condensed all-caps display font (similar to a video game
stat-increase notification), sized to fill most of the keycap face while
staying clearly legible. The keycap body is rendered in a single solid
off-white fill color (#F8F8FB). The "+RESPECT" text and a soft glow
directly around it are rendered in a bright green color as the one and only
accent color in the image. No other text, no other letters, no watermark.
Square 1:1 canvas, 1024x1024, generous padding on all sides. Background
fully transparent (PNG with alpha channel). Part of a matched set of
collectible profile-avatar badges for a developer/QA tools website — same
line weight and geometric simplification as the rest of the set, instantly
recognizable at 64x64 pixels (note: the text will only be legible at larger
sizes, that is expected for this one icon).
```

### 10. `rocket.png` — зонд Voyager-1

```
Create a minimalist flat icon/emblem of a space probe inspired by the
Voyager 1 spacecraft, drifting in space (not launching, no flame or
exhaust trail). Bold clean overall silhouette, solid smooth slightly
geometric vector-style illustration — NOT photorealistic, NOT 3D, NOT a
photo, NOT line-art. The dominant shape is a large circular parabolic dish
antenna, angled slightly, taking up the most visual weight in the icon.
Behind/below the dish sits a smaller hexagonal probe body. From the body,
one long thin straight boom arm extends outward to the side, far longer
than a normal antenna, like a magnetometer boom. The probe's silhouette is
rendered in a single solid off-white fill color (#F8F8FB). In the far
corner of the composition, away from the probe, place one small distant
abstract planet — a simple circle, optionally with a thin ring or band
across it — rendered in a deep violet-purple color as the one and only
accent color in the image. No text, no letters, no watermark. Square 1:1
canvas, 1024x1024, generous padding on all sides. Background fully
transparent (PNG with alpha channel). Part of a matched set of collectible
profile-avatar badges for a developer/QA tools website — same line weight
and geometric simplification as the rest of the set, instantly recognizable
at 64x64 pixels.
```

### 11. `database.png` — «прод», обмотанный цепью

```
Create a minimalist flat icon/emblem of a classic database icon — a stack
of three ellipse-topped cylinder discs — but wrapped tightly with a heavy
chain and a padlock across the middle, like something deliberately locked
away and forbidden to touch. Bold clean overall cylinder-stack silhouette,
solid smooth slightly geometric vector-style illustration — NOT
photorealistic, NOT 3D, NOT a photo, NOT line-art. The stack leans at a
slight precarious angle rather than standing perfectly upright. The metal
surface has streaks of rust/wear and a few dents. On one of the disc rims,
show a small crudely scratched warning symbol — a circle with a diagonal
line through it, like a simple prohibition sign (not a letter or word). A
thick chain wraps around the stack with a padlock hanging at the front. The
whole icon uses a single solid off-white fill color (#F8F8FB) only — no
gradients, no outline of a different color, no other colors. No text, no
letters, no watermark. Square 1:1 canvas, 1024x1024, generous padding on
all sides. Background fully transparent (PNG with alpha channel). Part of a
matched set of collectible profile-avatar badges for a developer/QA tools
website — same line weight and geometric simplification as the rest of the
set, instantly recognizable at 64x64 pixels.
```

### 12. `chip.png` — «цифровой дождь» (Матрица)

```
Create a minimalist flat icon/emblem of a square microchip, inspired by the
falling green code rain visual from a science-fiction hacker movie about a
simulated reality. Bold clean overall square chip silhouette with small pin
legs extending from its sides, solid smooth slightly geometric vector-style
illustration — NOT photorealistic, NOT 3D, NOT a photo, NOT line-art. Most
pins are simple straight pin legs, but one corner pin is replaced with a
small circular jack/port shape with two or three concentric rings around
it, like a neural interface plug. Across the face of the chip, instead of a
normal circuit-trace grid, draw several vertical cascading line-streams of
varying length, like falling code, flowing from top to bottom of the chip's
surface. The chip's body and pins are rendered in a single solid off-white
fill color (#F8F8FB) — EXCEPT the vertical falling code streams on its
face, which are rendered in a bright matrix-green color as the one and only
accent color in the image. No text, no letters, no watermark. Square 1:1
canvas, 1024x1024, generous padding on all sides. Background fully
transparent (PNG with alpha channel). Part of a matched set of collectible
profile-avatar badges for a developer/QA tools website — same line weight
and geometric simplification as the rest of the set, instantly recognizable
at 64x64 pixels.
```

### 13. `flame.png` — дамстер-файр

```
Create a minimalist flat icon/emblem of a small rectangular dumpster/trash
bin fully engulfed in fire, with flames and smoke pouring out of the open
top — the classic "everything is on fire" image. Bold clean overall
silhouette, solid smooth slightly geometric vector-style illustration — NOT
photorealistic, NOT 3D, NOT a photo, NOT line-art. The dumpster body is a
simple rectangular bin with slightly angled sides and a lid flipped open.
Flames rise up out of the open top in several uneven jagged tongues of
varying height, with a puff of smoke curling above them. The whole icon
uses a single solid off-white fill color (#F8F8FB) only — no gradients, no
outline of a different color, no drop shadows, no textures, no other
colors. No text, no letters, no watermark. Square 1:1 canvas, 1024x1024,
generous padding on all sides. Background fully transparent (PNG with
alpha channel). Part of a matched set of collectible profile-avatar badges
for a developer/QA tools website — same line weight and geometric
simplification as the rest of the set, instantly recognizable at 64x64
pixels.
```

### 14. `owl.png` — мутировавшая сова (Fallout)

```
Create a minimalist flat icon/emblem of a small owl, front-facing, perched
and alert, but mutated by radiation in the style of a wasteland creature
from a post-apocalyptic video game. Bold clean overall owl silhouette,
solid smooth slightly geometric vector-style illustration — NOT
photorealistic, NOT 3D, NOT a photo, NOT line-art. The feathers are patchy
and matted rather than smooth and round, with a few small gaps in the
plumage revealing rough skin texture underneath. The talons gripping its
perch are larger and sharper than a normal owl's, in a tense ready-to-
strike stance. Work a small dark radiation trefoil symbol subtly into the
silhouette as a marking on the chest or wing (rendered as part of the shape
itself, not as separate colored decoration). The owl's body is rendered in
a single solid off-white fill color (#F8F8FB) — EXCEPT its two eyes, which
glow in a sickly radioactive green as the one and only accent color in the
image. No text, no letters, no watermark. Square 1:1 canvas, 1024x1024,
generous padding on all sides. Background fully transparent (PNG with
alpha channel). Part of a matched set of collectible profile-avatar badges
for a developer/QA tools website — same line weight and geometric
simplification as the rest of the set, instantly recognizable at 64x64
pixels.
```

### 15. `ghost.png` — призрак, который не бросил работу

```
Create a minimalist flat icon/emblem of a ghost — a slightly hunched, tired
office worker's spirit who died at their desk and kept working anyway. Bold
clean overall ghost silhouette (elongated rounded body, wavy flowing bottom
edge instead of legs, slightly translucent-looking form), solid smooth
slightly geometric vector-style illustration — NOT photorealistic, NOT 3D,
NOT a photo, NOT line-art. Both arms reach forward at chest height with
fingers positioned as if typing on an invisible keyboard made of the same
ghostly material, rendered as part of the ghost's own form rather than a
separate solid object. The eyes are two heavy, half-closed tired slits
rather than round dot-eyes, with no other facial features. Posture is
slightly hunched forward, not floating upright. Include one small detail: a
simple coffee mug shape hovering just beside the ghost, as if permanently
within reach. The whole icon uses a single solid off-white fill color
(#F8F8FB) only — no gradients, no outline of a different color, no other
colors. No text, no letters, no watermark. Square 1:1 canvas, 1024x1024,
generous padding on all sides. Background fully transparent (PNG with
alpha channel). Part of a matched set of collectible profile-avatar badges
for a developer/QA tools website — same line weight and geometric
simplification as the rest of the set, instantly recognizable at 64x64
pixels.
```

### 16. `satellite.png` — взрыв сверхновой звезды

Единственная полностью многоцветная эмблема — сознательное исключение
(обсуждали отдельно).

```
Create a minimalist flat icon/emblem of a beautiful supernova explosion —
a dying star's blast of light and matter — as a striking decorative badge
rather than a literal object. Bold clean overall radial silhouette, solid
smooth slightly geometric vector-style illustration — NOT photorealistic,
NOT 3D, NOT a photo, NOT line-art. A dense bright core sits at the center,
with asymmetric rays of varying length and thickness bursting outward from
it in an irregular, organic-feeling starburst pattern (not a perfectly
even snowflake shape). Around the core, add two or three layered
rings/clouds of expanding material at different distances, with the outer
layers more sparse and broken-up than the dense inner ones. Unlike the rest
of the set, this emblem may use multiple colors: render the central core
and innermost rays in a warm bright gold-orange color, and the outer
rings/clouds and longer outer rays in a cooler violet-blue color, blending
smoothly from warm center to cool edge. No text, no letters, no watermark.
Square 1:1 canvas, 1024x1024, generous padding on all sides. Background
fully transparent (PNG with alpha channel). Part of a matched set of
collectible profile-avatar badges for a developer/QA tools website — same
line weight and geometric simplification as the rest of the set, instantly
recognizable at 64x64 pixels.
```

---

## Что дальше

Каждый файл кладётся сюда: `public/avatars/emblems/<имя>.png` (имена как в
таблице вверху — регистр и дефисы важны, `keyboard-key.png`, а не
`keyboard_key.png`). Можно класть частями, не обязательно все 16 сразу — на
`/profile` в Settings уже есть селектор «Эмблема аватарки», он подтянет
файлы автоматически, без изменений в коде.

Если какая-то генерация выйдет неудачно (не тот акцентный цвет, слились
детали) — просто перегенерируй именно этот промт ещё раз, они не зависят
друг от друга.
