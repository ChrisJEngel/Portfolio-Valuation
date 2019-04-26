// Get moment for date manipulation
const moment = require('./node_modules/moment');

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

// Retrieve investment data and display chart
var sqlSelect = "SELECT * FROM portfolio_balance WHERE SnapshotDate >= '" + startDate + "'";
pool.query(sqlSelect, function (err, chartdata){
  if (err) throw err;
  var chartdataXaxis = [];
  var chartdataYaxis = [];
  for(var i = 0; i < chartdata.length; i++){
    chartdataXaxis[i] = chartdata[i].SnapshotDate;
    chartdataYaxis[i] = chartdata[i].InvestmentValueTotal;
  };

  const Chart = require('./node_modules/chart.js');
  const ctx = document.getElementById('balTrend').getContext('2d');
  const balTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels:chartdataXaxis,
      datasets:[{borderColor:"#CD5C5C", backgroundColor:"#FFEFD5", pointRadius:0, data:chartdataYaxis}]
    },
    options: {
      legend: {display: false},
      title: {
        display: true,
        text: 'Portfolio Daily Balance Trend',
        fontColor:"#CD5C5C",
        fontSize:14
      },
      tooltips: {
        displayColors: false,
        intersect: false,
        position: 'nearest',
        mode: 'index',
        callbacks: {
          label: function(toolTipItem, data){
            return 'Daily balance is ' +
            Intl.NumberFormat ('en', {style:'currency',currency:'USD', minimumFractionDigits:0}).format(toolTipItem.yLabel)
          }
        }
      },
      scales: {
        xAxes: [{
          ticks: {
            callback: function(label, index, labels) {
            dateLabel = new Date(label)
            return Intl.DateTimeFormat ('en-AU', {day:'numeric', month:'short', year:'numeric'}).format(dateLabel)
            }
          }
        }],
        yAxes: [{
          ticks: {
            callback: function(label, index, labels) {
              return Intl.NumberFormat ('en', {style:'currency',currency:'USD', minimumFractionDigits:0}).format(label)
            }
          }
        }]
      }
    }
  });

  // Highlight Date Range selection
  document.getElementById(indexRange).style.backgroundColor = "LightGrey";

  // Display Balance information
  var startBal = chartdataYaxis[0];
  var endBal = chartdataYaxis[chartdataYaxis.length-1];
  document.getElementById("startBal").innerHTML =
    Intl.NumberFormat ('en', {style:'currency',currency:'USD', minimumFractionDigits:0}).format(startBal);
  document.getElementById("endBal").innerHTML =
    Intl.NumberFormat ('en', {style:'currency',currency:'USD', minimumFractionDigits:0}).format(endBal);
  document.getElementById("chgBal").innerHTML =
    Intl.NumberFormat ('en', {style:'currency',currency:'USD', minimumFractionDigits:0}).format(endBal-startBal);
  document.getElementById("chgBalPerCent").innerHTML = ((endBal-startBal)*100/startBal).toFixed(3);

  // Retrieve pension data
  sqlSelect = "SELECT ROUND(SUM(PensionAmount),0) AS pensionAmountTotal FROM pension_payments WHERE PensionPaymentDate BETWEEN '" + chartdataXaxis[0] + "' AND '" + chartdataXaxis[chartdataXaxis.length-1] + "'";
  pool.query(sqlSelect, function (err, pensionData){
    if (err) throw err;

    // Display Pension coverage information area
    var pensionTotal = pensionData[0].pensionAmountTotal
    document.getElementById("pensionPay").innerHTML =
      Intl.NumberFormat ('en', {style:'currency',currency:'USD', minimumFractionDigits:0}).format(pensionTotal);
    document.getElementById("chgBalExPension").innerHTML =
      Intl.NumberFormat ('en', {style:'currency',currency:'USD', minimumFractionDigits:0}).format(endBal-startBal+pensionTotal);
    if (pensionTotal > 0) {
      document.getElementById("covPension").innerHTML = ((endBal-startBal+pensionTotal)*100/pensionTotal).toFixed(3);
    } else {
      document.getElementById("covPension").innerHTML = "N/A";
    }
  });
});

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
