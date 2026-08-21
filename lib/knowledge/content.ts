export type KnowledgeRole = "qa" | "frontend" | "backend" | "all";
export type ResourceType = "article" | "book" | "course" | "video" | "tool" | "roadmap";

export interface Resource {
  title:       string;
  titleRu?:    string;
  url:         string;
  type:        ResourceType;
  description: string;
  descriptionRu?: string;
  free:        boolean;
  tags:        string[];
}

export interface Roadmap {
  id:          string;
  role:        KnowledgeRole;
  title:       string;
  titleRu:     string;
  description: string;
  descriptionRu: string;
  phases: {
    title:     string;
    titleRu:   string;
    items:     string[];
    itemsRu:   string[];
  }[];
}

export const ROADMAPS: Roadmap[] = [
  {
    id: "qa-roadmap",
    role: "qa",
    title: "QA Engineer Roadmap",
    titleRu: "Roadmap QA-инженера",
    description: "From beginner to senior QA engineer.",
    descriptionRu: "От новичка до senior QA-инженера.",
    phases: [
      { title:"Foundations", titleRu:"Основы", items:["SDLC & STLC basics","Types of testing","Test documentation","Severity & Priority","Agile / Scrum"], itemsRu:["Основы SDLC и STLC","Виды тестирования","Тестовая документация","Severity и Priority","Основы Agile / Scrum"] },
      { title:"Test Design", titleRu:"Тест-дизайн", items:["Equivalence partitioning","Boundary value analysis","Decision tables","State transition testing","Pairwise testing"], itemsRu:["Классы эквивалентности","Анализ граничных значений","Таблицы решений","Переходы состояний","Парное тестирование"] },
      { title:"API & Web Testing", titleRu:"API и веб", items:["HTTP basics","REST API with Postman","JSON & XML","Browser DevTools","Web security basics"], itemsRu:["Основы HTTP","REST API через Postman","JSON и XML","DevTools браузера","Основы веб-безопасности"] },
      { title:"Automation", titleRu:"Автоматизация", items:["Python or JavaScript basics","Selenium WebDriver","Page Object Model","Pytest or Jest","CI/CD basics"], itemsRu:["Основы Python или JS","Selenium WebDriver","Page Object Model","Pytest или Jest","Основы CI/CD"] },
      { title:"Advanced", titleRu:"Продвинутый", items:["Performance testing (k6)","Security testing","Mobile testing","Test strategy","Metrics & reporting"], itemsRu:["Нагрузочное тестирование","Тестирование безопасности","Мобильное тестирование","Стратегия тестирования","Метрики и отчётность"] },
    ],
  },
  {
    id: "frontend-roadmap",
    role: "frontend",
    title: "Frontend Developer Roadmap",
    titleRu: "Roadmap Frontend-разработчика",
    description: "From HTML basics to production React apps.",
    descriptionRu: "От основ HTML до продакшн React-приложений.",
    phases: [
      { title:"Web Basics", titleRu:"Основы веба", items:["HTML5 semantics","CSS3 & Flexbox & Grid","Responsive design","Browser DevTools","Git basics"], itemsRu:["Семантический HTML5","CSS3, Flexbox, Grid","Адаптивный дизайн","DevTools браузера","Основы Git"] },
      { title:"JavaScript", titleRu:"JavaScript", items:["ES6+ syntax","DOM manipulation","Async JS (Promises, async/await)","Fetch API","TypeScript basics"], itemsRu:["Синтаксис ES6+","Работа с DOM","Async JS","Fetch API","Основы TypeScript"] },
      { title:"React", titleRu:"React", items:["Components & JSX","State & Props","Hooks","React Router","State management (Zustand)"], itemsRu:["Компоненты и JSX","State и Props","Хуки","React Router","Управление состоянием"] },
      { title:"Tooling", titleRu:"Инструменты", items:["Vite / Next.js","Tailwind CSS","Testing (Vitest)","Performance (Lighthouse)","Accessibility (WCAG)"], itemsRu:["Vite / Next.js","Tailwind CSS","Тестирование (Vitest)","Производительность","Доступность"] },
      { title:"Production", titleRu:"Продакшн", items:["Auth patterns","API integration","Error monitoring","CI/CD","Security (CSP, XSS)"], itemsRu:["Паттерны аутентификации","Интеграция с API","Мониторинг ошибок","CI/CD","Безопасность"] },
    ],
  },
  {
    id: "backend-roadmap",
    role: "backend",
    title: "Backend Developer Roadmap",
    titleRu: "Roadmap Backend-разработчика",
    description: "From REST APIs to scalable systems.",
    descriptionRu: "От REST API до масштабируемых систем.",
    phases: [
      { title:"Fundamentals", titleRu:"Основы", items:["Node.js / Python / Go","Data structures basics","OOP principles","Git","Linux / CLI"], itemsRu:["Node.js / Python / Go","Основы структур данных","Принципы ООП","Git","Основы Linux"] },
      { title:"Web & APIs", titleRu:"Веб и API", items:["HTTP protocol","REST API design","JWT / OAuth2","Input validation","OpenAPI docs"], itemsRu:["Протокол HTTP","Дизайн REST API","JWT / OAuth2","Валидация","Документация API"] },
      { title:"Databases", titleRu:"Базы данных", items:["SQL (PostgreSQL)","DB design & normalization","Indexing & optimization","Transactions & ACID","Redis"], itemsRu:["SQL (PostgreSQL)","Проектирование БД","Индексирование","Транзакции и ACID","Redis"] },
      { title:"Infrastructure", titleRu:"Инфраструктура", items:["Docker","CI/CD pipelines","Env variables & secrets","Logging & monitoring","Cloud (AWS / Vercel)"], itemsRu:["Docker","CI/CD пайплайны","Переменные окружения","Логирование","Облако"] },
      { title:"Scale & Architecture", titleRu:"Архитектура", items:["System design patterns","Message queues","Microservices vs monolith","Security (OWASP)","Load testing"], itemsRu:["Паттерны дизайна","Очереди сообщений","Микросервисы vs монолит","Безопасность","Нагрузочное тестирование"] },
    ],
  },
];

export const RESOURCES: Resource[] = [
  { title:"ISTQB Foundation Level", url:"https://www.istqb.org/certifications/certified-tester-foundation-level", type:"article", free:true, description:"Official ISTQB CTFL syllabus — gold standard for QA fundamentals.", descriptionRu:"Официальная программа ISTQB CTFL — золотой стандарт основ QA.", tags:["qa","certification"] },
  { title:"Postman Learning Center", url:"https://learning.postman.com", type:"course", free:true, description:"Comprehensive guide to API testing with Postman.", descriptionRu:"Полное руководство по тестированию API через Postman.", tags:["qa","api","postman"] },
  { title:"Test Automation University", url:"https://testautomationu.applitools.com", type:"course", free:true, description:"Free courses on Selenium, Cypress, Playwright and more.", descriptionRu:"Бесплатные курсы по Selenium, Cypress, Playwright.", tags:["qa","automation"] },
  { title:"Awesome Testing (GitHub)", url:"https://github.com/TheJambo/awesome-testing", type:"tool", free:true, description:"Curated list of testing tools and frameworks.", descriptionRu:"Подборка инструментов и фреймворков для тестирования.", tags:["qa","tools"] },
  { title:"k6 Load Testing Docs", url:"https://k6.io/docs", type:"article", free:true, description:"Modern load testing tool — free and open source.", descriptionRu:"Современный инструмент нагрузочного тестирования.", tags:["qa","performance"] },
  { title:"MDN Web Docs", url:"https://developer.mozilla.org", type:"article", free:true, description:"The definitive reference for HTML, CSS and JavaScript.", descriptionRu:"Главный справочник по HTML, CSS и JavaScript.", tags:["frontend","html","css","javascript"] },
  { title:"javascript.info", url:"https://javascript.info", type:"article", free:true, description:"Modern JavaScript tutorial from basics to advanced.", descriptionRu:"Современный учебник JavaScript от основ до продвинутых тем.", tags:["frontend","javascript"] },
  { title:"React Official Docs", url:"https://react.dev", type:"article", free:true, description:"Official React documentation with interactive examples.", descriptionRu:"Официальная документация React с интерактивными примерами.", tags:["frontend","react"] },
  { title:"web.dev by Google", url:"https://web.dev", type:"article", free:true, description:"Performance, accessibility and Core Web Vitals guides.", descriptionRu:"Гайды по производительности и Core Web Vitals от Google.", tags:["frontend","performance"] },
  { title:"TypeScript Handbook", url:"https://www.typescriptlang.org/docs/handbook/intro.html", type:"article", free:true, description:"Official TypeScript handbook from basics to advanced types.", descriptionRu:"Официальное руководство TypeScript.", tags:["frontend","typescript"] },
  { title:"Frontend Masters", url:"https://frontendmasters.com", type:"course", free:false, description:"Expert-led courses on JavaScript, React and CSS.", descriptionRu:"Курсы от экспертов по JavaScript, React, CSS.", tags:["frontend","courses"] },
  { title:"PostgreSQL Docs", url:"https://www.postgresql.org/docs", type:"article", free:true, description:"Comprehensive PostgreSQL documentation.", descriptionRu:"Полная документация PostgreSQL.", tags:["backend","database"] },
  { title:"System Design Primer", url:"https://github.com/donnemartin/system-design-primer", type:"article", free:true, description:"Learn how to design large-scale systems.", descriptionRu:"Дизайн масштабируемых систем.", tags:["backend","system-design"] },
  { title:"OWASP Top 10", url:"https://owasp.org/www-project-top-ten", type:"article", free:true, description:"The 10 most critical web application security risks.", descriptionRu:"10 наиболее критичных рисков безопасности веб-приложений.", tags:["backend","security"] },
  { title:"Docker Getting Started", url:"https://docs.docker.com/get-started", type:"article", free:true, description:"Official Docker tutorial from containers to compose.", descriptionRu:"Официальный туториал Docker.", tags:["backend","docker"] },
  { title:"Roadmap.sh", url:"https://roadmap.sh", type:"roadmap", free:true, description:"Community-driven visual roadmaps for developers.", descriptionRu:"Визуальные дорожные карты для разработчиков.", tags:["all","roadmap"] },
];

export type KnowledgeTab = "roadmaps" | "resources";