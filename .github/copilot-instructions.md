# Copilot Instructions - Projeto Robo Interativo (Sorriso + Toque)

Estas instruções orientam o GitHub Copilot / Assistentes de IA sobre como contribuir corretamente neste repositório.

## Visão Geral do Projeto

Aplicação **Next.js (App Router)** que combina:

- Detecção facial via **face-api.js** (expressões: happy, angry, landmarks, direção do rosto)
- Mecânica de interação assistida: **sorriso abre janela de 5s** + **toque inicia reconhecimento de voz**
- Reconhecimento de voz (Web Speech API) e síntese TTS via endpoint Pollinations (fetch de áudio)
- Componentes visuais: olhos robóticos que acompanham posição do rosto, interrogação quando escutando, overlay de instruções.

## Fluxo de Interação (Core)

1. Usuário aparece na câmera (componente `FaceDetection`).
2. Ao detectar sorriso acima do limiar: abre janela de 5 segundos (`smileWindowActive`).
3. Durante a janela o usuário pode tocar em **qualquer lugar da tela** para iniciar a escuta.
4. Web Speech API captura pergunta → gera prompt restrito a astronomia → busca áudio TTS.
5. Enquanto áudio toca: estado `isTalking` bloqueia novas ativações.
6. Ao terminar: volta ao estado inicial aguardando novo sorriso.
7. Expressão angry pode servir futuramente para cancelar (já existe função base `handleAngry`).

## Principais Arquivos

- `src/app/page.tsx`: Orquestra estados (isListening, isTalking, janela de sorriso) e overlays.
- `src/components/FaceDetection.jsx`: Carrega modelos e detecta expressões / posição.
- `src/components/RobotEyes.tsx`: Renderiza olhos/boca/interrogação e botão fallback.
- `src/components/VoiceAssistant.tsx`: Encapsula reconhecimento de voz + fluxo TTS.
- `src/utils/interactionHandlers.ts`: Handlers simples (pode ser reduzido com a nova lógica assistida).
- `public/models/`: Modelos do face-api.js.

## Convenções de Código

- Idioma dos comentários: **Português do Brasil**.
- Preferir **TypeScript** para novos componentes; se JS legado existir, pode ser migrado incrementalmente.
- Evitar lógica de negócio em JSX inline complexa → extrair helpers.
- Nomear estados booleanos com prefixo `is/has/can`.
- Funções puras utilitárias em `src/utils/`.
- Evitar uso direto de `any` — tipar estruturas mínimas.

## Diretrizes de Reconhecimento de Voz

- Sempre verificar suporte: `window.SpeechRecognition || window.webkitSpeechRecognition`.
- Não iniciar automaticamente sem gesto do usuário em mobile (mas o fluxo atual já garante o toque após sorriso).
- Se for adicionar fallback: usar `MediaRecorder` + backend (ainda não implementado).
- Restringir respostas a astronomia (prompt já reforça isso; manter consistência).

## UI/UX

- Manter overlay discreto; evitar bloquear conteúdo enquanto `isTalking`.
- Barra de progresso da janela de sorriso deve atualizar a cada ~200ms (já implementado com state `now`).
- Evitar múltiplos overlays concorrentes.

## Performance

- Intervalo de detecção atual: 1000ms; pode ser configurado para mobile posteriormente (placeholder: extrair var).
- Se criar otimizações: permitir pausar detecção enquanto áudio toca para economizar CPU.

## Erros & Resiliência

- Proteger chamadas de `audio.play()` com try/catch (já feito).
- Sempre limpar timeouts ao desmontar ou abortar reconhecimento.
- Verificar tamanho do blob de áudio antes de tocar.

## Estilo de Commits (sugestão)

Use prefixos semânticos:

- `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`
  Ex: `feat(interaction): adicionar vibração ao abrir janela de sorriso`

## Testes

- Testes existentes em `tests/` e alguns `.test.mjs`.
- Ao criar nova lógica: adicionar pelo menos teste de função pura (ex: util de cálculo de offsets ou verificação de janela ativa).
- Evitar testar APIs de navegador diretamente sem mocks.

## O que NÃO fazer

- Não mover modelos de `public/models/` sem atualizar paths.
- Não adicionar dependências grandes para algo trivial (ex: lodash para simples map/filter).
- Não expor chaves ou endpoints sensíveis (TTS atual usa URL pública derivada de prompt).

## Roadmap (Sugestões Futuras)

- Ajustar limiar de sorriso adaptativo (desktop vs mobile)
- Vibrar (Haptic) ao abrir janela em mobile (`navigator.vibrate(80)`).
- Expor método imperativo de `VoiceAssistant` (forwardRef) para controle mais direto (pré-esboçado nas discussões).
- Cancelamento por expressão angry durante escuta.
- Modo acessibilidade (aria-live para mudanças de estado: "Sorria", "Toque para falar", "Respondendo").

## Padrão para Novas Features

1. Criar branch: `feat/<nome-descritivo>`.
2. Adicionar testes (se envolver lógica pura).
3. Rodar build e lint.
4. Abrir PR descrevendo mudança, risco e passos de teste manual.

## Checklist de PR

- [ ] Build passa (`npm run build`)
- [ ] Sem warnings críticos no console do navegador
- [ ] Interação sorriso→toque preservada
- [ ] Sem regressão visual nos olhos / interrogação
- [ ] Testes (quando aplicável)

## Mensagens do Assistente (Guidelines)

- Responder em português do Brasil.
- Explicar brevemente raciocínio ao sugerir mudança estrutural.
- Incluir motivação de qualquer nova dependência.
- Quando alterar comportamento de interação, descrever fluxo completo antes de editar.

---

Essas instruções podem ser expandidas conforme o projeto evolui. Atualize este arquivo quando adicionar novos fluxos de interação ou serviços externos.
