/**
 * Copyright (c) 2014, 2017, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your application specific code will go here
 */
define(['ojs/ojcore', 'knockout', 'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojarraytabledatasource',
  'ojs/ojoffcanvas', 'ojs/ojbutton', 'ojs/ojmenu', 'ojs/ojoption', 'ojs/ojnavigationlist', 'ojs/ojconveyorbelt'],
  function(oj, ko) {
     function ControllerViewModel() {
       var self = this;

      // Media queries for repsonsive layouts
      var smQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
      self.smScreen = oj.ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
      var mdQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.MD_UP);
      self.mdScreen = oj.ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);

       // Router setup
       self.router = oj.Router.rootInstance;
       self.router.configure({
         'dashboard': {label: 'Dashboard', isDefault: true},
         'employees': {label: 'Employees'},
         'jobs': {label: 'Jobs'}
       });
      oj.Router.defaults['urlAdapter'] = new oj.Router.urlParamAdapter();

      // Navigation setup
      var navData = [
      {name: 'Dashboard', id: 'dashboard',
       iconClass: 'oj-navigationlist-item-icon demo-icon-font-24 demo-chart-icon-24'},
      {name: 'Employees', id: 'employees',
       iconClass: 'oj-navigationlist-item-icon demo-icon-font-24 demo-fire-icon-24'},
      {name: 'Jobs', id: 'jobs',
       iconClass: 'oj-navigationlist-item-icon demo-icon-font-24 demo-people-icon-24'}
      ];
      self.navDataSource = new oj.ArrayTableDataSource(navData, {idAttribute: 'id'});

      // array of dynamic tabs
      self.menuShortcuts = ko.observableArray();
      self.menuShortcutsDataSource = new oj.ArrayTableDataSource(self.menuShortcuts, {idAttribute: 'id'});
      // add default tab
      self.menuShortcuts.push({name: 'Dashboard', id: 'dashboard'});
      // current tab
      self.selectedItem = ko.observable('dashboard');
      // next tab to focus after current tab remove
      var tabToFocusAfterRemove = '';

      // Drawer
      // Close offcanvas on medium and larger screens
      self.mdScreen.subscribe(function() {oj.OffcanvasUtils.close(self.drawerParams);});
      self.drawerParams = {
        displayMode: 'push',
        selector: '#navDrawer',
        content: '#pageContent'
      };
      // Called by navigation drawer toggle button and after selection of nav drawer item
      self.toggleDrawer = function() {
        return oj.OffcanvasUtils.toggle(self.drawerParams);
      }
      // Add a close listener so we can move focus back to the toggle button when the drawer closes
      $("#navDrawer").on("ojclose", function() { $('#drawerToggleButton').focus(); });

      // Header
      // Application Name used in Branding Area
      self.appName = ko.observable("JET UI Shell for ADF Task Flows");
      // User Info used in Global Navigation area
      self.userLogin = ko.observable("andrejusb@redsamuraiconsulting.com");

      var uiShellMap = {};
      var frameParams = 'overflow:hidden;overflow-x:hidden;overflow-y:hidden;height:95%;width:100%;position:absolute;top:85px;left:0px;right:0px;bottom:0px';
      var emplsAdfTf = 'http://127.0.0.1:7101/sampleadf/faces/adf.task-flow?adf.tfId=empls-flow&adf.tfDoc=/WEB-INF/flows/empls-flow.xml';
      var jobsAdfTf = 'http://127.0.0.1:7101/sampleadf/faces/adf.task-flow?adf.tfId=jobs-flow&adf.tfDoc=/WEB-INF/flows/jobs-flow.xml';

      self.dashboardRendered = ko.computed(function () {
        if (self.selectedItem() === 'dashboard') {
          return true;
        }
        return false;
      });

      // handle click on the menu, used for small screen, when navigation list on the left
      self.menuSelection = ko.computed(function () {
        if (tabToFocusAfterRemove !== '') {
          return self.router.stateId();
        }

        var menuKey = self.router.stateId();
        if (menuKey !== undefined) {
          var menuExist = false;

          // avoid duplicates
          for (i = 0; i < self.menuShortcuts().length; i++) {
              if (menuKey === self.menuShortcuts()[i].id) {
                  menuExist = true;
                  break;
              }
          }

          if (menuExist === false) {
            // add new tab with ID and Name from menu
            for (i = 0; i < navData.length; i++) {
                if (menuKey === navData[i].id) {
                  self.menuShortcuts.push({id: navData[i].id, name: navData[i].name});
                  break;
                }
            }

            addFrame(menuKey);
          }

          // set current tab
          self.selectedItem(menuKey);
        }

        return self.router.stateId();
      });

      // handle module selection from the list and update list of tabs
      self.menuItemAction = function(event) {
        // if we are removing tab, no logic to process
        if (tabToFocusAfterRemove !== '') {
          return;
        }

        var menuKey = event.target.value;
        var menuExist = false;

        // avoid duplicates
        for (i = 0; i < self.menuShortcuts().length; i++) {
            if (menuKey === self.menuShortcuts()[i].id) {
                menuExist = true;
                break;
            }
        }

        if (menuExist === false) {
          // add new tab with ID and Name from menu
          for (i = 0; i < navData.length; i++) {
            if (menuKey === navData[i].id) {
              self.menuShortcuts.push({id: navData[i].id, name: navData[i].name});
              break;
            }
          }
        }

        // set current tab, make sure tab is set in Promis, to delay UI update
        self.router.go(menuKey).then (
          function(result) {
            addFrame(menuKey);
            self.selectedItem(menuKey);
          }
        );
      };

      // handle selection for dynamic tab
      self.selectedItem.subscribe(function (menuKey) {
        tabToFocusAfterRemove = '';

        self.router.go(menuKey).then (
          function(result) {
            selectFrame(menuKey);
          }
        );
      });

      //handle tab removal
      this.onRemove = function (event) {
        self.delete(event.detail.key);

        event.preventDefault();
        event.stopPropagation();
      };

      self.delete = function(tabId) {
        var items = self.menuShortcuts();
        for (i = 0; i < items.length; i++) {
          if (tabId === items[i].id) {
            tabToFocusAfterRemove = self.router.stateId();

            // check where is focus - on tab to be removed or on another tab
            if (self.router.stateId() === tabId) {
              if (items[i+1] !== undefined) {
                tabToFocusAfterRemove = items[i+1].id;
              } else {
                tabToFocusAfterRemove = items[i-1].id;
              }
            }

            // remove tab
            self.menuShortcuts.splice(i, 1);

            removeFrame(tabId);

            // set current tab in router navigation promis, to delay UI update
            self.router.go(tabToFocusAfterRemove).then (
              function(result) {
                self.selectedItem(tabToFocusAfterRemove);

                selectFrameAfterRemove(tabToFocusAfterRemove);

                // if focus remains on same tab, when another row is removed - reset variable for current focus
                if (self.selectedItem() === tabToFocusAfterRemove) {
                  tabToFocusAfterRemove =  '';
                }
              }
            );

            break;
          }
        }
      };

      function addFrame(menuKey) {
        var shellTabExist = false;
        for (var i in uiShellMap) {
          if (i === menuKey  + 'Frame') {
            shellTabExist = true;
            break;
          }
        }
        
        if (!shellTabExist) {
          for (var i in uiShellMap) {
            var ifrm = document.getElementById(i);
            ifrm.setAttribute('style', 'display:block; visibility:hidden');
          }

          var ifrm = document.createElement('iframe');
          ifrm.setAttribute('id', menuKey + 'Frame');

          var pcElement = document.getElementById('pageContent');
          pcElement.appendChild(ifrm);

          var emplsAdfTfVal = '';
          if (menuKey === 'employees') {
            emplsAdfTfVal = emplsAdfTf;
          } else {
            emplsAdfTfVal = jobsAdfTf;
          }
          ifrm.setAttribute('src', emplsAdfTfVal);
          ifrm.setAttribute('frameborder', '0');
          ifrm.setAttribute('style', frameParams);
          ifrm.setAttribute('height', '95%');
          ifrm.setAttribute('width', '100%');

          uiShellMap[menuKey + 'Frame'] = menuKey + 'Frame';
        }
      }

      function selectFrame(menuKey) {
        for (var i in uiShellMap) {
          var ifrm = document.getElementById(i);
          ifrm.setAttribute('style', 'display:block; visibility:hidden');
        }

        if (menuKey !== 'dashboard') {
          for (var i in uiShellMap) {
            if (i === menuKey + 'Frame') {
              var ifrm = document.getElementById(i);
              ifrm.setAttribute('style', frameParams);

              break;
            }
          }
        }
      }

      function removeFrame(tabId) {
        for (var i in uiShellMap) {
          if (i === tabId + 'Frame') {
            var pcElement = document.getElementById('pageContent');
            var ifrm = document.getElementById(i);
            pcElement.removeChild(ifrm);

            break;
          }
        }
        delete uiShellMap[tabId + 'Frame'];
      }

      function selectFrameAfterRemove(tabToFocusAfterRemove) {
        if (tabToFocusAfterRemove !== 'dashboard') {
          for (var i in uiShellMap) {
            if (i === tabToFocusAfterRemove + 'Frame') {
              var ifrm = document.getElementById(i);
              ifrm.setAttribute('style', frameParams);

              break;
            }
          }
        }
      }

      // Footer
      function footerLink(name, id, linkTarget) {
        this.name = name;
        this.linkId = id;
        this.linkTarget = linkTarget;
      }
      self.footerLinks = ko.observableArray([
        new footerLink('About Oracle', 'aboutOracle', 'http://www.oracle.com/us/corporate/index.html#menu-about'),
        new footerLink('Contact Us', 'contactUs', 'http://www.oracle.com/us/corporate/contact/index.html'),
        new footerLink('Legal Notices', 'legalNotices', 'http://www.oracle.com/us/legal/index.html'),
        new footerLink('Terms Of Use', 'termsOfUse', 'http://www.oracle.com/us/legal/terms/index.html'),
        new footerLink('Your Privacy Rights', 'yourPrivacyRights', 'http://www.oracle.com/us/legal/privacy/index.html')
      ]);
     }

     return new ControllerViewModel();
  }
);
