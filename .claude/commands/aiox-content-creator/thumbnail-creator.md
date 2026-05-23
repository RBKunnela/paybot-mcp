# Thumbnail Creator (Tutorial - Capa Lendaria)

## Sobre

**Tipo:** Tutorial / Recurso Externo (NAO e um agente IA)
**Ferramenta:** Capa Lendaria V27.0
**Funcao:** Gerar thumbnails profissionais com IA (Google Gemini)
**Repositorio:** https://github.com/ericasouza-eng/DESAFIO-AIOX

---

## O que e a Capa Lendaria?

A Capa Lendaria e uma aplicacao web que gera thumbnails profissionais usando IA.
Ela usa a API do Google Gemini para criar imagens otimizadas para diferentes plataformas.

**NAO e um agente do squad** — e uma ferramenta separada que o AIOX Chief indica quando o usuario precisa de thumbnails.

---

## Formatos Suportados

| Formato | Dimensoes | Uso |
|---------|-----------|-----|
| YouTube | 1280x720 (16:9) | Thumbnail de video |
| Reels/Shorts | 1080x1920 (9:16) | Capa de reel/short |
| Feed Instagram | 1080x1350 | Post no feed |

---

## Como Usar

### Pre-requisitos

1. **API Key do Google Gemini**
   - Acesse: https://aistudio.google.com/apikey
   - Clique em "Create API Key"
   - Copie a chave (comeca com `AIza...`)

2. **Node.js 18+** instalado

### Passo a Passo

```bash
# 1. Clone o repositorio da Capa Lendaria
git clone https://github.com/ericasouza-eng/DESAFIO-AIOX.git

# 2. Entre na pasta
cd DESAFIO-AIOX

# 3. Instale dependencias
npm install

# 4. Configure a API key
# Crie um arquivo .env com:
echo 'VITE_GEMINI_API_KEY="sua-chave-aqui"' > .env

# 5. Inicie a aplicacao
npm run dev

# 6. Acesse no navegador
# http://localhost:5173 (ou a porta indicada)
```

### Usando a Ferramenta

```
1. Selecione o formato (YouTube, Reels, Feed)
2. Descreva o que quer na thumbnail
3. A IA gera opcoes
4. Escolha a melhor
5. Baixe em alta resolucao
```

---

## Boas Praticas para Thumbnails

### O que Funciona

| Elemento | Dica | Por que |
|----------|------|---------|
| **Rosto** | Expressao exagerada | Humanos sao atraidos por rostos |
| **Texto** | Max 3-5 palavras | Legivel em tela pequena |
| **Cores** | Contraste alto | Destaca no feed |
| **Emocao** | Surpresa, curiosidade | Gera clique |
| **Simplicidade** | Menos e mais | Rapido de processar |

### O que NAO Funciona

| Elemento | Problema |
|----------|----------|
| Muito texto | Ilegivel no celular |
| Imagem generica | Nao destaca |
| Sem contraste | Some no feed |
| Clickbait falso | Perde confianca |
| Sem rosto | Menor CTR |

### Formula de Thumbnail de Alta CTR

```
ROSTO (expressao forte)
+
TEXTO CURTO (3-5 palavras)
+
CORES DE CONTRASTE (fundo vs texto)
+
ELEMENTO VISUAL (seta, circulo, emoji)
=
THUMBNAIL QUE CONVERTE
```

---

## Integracao com o Squad

| Situacao | Fluxo |
|----------|-------|
| "Preciso de thumbnail" | Chief → indica este tutorial |
| "Capa pro meu video" | Chief → indica este tutorial |
| "Arte do video" | Chief → indica este tutorial |
| Apos cortar video | Video Editor → sugere thumbnail → Chief indica tutorial |
| Apos escrever roteiro | Scriptwriter → sugere thumbnail → Chief indica tutorial |

### Como o Chief Indica

```
Quando o usuario pede thumbnail, o AIOX Chief responde:

"Pra thumbnails profissionais, voce vai usar a Capa Lendaria.
E uma ferramenta web com IA que gera capas otimizadas.

Como usar:
1. Acesse o repositorio: github.com/ericasouza-eng/DESAFIO-AIOX
2. Siga o setup em agents/thumbnail-creator.md
3. Escolha o formato (YouTube, Reels ou Feed)
4. Descreva o que quer e a IA gera opcoes

Precisa de ajuda com o setup?"
```

---

## Checklist de Thumbnail

Antes de publicar, verificar:

- [ ] Rosto visivel e expressivo? (se aplicavel)
- [ ] Texto legivel em tela de celular?
- [ ] Max 3-5 palavras no texto?
- [ ] Contraste entre fundo e texto?
- [ ] Formato correto pra plataforma?
- [ ] Nao e clickbait enganoso?
- [ ] Transmite a emocao certa?
- [ ] Destaca entre outros videos do nicho?

---

## Troubleshooting

### Erro: "API key not valid"
- Verifique se copiou a chave corretamente
- A chave deve comecar com `AIza...`
- Verifique se a Gemini API esta ativa no Google Cloud

### Imagem nao carrega
- Verifique conexao com internet
- Tente novamente (rate limit da API)
- Verifique se a API key tem cota disponivel

### Qualidade ruim
- Seja mais especifico no prompt
- Inclua: cores, estilo, emocao desejada
- Tente variantes do mesmo prompt

---

*Tutorial: Thumbnail Creator (Capa Lendaria) - Squad AIOX Content Creator*
