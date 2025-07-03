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

exports['build:icons'] = buildIcons;