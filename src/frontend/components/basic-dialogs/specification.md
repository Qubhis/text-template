# Basic Dialogs - Material Design 3 Specification

> **1:1 extraction from Material Design 3 Specs**  
> Source: https://m3.material.io/components/dialogs/specs#23e479cf-c5a6-4a8b-87b3-1202d51855ac  
> Extracted: All accordions systematically expanded for complete coverage

## Anatomy

Container, Icon (optional), Headline, Supporting text, Divider (optional), Button (label text), Scrim

## Basic Dialog Specifications

### Enabled

#### Container

- **Dialog container color**: `md-sys-color-surface-container-high`
- **Dialog container elevation**: `md-sys-elevation-level3`
- **Dialog container surface tint layer color**: `md-sys-color-surface-tint`
- **Dialog container shape**: `md-sys-shape-corner-extra-large`

#### Label text

- **Dialog action label text font**: `md-sys-typescale-label-large-font`
- **Dialog action label text line height**: `md-sys-typescale-label-large-line-height`
- **Dialog action label text size**: `md-sys-typescale-label-large-size`
- **Dialog action label text weight**: `md-sys-typescale-label-large-weight`
- **Dialog action label text tracking**: `md-sys-typescale-label-large-tracking`
- **Dialog action label text color**: `md-sys-color-primary`

#### Icon

- **Dialog icon size**: `24dp`
- **Dialog icon color**: `md-sys-color-secondary`

#### Subhead

- **Dialog subhead font**: `md-sys-typescale-headline-small-font`
- **Dialog subhead line height**: `md-sys-typescale-headline-small-line-height`
- **Dialog subhead size**: `md-sys-typescale-headline-small-size`
- **Dialog subhead weight**: `md-sys-typescale-headline-small-weight`
- **Dialog subhead tracking**: `md-sys-typescale-headline-small-tracking`
- **Dialog subhead color**: `md-sys-color-on-surface`

#### Headline

- **Dialog headline font**: `md-sys-typescale-headline-small-font`
- **Dialog headline line height**: `md-sys-typescale-headline-small-line-height`
- **Dialog headline size**: `md-sys-typescale-headline-small-size`
- **Dialog headline weight**: `md-sys-typescale-headline-small-weight`
- **Dialog headline tracking**: `md-sys-typescale-headline-small-tracking`
- **Dialog headline color**: `md-sys-color-on-surface`

#### Divider

- **Dialog divider color**: `md-sys-color-outline`
- **Dialog divider height**: `1dp`

#### Supporting text

- **Dialog supporting text font**: `md-sys-typescale-body-medium-font`
- **Dialog supporting text line height**: `md-sys-typescale-body-medium-line-height`
- **Dialog supporting text size**: `md-sys-typescale-body-medium-size`
- **Dialog supporting text weight**: `md-sys-typescale-body-medium-weight`
- **Dialog supporting text tracking**: `md-sys-typescale-body-medium-tracking`
- **Dialog supporting text color**: `md-sys-color-on-surface-variant`

### Hovered

#### Label text

- **Dialog action hover label text color**: `md-sys-color-primary`

#### State layer

- **Dialog action hover state layer color**: `md-sys-color-primary`
- **Dialog action hover state layer opacity**: `md-sys-state-hover-state-layer-opacity`

### Focused

#### Label text

- **Dialog action focus label text color**: `md-sys-color-primary`

#### State layer

- **Dialog action focus state layer color**: `md-sys-color-primary`
- **Dialog action focus state layer opacity**: `md-sys-state-focus-state-layer-opacity`

### Pressed (ripple)

#### Label text

- **Dialog action pressed label text color**: `md-sys-color-primary`

#### State layer

- **Dialog action pressed state layer color**: `md-sys-color-primary`
- **Dialog action pressed state layer opacity**: `md-sys-state-pressed-state-layer-opacity`

## Basic Dialog Color

Color values are implemented through design tokens. For design, this means working with color values that correspond with tokens. For implementation, a color value will be a token that references a value.

**Basic dialog color roles used for light and dark schemes:**

- Surface container high
- Secondary
- On surface
- On surface variant
- Primary
- Scrim

## Basic Dialog Measurements

| Attribute                        | Value                |
| -------------------------------- | -------------------- |
| Container shape                  | 28dp corner radius   |
| Container height                 | Dynamic              |
| Container width                  | Min 280dp; Max 560dp |
| Divider height                   | 1dp                  |
| Icon size                        | 24dp                 |
| Minimum width                    | 280dp                |
| Maximum width                    | 560dp                |
| Alignment with icon              | Center-aligned       |
| Alignment without icon           | Start-aligned        |
| Top/Left/right/bottom padding    | 24dp                 |
| Padding between buttons          | 8dp                  |
| Padding between title and body   | 16dp                 |
| Padding between icon and title   | 16dp                 |
| Padding between body and actions | 24dp                 |
