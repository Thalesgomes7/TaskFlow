# TaskFlow

Aplicação full stack de gerenciamento de tarefas, construída para demonstrar fundamentos de desenvolvimento web: HTML semântico, CSS responsivo, JavaScript no navegador, API REST com Node.js/Express, validação e persistência local em arquivo JSON.

## Funcionalidades

- Criar, listar, editar e excluir tarefas.
- Definir prioridade, prazo e status.
- Pesquisar tarefas por título ou descrição.
- Filtrar por status e prioridade.
- Visualizar indicadores de total, pendentes e concluídas.
- Interface responsiva e acessível por teclado.
- API REST com validação básica.
- Persistência em `data/tasks.json` (o arquivo é criado automaticamente).

## Requisitos

- Node.js 20 ou superior
- npm

## Executar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

Para iniciar sem modo de desenvolvimento:

```bash
npm start
```

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/tasks` | Lista tarefas; aceita `?status=pending`, `?priority=high` e `?q=texto` |
| GET | `/api/tasks/:id` | Busca uma tarefa |
| POST | `/api/tasks` | Cria uma tarefa |
| PATCH | `/api/tasks/:id` | Atualiza campos de uma tarefa |
| DELETE | `/api/tasks/:id` | Exclui uma tarefa |
| GET | `/api/health` | Verifica o estado da API |

### Exemplo de criação

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Estudar Node.js","description":"Criar uma API REST","priority":"high","dueDate":"2026-12-01"}'
```

## Estrutura

```text
taskflow/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── src/
│   ├── data-store.js
│   └── task-service.js
├── data/
│   └── .gitkeep
├── server.js
├── package.json
└── README.md
```

## Decisões técnicas

- O HTML usa elementos semânticos (`header`, `main`, `section`, `form`, `label`, `nav` e `footer`).
- O front-end usa `fetch` para consumir a API sem recarregar a página.
- A camada de serviço separa regras de negócio do servidor HTTP.
- A persistência JSON mantém o projeto fácil de executar sem instalar um banco de dados.
- O servidor limita o corpo das requisições e valida campos aceitos.

## Limitações e próximos passos

Esta é uma versão inicial para portfólio, não um sistema pronto para produção. Ela não inclui autenticação, múltiplos usuários, proteção CSRF ou banco de dados transacional. Próximas evoluções recomendadas:

1. Migrar a persistência para PostgreSQL.
2. Implementar autenticação segura e autorização por usuário.
3. Criar testes automatizados para serviços e rotas.
4. Adicionar paginação e logs estruturados.
5. Configurar integração contínua com GitHub Actions.
6. Implantar em um serviço de hospedagem e configurar variáveis de ambiente.

## Licença

MIT — veja `LICENSE`.
