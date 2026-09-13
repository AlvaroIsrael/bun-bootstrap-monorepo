# Bun Monorepo

Estrutura de monorepo gerenciada com **Bun Workspaces** e lockfile único na raiz (`bun.lock`).

---

## 📁 Estrutura de Pastas

```text
.
├── apps/
│   ├── backend/        # API NestJS (Fastify + SWC + Bun Test)
│   └── frontend/       # Aplicação Next.js (React 19 + Tailwind CSS)
├── packages/           # Bibliotecas e pacotes compartilhados (futuro)
├── bunfig.toml         # Configurações globais do Bun
├── package.json        # Configuração de workspaces
└── bun.lock            # Lockfile único do monorepo
```

---

## 🚀 Como Começar

### 1. Instalar dependências

Execute sempre a partir da **raiz** do repositório para manter o `bun.lock` sincronizado:

```bash
bun install
```

---

## 🛠️ Comandos do Dia a Dia

### Rodando a partir da Raiz (Recomendado)

O Bun permite executar comandos em apps específicos usando a flag `--filter`:

#### Backend (`apps/backend`)

- **Desenvolvimento (com hot reload via SWC):**

  ```bash
  bun --filter backend start:dev
  ```

- **Build de produção:**

  ```bash
  bun --filter backend build
  ```

- **Executar testes:**

  ```bash
  # Executa todos os testes do monorepo
  bun test

  # Ou apenas os testes do backend
  bun --filter backend test
  ```

- **Lint e Formatação:**
  ```bash
  bun --filter backend lint
  bun --filter backend format
  ```

#### Frontend (`apps/frontend`)

- **Desenvolvimento:**

  ```bash
  bun --filter frontend dev
  ```

- **Build de produção:**

  ```bash
  bun --filter frontend build
  ```

- **Executar em produção (após o build):**
  ```bash
  bun --filter frontend start
  ```

---

### Rodando Diretamente Dentro da Pasta do App

Se preferir navegar até a pasta da aplicação:

#### Backend

```bash
cd apps/backend

bun run start:dev  # Inicia em modo desenvolvimento
bun run build      # Compila o projeto
```

#### Frontend

```bash
cd apps/frontend

bun run start:dev  # Inicia o servidor de desenvolvimento
bun run build      # Compila a aplicação Next.js
bun run start      # Inicia o servidor Next.js compilado
```

---

## 📦 Gerenciamento de Dependências

### Adicionar dependência em um app específico

A partir da raiz:

```bash
# Dependência de produção no backend
bun add <pacote> --filter backend

# Dependência de desenvolvimento no backend
bun add -d <pacote> --filter backend

# Dependência de produção no frontend
bun add <pacote> --filter frontend

# Dependência de desenvolvimento no frontend
bun add -d <pacote> --filter frontend
```

### Adicionar dependência global (raiz do monorepo)

```bash
bun add -d <pacote>
```

## 🎯 Como testar ?

Na raiz do monorepo, execute um dos comandos abaixo:

```bash
$ bun test            # Roda todos os testes do monorepo
$ bun run test:watch  # Roda os testes em modo observador
$ bun run test:cov    # Roda os testes com relatório de cobertura
```