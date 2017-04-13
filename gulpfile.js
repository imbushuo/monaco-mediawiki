var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

gulp.task('compile', function() {
      return gulp.src('**/*.js')
         .pipe(uglify()) 
         .pipe(sourcemaps.write()) // Now the sourcemaps are added to the .js file 
         .pipe(gulp.dest('release/'));
});