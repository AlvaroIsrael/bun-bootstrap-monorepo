- Instead of manually maintaining entity arrays or relying on folder-based discovery at runtime, you can use the discovery:export CLI command to generate a TypeScript barrel file with explicit entity imports:

```bash
bun run mikro-orm discovery:export
```

This scans your entity source files (using entitiesTs or entities paths from your config) and generates a file like:

```typescript
import { Article } from "./entities/Article.js";
import { User } from "./entities/User.js";

export const entities = [Article, User] as const;
```

# Arquitetura NestJS orientada a Use Cases

Ao implementar lógica de aplicação em NestJS, adote uma arquitetura orientada a **Use Cases**. Prefira casos de uso pequenos, coesos e explícitos a classes `*.service.ts` grandes que concentram várias operações de negócio sem relação direta.

Esta regra se aplica à lógica de aplicação e aos fluxos de negócio. Não a use para criar abstrações artificiais para detalhes internos simples.

## Regras obrigatórias

- Cada operação de negócio independente deve ser representada por uma classe própria de caso de uso/serviço.
- Todo caso de uso deve expor **um único ponto de entrada público**, chamado `execute()`.
- O método `execute()` deve receber a entrada necessária para a operação, executar ou orquestrar o fluxo e retornar seu resultado.
- Nomeie a classe do caso de uso pela ação que ele realiza com o sufixo obrigatório `Service`: `GetHealthService`, `CreateUserService`, `UpdateUserService`, `DeleteUserService`, `AuthenticateUserService`, `CalculateOrderTotalService` e `SendNotificationService`.
- Não crie uma classe genérica como `UsersService`, `AppService` ou `OrderService` para acumular múltiplas operações de negócio não relacionadas. Cada classe deve encapsular apenas uma única operação.
- O nome da classe deve sempre ter o sufixo `Service` (ex: `GetHealthService`, `CreateUserService`), e **o arquivo correspondente deve sempre ter o sufixo `.service.ts`** (por exemplo, `create-user.service.ts`, `get-health.service.ts`).
- Os arquivos de serviços/casos de uso **devem ser sempre criados dentro da pasta `services/`** do módulo correspondente (por exemplo, `src/modules/app/services/get-health.service.ts`, `src/modules/users/services/create-user.service.ts`), e **nunca** dentro de pastas como `application/`.
- **Logger padrão obrigatório**: Todo service deve ser criado com uma referência para o logger do NestJS no formato:
  ```ts
  private readonly logger = new Logger(GetHealthService.name);
  ```
  sendo que o argumento do `new Logger(...)` deve ser sempre o `.name` da própria classe do serviço.
- Se uma classe começar a acumular métodos públicos que representam operações diferentes, extraia cada operação para seu próprio caso de uso/serviço.
- Injete dependências por meio do mecanismo de DI do NestJS. Casos de uso podem depender de repositórios, gateways, clientes externos, serviços de domínio e outras abstrações necessárias ao fluxo.
- Mantenha controllers finos: eles validam e traduzem entrada de transporte, invocam `execute()` e traduzem a saída para HTTP. Controllers não devem conter lógica de negócio.
- Mantenha detalhes de transporte fora dos casos de uso sempre que possível. Não passe `Request`, `Response`, decorators HTTP ou códigos de status como parte da lógica de aplicação.
- Não crie métodos públicos redundantes. Em especial, não crie `execute()` apenas para delegar a outro método como `health()`, `create()` ou `getUser()`.

## Estrutura esperada

Organize os serviços/casos de uso dentro da pasta `services/` do módulo ou funcionalidade a que pertencem. Uma estrutura possível é:

```text
src/
  modules/
    users/
      services/
        create-user.service.ts
        get-user.service.ts
        update-user.service.ts
      infra/
        repositories/
      presentation/
        users.controller.ts
```

O formato de pastas deve sempre utilizar `services/` para os casos de uso com sufixo `.service.ts`.

## Abordagem correta

```ts
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class GetHealthService {
  private readonly logger = new Logger(GetHealthService.name);

  execute(): HealthCheckResponse {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
```

```ts
import { Body, Controller, Post } from "@nestjs/common";

@Controller("users")
export class UsersController {
  constructor(private readonly createUserService: CreateUserService) {}

  @Post()
  create(@Body() input: CreateUserInput): Promise<UserOutput> {
    return this.createUserService.execute(input);
  }
}
```

```ts
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class CreateUserService {
  private readonly logger = new Logger(CreateUserService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<UserOutput> {
    const existingUser = await this.usersRepository.findByEmail(input.email);

    if (existingUser) {
      throw new EmailAlreadyInUseError(input.email);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.usersRepository.create({ ...input, passwordHash });

    return UserOutput.from(user);
  }
}
```

## Abordagens incorretas

Evite serviços amplos que misturam vários fluxos independentes:

```ts
// Incorreto: operações distintas concentradas em uma classe genérica.
@Injectable()
export class UsersService {
  create(input: CreateUserInput) {}
  getById(id: string) {}
  update(id: string, input: UpdateUserInput) {}
  delete(id: string) {}
  authenticate(input: AuthenticateInput) {}
  sendWelcomeEmail(userId: string) {}
}
```

Evite um `execute()` que não é o ponto real da operação:

```ts
// Incorreto: execute() é apenas um alias sem valor arquitetural.
export class GetHealthService {
  health(): HealthCheckResponse {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  execute(): HealthCheckResponse {
    return this.health();
  }
}
```

Prefira implementar diretamente em `execute()`:

```ts
// Correto.
export class GetHealthService {
  private readonly logger = new Logger(GetHealthService.name);

  execute(): HealthCheckResponse {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
```

## Regra de decisão

Antes de criar ou alterar uma classe, avalie:

1. Isto representa uma ação de negócio, uma consulta relevante ou um fluxo da aplicação que pode ser solicitado de forma independente?
2. A operação tem entrada, validações, regras, efeitos ou resultado próprios?
3. Ela ficaria mais clara e testável como uma unidade isolada?

Se a resposta for sim para qualquer uma dessas perguntas, implemente-a como um caso de uso dedicado com `execute()`.

Exemplos que normalmente merecem casos de uso próprios:

- Criar, atualizar, desativar ou consultar uma entidade.
- Autenticar um usuário, renovar uma sessão ou solicitar redefinição de senha.
- Calcular um total, fechar um pedido ou processar um pagamento.
- Enviar uma notificação como parte de um fluxo de aplicação identificável.
- Executar uma verificação de saúde ou uma rotina operacional exposta como uma operação independente.

## Evite fragmentação artificial

Não transforme cada função privada ou detalhe de implementação em um caso de uso. A arquitetura orientada a casos de uso busca clareza e coesão, não maximizar o número de arquivos.

Não crie um caso de uso separado para:

- Helpers internos, como normalização de texto, conversão de formatos ou composição de objetos.
- Transformações triviais de DTOs, mapeamentos simples e funções puras pequenas.
- Validações locais que pertencem exclusivamente a um único fluxo.
- Consultas ou chamadas de repositório que são apenas uma etapa interna de outro caso de uso.
- Detalhes técnicos de infraestrutura, como serialização, hash, envio HTTP, acesso ao banco ou logging.

Esses elementos devem permanecer privados ao caso de uso, ser extraídos para funções utilitárias pequenas ou, quando compartilharem uma regra de domínio relevante, para uma abstração de domínio claramente nomeada.

## Padrão de implementação para agentes

Ao receber uma solicitação de implementação no NestJS:

1. Identifique as operações de negócio independentes envolvidas.
2. Crie ou reutilize um caso de uso/serviço explícito para cada operação com o sufixo `Service` no nome da classe (ex: `GetHealthService`, `CreateUserService`), salvando-o sempre dentro da pasta `services/` com o sufixo `.service.ts` (ex: `services/get-health.service.ts`); não acrescente métodos não relacionados a um serviço genérico existente.
3. Exponha apenas `execute()` como API pública do caso de uso e declare o logger padrão: `private readonly logger = new Logger(NomeDaClasseService.name);`.
4. Injete as dependências necessárias no construtor e mantenha a lógica de orquestração em `execute()`.
5. Deixe helpers como métodos privados ou funções locais quando não constituírem uma operação independente.
6. Faça o controller chamar o caso de uso e mantenha nele somente responsabilidades de transporte.
7. Escreva testes focados no comportamento observável de cada caso de uso.

Em caso de dúvida, escolha a menor divisão que preserve uma operação de negócio clara, independente e testável. Não adicione métodos públicos redundantes nem abstrações sem responsabilidade própria.

## Instruções Específicas de Teste

- **Idioma**: Sempre escreva os testes em inglês.
- **Gerenciador de Pacotes**: Use `bun` se precisar executar os testes.
- **Comando de Teste**: O script correto para executar os testes é `bun test`.
- **Framework**: O projeto foi construído com **bun** e usa **Playwright** como framework de testes de UI.
- **Fluxo de Trabalho**: Ao criar um arquivo de teste, escreva primeiro os testes para os cenários de falha. Somente após cobri-los, gere o(s) teste(s) para os casos de sucesso do serviço.
- **Tipagem**: Evite gerar testes sem tipagem ou usar o tipo `any`. Seja sempre rigoroso com as tipagens.
- **Linting**: Resolva os erros de linter nos arquivos de teste gerados da forma mais eficaz possível.
- **Dependências**: Use *mocks* para dependências externas sempre que possível.
- **Escopo**: Não teste entidades "anêmicas". Foque em testar a lógica de negócios, serviços, casos de uso e arquivos do tipo `.utils.ts`.
- **Localização do Arquivo**: Os arquivos de teste devem ser salvos em um diretório `__tests__` localizado na mesma pasta do arquivo que está sendo testado.
- **Convenção de Nomenclatura**: O nome do arquivo de teste deve corresponder ao nome do serviço ou caso de uso, seguido pelo sufixo `.spec.ts`. Por exemplo, se estiver testando `create-user.service.ts`, o arquivo de teste deve ser nomeado `create-user.service.spec.ts`.
