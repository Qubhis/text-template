# Search Bar - Material Design 3 Specification

## Overview

Search lets people enter a keyword or phrase to get relevant information. A search bar is the basic form implementation of search functionality.

## Component Elements

1. Container
2. Leading icon button
3. Supporting text
4. Avatar or trailing icon (optional)

## Search Bar Specifications

### Enabled State

#### Avatar

- **Shape**: `md.sys.shape.corner.full`
- **Size**: 30dp

#### Container

- **Color**: `--md-sys-color-surface-container-high`
- **Elevation**: `md.sys.elevation.level3`
- **Shape**: `md.sys.shape.corner.full`
- **Height**: 56dp

#### Leading Icon

- **Color**: `--md-sys-color-on-surface`

#### Trailing Icon

- **Color**: `--md-sys-color-on-surface-variant`

#### Supporting Text

- **Color**: `--md-sys-color-on-surface-variant`
- **Font**: `md.sys.typescale.body-large.font`
- **Line height**: `md.sys.typescale.body-large.line-height`
- **Size**: `md.sys.typescale.body-large.size`
- **Weight**: `md.sys.typescale.body-large.weight`
- **Tracking**: `md.sys.typescale.body-large.tracking`
- **Type**: `md.sys.typescale.body-large`

#### Input Text

- **Color**: `--md-sys-color-on-surface`
- **Font**: `md.sys.typescale.body-large.font`
- **Line height**: `md.sys.typescale.body-large.line-height`
- **Size**: `md.sys.typescale.body-large.size`
- **Weight**: `md.sys.typescale.body-large.weight`
- **Tracking**: `md.sys.typescale.body-large.tracking`
- **Type**: `md.sys.typescale.body-large`

### Hovered State

#### State Layer

- **Color**: `--md-sys-color-on-surface`
- **Opacity**: `md.sys.state.hover.state-layer-opacity`

#### Supporting Text

- **Color**: `--md-sys-color-on-surface-variant`

### Pressed (Ripple) State

#### State Layer

- **Color**: `--md-sys-color-on-surface`
- **Opacity**: `md.sys.state.pressed.state-layer-opacity`

#### Supporting Text

- **Color**: `--md-sys-color-on-surface-variant`

### Focused State

#### Focus Indicator

- **Color**: `md.sys.color.secondary`
- **Thickness**: `md.sys.state.focus-indicator.thickness`
- **Offset**: `md.sys.state.focus-indicator.outer-offset`

## Search Bar Color

Color roles used for light and dark schemes:

1. Surface container high
2. On surface
3. On surface variant

## Search Bar Measurements

| Element   | Attribute                       | Value                  |
| --------- | ------------------------------- | ---------------------- |
| Container | Width                           | Min: 360dp; Max: 720dp |
|           | Height                          | 56dp                   |
|           | Label alignment                 | Start-aligned          |
|           | Left padding                    | 16dp                   |
|           | Right padding                   | 16dp                   |
|           | Leading icon and label padding  | 16dp                   |
|           | Label and trailing icon padding | 16dp                   |
| Avatar    | Size                            | 30dp                   |

## Search Bar Configurations

The search bar supports the following configurations:

1. With avatar
2. With one trailing icon button
3. With two trailing icon buttons
4. With avatar and trailing icon button

## Search View (Additional Component)

### Overview

Search view provides a full-screen or docked search interface for expanded search functionality.

### Component Elements

1. Container
2. Header
3. Leading icon button
4. Supporting text
5. Trailing icon button
6. Input text
7. Divider

### Search View Specifications

#### Container

- **Color**: `--md-sys-color-surface-container-high`
- **Full screen shape**: `md.sys.shape.corner.none`
- **Docked shape**: `md.sys.shape.corner.extra-large`
- **Elevation**: `md.sys.elevation.level3`
- **Surface tint layer color**: `md.sys.color.surface-tint`
- **Full screen header height**: 72dp
- **Docked header height**: 56dp

### Search View Color

Color roles used for light and dark themes:

1. Surface container high
2. On surface variant
3. On surface
4. On surface variant
5. Outline

### Search View Measurements

| Element                 | Attribute                       | Value                                 |
| ----------------------- | ------------------------------- | ------------------------------------- |
| Container (full screen) | Width                           | Full width                            |
|                         | Height                          | Full height                           |
| Container (docked)      | Width                           | Min: 360dp; Max: 720dp                |
|                         | Height                          | Min: 240dp; Max: 2/3 of screen height |
| Header                  | Height (full screen)            | 72dp                                  |
|                         | Height (docked)                 | 56dp                                  |
|                         | Label alignment                 | Left-aligned                          |
|                         | Left padding                    | 16dp                                  |
|                         | Right padding                   | 16dp                                  |
|                         | Leading icon and label padding  | 16dp                                  |
|                         | Label and trailing icon padding | 16dp                                  |

### Search View Configurations

1. Search view - full screen
2. Search view - docked
