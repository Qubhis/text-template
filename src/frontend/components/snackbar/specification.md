# Snackbar - Material Design 3 Specification

> **1:1 extraction from Material Design 3 Specs**  
> Source: https://m3.material.io/components/snackbar/specs#29997eb8-b1bf-4ed9-ac67-19400b924e30  
> Extracted: All accordions systematically expanded for complete coverage

## Anatomy

Container, Supporting text, Action (optional), Icon (optional close affordance)

## Snackbar Specifications

### Enabled

#### Container
- **Snackbar container color**: `--md-sys-color-inverse-surface`
- **Snackbar container shadow color**: `--md-sys-color-shadow`
- **Snackbar container elevation**: `md.sys.elevation.level3`
- **Snackbar container shape**: `md.sys.shape.corner.extra-small`
- **Snackbar container with single line height**: `48dp`
- **Snackbar container with two lines height**: `68dp`

#### Label text
- **Snackbar label text color**: `md.sys.color.inverse-primary`
- **Snackbar label text font**: `md.sys.typescale.label-large.font`
- **Snackbar label text line height**: `md.sys.typescale.label-large.line-height`
- **Snackbar label text size**: `md.sys.typescale.label-large.size`
- **Snackbar label text tracking**: `md.sys.typescale.label-large.tracking`
- **Snackbar label text weight**: `md.sys.typescale.label-large.weight`

#### Icon
- **Snackbar icon color**: `md.sys.color.inverse-on-surface`
- **Snackbar icon size**: `24dp`

#### Supporting text
- **Snackbar supporting text color**: `md.sys.color.inverse-on-surface`
- **Snackbar supporting text font**: `md.sys.typescale.body-medium.font`
- **Snackbar supporting text line height**: `md.sys.typescale.body-medium.line-height`
- **Snackbar supporting text size**: `md.sys.typescale.body-medium.size`
- **Snackbar supporting text tracking**: `md.sys.typescale.body-medium.tracking`
- **Snackbar supporting text weight**: `md.sys.typescale.body-medium.weight`

### Hovered

#### Label text
- **Snackbar hover label text color**: `md.sys.color.inverse-primary`

#### State layer
- **Snackbar hover state layer color**: `md.sys.color.inverse-primary`
- **Snackbar hover state layer opacity**: `md.sys.state.hover.state-layer-opacity`
- **Snackbar icon hover state layer color**: `md.sys.color.inverse-on-surface`
- **Snackbar icon hover state layer opacity**: `md.sys.state.hover.state-layer-opacity`

#### Icon
- **Snackbar icon hover icon color**: `md.sys.color.inverse-on-surface`

### Focused

#### Label text
- **Snackbar focus label text color**: `md.sys.color.inverse-primary`

#### State layer
- **Snackbar focus state layer color**: `md.sys.color.inverse-primary`
- **Snackbar focus state layer opacity**: `md.sys.state.focus.state-layer-opacity`
- **Snackbar icon focus state layer color**: `md.sys.color.inverse-on-surface`
- **Snackbar icon focus state layer opacity**: `md.sys.state.focus.state-layer-opacity`

#### Icon
- **Snackbar icon focus icon color**: `md.sys.color.inverse-on-surface`

### Pressed (ripple)

#### Label text
- **Snackbar pressed label text color**: `md.sys.color.inverse-primary`

#### State layer
- **Snackbar pressed state layer color**: `md.sys.color.inverse-primary`
- **Snackbar pressed state layer opacity**: `md.sys.state.pressed.state-layer-opacity`
- **Snackbar icon pressed state layer color**: `md.sys.color.inverse-on-surface`
- **Snackbar icon pressed state layer opacity**: `md.sys.state.pressed.state-layer-opacity`

#### Icon
- **Snackbar icon pressed icon color**: `md.sys.color.inverse-on-surface`

## Snackbar Color

Color values are implemented through design tokens. For design, this means working with color values that correspond with tokens. For implementation, a color value will be a token that references a value.

**Snackbar color roles used for light and dark schemes:**
- Inverse surface
- Inverse on surface
- Inverse primary
- Inverse on surface

## Snackbar Measurements

| Attribute | Description |
|-----------|-------------|
| Single line height | 48dp |
| Two lines height | 68dp |
| Icon size | 24dp |
| Shape | Extra-small corner radius |

## Configurations

1. Single line
2. Single line with action
3. Two lines
4. Two lines with action
5. Two lines with longer action

---

*Complete 1:1 extraction with all accordions systematically expanded. All visible specifications from the Material Design 3 Snackbar page have been captured with proper CSS variable naming conversion where applicable.*