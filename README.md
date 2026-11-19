# Raisin Tech — Front-end

Painel web do projeto **Dashboard de monitoramento climático e logístico em nuvem para exportadoras de uvas** (Vale do São Francisco, Petrolina/Juazeiro). Mostra em tempo quase real a temperatura e a umidade medidas no parreiral, gera alertas, previsões da janela ideal de colheita e relatórios.

Projeto Integrador do 4º módulo de Análise e Desenvolvimento de Sistemas (Senac).

- **Site em produção:** https://raisin-tech-frontend.vercel.app
- **Back-end (API):** repositório `uva-backend` (Spring Boot), publicado no Render

## Como o sistema funciona

```
DHT11 → ESP32 → ThingSpeak → Back-end (Spring Boot) → PostgreSQL (Supabase)
                                      ↑                        ↑
                          Open-Meteo (previsão)     Script Python (limpeza)
                                      ↑
                         Este front-end (React) via HTTPS + JWT
```

O diagrama completo está em `docs/arquitetura.png` do repositório do back-end. O front-end **só conversa com a API do back-end**; ele não acessa o banco nem o ThingSpeak diretamente.

## Tecnologias

- React + Vite
- React Router (`react-router-dom`)
- Axios (chamadas à API)
- lucide-react (ícones)
- Gráficos próprios em SVG (componente `LineChart`)
- Deploy na Vercel

## Telas

| Tela | O que mostra |
|---|---|
| Login / Esqueci a senha | Acesso com e-mail e senha; o back-end devolve um token JWT |
| Dashboard | Última leitura, gráfico de temperatura e umidade e situação em relação aos critérios |
| Clima | Série climática com escala adaptada ao período (a cada 10 min até 1 h; média por hora acima de 24 h) |
| Previsões | Previsão do tempo (Open-Meteo) e melhor janela de colheita/exportação |
| Histórico | Leituras por período, com exportação em CSV |
| Alertas | Alertas de temperatura, umidade e janela ideal |
| Dados de mercado | Preço da uva e demanda de exportação (dados simulados) |
| Relatórios | Exportação de dados e abas de **Segurança** e **Qualidade** (resultado dos testes automatizados) |
| Usuários | Gestão de usuários (administrador) |
| Perfil | Dados do usuário logado |

## Perfis de acesso

- `PRODUTOR_EXPORTADOR`
- `ANALISTA_DADOS`
- `ADMINISTRADOR`

As permissões são validadas pelo back-end; o front apenas esconde o que o perfil não pode usar.

## Como rodar localmente

Pré-requisito: Node.js (versão LTS) e o back-end rodando.

```bash
# 1. instalar as dependências
npm install

# 2. criar o arquivo .env na raiz do projeto
#    VITE_API_URL=http://localhost:8081

# 3. iniciar o servidor de desenvolvimento
npm run dev
```

O site abre em http://localhost:5173.

Para gerar a versão de produção:

```bash
npm run build
```

## Variáveis de ambiente

| Variável | Para que serve | Exemplo |
|---|---|---|
| `VITE_API_URL` | Endereço do back-end | `http://localhost:8081` (local) ou o endereço do back no Render (produção) |

Não guarde senhas nem chaves no front-end: tudo que começa com `VITE_` fica visível no navegador. O arquivo `.env` **não deve ser commitado**.

## Publicação (Vercel)

1. Importe o repositório na Vercel (framework Vite).
2. Em **Settings > Environment Variables**, crie `VITE_API_URL` com o endereço do back-end.
3. Faça um **Redeploy** (sem cache) sempre que alterar essa variável, pois ela é embutida na hora do build.
4. O back-end só aceita requisições do endereço principal do site (regra de CORS). Acesse sempre pelo domínio principal, e não pelos links de pré-visualização de cada deploy.

## Observações de uso

- O back-end está no plano gratuito do Render e **dorme após 15 minutos sem uso**; o primeiro acesso depois disso pode demorar cerca de um minuto.
- Os horários das leituras são guardados em UTC e exibidos no horário local pelo front.
- Leituras marcadas como **inválidas** ou **duplicadas** pelo processo de limpeza de dados (RF05) não aparecem nos gráficos nem entram nos cálculos.

## Equipe

Projeto desenvolvido por estudantes do Senac como parte do Projeto Integrador (Eletiva II – IoT), cronograma: entrega técnica em 16/11/2026 e pitch final em 23/11/2026.