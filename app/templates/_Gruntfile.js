/*jshint camelcase: false*/

module.exports = function (grunt) {
    'use strict';

    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // configurable paths
    var config = {
        app: 'app',
        win: 'dist/win',
        mac: 'dist/mac',
        linux: 'dist/linux',
        all: 'dist',
        tmp: 'tmp',
        resources: 'resources'
    };

    grunt.initConfig({
        config: config,
        clean: {
            win: {
                files: [{
                    dot: true,
                    src: [
                        '<%= config.win %>/*',
                        '<%= config.tmp %>/*'
                    ]
                }]
            },
            mac: {
                files: [{
                    dot: true,
                    src: [
                        '<%= config.mac %>/*',
                        '<%= config.tmp %>/*'
                    ]
                }]
            },
            linux: {
                files: [{
                    dot: true,
                    src: [
                        '<%= config.linux %>/*',
                        '<%= config.tmp %>/*'
                    ]
                }]
            },
            all: {
                files: [{
                    dot: true,
                    src: [
                        '<%= config.all %>/*',
                        '<%= config.tmp %>/*'
                    ]
                }]
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            files: '<%= config.app %>/js/*.js'
        },
        copy: {
            appLinux: {
                files: [{
                    expand: true,
                    cwd: '<%= config.app %>',
                    dest: '<%= config.linux %>/app.nw',
                    src: '**'
                }]
            },
            appMacos: {
                files: [{
                    expand: true,
                    cwd: '<%= config.app %>',
                    dest: '<%= config.mac %>/node-webkit.app/Contents/Resources/app.nw',
                    src: '**'
                }, {
                    expand: true,
                    cwd: '<%= config.resources %>/mac/',
                    dest: '<%= config.mac %>/node-webkit.app/Contents/',
                    filter: 'isFile',
                    src: '*.plist'
                }, {
                    expand: true,
                    cwd: '<%= config.resources %>/mac/',
                    dest: '<%= config.mac %>/node-webkit.app/Contents/Resources/',
                    filter: 'isFile',
                    src: '*.icns'
                }]
            },
            webkit: {
                files: [{
                    expand: true,
                    cwd: '<%=config.resources %>/node-webkit/MacOS',
                    dest: '<%= config.mac %>/',
                    src: '**'
                }]
            },
            copyWinToTmp: {
                files: [{
                    expand: true,
                    cwd: '<%= config.resources %>/node-webkit/Windows/',
                    dest: '<%= config.tmp %>/',
                    src: '**'
                }]
            }
        },
        compress: {
            appToTmp: {
                options: {
                    archive: '<%= config.tmp %>/app.zip'
                },
                files: [{
                    expand: true,
                    cwd: '<%= config.app %>',
                    src: ['**']
                }]
            },
            finalWindowsApp: {
                options: {
                    archive: '<%= config.win %>/test.zip'
                },
                files: [{
                    expand: true,
                    cwd: '<%= config.tmp %>',
                    src: ['**']
                }]
            }
        },
        rename: {
            app: {
                files: [{
                    src: '<%= config.mac %>/node-webkit.app',
                    dest: '<%= config.mac %>/test.app'
                }]
            },
            zipToApp: {
                files: [{
                    src: '<%= config.tmp %>/app.zip',
                    dest: '<%= config.tmp %>/app.nw'
                }]
            }
        }
    });

    grunt.registerTask('chmod', 'Add lost Permissions.', function () {
        var fs = require('fs');
        fs.chmodSync('dist/mac/test.app/Contents/Frameworks/node-webkit Helper EH.app/Contents/MacOS/node-webkit Helper EH', '555');
        fs.chmodSync('dist/mac/test.app/Contents/Frameworks/node-webkit Helper NP.app/Contents/MacOS/node-webkit Helper NP', '555');
        fs.chmodSync('dist/mac/test.app/Contents/Frameworks/node-webkit Helper.app/Contents/MacOS/node-webkit Helper', '555');
        fs.chmodSync('dist/mac/test.app/Contents/MacOS/node-webkit', '555');
    });

    grunt.registerTask('createLinuxApp', 'Create linux distribution.', function () {
        var done = this.async();
        var childProcess = require('child_process');
        var exec = childProcess.exec;
        exec('mkdir -p ./dist/linux; cp resources/node-webkit/Linux64/nw.pak dist/linux && cp resources/node-webkit/Linux64/nw dist/linux/node-webkit', function (error, stdout, stderr) {
            var result = true;
            if (stdout) {
                grunt.log.write(stdout);
            }
            if (stderr) {
                grunt.log.write(stderr);
            }
            if (error !== null) {
                grunt.log.error(error);
                result = false;
            }
            done(result);
        });
    });

    grunt.registerTask('createWindowsApp', 'Create windows distribution.', function () {
        var done = this.async();
        var childProcess = require('child_process');
        var exec = childProcess.exec;
        var command;

        switch (process.platform){
            case "win32":
                command = "copy /b tmp\\nw.exe+tmp\\app.nw tmp\\<%= appName %>.exe && del tmp\\app.nw tmp\\nw.exe";
                break;
            default:
                command = "cat tmp/nw.exe tmp/app.nw >>  tmp/test.exe  && rm tmp/app.nw && rm tmp/nw.exe " ;

        }

        exec(command, function (error, stdout, stderr) {
            var result = true;
            if (stdout) {
                grunt.log.write(stdout);
            }
            if (stderr) {
                grunt.log.write(stderr);
            }
            if (error !== null) {
                grunt.log.error(error);
                result = false;
            }
            done(result);
        });
    });

    grunt.registerTask('setVersion', 'Set version to all needed files', function (version) {
        var config = grunt.config.get(['config']);
        var appPath = config.app;
        var resourcesPath = config.resources;
        var mainPackageJSON = grunt.file.readJSON('package.json');
        var appPackageJSON = grunt.file.readJSON(appPath + '/package.json');
        var infoPlistTmp = grunt.file.read(resourcesPath + '/mac/Info.plist.tmp', {
            encoding: 'UTF8'
        });
        var infoPlist = grunt.template.process(infoPlistTmp, {
            data: {
                version: version
            }
        });
        mainPackageJSON.version = version;
        appPackageJSON.version = version;
        grunt.file.write('package.json', JSON.stringify(mainPackageJSON, null, 2), {
            encoding: 'UTF8'
        });
        grunt.file.write(appPath + '/package.json', JSON.stringify(appPackageJSON, null, 2), {
            encoding: 'UTF8'
        });
        grunt.file.write(resourcesPath + '/mac/Info.plist', infoPlist, {
            encoding: 'UTF8'
        });
    });

    grunt.registerTask('dist-linux', [
        'jshint',
        'clean:linux',
        'copy:appLinux',
        'createLinuxApp'
    ]);

    grunt.registerTask('dist-win', [
        'jshint',
        'clean:win',
        'copy:copyWinToTmp',
        'compress:appToTmp',
        'rename:zipToApp',
        'createWindowsApp',
        'compress:finalWindowsApp'
    ]);

    grunt.registerTask('dist-mac', [
        'jshint',
        'clean:mac',
        'copy:webkit',
        'copy:appMacos',
        'rename:app',
        'chmod',
        'dmg'
    ]);

    grunt.registerTask('dist-all-mac', [
        'jshint',
        'clean:all',
        'dist-mac',
        'dist-win',
        'dist-linux'
    ]);

    grunt.registerTask('check', [
        'jshint'
    ]);

    grunt.registerTask('dmg', 'Create dmg from previously created app folder in dist.', function () {
        var done = this.async();
        var createDmgCommand = 'resources/mac/package.sh "test"';
        require('child_process').exec(createDmgCommand, function (error, stdout, stderr) {
            var result = true;
            if (stdout) {
                grunt.log.write(stdout);
            }
            if (stderr) {
                grunt.log.write(stderr);
            }
            if (error !== null) {
                grunt.log.error(error);
                result = false;
            }
            done(result);
        });
    });

};