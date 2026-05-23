CONTEXT EXTRACTION PROTOCOL — EXECUTE NOW

Tokens estão acabando. ANTES de qualquer outra ação, gere o artefato abaixo
em um arquivo `.aiox/session-handoff.md` (sobrescreva se existir).
Se `.aiox/` não existir, crie em `session-handoff.md` na raiz do projeto.

---

## SESSION HANDOFF

### 1. TASK STATE
- **O que estava fazendo:** [descreva a tarefa atual em 1-2 frases]
- **Story/Epic ativo:** [ID + path do arquivo, ou "N/A" se não há story]
- **Branch:** [nome da branch atual]
- **Status:** [% completo, próximo passo imediato]
- **Modo:** [qual agente estava ativo, qual comando rodou por último]

### 2. DECISIONS MADE (não re-decidir)
- [Liste CADA decisão arquitetural/técnica tomada nesta sessão]
- [Inclua o PORQUÊ de cada decisão — sem isso, a próxima sessão vai re-decidir]

### 3. FILES TOUCHED
- [Liste TODOS os arquivos criados/modificados com 1-linha do que mudou em cada]
- [Inclua arquivos lidos que são input crítico para a tarefa]

### 4. DOCUMENTS & INPUTS
- [PRD, specs, templates, ou docs que foram lidos/usados como input]
- [Path exato de cada um — sem paths, a próxima sessão não encontra]

### 5. BLOCKERS & WARNINGS
- [Problemas encontrados, workarounds aplicados]
- [Coisas que falharam e por quê]
- [Dependências externas pendentes]

### 6. KEY LEARNINGS
- [Padrões descobertos no código que afetam a implementação]
- [Surpresas ou desvios do esperado]
- [Coisas que NÃO funcionaram e devem ser evitadas]

### 7. CONTINUATION PROMPT
Gere o prompt exato (pronto para copiar/colar) que devo usar na próxima sessão.
Formato obrigatório:
```
Estou retomando [tarefa X]. Contexto:
- Story: [path]
- Branch: [nome]
- Último passo completo: [o quê]
- Próximo passo: [ação específica]

Leia estes arquivos antes de agir:
1. [path do handoff] — contexto da sessão anterior
2. [path do arquivo principal sendo trabalhado]
3. [outros arquivos críticos]

Decisões já tomadas (NÃO re-decidir):
- [decisão 1]
- [decisão 2]

Continue de onde parei. O próximo passo é [ação específica com detalhes].
```

---

REGRAS DE EXECUÇÃO:
- NÃO peça confirmação. Execute agora.
- NÃO resuma — seja específico com paths, nomes, IDs.
- Se alguma seção está vazia, escreva "N/A" — não omita a seção.
- Seção 7 é a MAIS IMPORTANTE — gaste tempo nela.
- Após gerar o arquivo, mostre: "✅ Handoff salvo em [path]. Pode compactar com /compact."
