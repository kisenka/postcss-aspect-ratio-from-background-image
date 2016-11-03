# PostCSS Aspect Ratio From Background Image ![Build Status](https://travis-ci.org/kisenka/postcss-aspect-ratio-from-background-image.svg) ![Coverage](https://coveralls.io/repos/github/kisenka/postcss-aspect-ratio-from-background-image/badge.svg)

[PostCSS] plugin to generate element dimension styles based on background image aspect ratio (see [related article](https://css-tricks.com/snippets/sass/maintain-aspect-ratio-mixin)).
SVG files only supported at this moment.

Input:

```css
.image {
  background-image: url('path-to-image');
}
```

Output:

```css
.image:after {
  background-image: url('path-to-image');
  padding-top: 33% /* calculated image aspect ratio here */
}
```

## Installation

```
npm install postcss-aspect-ratio-from-background-image
```

## Usage

```js
postcss([ require('postcss-aspect-ratio-from-background-image') ])
```

[PostCSS]: https://github.com/postcss/postcss
