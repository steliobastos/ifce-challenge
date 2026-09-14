# Prompt — Material de divulgação do IFCE Challenge (Pokémon TCG)

> Feito para colar direto num gerador de imagens (Midjourney, DALL·E, Ideogram, Stable Diffusion etc.). Os prompts estão em inglês porque a maioria dos modelos entende melhor palavras-chave de estilo em inglês — mas o texto do evento (data, local) você adiciona depois, por fora, em edição.

## ⚠️ Aviso importante antes de usar

**Não peça personagens, logos ou cartas reais do Pokémon.** A maioria dos geradores de imagem recusa (tem filtro de marca registrada) ou produz algo errado/deformado. Além disso, usar a marca Pokémon num material de divulgação distribuído publicamente é risco de direito autoral — não é algo que a organização de vocês tenha licença para usar comercialmente. Por isso os prompts abaixo pedem um estilo **"trading card game" abstrato e genérico** (o mesmo caminho que o próprio site já usa: cards holográficos com ícones simples, sem personagens). Se quiser reforçar a ligação com o jogo real, isso fica só no texto escrito ("Torneio Pokémon TCG Live"), nunca na imagem gerada.

## Paleta de cores (usar exatamente esses hex no prompt)

| Cor | Hex | Uso |
|---|---|---|
| Fundo (navy escuro) | `#050817` → `#0A1030` | Fundo principal |
| Ciano | `#39D3FF` | Destaque, brilho |
| Azul | `#2F6BFF` / `#1B3FD0` | Cards, gradientes |
| Índigo | `#6C4BFF` | Cards, gradientes |
| Dourado | `#FFD24A` / `#F0A81B` | Selo, CTA, detalhes |
| Verde IFCE | `#46A151` / `#6FD07C` | Identidade institucional |
| Vermelho IFCE | `#CD3539` | Uso pontual (evitar excesso) |
| Texto claro | `#EDF1FF` | Tipografia sobre o fundo escuro |

## Conteúdo textual do evento (para adicionar por fora, na edição)

- **Nome:** IFCE Challenge — Pokémon TCG
- **Data:** Sábado, 19/09/2026
- **Horário:** 9h às 11h (check-in até 9h10)
- **Local:** Laboratório de Informática 2 — IFCE Campus Horizonte
- **Chamada:** "Um sábado de manhã inteiro dedicado ao Pokémon Estampas Ilustradas"
- **Destaques:** Torneio no Pokémon TCG Live · Liga casual com cartas físicas · Espaço livre de troca · Oficina para quem nunca jogou
- **Reforços:** Entrada gratuita · Sem taxa de inscrição · Sem premiação (evento de integração e aprendizado)

---

## Prompt principal (post quadrado — Instagram feed, 1:1)

```
Modern esports-style promotional poster for a trading card game tournament event, dark navy background (#050817 to #0A1030 gradient), five glossy holographic collectible card silhouettes floating at slight angles with soft glow and light streak reflections, card gradients in electric cyan (#39D3FF), blue (#2F6BFF), indigo (#6C4BFF) and warm gold (#FFD24A), thin glowing line-art grid pattern in the background, subtle green accent glow (#46A151) referencing an educational institution brand, large empty negative space in the center-top for a bold headline, empty space at the bottom for event details, clean tech/gaming aesthetic, high contrast, sharp vector-like shapes, soft ambient glow, no readable text, no logos, no real trading card characters or artwork, no photorealistic people, digital illustration, square 1:1 composition
```

## Prompt — Story / Reels (vertical, 9:16)

```
Vertical mobile-first promotional graphic, dark navy gradient background (#050817 to #0A1030), three large holographic trading card silhouettes stacked diagonally with cyan (#39D3FF), indigo (#6C4BFF) and gold (#FFD24A) glossy gradients, soft glow and shine streaks across the cards, faint glowing grid lines in the background, green accent glow (#46A151) in one corner, generous empty space at the top for a headline and near the bottom for event details and a call-to-action button, energetic but clean gaming/esports style, no text, no logos, no real characters, digital illustration, 9:16 vertical composition
```

## Prompt — Banner largo (site / capa de grupo, 16:9)

```
Wide horizontal promotional banner, dark navy gradient background (#050817 to #0A1030) with a faint glowing grid pattern, five holographic trading card silhouettes arranged in a loose diagonal cluster on the right side, glossy gradients in cyan (#39D3FF), blue (#2F6BFF), indigo (#6C4BFF) and gold (#FFD24A) with soft glow and shine streak highlights, subtle green brand glow (#46A151) in a corner, large clean empty space on the left two-thirds for headline text and event details, modern esports/gaming landing page aesthetic, high contrast, sharp shapes, no text, no logos, no real characters, digital illustration, 16:9 composition
```

## Negative prompt (cole no campo de "negative prompt" se o gerador tiver essa opção)

```
Pokémon characters, Pikachu, official Pokémon logo, trademarked artwork, copyrighted characters, realistic human faces, photorealistic people, blurry, low contrast, watermark, extra limbs, distorted hands, low quality, jpeg artifacts, cluttered composition, text, typography, gibberish letters, misspelled words
```

## Dicas de uso

1. **Não confie no gerador para escrever o texto do evento.** Praticamente todo modelo erra letras/acentos em português. Gere a arte de fundo sem texto e adicione o texto depois (Canva, Figma, Photoshop, ou até o editor de imagem do celular).
2. Se o gerador aceitar referência de imagem, use um print da seção "hero" do site ([site/index.html](site/index.html)) como *image prompt* / *style reference* — ele já tem exatamente essa composição de cards holográficos.
3. Peça 2-4 variações por prompt e escolha a que tiver melhor espaço vazio pro texto entrar sem brigar com os elementos gráficos.
4. Para stories, deixe margem de segurância nos ~15% superiores e inferiores (é onde o Instagram sobrepõe interface).
