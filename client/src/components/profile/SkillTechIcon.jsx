import React from "react";
import {
  Code2,
  Database,
  Terminal,
  Cpu,
  Globe,
  Layers,
  Wrench,
  Server,
  Cloud,
  ShieldCheck,
  Smartphone,
  Flame,
} from "lucide-react";

/**
 * High-Resolution Authentic Vector Tech Stack Logos
 * Renders official brand SVGs for top frameworks, languages, tools, and databases.
 */
export const SkillTechIcon = ({ skill = "", className = "w-3.5 h-3.5" }) => {
  const s = String(skill).trim().toLowerCase();

  // 1. React / React.js / React Native
  if (s.includes("react")) {
    return (
      <svg className={className} viewBox="-11.5 -10.23174 23 20.46348" fill="none">
        <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
        <g stroke="#61DAFB" strokeWidth="1" fill="none">
          <ellipse rx="11" ry="4.2" />
          <ellipse rx="11" ry="4.2" transform="rotate(60)" />
          <ellipse rx="11" ry="4.2" transform="rotate(120)" />
        </g>
      </svg>
    );
  }

  // 2. Node / Node.js
  if (s === "node" || s.includes("node.js") || s.includes("nodejs")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path
          d="M16 2L3 9.5v15L16 32l13-7.5v-15L16 2z"
          fill="#5FA04E"
        />
        <path
          d="M16 4.5l10.5 6v12L16 28.5l-10.5-6v-12L16 4.5z"
          fill="#333"
        />
        <path
          d="M12 11h2.5v10H12v-6.5l-2 2L8.5 15l3.5-4zM16 11h4.5c1.4 0 2.5 1.1 2.5 2.5v5c0 1.4-1.1 2.5-2.5 2.5H16V11zm2.5 7.5H20c.3 0 .5-.2.5-.5v-4c0-.3-.2-.5-.5-.5h-1.5v5z"
          fill="#5FA04E"
        />
      </svg>
    );
  }

  // 3. TypeScript / TS
  if (s === "ts" || s.includes("typescript")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#3178C6" />
        <path
          d="M5 13h10v2.5h-3.75V24H8.75V15.5H5V13zm12.5 6.8c.8 1.4 2.1 2.2 3.8 2.2 1.3 0 2.3-.5 2.3-1.5 0-2.4-5.8-1.5-5.8-5.7 0-2.2 1.8-3.8 4.6-3.8 1.7 0 3.2.7 4.1 2l-1.8 1.6c-.6-.9-1.4-1.3-2.3-1.3-1.1 0-1.9.5-1.9 1.4 0 2.3 5.8 1.4 5.8 5.7 0 2.4-1.9 3.9-4.8 3.9-2.2 0-3.9-.9-4.9-2.6l1.9-1.9z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 4. JavaScript / JS
  if (s === "js" || s.includes("javascript")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#F7DF1E" />
        <path
          d="M11.5 24c-1.3 0-2.2-.4-2.8-1.2l1.6-1.5c.4.6.8.9 1.3.9.7 0 1.1-.4 1.1-1.3V13h2.6v7.8c0 2-1.3 3.2-3.8 3.2zm7.6-.2c-1.1 0-2.1-.4-2.8-1.1l1.5-1.7c.5.5 1 .8 1.5.8.8 0 1.3-.4 1.3-1 0-.7-.6-1-1.8-1.5-1.9-.8-3-1.6-3-3.3 0-1.8 1.4-3.1 3.5-3.1 1.2 0 2.1.3 2.7.9l-1.4 1.7c-.4-.4-.8-.6-1.3-.6-.6 0-1 .4-1 .8 0 .6.5.9 1.6 1.4 2.1.9 3.2 1.7 3.2 3.4 0 2-1.6 3-4 3z"
          fill="#000000"
        />
      </svg>
    );
  }

  // 5. Python
  if (s.includes("python")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path
          d="M15.9 2c-5.2 0-4.9 2.3-4.9 2.3l.1 2.3h5v.7h-7s-3.3.4-3.3 5c0 4.6 2.9 4.8 2.9 4.8h1.7v-2.4s-.1-2.9 2.8-2.9h4.9s2.7.1 2.7-2.6V4.7s.4-2.7-4.9-2.7zm-2.7 1.6a1 1 0 110 2 1 1 0 010-2z"
          fill="#3776AB"
        />
        <path
          d="M16.1 30c5.2 0 4.9-2.3 4.9-2.3l-.1-2.3h-5v-.7h7s3.3-.4 3.3-5c0-4.6-2.9-4.8-2.9-4.8h-1.7v2.4s.1 2.9-2.8 2.9h-4.9s-2.7-.1-2.7 2.6v4.6s-.4 2.7 4.9 2.7zm2.7-1.6a1 1 0 110-2 1 1 0 010 2z"
          fill="#FFD43B"
        />
      </svg>
    );
  }

  // 6. MongoDB / Mongo
  if (s.includes("mongo")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path
          d="M16 2s-7.5 7.2-7.5 15.5c0 6.6 4.6 11.2 7.5 12.5 2.9-1.3 7.5-5.9 7.5-12.5C23.5 9.2 16 2 16 2z"
          fill="#47A248"
        />
        <path
          d="M16 2v28c.3-.1.6-.2 1-.4 2.8-1.3 6.5-5.5 6.5-12.1C23.5 9.2 16 2 16 2z"
          fill="#499D4A"
        />
        <path
          d="M16 3.5v25.2c-.3 0-.6-.1-.9-.2-2.3-1-5.6-4.6-5.6-11 0-6.8 5.3-12.7 6.5-14z"
          fill="#3FA037"
        />
        <path
          d="M16 14v16c.3 0 .5-.1.8-.2.2-.1.4-.2.6-.4V14h-1.4z"
          fill="#FFFFFF"
          opacity="0.3"
        />
      </svg>
    );
  }

  // 7. Tailwind / Tailwind CSS
  if (s.includes("tailwind")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path
          d="M9 13.5c1.5-3 3.5-4.5 6-4.5 3.8 0 5 2.5 6.5 4s3.3 2.5 6.5 2.5c2.5 0 4.5-1.5 6-4.5-1.5 3-3.5 4.5-6 4.5-3.8 0-5-2.5-6.5-4S18.2 9 15 9c-2.5 0-4.5 1.5-6 4.5zM3 22.5c1.5-3 3.5-4.5 6-4.5 3.8 0 5 2.5 6.5 4s3.3 2.5 6.5 2.5c2.5 0 4.5-1.5 6-4.5-1.5 3-3.5 4.5-6 4.5-3.8 0-5-2.5-6.5-4S12.2 18 9 18c-2.5 0-4.5 1.5-6 4.5z"
          fill="#06B6D4"
        />
      </svg>
    );
  }

  // 8. Next.js / Next
  if (s.includes("next")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" fill="#000000" />
        <path
          d="M11 10h2.6v12H11V10zm11.3 11.2L13.8 11.5h-.2v10.5h2.2v-7.8l7.5 9h1.2c.7-.7 1.3-1.4 1.8-2z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 9. Docker
  if (s.includes("docker")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path
          d="M29.5 14.5c-.5-.4-1.6-.5-2.5-.2-.3-.8-1-1.3-1.9-1.5-.7-.2-1.5-.1-2.1.3-.2-.1-.5-.3-.7-.4C20.6 11.7 18 12 16.5 13H2.5c-.3.9-.4 1.9-.4 3 0 6.6 5.4 12 12 12 5.9 0 10.9-4.3 11.8-10 .8 0 2.6-.2 3.6-1.5.8-1 .7-1.8 0-2zM6 14h2.5v2.5H6V14zm3.5 0H12v2.5H9.5V14zm0-3.5H12V13H9.5v-2.5zm3.5 3.5h2.5v2.5H13V14zm0-3.5h2.5V13H13v-2.5zm3.5 3.5h2.5v2.5H16.5V14zm0-3.5h2.5V13H16.5v-2.5zm3.5 3.5h2.5v2.5H20V14z"
          fill="#2496ED"
        />
      </svg>
    );
  }

  // 10. Git / GitHub
  if (s === "git" || s.includes("gitlab")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path
          d="M30.4 14.3L17.7 1.6c-.8-.8-2.1-.8-2.9 0L12 4.4l3.7 3.7c.9-.3 1.9-.1 2.5.6.7.7.9 1.7.5 2.6l3.5 3.5c.9-.4 1.9-.2 2.6.5 1 1 1 2.6 0 3.6s-2.6 1-3.6 0c-.8-.8-.9-2-.4-2.9l-3.3-3.3v8.7c.3.2.6.4.8.7 1 1 1 2.6 0 3.6s-2.6 1-3.6 0c-1-1-1-2.6 0-3.6.3-.3.7-.6 1.1-.7v-8.8c-.4-.2-.8-.4-1.1-.7-.8-.8-.9-2-.4-2.9L8.2 8.2 1.6 14.8c-.8.8-.8 2.1 0 2.9l12.7 12.7c.8.8 2.1.8 2.9 0l13.2-13.2c.8-.8.8-2.1 0-2.9z"
          fill="#F05032"
        />
      </svg>
    );
  }

  if (s.includes("github")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="currentColor">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16 2C8.3 2 2 8.3 2 16c0 6.2 4 11.4 9.6 13.3.7.1 1-.3 1-.7v-2.5c-3.9.8-4.7-1.9-4.7-1.9-.6-1.6-1.5-2.1-1.5-2.1-1.3-.9.1-.9.1-.9 1.4.1 2.2 1.5 2.2 1.5 1.3 2.1 3.3 1.5 4.1 1.2.1-.9.5-1.5.9-1.9-3.1-.4-6.4-1.6-6.4-7 0-1.5.5-2.8 1.4-3.8-.1-.4-.6-1.8.1-3.7 0 0 1.2-.4 3.9 1.4 1.1-.3 2.3-.5 3.5-.5 1.2 0 2.4.2 3.5.5 2.7-1.8 3.9-1.4 3.9-1.4.8 1.9.3 3.3.1 3.7.9 1 1.4 2.3 1.4 3.8 0 5.4-3.3 6.6-6.4 7 .5.4.9 1.3.9 2.6V28.6c0 .4.3.8 1 .7C26 27.4 30 22.2 30 16c0-7.7-6.3-14-14-14z"
        />
      </svg>
    );
  }

  // 11. AWS / Amazon Web Services
  if (s.includes("aws") || s.includes("amazon")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path
          d="M9.5 18c-2.3 0-4-1.3-4-3.5 0-2.3 1.9-3.6 4.6-3.6 1.1 0 2.2.2 2.8.5v-.5c0-1.3-.9-2-2.4-2-.9 0-1.9.3-2.6.7l-.6-1.3c.9-.5 2.2-.9 3.5-.9 2.6 0 4.1 1.4 4.1 3.7v6.6h-1.8v-1.2c-.7.9-1.9 1.5-3.6 1.5zm.5-1.5c1.4 0 2.5-.8 2.8-1.9V13c-.5-.2-1.3-.4-2.1-.4-1.8 0-2.9.8-2.9 2.2 0 1.3.9 1.7 2.2 1.7zm10.5 1.5l-2.6-9.5h2l1.6 6.8 1.6-6.8h1.8l1.6 6.8 1.6-6.8h1.9l-2.6 9.5h-1.9l-1.6-6.5-1.6 6.5h-1.8z"
          fill="#232F3E"
        />
        <path
          d="M26.5 24c-3.8 2.8-9.4 4.3-14.8 4.3-7.5 0-14.2-2.8-19.3-7.4-.4-.4 0-.9.5-.6 5.5 3.2 12.2 5.1 19.1 5.1 4.8 0 10-1.1 14.8-3.4.7-.4 1.2.3.7.8z"
          fill="#FF9900"
        />
        <path
          d="M28.4 21.6c-.5-.6-3.1-.3-4.3-.2-.4 0-.4-.3-.1-.6 1.8-1.3 4.8-.9 5.2-.4.4.5 0 3.5-1.7 4.9-.3.2-.6.1-.4-.2.8-1.1 1.7-2.9 1.3-3.5z"
          fill="#FF9900"
        />
      </svg>
    );
  }

  // 12. PostgreSQL / Postgres / SQL
  if (s.includes("postgres") || s.includes("psql")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path
          d="M16 3c-7.2 0-13 5.8-13 13 0 4.2 2 8 5.1 10.3l1.8-2.6c-2.4-1.7-4-4.5-4-7.7 0-5.5 4.5-10 10-10s10 4.5 10 10c0 3.2-1.5 6-3.9 7.7l1.8 2.6c3.1-2.3 5.1-6.1 5.1-10.3 0-7.2-5.8-13-13-13z"
          fill="#4169E1"
        />
        <path
          d="M16 8c-3.9 0-7 3.1-7 7 0 2.3 1.1 4.3 2.8 5.6l1.2-1.8c-1.2-1-2-2.4-2-3.8 0-2.8 2.2-5 5-5s5 2.2 5 5c0 1.5-.7 2.9-1.9 3.8l1.2 1.8c1.7-1.3 2.7-3.3 2.7-5.6 0-3.9-3.1-7-7-7z"
          fill="#336791"
        />
        <circle cx="16" cy="15" r="2.5" fill="#336791" />
      </svg>
    );
  }

  // 13. Vue / Vue.js
  if (s.includes("vue")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path d="M16 24.5L28.5 3h-5L16 16 8.5 3h-5L16 24.5z" fill="#42B883" />
        <path d="M16 24.5L23.5 3h-4L16 13.5 12.5 3h-4L16 24.5z" fill="#35495E" />
      </svg>
    );
  }

  // 14. Angular
  if (s.includes("angular")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path d="M16 2L3 6.5l2 16.5L16 30l11-7 2-16.5L16 2z" fill="#DD0031" />
        <path d="M16 2v28l11-7 2-16.5L16 2z" fill="#C3002F" />
        <path d="M16 6.5L9.5 21h2.8l1.3-3.3h4.8l1.3 3.3h2.8L16 6.5zm1.7 9.2h-3.4L16 11.2l1.7 4.5z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 15. GraphQL
  if (s.includes("graphql")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path
          d="M16 3l11.3 6.5v13L16 29 4.7 22.5v-13L16 3z"
          stroke="#E10098"
          strokeWidth="2"
        />
        <circle cx="16" cy="3" r="2.5" fill="#E10098" />
        <circle cx="27.3" cy="9.5" r="2.5" fill="#E10098" />
        <circle cx="27.3" cy="22.5" r="2.5" fill="#E10098" />
        <circle cx="16" cy="29" r="2.5" fill="#E10098" />
        <circle cx="4.7" cy="22.5" r="2.5" fill="#E10098" />
        <circle cx="4.7" cy="9.5" r="2.5" fill="#E10098" />
      </svg>
    );
  }

  // 16. Java / Spring / Spring Boot
  if (s === "java" || s.includes("spring")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path
          d="M13.5 27c4.5.3 8.3-.3 11.5-1.5-3.3-.8-6.8-.7-10.3-.2-.5 0-.9.7-1.2 1.7z"
          fill="#5382A1"
        />
        <path
          d="M11 23.5c4.7.3 8.6-.3 12.3-1.6-3.7-.8-7.5-.7-11.2-.2-.5.1-.8.8-1.1 1.8z"
          fill="#5382A1"
        />
        <path
          d="M17.5 16.5c1.8 1.8.8 3.5-.7 4.9 3.5-.6 6.3-2.1 4.7-4.4-1.4-1.9-4.2-2.5-4-4.5.2-1.9 2-3.1 1.6-5.4-.5 1.5-1.9 2.5-2.2 4-.5 2.1.8 3.6.6 5.4z"
          fill="#E76F00"
        />
      </svg>
    );
  }

  // 17. HTML / HTML5
  if (s.includes("html")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path d="M4 2l2.5 25L16 30l9.5-3L28 2H4z" fill="#E34F26" />
        <path d="M16 28l7.5-2.4 2-20.6H16v23z" fill="#EF652A" />
        <path d="M16 11h5.8l-.3 3.5H16V18h5.3l-.5 5.5-4.8 1.3V27l7.4-2 .8-9.5H16V11zm-5.8 0H16v3.5h-5.5l.3 3.5H16v3.5h-5.2l.6 6 4.6 1.3V27l-7.4-2-.8-10.5h8.2V11H10.2z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 18. CSS / CSS3 / SCSS / Sass
  if (s.includes("css") || s.includes("sass") || s.includes("scss")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path d="M4 2l2.5 25L16 30l9.5-3L28 2H4z" fill="#1572B6" />
        <path d="M16 28l7.5-2.4 2-20.6H16v23z" fill="#33A9DC" />
        <path d="M16 11h5.8l-.3 3.5H16V18h5.3l-.5 5.5-4.8 1.3V27l7.4-2 .8-9.5H16V11zm-5.8 0H16v3.5h-5.5l.3 3.5H16v3.5h-5.2l.6 6 4.6 1.3V27l-7.4-2-.8-10.5h8.2V11H10.2z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 19. Redis
  if (s.includes("redis")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path d="M3 13l13-6 13 6-13 6-13-6z" fill="#D82C20" />
        <path d="M3 19l13 6 13-6v3l-13 6-13-6v-3z" fill="#A3241A" />
        <path d="M3 13v3l13 6 13-6v-3l-13 6-13-6z" fill="#C62828" />
      </svg>
    );
  }

  // 20. Linux / Ubuntu
  if (s.includes("linux") || s.includes("ubuntu")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <ellipse cx="16" cy="18" rx="8" ry="10" fill="#FFA500" />
        <ellipse cx="16" cy="17" rx="7" ry="9" fill="#000000" />
        <ellipse cx="16" cy="18" rx="5" ry="6" fill="#FFFFFF" />
        <circle cx="14" cy="9" r="1.5" fill="#FFFFFF" />
        <circle cx="18" cy="9" r="1.5" fill="#FFFFFF" />
        <circle cx="14" cy="9" r="0.7" fill="#000000" />
        <circle cx="18" cy="9" r="0.7" fill="#000000" />
        <polygon points="16,11 14,13 18,13" fill="#FFA500" />
      </svg>
    );
  }

  // 21. C / C++ / C#
  if (s === "c" || s === "c++" || s === "cpp" || s === "c#") {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path d="M16 2L3 9.5v13L16 30l13-7.5v-13L16 2z" fill="#00599C" />
        <path d="M21 16c0-2.8-2.2-5-5-5s-5 2.2-5 5 2.2 5 5 5c1.8 0 3.3-.9 4.2-2.3l-2.1-1.2c-.5.8-1.3 1.3-2.1 1.3-1.6 0-2.8-1.2-2.8-2.8s1.2-2.8 2.8-2.8c.8 0 1.6.5 2.1 1.3l2.1-1.2C20.3 16.9 18.8 16 21 16z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 22. Go / Golang
  if (s === "go" || s.includes("golang")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#00ADD8" />
        <path
          d="M8 16c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6-6-2.7-6-6zm9 0c0-1.7-1.3-3-3-3s-3 1.3-3 3 1.3 3 3 3 3-1.3 3-3zm5-5h2v10h-2V11z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 23. Figma
  if (s.includes("figma")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path d="M12 6h4v5h-4a2.5 2.5 0 010-5z" fill="#F24E1E" />
        <path d="M16 6h4a2.5 2.5 0 010 5h-4V6z" fill="#FF7262" />
        <path d="M16 11h4a2.5 2.5 0 010 5h-4v-5z" fill="#1ABCFE" />
        <circle cx="13.5" cy="13.5" r="2.5" fill="#0ACF83" />
        <path d="M12 16h4v2.5a2.5 2.5 0 01-5 0V16h1z" fill="#A259FF" />
      </svg>
    );
  }

  // 24. Firebase
  if (s.includes("firebase")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path d="M6 23.5L8.5 7.5 13 15.5 6 23.5z" fill="#FFA000" />
        <path d="M19 12.5L16 6.5l-3 9 6-3z" fill="#F57C00" />
        <path d="M26 23.5L19 12.5 6 23.5l10 5.5 10-5.5z" fill="#FFCA28" />
      </svg>
    );
  }

  // 25. Redux
  if (s.includes("redux")) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" fill="#764ABC" />
        <path
          d="M16 8c-4.4 0-8 2.2-8 5s3.6 5 8 5 8-2.2 8-5-3.6-5-8-5zm0 8c-3.3 0-6-1.3-6-3s2.7-3 6-3 6 1.3 6 3-2.7 3-6 3z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 26. Intelligent Categorical Fallbacks
  if (s.includes("db") || s.includes("sql") || s.includes("data") || s.includes("store")) {
    return <Database className={`${className} text-emerald-500 shrink-0`} />;
  }
  if (s.includes("cloud") || s.includes("server") || s.includes("host") || s.includes("infra")) {
    return <Cloud className={`${className} text-sky-500 shrink-0`} />;
  }
  if (s.includes("api") || s.includes("net") || s.includes("web") || s.includes("http")) {
    return <Globe className={`${className} text-blue-500 shrink-0`} />;
  }
  if (s.includes("mobile") || s.includes("app") || s.includes("ios") || s.includes("android")) {
    return <Smartphone className={`${className} text-indigo-500 shrink-0`} />;
  }
  if (s.includes("test") || s.includes("jest") || s.includes("cypress") || s.includes("qa")) {
    return <ShieldCheck className={`${className} text-emerald-600 shrink-0`} />;
  }
  if (s.includes("tool") || s.includes("dev") || s.includes("build") || s.includes("cli")) {
    return <Wrench className={`${className} text-amber-500 shrink-0`} />;
  }

  // Default clean code icon
  return <Code2 className={`${className} text-[#0a66c2] dark:text-sky-400 shrink-0`} />;
};

export default SkillTechIcon;
