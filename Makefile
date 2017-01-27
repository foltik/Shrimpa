MAKE="make"
INSTALL="install"
TAR="tar"
NODE="node"
NPM="npm"
DESTDIR="./dist"
TMPDIR := $(shell mktemp -d)

all: builddirs npm-dependencies swig copy-assets copy-includes
	
builddirs:
	mkdir -p $(CURDIR)/build
	mkdir -p $(CURDIR)/build/{assets,classes,includes,login,register}
	mkdir -p $(CURDIR)/build/assets/{css,js,fonts,img,tools}

installdirs:
	mkdir -p $(DESTDIR)/
	mkdir -p $(DESTDIR)/{assets,classes,includes,login,register}
	mkdir -p $(CURDIR)/build/assets/{css,js,fonts,img,tools}

npm-dependencies:
	$(NPM) install

swig:
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json templates/index.swig > $(CURDIR)/build/index.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json templates/faq.swig > $(CURDIR)/build/faq.html
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json templates/tools.swig > $(CURDIR)/build/tools.html
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json includes/panel.swig > $(CURDIR)/build/includes/panel.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json includes/invite.swig > $(CURDIR)/build/includes/invite.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json includes/report.swig > $(CURDIR)/build/includes/report.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json includes/reports.swig > $(CURDIR)/build/includes/reports.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json includes/search.swig > $(CURDIR)/build/includes/search.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json includes/shimapan.swig > $(CURDIR)/build/includes/shimapan.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json includes/footer.swig > $(CURDIR)/build/includes/footer.php
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json templates/login/index.swig > $(CURDIR)/build/login/index.html
	$(NODE) node_modules/swig/bin/swig.js render -j dist.json templates/register/index.swig > $(CURDIR)/build/register/index.html

copy-assets:
	cp -rv $(CURDIR)/assets/js/* $(CURDIR)/build/assets/js/
	cp -rv $(CURDIR)/assets/css/* $(CURDIR)/build/assets/css/
	cp -rv $(CURDIR)/assets/fonts/* $(CURDIR)/build/assets/fonts/
	cp -rv $(CURDIR)/assets/img/* $(CURDIR)/build/assets/img/
	cp -rv $(CURDIR)/assets/tools/* $(CURDIR)/build/assets/tools/

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
