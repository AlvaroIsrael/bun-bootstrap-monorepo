---
name: nest-use-cases
description: Implementa lógica de aplicação em NestJS como casos de uso pequenos e coesos em classes com sufixo Service, logger padrão e execute() como único ponto de entrada público, sempre salvos na pasta services/ com sufixo .service.ts. Use ao criar ou alterar serviços, fluxos ou operações de negócio no NestJS; não use para helpers ou detalhes técnicos triviais.
---

# Use Cases / Services no NestJS

Implemente a lógica de aplicação NestJS como **serviços orientados a casos de uso** explícitos. O objetivo é preservar operações de negócio pequenas, independentes, testáveis e fáceis de localizar, evitando classes genéricas gigantes (como `UsersService` ou `AppService` que acumulam dezenas de métodos sem relação).

## Localização e Convenção de Nomenclatura

- **Pasta obrigatória**: Os arquivos de serviços **devem ser sempre criados dentro da pasta `services/`** do módulo/funcionalidade correspondente (ex: `src/modules/app/services/get-health.service.ts`, `src/modules/users/services/create-user.service.ts`). **Nunca crie dentro de pastas como `application/`**.
- **Sufixo de arquivo obrigatório**: Todo arquivo de serviço **deve sempre ter o sufixo `.service.ts`** (ex: `get-health.service.ts`, `create-user.service.ts`, `delete-user.service.ts`).
- **Sufixo de classe obrigatório**: O nome da classe do serviço **deve sempre ter o sufixo `Service`**, representando a ação a ser executada: prefira `GetHealthService`, `CreateUserService`, `UpdateUserService`, `DeleteUserService`.

## Logger Padrão Obrigatório

Todo service deve ser criado por padrão com uma referência para o `Logger` do NestJS (`@nestjs/common`):

```ts
private readonly logger = new Logger(GetHealthService.name);
```

O valor passado para o `new Logger(...)` deve ser o `.name` da própria classe que está sendo criada.

## Contrato obrigatório

- Nomeie a classe pela ação com o sufixo `Service`: `GetHealthService`, `CreateUserService`.
- Exponha apenas um ponto de entrada público: `execute()`.
- Faça de `execute()` a implementação ou a orquestração real do fluxo. Não crie `execute()` como alias de métodos redundantes como `create()`, `health()` ou `getUser()`.
- Injete repositórios, gateways, clientes externos e abstrações de domínio pelo construtor, usando DI do NestJS.
- Mantenha controllers focados em transporte: receber/validar entrada, chamar `service.execute(input)` e devolver a resposta. Não coloque regras de negócio no controller.
- Evite incluir objetos de transporte (`Request`, `Response`), decorators HTTP ou decisões específicas de HTTP no serviço, salvo quando a arquitetura existente exigir isso de forma explícita.

## Estrutura esperada

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

## Exemplo de Implementação

Arquivo: `src/modules/users/services/create-user.service.ts`

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
    this.logger.log(`Creating user with email: ${input.email}`);

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

```ts
// Evite: operações diferentes acumuladas em um serviço genérico.
export class UsersService {
  create(input: CreateUserInput) {}
  getById(id: string) {}
  update(id: string, input: UpdateUserInput) {}
  delete(id: string) {}
}
```

## Não fragmente artificialmente

Mantenha como funções privadas, utilitários ou detalhes internos:

- Mapeamentos simples de DTOs e transformações triviais.
- Normalização, formatação e outras funções puras pequenas.
- Validações exclusivas de um único fluxo.
- Chamadas de repositório que são somente uma etapa de outro serviço.
- Detalhes de infraestrutura, como serialização, hash, HTTP e acesso a banco.

Extraia esses elementos apenas se forem reutilizados ou se expressarem uma regra de domínio relevante e claramente nomeável.

## Decisão antes de implementar

Pergunte:

1. Isto é uma ação de negócio, consulta relevante ou fluxo independente?
2. Possui entradas, regras, efeitos ou resultado próprios?
3. Uma classe isolada torna o comportamento mais claro e testável?

Se sim, crie ou reutilize um serviço com `execute()` dentro da pasta `services/` com sufixo `.service.ts`, classe nomeada com sufixo `Service` e `logger = new Logger(NomeDaClasseService.name)`. Se não, mantenha a lógica dentro do serviço que a orquestra ou em um helper coeso.

Ao alterar código existente, não adicione uma nova operação a um serviço amplo já existente. Extraia ou crie o serviço correspondente e atualize o controller ou chamador para invocar `execute()`.
