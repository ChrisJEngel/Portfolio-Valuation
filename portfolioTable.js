// Isolate inbound parameter for list order
let urlInbound = window.location.href;
let sortByCol = urlInbound.slice(urlInbound.lastIndexOf("=") + 1);

// Add sort ordr to Portfolio List Headings
formatHdg(sortByCol);

// Build SQL Group By clause
let sqlOrderBy = deriveOrderBy(sortByCol);

// Connect to database
const mysql = require('./node_modules/mysql');
const pool = mysql.createPool({
      connectionLimit:100,
      host: 'localhost',
      user: 'ChrisEngel',
      password: 'cengel001',
      database: 'portfolio_performance',
      dateStrings:true
});

// Get latest portfolio snapshot date and balance
var sqlSelect = "SELECT * FROM portfolio_balance ORDER BY SnapshotDate DESC LIMIT 1";

pool.query(sqlSelect, function (err, pbData){
  if (err) throw err;
  asAtDate = new Date(pbData[0].SnapshotDate);
  document.getElementById('latestSnapshotDate').innerHTML = Intl.DateTimeFormat('en-AU', {day:'numeric', month:'short', year:'numeric'}).format(asAtDate);

  // Get portfolio details for latest snapshot
  sqlSelect = "SELECT * FROM portfolio_snapshot WHERE SnapshotDate = '" + pbData[0].SnapshotDate + "'" + sqlOrderBy;
  pool.query(sqlSelect, function (err, psData){
    if (err) throw err;

    // Load Portfolio Table
    var portTable = document.getElementById('portfolioTable');

    for(var i = 0; i <= psData.length; i++){
      var portRow = portTable.insertRow(i+1);
      var portCell1 = portRow.insertCell(0);
      var portCell2 = portRow.insertCell(1);
      var portCell3 = portRow.insertCell(2);
      var portCell4 = portRow.insertCell(3);
      var portCell5 = portRow.insertCell(4);
      var portCell6 = portRow.insertCell(5);
      var portCell7 = portRow.insertCell(6);

      if (i < psData.length) {
        portCell1.innerHTML = psData[i].InvestmentTypeName;
        portCell2.innerHTML = psData[i].InvestmentName;
        portCell2.setAttribute('id', psData[i].InvestmentCode);
        portCell2.setAttribute('class', 'portfolioCell');
        portCell2.addEventListener('click', clickHolding);
        portCell3.innerHTML = psData[i].InvestmentCode;
        portCell3.setAttribute('id', psData[i].InvestmentCode);
        portCell3.setAttribute('class', 'portfolioCell');
        portCell3.addEventListener('click', clickHolding);
        portCell4.innerHTML = '$' + psData[i].InvestmentValue.toLocaleString('en-AU', {maximumFractionDigits:0});
        portCell5.innerHTML = (psData[i].InvestmentValue * 100 / pbData[0].InvestmentValueTotal).toFixed(2) + '%';
        portCell6.innerHTML = '$' + psData[i].InvestmentTotalIncome.toLocaleString('en-AU', {maximumFractionDigits:0});
        portCell7.innerHTML = (psData[i].InvestmentCAGR * 100).toFixed(2) + '%';
      } else {
        portCell1.innerHTML = null;
        portCell2.innerHTML = "Portfolio Value";
        portCell3.innerHTML = null;
        portCell4.innerHTML = '$' + pbData[0].InvestmentValueTotal.toLocaleString('en-AU', {maximumFractionDigits:0});
        portCell5.innerHTML = null;
        portCell6.innerHTML = null;
        portCell7.innerHTML = null;
      };
    };
  });
});

// Initialise Portfolio List Headings
function formatHdg(sortByCol){
  sortSel = sortByCol.charAt(0);
  sortOrd = sortByCol.charAt(1);
  if (sortOrd == 'a') {listHdg = '\u25B2' + document.getElementById('hdg'+sortSel).innerHTML}
  else {listHdg = '\u25BC' + document.getElementById('hdg'+sortSel).innerHTML}
  document.getElementById('hdg'+sortSel).innerHTML = listHdg;
  document.getElementById('hdg'+sortSel).style.backgroundColor = "LightGrey";
};

// Derive Order By clause for SQL statement
function deriveOrderBy(sortByCol){
  let sqlOrderBy = " ORDER BY SnapshotDate,";
  sortSel = sortByCol.charAt(0);
  switch (sortSel) {
    case '0':
      sqlOrderBy = sqlOrderBy + "DisplaySequence,InvestmentName";
      break;
    case '1':
      sqlOrderBy = sqlOrderBy + "InvestmentName";
      break;
    case '2':
      sqlOrderBy = sqlOrderBy + "InvestmentCode";
      break;
    case '3':
      sqlOrderBy = sqlOrderBy + "InvestmentValue";
      break;
    case '4':
      sqlOrderBy = sqlOrderBy + "InvestmentValue";
      break;
    case '5':
      sqlOrderBy = sqlOrderBy + "InvestmentTotalIncome";
      break;
    case '6':
      sqlOrderBy = sqlOrderBy + "InvestmentCAGR";
      break;
    };

  // Add descending sort order when required
  sortOrd = sortByCol.charAt(1);
  if (sortOrd == 'd') {
    if (sortSel == 0) {sqlOrderBy = " ORDER BY SnapshotDate,DisplaySequence DESC,InvestmentName"}
    else {sqlOrderBy = sqlOrderBy + " DESC"}
  }
  return sqlOrderBy;
};

// Holding clicked, display Holding Profile Window
function clickHolding(evt) {
  var holdingCode = evt.srcElement.id;
  const {ipcRenderer} = require('electron');
  ipcRenderer.send('clickPortfolioTable', holdingCode);
};
