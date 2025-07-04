const gulp = require('gulp');
const rename = require('gulp-rename');

function buildIcons() {
  return gulp
    .src('nodes/**/*.png')
    .pipe(rename((path) => {
      // Keep the full path structure under dist/nodes/
      path.dirname = 'nodes/' + path.dirname.replace(/.*nodes[\/\\]/, '');
    }))
    .pipe(gulp.dest('dist'));
}

function buildFonts() {
  return gulp
    .src('fonts/**/*')
    .pipe(gulp.dest('dist/fonts'));
}

exports['build:icons'] = buildIcons;
exports['build:fonts'] = buildFonts;
exports['build'] = gulp.parallel(buildIcons, buildFonts);