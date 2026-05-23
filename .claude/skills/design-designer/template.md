Design a {{Q1}} for {{Q2a}}.

Before generating: Claude Design has a documented default aesthetic — centered serif headline,
muted off-white background, sans-serif supporting copy, generous line-height, one accent color,
subtle grain, "thoughtful" voice. That default is FORBIDDEN in this job. If your first render
drifts into it, you have failed the brief. Build something a judge at a design awards show would
argue about, not something a SaaS landing page generator would approve.

Aesthetic target: {{Q3_primary}} crossed with {{Q3_secondary}}. Non-negotiable reference:
{{Q6b}} — specific brand/film/publication with year/context. If your first instinct is
"editorial," "minimal," "considered," "intentional," or "thoughtful" — you are drifting to
default. Restart the visual.

Audience state: {{Q2b}} — what they're feeling. Register the design for THAT emotional state,
not a generic "viewer."

Context I'm attaching: {{Q4}} — file paths/URLs. Token source of truth: {{Q4b}} — specific path.
Before you render anything, output a 6-line visual autopsy of the refs:
- dominant hue + exact hex
- type classification + x-height behavior
- grid module size in px
- negative-space ratio
- edge treatment (hard/soft/bled)
- one word for what the refs refuse to do
If you cannot produce this autopsy, stop and ask. Do not proceed on vibes.

Brand system (load from tokens, do not invent):
- Primary {{Q5.primary_color}}
- Accent {{Q5.accent_color}}
- Neutral {{Q5.neutral_color}}
- Headline {{Q5.headline_typeface}}
- Body {{Q5.body_typeface}}

Writing voice — match this register for ALL generated copy:
{{Q5b}}
Sentence length: max 14 words in any hero. Read every line out loud in your head — if it sounds
like a pitch deck, delete it.

Structure: {{Q7}} — section-by-section list. Density: {{Q7b}} — sparse or dense.

Produce exactly {{Q6.count}} variations along the axis of {{Q6.axis}}:
- V1: orthodox execution of the brand system, zero deviation.
- V2: same content, hostile grid — break the brand's default rhythm.
- V3: same content, wrong-medium hijack — treat it as if it belonged to
  [specific unrelated medium: arcade cabinet / court filing / liner notes / transit signage].
- V4: same content, the version a competitor would ship if they were trying to embarrass us.
If any two variations could swap titles and remain plausible, you failed the axis — restart.

Banned visual: {{Q8.visual}}.
Banned copy moves: {{Q5c_plus_Q8_copy}}.
Cringe priority: {{Q12}} — worse sin is X.

Canvas ratio: {{Q1.5}} — explicit, e.g., 1920x1080 / 9:16 / 1080x1350.
{{#if Q1_is_deck_and_Q9_not_none}}
Speaker notes — {{Q9}}, full conversational script per slide,
placed in #speaker-notes JSON block per Claude Design's convention.
{{/if}}
{{#if Q9_is_none}}
NEVER add speaker notes.
{{/if}}

Tweaks (use EDITMODE-BEGIN/EDITMODE-END JSON markers, wire per Claude Design's spec):
{{Q11}} — structured list: label, type, affects.

Every slide/screen must carry `data-screen-label="NN Title"` (1-indexed) for review comments.

Rejection gates — check before you return:
1. Hero copy contains zero banned words.
2. At least two variations would get a "what the hell is this" reaction from a design director.
3. The palette is not muted-neutrals-plus-one-accent.
4. No variation contains serif-display-headline over sans-body (unless explicitly brand-spec'd).
5. Every piece of copy references a specific, falsifiable detail from the attached refs or brand.
If any gate fails, silently regenerate that variation before returning.

Export target: {{Q10}} — format.
{{#if Q10_includes_claude_code}}
Include the hand-off command ready to paste.
{{/if}}

One page, ship-ready, no placeholder copy, no garbled letters, no overlapping zones.
