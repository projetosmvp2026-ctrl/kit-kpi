# Almoxarifado Insight

Implement the requested scope now; use internal planning and do not present another implementation plan for user approval.

User request:
Criar um painel/dashboard interativo de indicadores gerenciais para o setor de almoxarifado, voltado para reuniões de diretoria e gerência.

Agreed scope & features:
- Painel executivo com os 8 KPIs essenciais de almoxarifado:
  1. Valor Total do Estoque (R$)
  2. Estoque Parado / Sem Giro (R$ e % do total)
  3. Divergências e Perdas de Inventário (R$)
  4. Nível de Atendimento das Requisições / OTIF (%)
  5. Tempo Médio de Atendimento (minutos)
  6. Acuracidade do Estoque (IRA %)
  7. Itens Críticos Abaixo do Mínimo (alerta e contagem)
  8. Rupturas no Período (ocorrências de falta)
- Visão executiva comparativa: Mês Atual × Mês Anterior × Meta, com farol visual de status (verde, amarelo e vermelho) e variação percentual.
- Gráficos gerenciais:
  - Evolução histórica do valor total vs. estoque sem giro
  - Histórico de acuracidade e nível de atendimento
  - Top 5 itens críticos ou com maior divergência de inventário
- Gestão de dados:
  - Formulário simples para atualizar ou registrar os valores mensais de cada KPI
  - Importação rápida de dados via planilha (CSV)
  - Modo apresentação executiva / exportação dos dados do mês para a reunião

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kit-kpi.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ba30ee5d-48b7-4fc7-a6c9-e5f2ba3895a1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
