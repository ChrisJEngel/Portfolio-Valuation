// Get moment for date manipulation
const moment = require('./node_modules/moment');

// Get random color generator for Charts
var randomColor = require('./node_modules/randomcolor');

// Isolate inbound parameter for chart term
let urlInbound = window.location.href;
let indexRange = urlInbound.slice(urlInbound.lastIndexOf("=") + 1);
var startDate = calcStartDate(indexRange);

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

  // Retrieve ranking data and display chart
  var sqlSelect = "SELECT ROW_NUMBER() OVER(ORDER BY ps1.InvestmentCAGR - ps2.InvestmentCAGR DESC) as InvestmentCAGRDiffRank," +
                         "ps1.InvestmentCode as InvestmentCode," +
                         "ps1.InvestmentName as InvestmentName," +
                         "ps2.InvestmentCAGR as InvestmentCAGRFirst," +
                         "ps1.InvestmentCAGR as InvestmentCAGRLast," +
                         "(ps1.InvestmentCAGR - ps2.InvestmentCAGR) as InvestmentCAGRDiff," +
          	             "ps2.SnapshotDate as SnapshotDateFirst," +
                         "ps1.SnapshotDate as SnapshotDateLast," +
           	             "ps1.InvestmentValue as InvestmentValue " +
                  "FROM portfolio_snapshot_latest AS ps1 " +
                  "JOIN (SELECT * " +
                        "FROM portfolio_snapshot " +
                        "WHERE SnapshotDate >= '" + startDate + "' " +
                        "GROUP BY InvestmentCode) AS ps2 " +
                  "ON ps2.InvestmentCode = ps1.InvestmentCode"
  pool.query(sqlSelect, function (err, rankData){
    if (err) throw err;
    var chartData = [{}];
    var chartLegend = [];
    var bubbleColor = [];
    for(var i = 0; i < rankData.length; i++){
      xCoord = rankData[i].InvestmentCAGRDiffRank;
      yCoord = Number((rankData[i].InvestmentCAGRDiff * 100).toFixed(2));
      rCoord = Number((rankData[i].InvestmentValue * 250 / pbData[0].InvestmentValueTotal).toFixed(2));
      chartData[i] = {x: xCoord, y:yCoord, r: rCoord};
      chartLegend[i] = rankData[i].InvestmentName + '(' + rankData[i].InvestmentCode + ')';
      bubbleColor[i] = randomColor({
        luminosity: 'bright',
        format: 'rgb'
      });
    };

    // Construct CAGR ranking (bubble) chart
    const Chart = require('./node_modules/chart.js');
    const ctx = document.getElementById('cagrTrend').getContext('2d');
    const cagrTrend = new Chart(ctx, {
      type: 'bubble',
      labels: chartLegend,
      data: {
        datasets: [{data:chartData, borderColor:bubbleColor, backgroundColor:bubbleColor}]
      },
      options: {
        legend: {display: false},
        title: {
          display: true,
          text: ['Ranked Change in CAGR% for each Holding over the Selected Date Range','(Bubble Size depicts the share of Portfolio)'],
          fontColor:"#CD5C5C",
          fontSize:14
        },
        onClick: chartClickEvent,
        tooltips: {
          callbacks: {
            label: function(toolTipItem, data){
              var dateLabel1 = new Date(rankData[toolTipItem.index].SnapshotDateFirst);
              var dateLabel2 = new Date(rankData[toolTipItem.index].SnapshotDateLast);
              var toolTipLines = [];
              toolTipLines[0] = chartLegend[toolTipItem.index] + ': Change in CAGR% of ' + toolTipItem.yLabel + '% ranked ' + toolTipItem.xLabel + ' of ' + rankData.length;
              toolTipLines[1] = 'CAGR% changed from ' +
                (rankData[toolTipItem.index].InvestmentCAGRFirst * 100).toFixed(2) + '% to ' + (rankData[toolTipItem.index].InvestmentCAGRLast * 100).toFixed(2) + '% between ' +
                Intl.DateTimeFormat ('en-AU', {day:'numeric', month:'short', year:'numeric'}).format(dateLabel1) + ' and ' +
                Intl.DateTimeFormat ('en-AU', {day:'numeric', month:'short', year:'numeric'}).format(dateLabel2);
                toolTipLines[2] = 'Latest value is ' +
                Intl.NumberFormat ('en', {style:'currency',currency:'USD', minimumFractionDigits:0}).format(rankData[toolTipItem.index].InvestmentValue.toFixed(0));
              return toolTipLines;
            }
          }
        },
        scales: {
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: "Change in CAGR%"
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: "Change in CAGR% Ranking"
            }
          }]
        }
      }
    });
  });
});

// Highlight Date Range selection
document.getElementById(indexRange).style.backgroundColor = "LightGrey";

// Calculate starting date for SQL Where clause
function calcStartDate(indexRange){
  switch (indexRange) {
    case "finYtd":
      startDate = finStart();
      break;
    case "calYtd":
      startDate = calStart();
      break;
    case "10d":
      startDate = datePrior(10);
      break;
    case "30d":
      startDate = datePrior(30);
      break;
    case "3m":
      startDate = mthPrior(3);
      break;
    case "6m":
      startDate = mthPrior(6);
      break;
    case "1y":
      startDate = mthPrior(12);
      break;
    default:
      startDate = "1900-01-01";
  };
  return startDate;
};

// Calculate a date x days before today
function datePrior(subDays) {
  var newDate = new Date();
  returnDate = moment(newDate, 'YYYY-MM-DD').subtract(subDays, 'days').format('YYYY-MM-DD');
  return returnDate;
};

// Calculate a date x months before today
function mthPrior(subMths) {
  var newDate = new Date();
  returnDate = moment(newDate, 'YYYY-MM-DD').subtract(subMths, 'months').format('YYYY-MM-DD');
  return returnDate;
};

// Determine Financial Year Start Date
function finStart() {
  newDate = new Date();
  if (newDate.getMonth() < 6) {
    return (newDate.getFullYear()-1) + "-07-01"
  } else {
    return newDate.getFullYear() + "-07-01"
  };
};

// Determine Calendar Year Start Date
function calStart() {
  newDate = new Date();
  return newDate.getFullYear() + "-01-01"
};

// Process chart click event
function chartClickEvent(evt, activeElements) {
  if (activeElements.length > 0) {
    // Isolate Holding Code the pass to Holding Profile Window
    var holdingLabel = activeElements[0]._chart.config.labels[activeElements[0]._index];
    var posLeftBracket = holdingLabel.lastIndexOf('(');
    var posRightBracket = holdingLabel.lastIndexOf(')');
    var holdingCode = holdingLabel.substring(posLeftBracket + 1, posRightBracket);
    const {ipcRenderer} = require('electron');
    ipcRenderer.send('clickCagrTrend', holdingCode);
  };
};
