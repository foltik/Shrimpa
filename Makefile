MAKE="make"
INSTALL="install"
TAR="tar"
NODE="node"
NPM="npm"
DESTDIR="./dist"
TMPDIR := $(shell mktemp -d)

all: builddirs npm-dependencies swig min-html min-css min-js copy-assets copy-includes
	
builddirs:
	mkdir -p $(CURDIR)/build
	mkdir -p $(CURDIR)/build/{assets,classes,includes,login,panel,register}
	mkdir -p $(CURDIR)/build/assets/{css,js,fonts,img,tools}

installdirs:
	mkdir -p $(DESTDIR)/
	mkdir -p $(DESTDIR)/{assets,classes,includes,login,panel,register}
	mkdir -p $(CURDIR)/build/assets/{css,js,fonts,img,tools}

npm-dependencies:
	$(NPM) install

swig:
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json templates/index.swig > $(CURDIR)/build/index.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json templates/faq.swig > $(CURDIR)/build/faq.html
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json templates/tools.swig > $(CURDIR)/build/tools.html
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json includes/invite.swig > $(CURDIR)/build/includes/invite.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json includes/report.swig > $(CURDIR)/build/includes/report.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json includes/reports.swig > $(CURDIR)/build/includes/reports.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json includes/search.swig > $(CURDIR)/build/includes/search.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json includes/shimapan.swig > $(CURDIR)/build/includes/shimapan.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json includes/footer.swig > $(CURDIR)/build/includes/footer.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json templates/upload.swig > $(CURDIR)/build/upload.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json templates/login/index.swig > $(CURDIR)/build/login/index.html
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json templates/panel/index.swig > $(CURDIR)/build/panel/index.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json templates/register/index.swig > $(CURDIR)/build/register/index.html

min-html:
	$(NODE) node_modules/htmlmin/bin/htmlmin $(CURDIR)/build/index.php -o $(CURDIR)/build/index.php 
	$(NODE) node_modules/htmlmin/bin/htmlmin $(CURDIR)/build/faq.html -o $(CURDIR)/build/faq.html 
	$(NODE) node_modules/htmlmin/bin/htmlmin $(CURDIR)/build/tools.html -o $(CURDIR)/build/tools.html
	$(NODE) node_modules/htmlmin/bin/htmlmin $(CURDIR)/build/login/index.html -o $(CURDIR)/build/login/index.html
	$(NODE) node_modules/htmlmin/bin/htmlmin $(CURDIR)/build/register/index.html -o $(CURDIR)/build/register/index.html

min-css:
	$(NODE) $(CURDIR)/node_modules/.bin/cleancss --s0 $(CURDIR)/assets/css/shimapan.css > $(CURDIR)/build/assets/css/shimapan.min.css
	$(NODE) $(CURDIR)/node_modules/.bin/cleancss --s0 $(CURDIR)/assets/css/shimapan-panel.css > $(CURDIR)/build/assets/css/shimapan-panel.min.css
	$(NODE) $(CURDIR)/node_modules/.bin/cleancss --s0 $(CURDIR)/assets/css/bootstrap.css > $(CURDIR)/build/assets/css/bootstrap.min.css 

min-js:
	$(NODE) $(CURDIR)/node_modules/.bin/uglifyjs --screw-ie8 ./assets/js/shimapan.js >> $(CURDIR)/build/assets/js/shimapan.min.js 
	$(NODE) $(CURDIR)/node_modules/.bin/uglifyjs --screw-ie8 ./assets/js/config.js >> $(CURDIR)/build/assets/js/config.min.js

copy-assets:
	cp -vT $(CURDIR)/assets/js/bootstrap.min.js $(CURDIR)/build/assets/js/bootstrap.min.js
	cp -vT $(CURDIR)/assets/js/skel.min.js $(CURDIR)/build/assets/js/skel.min.js
	cp -vT $(CURDIR)/assets/js/jquery.min.js $(CURDIR)/build/assets/js/jquery.min.js
	cp -rv $(CURDIR)/assets/fonts/* $(CURDIR)/build/assets/fonts/
	cp -rv $(CURDIR)/assets/img/* $(CURDIR)/build/assets/img/
	cp -rv $(CURDIR)/assets/tools/* $(CURDIR)/build/assets/tools

copy-includes:
	cp -v $(CURDIR)/includes/*.php $(CURDIR)/build/includes/
	cp -v $(CURDIR)/classes/*.php $(CURDIR)/build/classes/

pack:
	DESTDIR=$(TMPDIR)/shimapan
	export DESTDIR
	install
	$(TAR) cJf shimapan.tar.xz $(DESTDIR)
	rm -rf $(TMPDIR)

clean:
	rm -rvf $(CURDIR)/node_modules 
	rm -rvf $(CURDIR)/build

install: installdirs
	cp -rv $(CURDIR)/build/* $(DESTDIR)/
	
uninstall:
	rm -rvf $(DESTDIR)/