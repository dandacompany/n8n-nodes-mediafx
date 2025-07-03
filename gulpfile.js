const gulp = require('gulp');
const rename = require('gulp-rename');

function buildIcons() {
  return gulp
    .src('nodes/**/*.png')
    .pipe(rename((path) => {
      path.dirname = path.dirname.replace(/.*nodes[\/\\]/, '');
    }))
    .pipe(gulp.dest('dist'));
}

exports['build:icons'] = buildIcons;