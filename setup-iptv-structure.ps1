# Caminho base do projeto
$basePath = "D:\iptv-player-web"

# Cria a pasta raiz
New-Item -ItemType Directory -Force -Path $basePath | Out-Null

# Estrutura de pastas
$folders = @(
    "src",
    "src\app",
    "src\components",
    "src\features",
    "src\features\auth",
    "src\features\playlist",
    "src\features\xtream",
    "src\features\epg",
    "src\features\playback",
    "src\store",
    "src\styles",
    "src\utils",
    "src\types",
    "public"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path (Join-Path $basePath $folder) | Out-Null
}

# Arquivos na raiz
$rootFiles = @(
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "README.md"
)

foreach ($file in $rootFiles) {
    New-Item -ItemType File -Force -Path (Join-Path $basePath $file) | Out-Null
}

Write-Host "✅ Estrutura do projeto IPTV criada em $basePath"
