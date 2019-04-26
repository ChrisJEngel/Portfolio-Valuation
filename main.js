// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron');

// Keep a global reference of the window objects
let balTrend;
let portfolioTable;
let portfolioConfig;
let portfolioCagr;
let cagrTrend;
let holdingProfile;
let selectHolding;

// Control Balance Trend Widow
function createWindows() {
  // Create the browser windows
  balTrend = new BrowserWindow({width:1350, height:1000});
  portfolioTable = new BrowserWindow({width:1350, height:1000, show:false});
  portfolioConfig = new BrowserWindow({width:1350, height:1000, show:false});
  portfolioCagr = new BrowserWindow({width:1350, height:1000, show:false});
  cagrTrend = new BrowserWindow({width:1350, height:1000, show:false});
  holdingProfile = new BrowserWindow({width:1350, height:1000, show:false});
  selectHolding = new BrowserWindow({parent:holdingProfile, modal:true, width:400, height:820, autoHideMenuBar:true, minimizable:false, maximizable:false, show:false});

  // Load the html for all the windows
  balTrend.loadURL('file://' + __dirname + '/balTrend.html?indexRange=All');
  portfolioTable.loadURL('file://' + __dirname + '/portfolioTable.html?indexSort=0a');
  portfolioConfig.loadURL('file://' + __dirname + '/portfolioConfig.html');
  portfolioCagr.loadURL('file://' + __dirname + '/portfolioCagr.html');
  cagrTrend.loadURL('file://' + __dirname + '/cagrTrend.html?indexRange=All');
  holdingProfile.loadURL('file://' + __dirname + '/holdingProfile.html?indexRange=All&holdingCode=');
  selectHolding.loadURL('file://' + __dirname + '/selectHolding.html');

  // Load global variable defaults
  global.sharedObj = {indexRange:'All', holdingCode:''};

  // Quit app if close selected
  balTrend.on('closed', function(){
    app.quit();
  });

  portfolioTable.on('closed', function(){
    app.quit();
  });

  portfolioConfig.on('closed', function(){
    app.quit();
  });

  portfolioCagr.on('closed', function(){
    app.quit();
  });

  cagrTrend.on('closed', function(){
    app.quit();
  });

  holdingProfile.on('closed', function(){
    app.quit();
  });

  selectHolding.on('close', function(evt){
    evt.preventDefault();
    selectHolding.hide();
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindows);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  app.quit();
});

// Process Range selection from Balance Trend
ipcMain.on('rangeBalTrend', function(event, indexRange) {
  balTrend.loadURL('file://' + __dirname + '/balTrend.html?indexRange=' + indexRange);
});

// Process Range selection from CAGR Trend
ipcMain.on('rangeCagrTrend', function(event, indexRange) {
  cagrTrend.loadURL('file://' + __dirname + '/cagrTrend.html?indexRange=' + indexRange);
});

// Process Range selection from Holding Profile
ipcMain.on('rangeHoldingProfile', function(event, inParms) {
  var posColon = inParms.lastIndexOf(':');
  var indexRange = inParms.substring(0, posColon);
  global.sharedObj.indexRange = indexRange;
  var holdingCode = inParms.slice(posColon + 1);
  holdingProfile.loadURL('file://' + __dirname + '/holdingProfile.html?indexRange=' + indexRange + '&holdingCode=' + holdingCode);
});

// Process Holding selection from Holding Profile
ipcMain.on('selHoldingProfile', function(event, inParms) {
  var posColon = inParms.lastIndexOf(':');
  global.sharedObj.indexRange = inParms.substring(0, posColon);
  selectHolding.show();
});

// Process selection from Holding Table
ipcMain.on('selHoldingTable', function(event, holdingCode) {
  selectHolding.hide();
  global.sharedObj.holdingCode = holdingCode;
  holdingProfile.loadURL('file://' + __dirname + '/holdingProfile.html?indexCode=' + global.sharedObj.indexRange + '&holdingCode=' + holdingCode);
});

// Process Sort selection from Portfolio Table
ipcMain.on('sortPortfolioTable', function(event, sortSelOrd) {
  portfolioTable.loadURL('file://' + __dirname + '/portfolioTable.html?indexSort=' + sortSelOrd);
});

// Process click event from Portfolio Table Window
ipcMain.on('clickPortfolioTable', function(event, holdingCode) {
  portfolioTable.hide();
  global.sharedObj.holdingCode = holdingCode;
  holdingProfile.loadURL('file://' + __dirname + '/holdingProfile.html?indexCode=' + global.sharedObj.indexRange + '&holdingCode=' + holdingCode);
  holdingProfile.show();
});

// Process click event from Portfolio Config Window
ipcMain.on('clickPortfolioConfig', function(event, holdingCode) {
  portfolioConfig.hide();
  global.sharedObj.holdingCode = holdingCode;
  holdingProfile.loadURL('file://' + __dirname + '/holdingProfile.html?indexCode=' + global.sharedObj.indexRange + '&holdingCode=' + holdingCode);
  holdingProfile.show();
});

// Process click event from Portfolio CAGR Window
ipcMain.on('clickPortfolioCagr', function(event, holdingCode) {
  portfolioCagr.hide();
  global.sharedObj.holdingCode = holdingCode;
  holdingProfile.loadURL('file://' + __dirname + '/holdingProfile.html?indexCode=' + global.sharedObj.indexRange + '&holdingCode=' + holdingCode);
  holdingProfile.show();
});

// Process click event from CAGR Trend
ipcMain.on('clickCagrTrend', function(event, holdingCode) {
  cagrTrend.hide();
  global.sharedObj.holdingCode = holdingCode;
  holdingProfile.loadURL('file://' + __dirname + '/holdingProfile.html?indexCode=' + global.sharedObj.indexRange + '&holdingCode=' + holdingCode);
  holdingProfile.show();
});

// Process navigation from all Windows
ipcMain.on('navBalTrend', function(event, windowName) {
  balTrend.hide();
  navWindow(windowName);
});

ipcMain.on('navPortfolioTable', function(event, windowName) {
  portfolioTable.hide();
  navWindow(windowName);
});

ipcMain.on('navPortfolioConfig', function(event, windowName) {
  portfolioConfig.hide();
  navWindow(windowName);
});

ipcMain.on('navPortfolioCagr', function(event, windowName) {
  portfolioCagr.hide();
  navWindow(windowName);
});

ipcMain.on('navCagrTrend', function(event, windowName) {
  cagrTrend.hide();
  navWindow(windowName);
});

ipcMain.on('navHoldingProfile', function(event, windowName) {
  holdingProfile.hide()
  navWindow(windowName);
});

function navWindow(windowName) {
  switch (windowName) {
    case "balTrend":
      balTrend.show();
      break;
    case "portfolioTable":
      portfolioTable.show();
      break;
    case "portfolioConfig":
      portfolioConfig.show();
      break;
    case "portfolioCagr":
      portfolioCagr.show();
      break;
    case "cagrTrend":
      cagrTrend.show();
      break;
    case "holdingProfile":
      holdingProfile.show();
      if (global.sharedObj.holdingCode == '') {
        selectHolding.show();
      }
      break;
  };
};
