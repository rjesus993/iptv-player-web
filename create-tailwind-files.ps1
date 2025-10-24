# Caminho base do projeto
$basePath = "D:\iptv-player-web"

# Garante que a pasta src existe
if (!(Test-Path "$basePath\src")) {
    New-Item -ItemType Directory -Path "$basePath\src" | Out-Null
}

# Cria tailwind.config.js
@"
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
"@ | Out-File -FilePath "$basePath\tailwind.config.js" -Encoding utf8 -Force

# Cria src/index.css
@"
@tailwind base;
@tailwind components;
@tailwind utilities;
"@ | Out-File -FilePath "$basePath\src\index.css" -Encoding utf8 -Force

Write-Host "✅ Arquivos Tailwind criados em $basePath"
