// Роли профиля (не путать с ChallengeRole из lib/challenges/types.ts —
// та описывает три категории задач в Challenges; эта описывает более
// широкий выбор профессии на самой странице профиля). Раньше жила прямо
// внутри app/[locale]/profile/page.tsx как локальная константа; вынесена
// сюда, когда понадобилась вторая точка использования — публичная
// страница профиля (components/profile/PublicProfileView.tsx) должна
// показывать ту же метку роли, что и приватная страница настроек, без
// копипасты одного и того же массива в двух местах.
export const ROLE_TAGS = [
  { id: "qa",        label: "QA Engineer",    labelRu: "QA-инженер" },
  { id: "frontend",  label: "Frontend Dev",   labelRu: "Frontend-разработчик" },
  { id: "backend",   label: "Backend Dev",    labelRu: "Backend-разработчик" },
  { id: "fullstack", label: "Full Stack Dev", labelRu: "Full Stack" },
  { id: "devops",    label: "DevOps Engineer",labelRu: "DevOps-инженер" },
  { id: "developer", label: "Developer",      labelRu: "Разработчик" },
];
